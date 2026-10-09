/**
 * ============================================================================
 * MODULE: SecOps Administration Layout Stack
 * DIRECTORY: app/(secops)/_layout.js
 * ROLE/SCOPE: Institutional Security Operations Route Shell
 * DESCRIPTION:
 *   Expo Router layout configuration for the SecOps perimeter command center.
 *   Provides seamless screen rendering with custom headers managed internally.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. STACK LAYOUT COMPONENT & SCREEN CONFIGURATION
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import { Stack } from 'expo-router';

// ============================================================================
// SECTION 2: STACK LAYOUT COMPONENT & SCREEN CONFIGURATION
// ============================================================================

/**
 * SecOps stack layout rendering the security operations portal.
 *
 * @returns {React.ReactElement} SecOps navigation stack
 */
export default function SecOpsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
