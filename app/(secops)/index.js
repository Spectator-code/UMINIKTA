/**
 * ============================================================================
 * MODULE: Institutional SecOps Perimeter & SOC Command Dashboard
 * DIRECTORY: app/(secops)/index.js
 * ROLE/SCOPE: Security Operations Center (SOC) Master Control & Telemetry Stream
 * DESCRIPTION:
 *   Central command center for authorized institutional SecOps administrators.
 *   Provides real-time SIEM network telemetry streaming, an emergency campus
 *   lockdown kill-switch, automated WAF IP blacklist management, global student/faculty
 *   directory administration, and offline batch code generation.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT INSTANTIATION & REAL-TIME SIEM LISTENERS
 *   3. EMERGENCY CAMPUS LOCKDOWN CONTROLLER (handleToggleLockdown)
 *   4. RENDER: SIEM TELEMETRY STREAM & TRAFFIC LOG TABLE
 *   5. RENDER: SECOPS COMMAND CENTER HEADER & TAB SWITCHER
 *   6. COMPONENT STYLESHEET
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useConfirm } from '../../src/context/ConfirmContext';
import { supabase } from '../../src/config/supabase';
import {
  Activity,
  Users,
  ShieldAlert,
  LogOut,
  Radio,
  ShieldCheck,
  AlertTriangle,
  Key,
} from 'lucide-react-native';
import { getLockdownStatus, setLockdownStatus } from '../../src/utils/systemLockdown';
import GlobalDirectory from '../../src/components/secops/GlobalDirectory';
import WAFBlacklist from '../../src/components/secops/WAFBlacklist';
import BatchGenerator from '../../src/components/secops/BatchGenerator';

// ============================================================================
// SECTION 2: COMPONENT INSTANTIATION & REAL-TIME SIEM LISTENERS
// ============================================================================

/**
 * Institutional Security Operations Command Center.
 *
 * @returns {React.ReactElement} SOC master command interface
 */
export default function SecOpsDashboard() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { confirm } = useConfirm();

  const handleLogout = async () => {
    const proceed = await confirm({
      title: 'Terminate SecOps Session',
      message: 'Are you sure you want to terminate your administrative SecOps command session?',
      confirmText: 'Terminate Session',
      confirmColor: '#DC2626',
      icon: 'logout',
      isDestructive: true,
    });

    if (proceed) {
      try {
        await logout();
        router.replace('/');
      } catch (e) {
        console.warn('SecOps logout error:', e);
      }
    }
  };
  const [activeTab, setActiveTab] = useState('siem'); // siem, directory, waf, batch
  const [logs, setLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());
  const [lockdownState, setLockdownState] = useState({ active: false, reason: 'Normal Campus Operations' });

  useEffect(() => {
    (async () => {
      const status = await getLockdownStatus();
      setLockdownState(status);
    })();
  }, []);

  // ==========================================================================
  // SECTION 3: EMERGENCY CAMPUS LOCKDOWN CONTROLLER
  // ==========================================================================

  const handleToggleLockdown = async () => {
    if (lockdownState.active) {
      const proceed = await confirm({
        title: 'Lift Emergency Campus Lockdown',
        message: 'Restore normal campus portal operations for all students and faculty across the institution?',
        confirmText: 'Restore Operations',
        confirmColor: '#059669',
        icon: 'info',
        isDestructive: false,
      });

      if (proceed) {
        const res = await setLockdownStatus(false, 'Normal Campus Operations', user?.email || 'secops-admin@umindanao.edu.ph');
        setLockdownState(res);
      }
    } else {
      const proceed = await confirm({
        title: 'Confirm Emergency Campus Lockdown',
        message: 'WARNING: Engaging lockdown places Student and Faculty portals into read-only maintenance mode immediately. SecOps administrators retain full control.\n\nProceed with emergency lockdown?',
        confirmText: 'Engage Lockdown',
        confirmColor: '#DC2626',
        icon: 'alert',
        isDestructive: true,
      });

      if (proceed) {
        const res = await setLockdownStatus(true, 'Institutional Cyber Defense & Maintenance', user?.email || 'secops-admin@umindanao.edu.ph');
        setLockdownState(res);
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch SIEM logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await supabase
          .from('siem_traffic_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        setLogs(data || []);
      } catch (e) {
        console.warn('SIEM fetch error:', e);
      }
    };
    fetchLogs();

    const subscription = supabase
      .channel('siem_traffic_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'siem_traffic_logs' }, (payload) => {
        setLogs((current) => [payload.new, ...current].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const threatsBlockedCount = logs.filter((l) => l.status === 'BLOCKED' || l.status === 'MANUALLY_BANNED').length;
  const cleanTrafficCount = logs.filter((l) => l.status === 'ALLOWED').length;
  const vpnCount = logs.filter((l) => l.is_vpn).length;
  const totalPackets = logs.length || 1;
  const cleanRatio = Math.round((cleanTrafficCount / totalPackets) * 100);

  // ==========================================================================
  // SECTION 4: RENDER: SIEM TELEMETRY STREAM & TRAFFIC LOG TABLE
  // ==========================================================================

  const renderSiemLogs = () => (
    <View style={styles.tabContainer}>
      {/* EMERGENCY CAMPUS LOCKDOWN KILL-SWITCH STRIP */}
      <View style={[styles.lockdownStrip, lockdownState.active && styles.lockdownStripActive]}>
        <View style={styles.lockdownInfoCol}>
          <View style={styles.lockdownBadgeRow}>
            <View style={[styles.lockdownStatusPill, lockdownState.active ? styles.lockdownPillActive : styles.lockdownPillNormal]}>
              <Text style={[styles.lockdownPillText, lockdownState.active ? styles.lockdownPillTextActive : styles.lockdownPillTextNormal]}>
                {lockdownState.active ? '[EMERGENCY LOCKDOWN ACTIVE]' : '[NORMAL OPERATIONS]'}
              </Text>
            </View>
            {lockdownState.activatedAt && (
              <Text style={styles.lockdownTimestamp}>Triggered at {new Date(lockdownState.activatedAt).toLocaleTimeString()}</Text>
            )}
          </View>
          <Text style={styles.lockdownHeading}>Campus Emergency Maintenance Kill-Switch</Text>
          <Text style={styles.lockdownSubtext}>
            {lockdownState.active 
              ? 'Student and Faculty portals are placed into read-only lockdown mode. SecOps retains full administrative control.'
              : 'Immediately place Student & Faculty portals into read-only maintenance mode during cyber incident response or disaster recovery.'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.lockdownActionBtn, lockdownState.active ? styles.lockdownActionBtnDeactivate : styles.lockdownActionBtnActivate]}
          onPress={handleToggleLockdown}
          activeOpacity={0.85}
        >
          <Text style={styles.lockdownActionBtnText}>
            {lockdownState.active ? 'Lift Campus Lockdown' : 'Engage Emergency Lockdown'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Telemetry KPI Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardBlocked]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>Threats Blocked</Text>
            <ShieldAlert size={18} color="#EF4444" />
          </View>
          <Text style={[styles.statNum, { color: '#EF4444' }]}>{threatsBlockedCount}</Text>
          <Text style={styles.statSub}>Suppressing non-PH & exploit probes</Text>
        </View>

        <View style={[styles.statCard, styles.statCardClean]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>Clean Traffic</Text>
            <ShieldCheck size={18} color="#10B981" />
          </View>
          <Text style={[styles.statNum, { color: '#10B981' }]}>{cleanTrafficCount}</Text>
          <Text style={styles.statSub}>{cleanRatio}% validated institutional traffic</Text>
        </View>

        <View style={[styles.statCard, styles.statCardVpn]}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statLabel}>VPN / Proxy Detections</Text>
            <AlertTriangle size={18} color="#F59E0B" />
          </View>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{vpnCount}</Text>
          <Text style={styles.statSub}>Anonymizer nodes intercepted</Text>
        </View>
      </View>

      {/* Logs Table Container */}
      <View style={styles.logsContainer}>
        <View style={styles.logsHeaderBar}>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.pulsingDot} />
            <Text style={styles.logsHeaderTitle}>LIVE SIEM TELEMETRY STREAM</Text>
          </View>
          <Text style={styles.logsPacketCount}>Displaying last 50 network requests</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.2 }]}>CLIENT IP / TIMESTAMP</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>GEOLOCATION & NODE</Text>
          <Text style={[styles.th, { width: 130, textAlign: 'right' }]}>WAF VERDICT</Text>
        </View>

        <FlatList
          data={logs}
          keyExtractor={(item, index) => item.id || index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Activity size={32} color="#64748B" />
              <Text style={styles.emptyText}>Listening for real-time network packets...</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isBlocked = item.status === 'BLOCKED' || item.status === 'MANUALLY_BANNED';
            return (
              <View style={[styles.logRow, isBlocked && styles.logRowBlocked]}>
                <View style={styles.logCol}>
                  <Text style={styles.logIp}>{item.ip_address}</Text>
                  <Text style={styles.logTime}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.logColCenter}>
                  <Text style={styles.logCountry}>{item.country || 'Unknown Geo'}</Text>
                  {item.is_vpn && <Text style={styles.vpnBadge}>VPN / PROXY</Text>}
                </View>
                <View style={styles.logColRight}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'ALLOWED' ? styles.statusAllowed : styles.statusBlocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'ALLOWED' ? styles.statusTextAllowed : styles.statusTextBlocked,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* SOC Top Command Center Header */}
      <View style={styles.header}>
        <View style={styles.brandGroup}>
          <View style={styles.brandIcon}>
            <ShieldAlert color="#EF4444" size={26} />
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.headerTitle}>UMINIKTA SECOPS</Text>
              <View style={styles.socLiveBadge}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.socLiveText}>ARMED & MONITORING</Text>
              </View>
            </View>
            <Text style={styles.headerSub}>007 Threat Management & Telemetry Core • {currentTime}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color="#F87171" />
          <Text style={styles.logoutText}>Terminate Session</Text>
        </TouchableOpacity>
      </View>

      {/* High-Tech Tabs */}
      <View style={styles.tabsWrapper}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'siem' && styles.tabBtnActive]}
          onPress={() => setActiveTab('siem')}
          activeOpacity={0.8}
        >
          <Activity size={16} color={activeTab === 'siem' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'siem' && styles.tabTextActive]}>Live SIEM Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'directory' && styles.tabBtnActive]}
          onPress={() => setActiveTab('directory')}
          activeOpacity={0.8}
        >
          <Users size={16} color={activeTab === 'directory' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'directory' && styles.tabTextActive]}>Global Directory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'waf' && styles.tabBtnActiveWaf]}
          onPress={() => setActiveTab('waf')}
          activeOpacity={0.8}
        >
          <ShieldAlert size={16} color={activeTab === 'waf' ? '#EF4444' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'waf' && styles.tabTextActiveWaf]}>WAF IP Blacklist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'batch' && styles.tabBtnActive]}
          onPress={() => setActiveTab('batch')}
          activeOpacity={0.8}
        >
          <Key size={16} color={activeTab === 'batch' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'batch' && styles.tabTextActive]}>Batch Code Generator</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {activeTab === 'siem' && renderSiemLogs()}
        {activeTab === 'directory' && <GlobalDirectory />}
        {activeTab === 'waf' && <WAFBlacklist />}
        {activeTab === 'batch' && <BatchGenerator />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Obsidian deep black
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brandIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1.2,
  },
  socLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  socLiveText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerSub: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoutText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabsWrapper: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  tabBtnActiveWaf: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  tabText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#38BDF8',
  },
  tabTextActiveWaf: {
    color: '#EF4444',
  },
  contentArea: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statCardBlocked: {
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  statCardClean: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  statCardVpn: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statNum: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statSub: {
    fontSize: 11,
    color: '#64748B',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#0B132B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  logsHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  logsHeaderTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logsPacketCount: {
    color: '#64748B',
    fontSize: 11,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#060D1F',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  th: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#131F37',
  },
  logRowBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  logCol: {
    flex: 1.2,
  },
  logIp: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  logTime: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  logColCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logCountry: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  vpnBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  logColRight: {
    width: 130,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusAllowed: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextAllowed: {
    color: '#10B981',
  },
  statusTextBlocked: {
    color: '#EF4444',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  // Emergency Lockdown Kill-Switch Styles
  lockdownStrip: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  lockdownStripActive: {
    borderColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  lockdownInfoCol: {
    flex: 1,
    minWidth: 280,
  },
  lockdownBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  lockdownStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  lockdownPillNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  lockdownPillActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  lockdownPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lockdownPillTextNormal: {
    color: '#10B981',
  },
  lockdownPillTextActive: {
    color: '#EF4444',
  },
  lockdownTimestamp: {
    fontSize: 11,
    color: '#94A3B8',
  },
  lockdownHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  lockdownSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    maxWidth: 580,
  },
  lockdownActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  lockdownActionBtnActivate: {
    backgroundColor: '#DC2626',
  },
  lockdownActionBtnDeactivate: {
    backgroundColor: '#059669',
  },
  lockdownActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
