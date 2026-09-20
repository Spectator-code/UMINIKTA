import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { ShieldAlert, Trash2, Plus } from 'lucide-react-native';

export default function WAFBlacklist() {
  const [bannedIps, setBannedIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newIp, setNewIp] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBlacklist = async () => {
    try {
      const { data, error } = await supabase
        .from('waf_blacklisted_ips')
        .select('*')
        .order('banned_at', { ascending: false });
      
      if (error) throw error;
      setBannedIps(data || []);
    } catch (e) {
      console.warn('Failed to fetch WAF blacklist:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const handleAddIp = async () => {
    if (!newIp.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('waf_blacklisted_ips')
        .insert([{ ip_address: newIp.trim(), reason: reason.trim() || 'Manual Ban' }])
        .select()
        .single();
        
      if (error) throw error;
      
      setBannedIps([data, ...bannedIps]);
      setNewIp('');
      setReason('');
    } catch (e) {
      console.warn('Failed to add IP to blacklist:', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveIp = async (id) => {
    try {
      const { error } = await supabase
        .from('waf_blacklisted_ips')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setBannedIps(bannedIps.filter(ip => ip.id !== id));
    } catch (e) {
      console.warn('Failed to remove IP:', e.message);
    }
  };

  const renderIpItem = ({ item }) => (
    <View style={styles.ipRow}>
      <View style={styles.colMain}>
        <Text style={styles.ipText}>{item.ip_address}</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>
      <View style={styles.colCenter}>
        <Text style={styles.timeText}>{new Date(item.banned_at).toLocaleString()}</Text>
      </View>
      <View style={styles.colRight}>
        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => handleRemoveIp(item.id)}
        >
          <Trash2 size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#EF4444" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ShieldAlert size={20} color="#EF4444" />
          <Text style={styles.title}>Manual IP Blacklist</Text>
        </View>
        <Text style={styles.count}>{bannedIps.length} Active Bans</Text>
      </View>

      <View style={styles.addForm}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="IP Address (e.g. 192.168.1.1)"
            placeholderTextColor="#64748B"
            value={newIp}
            onChangeText={setNewIp}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { flex: 1.5 }]}
            placeholder="Reason (Optional)"
            placeholderTextColor="#64748B"
            value={reason}
            onChangeText={setReason}
          />
          <TouchableOpacity 
            style={[styles.addBtn, submitting && styles.addBtnDisabled]} 
            onPress={handleAddIp}
            disabled={submitting || !newIp.trim()}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <><Plus size={16} color="#FFF" /><Text style={styles.addBtnText}>BLOCK</Text></>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 1 }]}>IP Address & Reason</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Date Banned</Text>
        <Text style={[styles.th, { width: 60, textAlign: 'right' }]}></Text>
      </View>

      <FlatList
        data={bannedIps}
        keyExtractor={item => item.id}
        renderItem={renderIpItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: -0.5,
  },
  count: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '700',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addForm: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  inputGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
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
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
  },
  colMain: {
    flex: 1,
  },
  ipText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  reasonText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  colCenter: {
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  colRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  removeBtn: {
    padding: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: 8,
  }
});
