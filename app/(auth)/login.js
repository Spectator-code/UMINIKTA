/**
 * ============================================================================
 * MODULE: Institutional Login Route
 * DIRECTORY: app/(auth)/login.js
 * ROLE/SCOPE: Domain Authentication Gateway
 * DESCRIPTION:
 *   Hosts the responsive, sliding two-panel authentication experience initialized
 *   in login/sign-in mode. Supports UM institutional email validation.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT DEFINITION (Login)
 *   3. STYLESHEET
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

// Sliding Auth Container
import AuthSlidingContainer from '../../src/components/AuthSlidingContainer';

// ============================================================================
// SECTION 2: COMPONENT DEFINITION (Login)
// ============================================================================
export default function Login() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthSlidingContainer initialSignUp={false} />
    </SafeAreaView>
  );
}

// ============================================================================
// SECTION 3: STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
