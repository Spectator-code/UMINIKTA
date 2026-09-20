import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/config/supabase';
import { Activity, Users, ShieldAlert, LogOut } from 'lucide-react-native';

import GlobalDirectory from './GlobalDirectory';
import WAFBlacklist from './WAFBlacklist';

export default function SecOpsDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('siem'); // siem, directory, waf
  const [logs, setLogs] = useState([]);

  // Fetch SIEM logs only for the SIEM tab, but we can keep it alive
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await supabase
          .from('siem_traffic_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        setLogs(data || []);
      } catch (e) {}
    };
    fetchLogs();
    
    const subscription = supabase
      .channel('siem_traffic_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'siem_traffic_logs' }, payload => {
        setLogs(current => [payload.new, ...current].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const renderSiemLogs = () => (
    <View style={styles.tabContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{logs.filter(l => l.status === 'BLOCKED' || l.status === 'MANUALLY_BANNED').length}</Text>
          <Text style={styles.statLabel}>Threats Blocked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#10B981' }]}>{logs.filter(l => l.status === 'ALLOWED').length}</Text>
          <Text style={styles.statLabel}>Clean Traffic</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#EF4444' }]}>{logs.filter(l => l.is_vpn).length}</Text>
          <Text style={styles.statLabel}>VPNs Detected</Text>
        </View>
      </View>

      <View style={styles.logsContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1 }]}>IP / Time</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Geo & Node</Text>
          <Text style={[styles.th, { width: 120, textAlign: 'right' }]}>WAF Status</Text>
        </View>
        <FlatList
          data={logs}
          keyExtractor={(item, index) => item.id || index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.logRow}>
              <View style={styles.logCol}>
                <Text style={styles.logIp}>{item.ip_address}</Text>
                <Text style={styles.logTime}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
              <View style={styles.logColCenter}>
                <Text style={styles.logCountry}>{item.country}</Text>
                {item.is_vpn && <Text style={styles.vpnBadge}>VPN / PROXY</Text>}
              </View>
              <View style={styles.logColRight}>
                <View style={[
                  styles.statusBadge, 
                  item.status === 'ALLOWED' ? styles.statusAllowed : styles.statusBlocked
                ]}>
                  <Text style={[
                    styles.statusText, 
                    item.status === 'ALLOWED' ? styles.statusTextAllowed : styles.statusTextBlocked
                  ]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sidebar / Top Nav Area */}
      <View style={styles.header}>
        <View style={styles.brandGroup}>
          <View style={styles.brandIcon}><ShieldAlert color="#EF4444" size={24} /></View>
          <View>
            <Text style={styles.headerTitle}>UMINEKTA SECOPS</Text>
            <Text style={styles.headerSub}>007 Threat Management</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={16} color="#94A3B8" />
          <Text style={styles.logoutText}>Terminate</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'siem' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('siem')}
        >
          <Activity size={16} color={activeTab === 'siem' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'siem' && styles.tabTextActive]}>Live SIEM</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'directory' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('directory')}
        >
          <Users size={16} color={activeTab === 'directory' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'directory' && styles.tabTextActive]}>Global Directory</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'waf' && styles.tabBtnActiveWaf]} 
          onPress={() => setActiveTab('waf')}
        >
          <ShieldAlert size={16} color={activeTab === 'waf' ? '#EF4444' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'waf' && styles.tabTextActiveWaf]}>WAF Blacklist</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {activeTab === 'siem' && renderSiemLogs()}
        {activeTab === 'directory' && <GlobalDirectory />}
        {activeTab === 'waf' && <WAFBlacklist />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Deeper cinematic black
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brandIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabsWrapper: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 16,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  tabBtnActiveWaf: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statNum: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 12,
    marginBottom: 12,
  },
  th: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
  },
  logCol: {
    flex: 1,
  },
  logIp: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  logTime: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  logColCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logCountry: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  vpnBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logColRight: {
    width: 120,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusAllowed: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusTextAllowed: {
    color: '#10B981',
  },
  statusTextBlocked: {
    color: '#EF4444',
  }
});
