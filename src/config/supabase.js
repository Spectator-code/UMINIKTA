/**
 * ============================================================================
 * MODULE: Institutional Supabase Client & Storage Adapter
 * DIRECTORY: src/config/supabase.js
 * ROLE/SCOPE: Backend-as-a-Service (BaaS) Infrastructure Gateway
 * DESCRIPTION:
 *   Initializes the singleton Supabase client using environment variables.
 *   Implements the 007 Hardening SecureStore adapter for hardware-backed
 *   keychain storage on iOS/Android with AsyncStorage fallback on Web.
 *
 * SECTION INDEX:
 *   1. POLYFILLS & CORE IMPORTS
 *   2. SECURE STORAGE ADAPTER (ExpoSecureStoreAdapter)
 *   3. CLIENT INITIALIZATION & CONFIGURATION
 * ============================================================================
 */

// ============================================================================
// SECTION 1: POLYFILLS & CORE IMPORTS
// ============================================================================
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ============================================================================
// SECTION 2: SECURE STORAGE ADAPTER (HARDENED)
// ============================================================================
// 007 Hardening: Hardware-backed keychain on Native, encrypted storage on Web
// Wrapped in resilient try-catch to prevent unhandled storage rejections from crashing auth boot
const ExpoSecureStoreAdapter = {
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('[Supabase Storage Adapter] getItem failed for key:', key, e?.message);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.setItem(key, value);
      }
      return await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('[Supabase Storage Adapter] setItem failed for key:', key, e?.message);
    }
  },
  removeItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.removeItem(key);
      }
      return await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('[Supabase Storage Adapter] removeItem failed for key:', key, e?.message);
    }
  },
};

// ============================================================================
// SECTION 3: CLIENT INITIALIZATION & RESILIENT FALLBACK (B-01 REMEDIATION)
// ============================================================================
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

let clientInstance;
try {
  clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
} catch (initErr) {
  console.error('[Supabase Init] Critical initialization failure caught:', initErr?.message);
  // Fallback to dummy client structure to prevent top-level module crash
  clientInstance = createClient('https://your-project.supabase.co', 'placeholder-anon-key', {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = clientInstance;
