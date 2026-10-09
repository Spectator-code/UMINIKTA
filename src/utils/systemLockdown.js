/**
 * ============================================================================
 * MODULE: Emergency Campus Lockdown & System Kill-Switch Engine
 * DIRECTORY: src/utils/systemLockdown.js
 * ROLE/SCOPE: Institutional Crisis Management & Administrative Access Override
 * DESCRIPTION:
 *   Global kill-switch engine that permits SecOps administrators to place
 *   all student and faculty client portals into read-only maintenance mode
 *   with reactive observer subscription patterns.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. ENGINE STATE & SUBSCRIBER REGISTRY
 *   3. INITIAL STATE HYDRATION (AsyncStorage)
 *   4. OBSERVER NOTIFICATION DISPATCHER (notifyListeners)
 *   5. STATUS GETTER (getLockdownStatus)
 *   6. STATUS MUTATOR (setLockdownStatus)
 *   7. REACTIVE SUBSCRIPTION HOOK (subscribeToLockdown)
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ============================================================================
// SECTION 2: ENGINE STATE, SUBSCRIBER REGISTRY & REALTIME CHANNEL
// ============================================================================
const STORAGE_KEY = 'uminikta_system_lockdown';
const BROADCAST_CHANNEL = 'campus_lockdown_events';
const listeners = new Set();

let currentStatus = {
  active: false,
  reason: 'Normal Campus Operations',
  activatedAt: null,
  activatedBy: null,
};

let realtimeChannel = null;

// ============================================================================
// SECTION 3: INITIAL STATE HYDRATION & REALTIME LISTENER
// ============================================================================

// Initialize from local cache first, then query Supabase settings
(async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      currentStatus = JSON.parse(raw);
      notifyListeners();
    }
  } catch (e) {
    console.warn('Failed to load initial lockdown state:', e.message);
  }

  // Connect to Supabase Realtime broadcast channel for multi-device sync
  try {
    realtimeChannel = supabase
      .channel(BROADCAST_CHANNEL)
      .on('broadcast', { event: 'lockdown_update' }, ({ payload }) => {
        if (payload) {
          currentStatus = { ...payload };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentStatus)).catch(console.warn);
          notifyListeners();
        }
      })
      .subscribe();

    // Query remote database state if online
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'campus_lockdown')
      .single();

    if (data && data.value) {
      currentStatus = { ...data.value };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentStatus));
      notifyListeners();
    }
  } catch (e) {
    // Fail-open / fallback silently to local AsyncStorage cache if remote DB is unreachable
  }
})();

// ============================================================================
// SECTION 4: OBSERVER NOTIFICATION DISPATCHER
// ============================================================================
/**
 * Dispatches current lockdown status updates to all registered listeners.
 */
function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb({ ...currentStatus });
    } catch (e) {
      console.warn('Error notifying lockdown listener:', e);
    }
  });
}

// ============================================================================
// SECTION 5: STATUS GETTER
// ============================================================================
/**
 * Retrieves the current campus emergency lockdown status.
 *
 * @returns {Promise<{ active: boolean, reason: string, activatedAt: string|null, activatedBy: string|null }>}
 */
export async function getLockdownStatus() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      currentStatus = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading lockdown status:', e.message);
  }
  return { ...currentStatus };
}

// ============================================================================
// SECTION 6: STATUS MUTATOR & MULTI-DEVICE BROADCASTER
// ============================================================================
/**
 * Engages or lifts emergency campus lockdown mode and synchronizes with storage
 * and Supabase Realtime broadcast stream.
 *
 * @param {boolean} active - Target lockdown state.
 * @param {string} reason - Institutional rationale for lockdown.
 * @param {string} adminEmail - Audit trail identifier of authorizer.
 * @returns {Promise<{ active: boolean, reason: string, activatedAt: string|null, activatedBy: string|null }>}
 */
export async function setLockdownStatus(active, reason = 'Campus Emergency Maintenance Mode', adminEmail = 'secops-admin@umindanao.edu.ph') {
  currentStatus = {
    active: Boolean(active),
    reason: reason || (active ? 'Campus Emergency Maintenance Mode' : 'Normal Campus Operations'),
    activatedAt: active ? new Date().toISOString() : null,
    activatedBy: active ? adminEmail : null,
  };

  // 1. Local caching
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentStatus));
  } catch (e) {
    console.warn('Error saving lockdown status to AsyncStorage:', e.message);
  }

  // 2. Multi-device Realtime WebSocket Broadcast
  try {
    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'lockdown_update',
        payload: currentStatus,
      });
    }
  } catch (e) {
    console.warn('Failed to broadcast lockdown change over WebSocket:', e.message);
  }

  // 3. Remote persistent database sync
  try {
    await supabase.from('system_settings').upsert([{
      key: 'campus_lockdown',
      value: currentStatus,
      updated_at: new Date().toISOString(),
    }]);
  } catch (e) {
    // Non-blocking remote sync failure
  }

  notifyListeners();
  return { ...currentStatus };
}

// ============================================================================
// SECTION 7: REACTIVE SUBSCRIPTION HOOK
// ============================================================================
/**
 * Registers an observer callback invoked whenever lockdown status changes.
 *
 * @param {Function} callback - Callback function receiving lockdown status object.
 * @returns {Function} Unsubscribe teardown function.
 */
export function subscribeToLockdown(callback) {
  if (typeof callback === 'function') {
    listeners.add(callback);
    callback({ ...currentStatus });
    return () => listeners.delete(callback);
  }
  return () => {};
}
