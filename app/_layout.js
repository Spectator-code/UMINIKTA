import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { syncOfflineQueue } from '../src/utils/offlineQueue';
import { SecurityWAF } from '../src/utils/SecurityWAF';
import { View, ActivityIndicator, Platform } from 'react-native';

function RootLayoutNav() {
  const { user, role, isBanned, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 007 Hardening / Offline Sync: Auto-sync when connection restores
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncOfflineQueue();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    // 007 Hardening: Clear sensitive Supabase tokens from the URL bar to prevent leakage
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.location.hash.includes('error=')) {
        const urlParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        const errorDesc = urlParams.get('error_description');
        if (errorDesc) alert('Authentication Error: ' + errorDesc.replace(/\+/g, ' '));
      }
      
      if (window.location.hash.includes('access_token=') || window.location.hash.includes('error=')) {
        // Delay slightly to ensure Supabase Auth has time to parse the tokens
        setTimeout(() => {
          window.history.replaceState(null, '', window.location.pathname);
        }, 500);
      }
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user) {
      if (isBanned && segments[0] !== 'banned') {
        router.replace('/banned');
        return;
      }
      
      if (!isBanned) {
        if (inAuthGroup) {
          if (role === 'secops') {
            setTimeout(() => router.replace('/(secops)'), 100);
          } else if (role === 'professor') {
            setTimeout(() => router.replace('/(professor)'), 100);
          } else if (role === 'student') {
            setTimeout(() => router.replace('/(student)'), 100);
          }
        } else if (role && segments[0] !== `(${role})`) {
           setTimeout(() => router.replace(`/(${role})`), 100);
        }
      }
    }
  }, [user, role, isBanned, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(professor)" options={{ headerShown: false }} />
      <Stack.Screen name="(secops)" options={{ headerShown: false }} />
      <Stack.Screen name="forbidden" options={{ headerShown: false }} />
      <Stack.Screen name="banned" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [wafAllowed, setWafAllowed] = React.useState(null);

  useEffect(() => {
    const runWaf = async () => {
      const result = await SecurityWAF.checkTraffic();
      if (!result.allowed) {
        setWafAllowed(false);
      } else {
        setWafAllowed(true);
      }
    };
    runWaf();
  }, []);

  if (wafAllowed === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  if (wafAllowed === false) {
    return require('./forbidden').default();
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
