import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../../config/supabase';
import { useConfirm } from '../../context/ConfirmContext';
import {
  ShieldBan,
  ShieldCheck,
  Search,
  Activity,
  X,
  UserCheck,
  UserX,
  Filter,
  UserCog,
} from 'lucide-react-native';

export default function GlobalDirectory() {
  const { confirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userLogs, setUserLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'student' | 'professor' | 'secops' | 'banned'

  const fetchUsers = async () => {
    try {
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
    const actionLabel = currentBanState ? 'Restore Account' : 'Suspend Account';
    const proceed = await confirm({
      title: `${actionLabel}`,
      message: currentBanState
        ? 'Are you sure you want to lift this suspension and restore active campus access for this user?'
        : 'Are you sure you want to suspend this user account? The user will be quarantined from the portal immediately.',
      confirmText: actionLabel,
      confirmColor: currentBanState ? '#10B981' : '#DC2626',
      icon: currentBanState ? 'check' : 'alert',
      isDestructive: !currentBanState,
    });

    if (!proceed) return;

    try {
      const newBanState = !currentBanState;
      const { error } = await supabase
        .from('users')
        .update({ is_banned: newBanState })
        .eq('id', userId);

      if (error) throw error;

      // Optimistic update
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_banned: newBanState } : u)));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, is_banned: newBanState });
      }
    } catch (e) {
      console.warn('Failed to toggle ban:', e.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const proceed = await confirm({
      title: 'Update Institutional Role',
      message: `Are you sure you want to change this user's institutional role to ${newRole.toUpperCase()}? Permissions will update immediately.`,
      confirmText: 'Change Role',
      confirmColor: newRole === 'secops' ? '#DC2626' : '#2563EB',
      icon: 'alert',
      isDestructive: newRole === 'secops',
    });

    if (!proceed) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`User role successfully updated to ${newRole.toUpperCase()}`);
      } else {
        Alert.alert('Role Updated', `User role successfully updated to ${newRole.toUpperCase()}`);
      }
    } catch (e) {
      console.warn('Role update failure:', e.message);
      const errMsg = `Unable to update role to ${newRole.toUpperCase()}: ${e.message || 'Database rejected update'}`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(errMsg);
      } else {
        Alert.alert('Role Update Error', errMsg);
      }
    }
  };

  const handleWafBlacklist = async (ip) => {
    if (!ip) return;
    try {
      await supabase
        .from('waf_blacklisted_ips')
        .insert([{ ip_address: ip, reason: 'Manual SecOps Ban' }]);
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

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.id_number && u.id_number.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (roleFilter === 'banned') return u.is_banned;
    if (roleFilter !== 'all') return u.role?.toLowerCase() === roleFilter;

    return true;
  });

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.userRow, item.is_banned && styles.bannedRow]}
      onPress={() => openUserModal(item)}
      activeOpacity={0.8}
    >
      <View style={styles.colMain}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.name || item.email?.split('@')[0] || 'Unknown User'}</Text>
          {item.is_banned && (
            <View style={styles.suspendedTag}>
              <Text style={styles.suspendedTagText}>SUSPENDED</Text>
            </View>
          )}
        </View>
        <Text style={styles.userId}>
          {item.id_number || 'NO-ID'} • {item.role?.toUpperCase()} • {item.email || 'institutional'}
        </Text>
      </View>

      <View style={styles.colCenter}>
        <View style={styles.campusBadge}>
          <Text style={styles.campusText}>{item.campus || 'Matina Campus'}</Text>
        </View>
      </View>

      <View style={styles.colRight}>
        <TouchableOpacity
          style={[styles.banBtn, item.is_banned ? styles.unbanBtn : styles.doBanBtn]}
          onPress={(e) => {
            e.stopPropagation();
            toggleBan(item.id, item.is_banned);
          }}
        >
          {item.is_banned ? (
            <>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.unbanText}>RESTORE</Text>
            </>
          ) : (
            <>
              <ShieldBan size={14} color="#EF4444" />
              <Text style={styles.banText}>SUSPEND</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search and Role Filter Bar */}
      <View style={styles.controlsRow}>
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID number, or email..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterPills}>
          <TouchableOpacity
            style={[styles.filterPill, roleFilter === 'all' && styles.filterPillActive]}
            onPress={() => setRoleFilter('all')}
          >
            <Text style={[styles.filterPillText, roleFilter === 'all' && styles.filterPillTextActive]}>
              All ({users.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, roleFilter === 'student' && styles.filterPillActive]}
            onPress={() => setRoleFilter('student')}
          >
            <Text style={[styles.filterPillText, roleFilter === 'student' && styles.filterPillTextActive]}>
              Students
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, roleFilter === 'professor' && styles.filterPillActive]}
            onPress={() => setRoleFilter('professor')}
          >
            <Text style={[styles.filterPillText, roleFilter === 'professor' && styles.filterPillTextActive]}>
              Faculty
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, roleFilter === 'secops' && styles.filterPillActive]}
            onPress={() => setRoleFilter('secops')}
          >
            <Text style={[styles.filterPillText, roleFilter === 'secops' && styles.filterPillTextActive]}>
              SecOps
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, roleFilter === 'banned' && styles.filterPillActiveDanger]}
            onPress={() => setRoleFilter('banned')}
          >
            <Text style={[styles.filterPillText, roleFilter === 'banned' && styles.filterPillTextDanger]}>
              Suspended
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Directory Table */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.4 }]}>IDENTITY & ROSTER ROLE</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>INSTITUTIONAL CAMPUS</Text>
          <Text style={[styles.th, { width: 120, textAlign: 'right' }]}>ACCOUNT STATUS</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingText}>Indexing user accounts from directory...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <UserX size={36} color="#64748B" />
            <Text style={styles.emptyTitle}>No Accounts Match Current Filter</Text>
            <Text style={styles.emptySub}>
              Adjust your search keywords or toggle the role filters above.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* User Inspection Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <View style={styles.modalTitleRow}>
                      <Text style={styles.modalTitle}>
                        {selectedUser.name || selectedUser.email?.split('@')[0] || 'Unknown User'}
                      </Text>
                      {selectedUser.is_banned && (
                        <View style={styles.suspendedTag}>
                          <Text style={styles.suspendedTagText}>SUSPENDED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.modalSub}>
                      {selectedUser.id_number} • {selectedUser.role?.toUpperCase()} • {selectedUser.email}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <X size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Global Role Assignment Box */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>GLOBAL ACCOUNT ROLE ASSIGNMENT</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 12 }}>
                      Current Role: <Text style={{ color: '#38BDF8', fontWeight: '800' }}>{selectedUser.role?.toUpperCase() || 'STUDENT'}</Text>
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      <TouchableOpacity
                        style={[
                          styles.roleChangeChip,
                          selectedUser.role?.toLowerCase() === 'student' && styles.roleChangeChipActive,
                        ]}
                        onPress={() => handleRoleChange(selectedUser.id, 'student')}
                      >
                        <UserCheck size={14} color={selectedUser.role?.toLowerCase() === 'student' ? '#38BDF8' : '#64748B'} />
                        <Text style={[styles.roleChipText, selectedUser.role?.toLowerCase() === 'student' && styles.roleChipTextActive]}>
                          Student Role
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleChangeChip,
                          selectedUser.role?.toLowerCase() === 'professor' && styles.roleChangeChipActive,
                        ]}
                        onPress={() => handleRoleChange(selectedUser.id, 'professor')}
                      >
                        <UserCog size={14} color={selectedUser.role?.toLowerCase() === 'professor' ? '#38BDF8' : '#64748B'} />
                        <Text style={[styles.roleChipText, selectedUser.role?.toLowerCase() === 'professor' && styles.roleChipTextActive]}>
                          Faculty Role
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleChangeChip,
                          selectedUser.role?.toLowerCase() === 'secops' && styles.roleChangeChipActiveDanger,
                        ]}
                        onPress={() => handleRoleChange(selectedUser.id, 'secops')}
                      >
                        <ShieldCheck size={14} color={selectedUser.role?.toLowerCase() === 'secops' ? '#EF4444' : '#64748B'} />
                        <Text style={[styles.roleChipText, selectedUser.role?.toLowerCase() === 'secops' && styles.roleChipTextDanger]}>
                          SecOps Admin Role
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Threat Intelligence Box */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>THREAT INTELLIGENCE & TELEMETRY</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Last Logged IP Address:</Text>
                      <Text style={styles.infoValue}>{selectedUser.last_ip || 'No Network Telemetry Recorded'}</Text>
                    </View>

                    {selectedUser.last_ip && (
                      <View style={styles.actionGrid}>
                        <TouchableOpacity
                          style={styles.osintBtn}
                          onPress={() =>
                            Linking.openURL(`https://www.abuseipdb.com/check/${selectedUser.last_ip}`)
                          }
                        >
                          <Search size={14} color="#38BDF8" />
                          <Text style={styles.osintText}>AbuseIPDB Check</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.osintBtn}
                          onPress={() =>
                            Linking.openURL(`https://www.virustotal.com/gui/search/${selectedUser.last_ip}`)
                          }
                        >
                          <Activity size={14} color="#38BDF8" />
                          <Text style={styles.osintText}>VirusTotal Scan</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.blacklistBtn}
                          onPress={() => handleWafBlacklist(selectedUser.last_ip)}
                        >
                          <ShieldBan size={14} color="#EF4444" />
                          <Text style={styles.blacklistText}>Blacklist IP</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Audit Logs */}
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>RECENT AUDIT ACTIVITY</Text>
                    {logsLoading ? (
                      <ActivityIndicator size="small" color="#38BDF8" style={{ marginVertical: 12 }} />
                    ) : userLogs.length === 0 ? (
                      <Text style={styles.noLogsText}>No recent security audit actions found.</Text>
                    ) : (
                      userLogs.map((log) => (
                        <View key={log.id} style={styles.auditLogRow}>
                          <Text style={styles.auditLogAction}>{log.action}</Text>
                          <Text style={styles.auditLogDetail}>{log.details}</Text>
                          <Text style={styles.auditLogTime}>
                            {new Date(log.created_at).toLocaleString()}
                          </Text>
                        </View>
                      ))
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
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    flex: 1,
    minWidth: 260,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    marginLeft: 10,
    fontSize: 13,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  filterPillActiveDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  filterPillTextDanger: {
    color: '#EF4444',
    fontWeight: '700',
  },
  tableCard: {
    flex: 1,
    backgroundColor: '#0B132B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  th: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  listContent: {
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#131F37',
  },
  bannedRow: {
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  colMain: {
    flex: 1.4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  suspendedTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suspendedTagText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  userId: {
    color: '#64748B',
    fontSize: 12,
  },
  colCenter: {
    flex: 1,
    alignItems: 'center',
  },
  campusBadge: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
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
    letterSpacing: 0.5,
  },
  unbanText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: 8,
  },
  emptyTitle: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    width: '100%',
    maxWidth: 600,
    maxHeight: '85%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    maxHeight: 460,
  },
  sectionBox: {
    backgroundColor: '#0B132B',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  infoValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  osintBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  osintText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  blacklistBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  blacklistText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  noLogsText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  auditLogRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#131F37',
    paddingVertical: 8,
  },
  auditLogAction: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  auditLogDetail: {
    color: '#CBD5E1',
    fontSize: 12,
    marginVertical: 2,
  },
  auditLogTime: {
    color: '#64748B',
    fontSize: 10,
  },
  roleChangeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  roleChangeChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  roleChangeChipActiveDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  roleChipTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  roleChipTextDanger: {
    color: '#EF4444',
    fontWeight: '800',
  },
});
