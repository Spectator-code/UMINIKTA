/**
 * ============================================================================
 * MODULE: Institutional Non-Blocking SignOut & State Purge Engine
 * DIRECTORY: src/utils/logoutHelper.js
 * ROLE/SCOPE: Robust Session Termination & Cache Flush Gateway
 * DESCRIPTION:
 *   Ensures that logging out never hangs indefinitely on dead network sockets,
 *   unreachable Supabase projects, or slow keychains.
 *   Implements optimistic in-memory wiping followed by a strict Promise.race
 *   timeout for backend signOut operations.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. SECURE ASSET PURGE UTILITIES
 *   3. SAFE SIGN-OUT ENGINE (performSafeSignOut)
 * ============================================================================
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../config/supabase';
import { ActivityLogger } from './ActivityLogger';

const PROFILE_PICTURE_KEY = '@profile_picture';
const NOTIFICATIONS_KEY = '@app_notifications_v2';
const SIGNOUT_TIMEOUT_MS = 1000;

/**
 * Performs a deterministic, non-blocking session termination.
 *
 * @param {Object} options
 * @param {string} [options.userId] - Active user UUID for audit logging
 * @param {Function} [options.onStateCleared] - Callback invoked immediately to clear React state
 * @returns {Promise<boolean>} True upon completion
 */
export async function performSafeSignOut({ userId, onStateCleared } = {}) {
  // Step 1: Immediately invoke React state purge callback
  if (typeof onStateCleared === 'function') {
    try {
      onStateCleared();
    } catch (stateErr) {
      console.warn('[logoutHelper] State clear notice:', stateErr?.message);
    }
  }

  // Step 2: Clear cached session keys in local/secure storage
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.multiRemove([PROFILE_PICTURE_KEY, NOTIFICATIONS_KEY]);
    } else {
      await Promise.allSettled([
        SecureStore.deleteItemAsync(PROFILE_PICTURE_KEY),
        SecureStore.deleteItemAsync(NOTIFICATIONS_KEY),
      ]);
    }
  } catch (storageErr) {
    console.warn('[logoutHelper] Storage purge notice:', storageErr?.message);
  }

  // Step 3: Fire-and-forget telemetry audit log
  if (userId) {
    try {
      ActivityLogger.logAction(userId, 'LOGOUT', 'User logged out via safe signOut engine').catch(() => {});
    } catch (_) {}
  }

  // Step 4: Strict timeout race for Supabase backend session termination
  try {
    await Promise.race([
      supabase.auth.signOut().catch((err) => {
        console.warn('[logoutHelper] Supabase signOut notice:', err?.message);
      }),
      new Promise((resolve) => setTimeout(resolve, SIGNOUT_TIMEOUT_MS)),
    ]);
  } catch (e) {
    console.warn('[logoutHelper] SignOut race execution notice:', e?.message);
  }

  return true;
}
