/**
 * ============================================================================
 * MODULE: Web Application Firewall (WAF) Access Intercept Screen
 * DIRECTORY: app/forbidden.js
 * ROLE/SCOPE: 007 Security Perimeter Enforcement
 * DESCRIPTION:
 *   Terminal route presented when an incoming network connection violates
 *   perimeter security policies (e.g. non-Philippine GeoIP, proxy/VPN nodes,
 *   or active WAF blacklist matches).
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT DEFINITION (ForbiddenScreen)
 *   3. STYLESHEET & THEME TOKENS
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

// Local Vector Icons
import UIcon from '../src/components/UIcon';

// ============================================================================
// SECTION 2: COMPONENT DEFINITION (ForbiddenScreen)
// ============================================================================
/**
 * ForbiddenScreen
 * Displays WAF diagnostic reason codes, perimeter rule enforcement,
 * and provides a connection re-test button on web runtimes.
 */
export default function ForbiddenScreen() {
  /**
   * Reloads active page to trigger fresh WAF evaluation
   */
  const handleRetry = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Perimeter Intercept Warning Vector */}
        <View style={styles.iconCircle}>
          <UIcon name="warning" size={48} color="#EF4444" />
        </View>

        {/* Defense Rule Badge */}
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>WAF PERIMETER DEFENSE ACTIVE</Text>
        </View>

        {/* Primary Header */}
        <Text style={styles.title}>Access Restricted</Text>

        {/* Intercept Advisory Notice */}
        <Text style={styles.message}>
          Your network connection was intercepted and filtered by the UMINIKTA Web Application Firewall (WAF).
          Connecting through anonymizers, VPNs, Tor exit nodes, or unauthorized IP ranges is strictly prohibited by university security policy.
        </Text>

        {/* Diagnostic Metadata Box */}
        <View style={styles.diagBox}>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Error Code:</Text>
            <Text style={styles.diagVal}>ERR_WAF_GEO_PROXY_FILTERED</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Defense Rule:</Text>
            <Text style={styles.diagVal}>007_SECURITY_PERIMETER_ENFORCED</Text>
          </View>
        </View>

        {/* Web Connection Retry Action */}
        {Platform.OS === 'web' && (
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
            <UIcon name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        )}
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
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 36,
    maxWidth: 480,
    width: '100%',
    alignItems: 'center',
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
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  diagBox: {
    width: '100%',
    backgroundColor: '#0B132B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 24,
    gap: 8,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  diagVal: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  retryBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
