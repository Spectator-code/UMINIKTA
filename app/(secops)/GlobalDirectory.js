import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Linking } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { ShieldBan, ShieldCheck, Search, Activity, ExternalLink, X } from 'lucide-react-native';

export default function GlobalDirectory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userLogs, setUserLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      // NOTE: RLS must allow SecOps to read/update public.users!
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      console.warn('Failed to fetch global directory:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBan = async (userId, currentBanState) => {
    try {
      const newBanState = !currentBanState;
      const { error } = await supabase
        .from('users')
        .update({ is_banned: newBanState })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Optimistic update
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: newBanState } : u));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, is_banned: newBanState });
      }
    } catch (e) {
      console.warn('Failed to toggle ban:', e.message);
    }
  };

  const handleWafBlacklist = async (ip) => {
    if (!ip) return;
    try {
      await supabase.from('waf_blacklisted_ips').insert([{ ip_address: ip, reason: 'Manual SecOps Ban' }]);
      alert('IP ' + ip + ' has been permanently blacklisted on the WAF.');
    } catch (e) {
      alert('Error blacklisting IP: ' + e.message);
    }
  };

  const fetchUserLogs = async (userId) => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) {
        setUserLogs(data);
      }
    } catch (e) {
      console.warn('Failed to fetch user logs', e.message);
    } finally {
      setLogsLoading(false);
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
    setUserLogs([]);
    fetchUserLogs(user.id);
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.userRow, item.is_banned && styles.bannedRow]}
      onPress={() => openUserModal(item)}
    >
      <View style={styles.colMain}>
        <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
        <Text style={styles.userId}>{item.id_number} • {item.role?.toUpperCase()}</Text>
      </View>
      <View style={styles.colCenter}>
        <View style={styles.campusBadge}>
          <Text style={styles.campusText}>{item.campus}</Text>
        </View>
      </View>
      <View style={styles.colRight}>
        <TouchableOpacity 
          style={[styles.banBtn, item.is_banned ? styles.unbanBtn : styles.doBanBtn]}
          onPress={(e) => {
            e.stopPropagation(); // prevent modal open
            toggleBan(item.id, item.is_banned);
          }}
        >
          {item.is_banned ? (
            <><ShieldCheck size={14} color="#10B981" /><Text style={styles.unbanText}>UNBAN</Text></>
          ) : (
            <><ShieldBan size={14} color="#EF4444" /><Text style={styles.banText}>SUSPEND</Text></>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Global User Directory</Text>
        <Text style={styles.count}>{users.length} Accounts</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 1 }]}>User & Role</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Campus</Text>
        <Text style={[styles.th, { width: 120, textAlign: 'right' }]}>Action</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{selectedUser.name || 'Unknown User'}</Text>
                    <Text style={styles.modalSub}>{selectedUser.id_number} • {selectedUser.role?.toUpperCase()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <X size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Intel Section */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>THREAT INTELLIGENCE</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last Known IP</Text>
                      <Text style={styles.infoValue}>{selectedUser.last_ip || 'No IP Data Available'}</Text>
                    </View>
                    
                    {selectedUser.last_ip && (
                      <View style={styles.actionGrid}>
                        <TouchableOpacity 
                          style={styles.osintBtn}
                          onPress={() => Linking.openURL(`https://www.abuseipdb.com/check/${selectedUser.last_ip}`)}
                        >
                          <Search size={14} color="#38BDF8" />
                          <Text style={styles.osintText}>AbuseIPDB</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.osintBtn}
                          onPress={() => Linking.openURL(`https://www.virustotal.com/gui/search/${selectedUser.last_ip}`)}
                        >
                          <Activity size={14} color="#38BDF8" />
                          <Text style={styles.osintText}>VirusTotal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.blacklistBtn}
                          onPress={() => handleWafBlacklist(selectedUser.last_ip)}
                        >
                          <ShieldBan size={14} color="#EF4444" />
                          <Text style={styles.blacklistText}>WAF Block</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Real Activity Feed */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>ACTIVITY LOG (LIVE)</Text>
                    {logsLoading ? (
                      <ActivityIndicator size="small" color="#38BDF8" style={{ marginTop: 10 }} />
                    ) : userLogs.length > 0 ? (
                      userLogs.map((log) => (
                        <View key={log.id} style={styles.activityItem}>
                          <View style={log.action === 'FAILED_LOGIN' ? styles.activityDotWarn : styles.activityDot}></View>
                          <View>
                            <Text style={styles.activityText}>{log.details}</Text>
                            <Text style={styles.activityTime}>{new Date(log.created_at).toLocaleString()}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.activityTime}>No activity logged yet.</Text>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  count: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '700',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 12,
    marginBottom: 12,
  },
  th: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
  },
  bannedRow: {
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  colMain: {
    flex: 1,
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  userId: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  colCenter: {
    flex: 1,
    alignItems: 'center',
  },
  campusBadge: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  campusText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  colRight: {
    width: 120,
    alignItems: 'flex-end',
  },
  banBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  doBanBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  unbanBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  banText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  unbanText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '70%',
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  modalSub: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
    marginTop: 4,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 8,
  },
  sectionBox: {
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  osintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  osintText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  blacklistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  blacklistText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  activityItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: 6,
  },
  activityDotWarn: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginTop: 6,
  },
  activityText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  }
});
