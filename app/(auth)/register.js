/**
 * ============================================================================
 * MODULE: Institutional Registration Route
 * DIRECTORY: app/(auth)/register.js
 * ROLE/SCOPE: Domain Authentication & Student Onboarding Gateway
 * DESCRIPTION:
 *   Hosts the responsive, sliding two-panel authentication experience initialized
 *   in registration/sign-up mode. Enforces institutional domain requirements.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT DEFINITION (Register)
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
// SECTION 2: COMPONENT DEFINITION (Register)
// ============================================================================
export default function Register() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthSlidingContainer initialSignUp={true} />
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
