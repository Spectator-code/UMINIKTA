import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ForbiddenScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🛡️</Text>
      <Text style={styles.title}>Access Denied</Text>
      <Text style={styles.message}>
        Your connection was blocked by the Security WAF. Proxies, VPNs, Tor, and non-PH traffic are strictly prohibited.
      </Text>
      <Text style={styles.errorCode}>ERR_WAF_BLOCKED</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    color: '#F87171',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: 1,
  },
  message: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
    marginBottom: 32,
  },
  errorCode: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
