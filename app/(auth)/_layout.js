/**
 * ============================================================================
 * MODULE: Authentication Stack Layout
 * DIRECTORY: app/(auth)/_layout.js
 * ROLE/SCOPE: Authentication & Onboarding Navigation
 * DESCRIPTION:
 *   Stack layout for the authentication route group, hosting the Login and
 *   Registration screens with native header suppression.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. STACK LAYOUT COMPONENT (AuthLayout)
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React from 'react';
import { Stack } from 'expo-router';

// ============================================================================
// SECTION 2: STACK LAYOUT COMPONENT (AuthLayout)
// ============================================================================
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}
