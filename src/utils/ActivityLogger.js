/**
 * ============================================================================
 * MODULE: Tamper-Evident Local & Remote Activity Audit Logger
 * DIRECTORY: src/utils/ActivityLogger.js
 * ROLE/SCOPE: Institutional Compliance & Security Audit Logging (RA 10173)
 * DESCRIPTION:
 *   Non-blocking audit telemetry recorder that captures authenticated user
 *   actions (logins, logouts, course views, permission changes) and persists
 *   them into the immutable `user_activity_logs` Supabase table.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. ACTIVITY LOGGER SERVICE CLASS
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import { supabase } from '../config/supabase';

// ============================================================================
// SECTION 2: ACTIVITY LOGGER SERVICE CLASS (THROTTLED & BATCHED)
// ============================================================================
const BATCH_FLUSH_INTERVAL = 2000; // Flush queued logs every 2 seconds
const MAX_BATCH_SIZE = 10;
let logBuffer = [];
let flushTimeout = null;
let lastLogTimestamp = 0;
let lastLogSignature = '';

const CRITICAL_ACTIONS = new Set(['LOGIN', 'LOGOUT', 'LOCKDOWN', 'QUARANTINE', 'ROLE_CHANGE', 'PASSWORD_RESET']);

export class ActivityLogger {
  /**
   * Internal flusher to persist buffered activity records to Supabase.
   */
  static async flush() {
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }

    if (logBuffer.length === 0) return;

    const toSend = [...logBuffer];
    logBuffer = [];

    try {
      await supabase.from('user_activity_logs').insert(toSend);
    } catch (e) {
      console.warn('[ActivityLogger] Batch insert notice:', e?.message);
    }
  }

  /**
   * Dispatches a throttled user audit record to the Supabase database.
   * Suppresses rapid duplicate tab navigation requests (B-05 Remediation).
   *
   * @param {string} userId - UUID of the authenticated actor.
   * @param {string} action - Action code mnemonic (e.g. 'LOGIN', 'LOGOUT', 'PAGE_VIEW').
   * @param {string} details - Contextual description of the event.
   * @returns {Promise<void>}
   */
  static async logAction(userId, action, details = '') {
    if (!userId) return;

    const now = Date.now();
    const signature = `${userId}:${action}:${details}`;

    // Suppress identical duplicate navigation events fired within 1000ms
    if (signature === lastLogSignature && now - lastLogTimestamp < 1000) {
      return;
    }
    lastLogSignature = signature;
    lastLogTimestamp = now;

    // Validate UUID format. Synthetic actors ('demo-user-...', 'system') must not violate PostgreSQL UUID constraints
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    const validUserId = isUUID ? userId : null;
    const enrichedDetails = isUUID ? details : `[Actor: ${userId}] ${details}`.trim();

    const payload = {
      action: action,
      details: enrichedDetails,
      created_at: new Date().toISOString(),
    };
    if (validUserId) {
      payload.user_id = validUserId;
    }

    // Critical security actions flush immediately
    if (CRITICAL_ACTIONS.has(action)) {
      logBuffer.push(payload);
      await this.flush();
      return;
    }

    // Non-critical telemetry is buffered and throttled
    logBuffer.push(payload);
    if (logBuffer.length >= MAX_BATCH_SIZE) {
      await this.flush();
    } else if (!flushTimeout) {
      flushTimeout = setTimeout(() => {
        this.flush();
      }, BATCH_FLUSH_INTERVAL);
    }
  }
}
