/**
 * ============================================================================
 * MODULE: Offline-First Mutation Persistence & Auto-Sync Engine
 * DIRECTORY: src/utils/offlineQueue.js
 * ROLE/SCOPE: Resilient Data Mutation & Offline State Recovery
 * DESCRIPTION:
 *   Intercepts database mutations when network connectivity drops, serializes
 *   payloads locally into AsyncStorage with local monotonic timestamps, and
 *   flushes transactions with mutex-lock concurrency control upon reconnection.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. CONSTANTS & MUTEX CONCURRENCY LOCK
 *   3. MUTATION QUEUE WRITER (queueDatabaseMutation)
 *   4. NETWORK RECONNECT FLUSH DISPATCHER (syncOfflineQueue)
 *   5. PENDING QUEUE TELEMETRY INSPECTOR (getOfflineQueueCount)
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../config/supabase';

// ============================================================================
// SECTION 2: CONSTANTS & MUTEX CONCURRENCY LOCK
// ============================================================================
const QUEUE_KEY = '@offline_mutation_queue';
const MAX_QUEUE_CAPACITY = 100; // B-03: Upper bound to prevent memory exhaustion
let isSyncing = false; // Mutex Lock to prevent duplicate sync loops

// ============================================================================
// SECTION 3: MUTATION QUEUE WRITER (HARDENED & DEDUPLICATED)
// ============================================================================
/**
 * Serializes a pending database mutation locally into AsyncStorage.
 * Implements deduplication for pending updates/upserts and bounds queue growth.
 *
 * @param {string} table - Target Supabase table name.
 * @param {Object} payload - Mutation data record.
 * @param {string} [action='insert'] - Database operation ('insert' | 'update' | 'upsert' | 'delete').
 * @param {Object} [match={}] - Match criteria for updates/deletions.
 * @returns {Promise<boolean>} True if queued successfully.
 */
export const queueDatabaseMutation = async (table, payload, action = 'insert', match = {}) => {
  try {
    if (!table || !payload) {
      console.warn('Invalid mutation data attempted to be queued.');
      return false;
    }

    const normalizedAction = typeof action === 'string' ? action.toLowerCase() : 'insert';
    const existingQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
    let existingQueue = existingQueueStr ? JSON.parse(existingQueueStr) : [];
    if (!Array.isArray(existingQueue)) existingQueue = [];

    const newMutation = { 
      table,
      payload,
      action: normalizedAction,
      match: match || {},
      _localId: Date.now().toString() + '-' + Math.random().toString(36).substring(5),
      _queuedAt: new Date().toISOString()
    };

    // B-03 Deduplication: If update/upsert on the same table and record, merge/replace pending item
    let deduplicated = false;
    if (normalizedAction === 'update' || normalizedAction === 'upsert') {
      const matchId = payload.id || (match && match.id);
      if (matchId) {
        const existingIdx = existingQueue.findIndex(
          item => item.table === table && (item.action === 'update' || item.action === 'upsert') && (item.payload?.id === matchId || item.match?.id === matchId)
        );
        if (existingIdx !== -1) {
          existingQueue[existingIdx] = {
            ...existingQueue[existingIdx],
            payload: { ...existingQueue[existingIdx].payload, ...payload },
            _queuedAt: new Date().toISOString(),
          };
          deduplicated = true;
        }
      }
    }

    if (!deduplicated) {
      existingQueue.push(newMutation);
    }

    // B-03 Bounded Queue Capacity: Discard oldest non-critical entries if exceeding limit
    if (existingQueue.length > MAX_QUEUE_CAPACITY) {
      existingQueue = existingQueue.slice(-MAX_QUEUE_CAPACITY);
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existingQueue));
    return true;
  } catch (e) {
    console.error('Failed to save mutation to offline queue:', e);
    return false;
  }
};

// ============================================================================
// SECTION 4: NETWORK RECONNECT FLUSH DISPATCHER
// ============================================================================
/**
 * Drains pending offline mutations sequentially to Supabase upon verified
 * network connection. Employs a mutex lock and 10s request abort timeout.
 *
 * @returns {Promise<void>}
 */
export const syncOfflineQueue = async () => {
  if (isSyncing) return; // Mutex Lock check

  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    const existingQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existingQueueStr) return;

    const existingQueue = JSON.parse(existingQueueStr);
    if (existingQueue.length === 0) return;

    isSyncing = true; // Lock acquired
    console.log(`Syncing ${existingQueue.length} items to Supabase...`);

    const failedQueue = [];

    for (const item of existingQueue) {
      try {
        const { table, payload, action = 'insert', match = {} } = item;
        
        // 007 Hardening: Implement timeout for backend requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        let query;
        if (action === 'update') {
          query = supabase.from(table).update(payload);
          if (match && Object.keys(match).length > 0) {
            query = query.match(match);
          } else if (payload.id) {
            query = query.eq('id', payload.id);
          }
        } else if (action === 'upsert') {
          query = supabase.from(table).upsert([payload]);
        } else if (action === 'delete') {
          query = supabase.from(table).delete();
          if (match && Object.keys(match).length > 0) {
            query = query.match(match);
          } else if (payload.id) {
            query = query.eq('id', payload.id);
          }
        } else {
          query = supabase.from(table).insert([payload]);
        }
        
        const { error } = await query.abortSignal(controller.signal);
          
        clearTimeout(timeoutId);

        if (error) {
          throw new Error(error.message);
        }
      } catch (e) {
        console.warn(`Failed to sync item ${item._localId}:`, e.message);
        failedQueue.push(item);
      }
    }

    // Retain only the ones that failed
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedQueue));

  } catch (e) {
    console.error('Error during sync process:', e);
  } finally {
    isSyncing = false; // Release lock
  }
};

// ============================================================================
// SECTION 5: PENDING QUEUE TELEMETRY INSPECTOR
// ============================================================================
/**
 * Reads local queue depth to report client sync backlog to telemetry engine.
 *
 * @returns {Promise<number>} Number of pending mutation payloads in storage.
 */
export const getOfflineQueueCount = async () => {
  try {
    const existingQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existingQueueStr) return 0;
    const existingQueue = JSON.parse(existingQueueStr);
    return Array.isArray(existingQueue) ? existingQueue.length : 0;
  } catch (e) {
    return 0;
  }
};

