/**
 * ============================================================================
 * MODULE: Account Suspension & Security Quarantine Screen
 * DIRECTORY: app/banned.js
 * ROLE/SCOPE: SecOps Security Enforcement & Incident Quarantine
 * DESCRIPTION:
 *   Terminal route presented when a user account has been flagged, suspended,
 *   or revoked by the Security Operations Center. Displays policy incident codes
 *   and provides a secure logout mechanism.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT DEFINITION (BannedScreen)
 *   3. STYLESHEET & THEME TOKENS
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldAlert, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Context
import { useAuth } from '../src/context/AuthContext';
import { useConfirm } from '../src/context/ConfirmContext';

// ============================================================================
// SECTION 2: COMPONENT DEFINITION (BannedScreen)
// ============================================================================
/**
 * BannedScreen
 * Renders quarantine card with incident details and session release action.
 */
export default function BannedScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { confirm } = useConfirm();

  const handleLogout = async () => {
    const proceed = await confirm({
      title: 'Exit Quarantined Session',
      message: 'Terminate quarantined session and return to campus authentication portal?',
      confirmText: 'Return to Login',
      confirmColor: '#DC2626',
      icon: 'logout',
      isDestructive: false,
    });

    if (proceed) {
      try {
        await logout();
        router.replace('/');
      } catch (e) {
        console.warn('Banned logout error:', e);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Security Incident Icon */}
        <View style={styles.iconCircle}>
          <ShieldAlert size={48} color="#EF4444" />
        </View>

        {/* Security Policy Advisory Pill */}
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>SECOPS ADVISORY • ACCESS REVOKED</Text>
        </View>

        {/* Advisory Header */}
        <Text style={styles.title}>Account Suspended</Text>

        {/* Explanatory Notice */}
        <Text style={styles.message}>
          Your UMINIKTA institutional account has been placed under administrative suspension by the Security Operations Center (SecOps) following system policy violations or unauthorized traffic behavior.
        </Text>

        {/* Incident Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Incident Code</Text>
          <Text style={styles.infoValue}>POL-SEC-SUSPENDED-007</Text>
          <Text style={styles.infoSub}>
            If you believe this suspension is in error, contact the UM IT Security Helpdesk.
          </Text>
        </View>

        {/* Session Release & Return Action */}
        <TouchableOpacity style={styles.button} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Log Out & Return to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// SECTION 3: STYLESHEET & THEME TOKENS
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 36,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    maxWidth: 480,
    width: '100%',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginBottom: 20,
  },
  badgeRow: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  badgeText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#0B132B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
    fontFamily: 'Courier',
    marginTop: 2,
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  button: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
