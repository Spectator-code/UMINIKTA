/**
 * ============================================================================
 * MODULE: Root Application Layout & Perimeter Gateway
 * DIRECTORY: app/_layout.js
 * ROLE/SCOPE: Universal Core Framework & Security Perimeter
 * DESCRIPTION:
 *   Top-level layout component managing application lifecycle, 007 Security
 *   WAF inspection, offline mutation network synchronization, global error
 *   boundaries, theme/auth context providers, and role-based route guards.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. ERROR BOUNDARY EXPORT
 *   3. ROOT NAVIGATION & ROLE-BASED ROUTING GUARD (RootLayoutNav)
 *   4. TOP-LEVEL PERIMETER & WAF INSPECTION SHELL (RootLayout)
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    console.error('[Global Window Error]:', e.message, e.error);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.warn('[Global Unhandled Rejection]:', e.reason);
  });
}
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

// Context Providers & Security Engines
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ConfirmProvider } from '../src/context/ConfirmContext';
import ContentProtection from '../src/components/ContentProtection';
import { syncOfflineQueue } from '../src/utils/offlineQueue';
import { SecurityWAF } from '../src/utils/SecurityWAF';

// ============================================================================
// SECTION 2: INSTITUTIONAL ERROR BOUNDARY (F-02 REMEDIATION)
// ============================================================================
// Catches unhandled component render exceptions and renders institutional UM recovery screen
export function ErrorBoundary({ error, retry }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ maxWidth: 480, width: '100%', backgroundColor: '#1E293B', borderRadius: 12, borderWidth: 1, borderColor: '#334155', padding: 24, alignItems: 'center' }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#7F1D1D', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#FCA5A5', fontWeight: '800', fontSize: 20 }}>!</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 8, textAlign: 'center' }}>
          Application Exception Intercepted
        </Text>
        <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16, textAlign: 'center', lineHeight: 20 }}>
          An unhandled error occurred in the active viewport. The session has been protected to prevent state corruption.
        </Text>
        {error?.message ? (
          <View style={{ backgroundColor: '#0B0F19', padding: 12, borderRadius: 6, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#1E293B' }}>
            <Text style={{ color: '#EF4444', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }} numberOfLines={4}>
              {error.message}
            </Text>
          </View>
        ) : null}
        <TouchableOpacity
          onPress={retry}
          style={{ backgroundColor: '#8B0000', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: '100%', alignItems: 'center' }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
            Retry Application View
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// SECTION 3: ROOT NAVIGATION & ROLE-BASED ROUTING GUARD
// ============================================================================
/**
 * RootLayoutNav
 * Handles user session validation, active route segment evaluation,
 * quarantine redirection (banned users), and institutional role-based
 * dispatching (Student, Faculty, SecOps Admin).
 */
function RootLayoutNav() {
  const { user, role, isBanned, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // --------------------------------------------------------------------------
  // Lifecycle Hook 1: Offline Mutation Queue Network Reconnect Listener
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 007 Hardening / Offline Sync: Auto-sync queued mutations when connectivity restores
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncOfflineQueue();
      }
    });
    return () => unsubscribe();
  }, []);

  // --------------------------------------------------------------------------
  // Lifecycle Hook 2: Role Authorization & Route Guard Controller
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (loading) return;

    // 007 Hardening: Clear sensitive Supabase tokens from the browser URL bar to prevent token leakage
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.location.hash.includes('error=')) {
        const urlParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        const errorDesc = urlParams.get('error_description');
        if (errorDesc) alert('Authentication Error: ' + errorDesc.replace(/\+/g, ' '));
      }
      
      if (window.location.hash.includes('access_token=') || window.location.hash.includes('error=')) {
        // Delay slightly to ensure Supabase Auth parser completes session extraction
        setTimeout(() => {
          window.history.replaceState(null, '', window.location.pathname);
        }, 500);
      }
    }

    const inAuthGroup = segments[0] === '(auth)';
    const isLandingPage = segments.length === 0 || segments[0] === 'index';

    // Route Protection: Unauthenticated users visiting protected screens redirected to landing
    if (!user && !inAuthGroup && !isLandingPage) {
      router.replace('/');
    } else if (user) {
      // Quarantine Guard: Banned users redirected immediately to SecOps quarantine advisory screen
      if (isBanned && segments[0] !== 'banned') {
        router.replace('/banned');
        return;
      }
      
      // Role-Based Landing Dispatch: Route authenticated users to their tailored portal
      if (!isBanned) {
        if (inAuthGroup || isLandingPage) {
          if (role === 'secops') {
            setTimeout(() => router.replace('/(secops)'), 100);
          } else if (role === 'professor') {
            setTimeout(() => router.replace('/(professor)'), 100);
          } else if (role === 'student') {
            setTimeout(() => router.replace('/(student)'), 100);
          }
        } else if (role && segments[0] !== `(${role})` && !['forbidden', 'banned'].includes(segments[0])) {
           setTimeout(() => router.replace(`/(${role})`), 100);
        }
      }
    }
  }, [user, role, isBanned, loading, segments]);

  // --------------------------------------------------------------------------
  // Route Stack Configuration (Headerless File-Based Routes)
  // --------------------------------------------------------------------------
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(professor)" options={{ headerShown: false }} />
      <Stack.Screen name="(secops)" options={{ headerShown: false }} />
      <Stack.Screen name="forbidden" options={{ headerShown: false }} />
      <Stack.Screen name="banned" options={{ headerShown: false }} />
    </Stack>
  );
}

// ============================================================================
// SECTION 4: TOP-LEVEL PERIMETER & WAF INSPECTION SHELL
// ============================================================================
/**
 * RootLayout
 * Mounts the top-level application wrapper, executes Web Application Firewall (WAF)
 * traffic evaluation, and wraps child routes in Theme and Authentication providers.
 */
export default function RootLayout() {
  const [wafAllowed, setWafAllowed] = React.useState(null);

  // --------------------------------------------------------------------------
  // WAF Perimeter Check: Fail-safe verification with fast-fallback race
  // --------------------------------------------------------------------------
  useEffect(() => {
    let active = true;
    const runWaf = async () => {
      try {
        const result = await Promise.race([
          SecurityWAF.checkTraffic(),
          new Promise((resolve) => setTimeout(() => resolve({ allowed: true }), 1500)),
        ]);
        if (active) {
          setWafAllowed(result.allowed !== false);
        }
      } catch (err) {
        if (active) setWafAllowed(true);
      }
    };
    runWaf();
    return () => { active = false; };
  }, []);

  // --------------------------------------------------------------------------
  // Perimeter State 1: Inspecting Network Traffic (Loading Spinner)
  // --------------------------------------------------------------------------
  if (wafAllowed === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // Perimeter State 2: WAF Drop / Intercept (Forbidden Screen)
  // --------------------------------------------------------------------------
  if (wafAllowed === false) {
    const ForbiddenScreen = require('./forbidden').default;
    return <ForbiddenScreen />;
  }

  // --------------------------------------------------------------------------
  // Perimeter State 3: Clean Traffic (Wrap in Providers & Mount Navigation)
  // --------------------------------------------------------------------------
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfirmProvider>
          <ContentProtection>
            <RootLayoutNav />
          </ContentProtection>
        </ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
