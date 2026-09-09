import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, Modal, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { loadSubjects, saveSubjects } from '../../src/utils/mockData';

export default function StudentDashboard() {
  const { user, unreadCount, addNotification } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
    }, [])
  );

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const allSubjects = await loadSubjects();
      const enrolled = allSubjects.filter(s => s.students.includes(user.uid));
      setSubjects(enrolled);
    } catch (e) {
      console.warn('Failed to fetch subjects:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubject = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    try {
      const allSubjects = await loadSubjects();
      const subject = allSubjects.find(s => s.code === joinCode.toUpperCase());

      if (!subject) {
        Alert.alert('Error', 'Invalid join code. No class found with that code.');
        return;
      }

      if (subject.bannedStudents && subject.bannedStudents.includes(user.uid)) {
        Alert.alert('Access Denied', 'You have been banned from this class.');
        return;
      }

      if (subject.students && subject.students.length >= 50) {
        Alert.alert('Error', 'This class is full (Maximum: 50 students).');
        return;
      }

      if (subject.students && subject.students.includes(user.uid)) {
        Alert.alert('Already Enrolled', 'You are already in this class.');
        setModalVisible(false);
        setJoinCode('');
        return;
      }

      subject.students.push(user.uid);
      await saveSubjects(allSubjects);

      await addNotification({
        title: 'Joined Class',
        body: `You successfully joined "${subject.name}".`,
        type: 'class',
      });

      setSubjects(allSubjects.filter(s => s.students.includes(user.uid)));
      setModalVisible(false);
      setJoinCode('');
      Alert.alert('Success', `Joined "${subject.name}" successfully!`);
    } catch (e) {
      Alert.alert('Error', 'Could not join class.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.subjectCard}
      onPress={() => router.push(`/(student)/subject/${item.id}?name=${encodeURIComponent(item.name)}`)}
    >
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.subjectName}>{item.name}</Text>
        <Text style={styles.subjectMeta}>Code: {item.code}  ·  {item.students.length} students</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0] || 'Student'}</Text>
        </View>
        <TouchableOpacity
          style={styles.notifButton}
          onPress={() => router.push('/(student)/profile')}
        >
          <Text style={styles.notifIcon}>N</Text>
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Enrolled Classes</Text>
          <TouchableOpacity style={styles.joinButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.joinButtonText}>+ Join</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>~</Text>
              <Text style={styles.emptyTitle}>{loading ? 'Loading...' : 'No Classes Yet'}</Text>
              <Text style={styles.emptyText}>{loading ? '' : 'Tap "+ Join" to enter a class code.'}</Text>
            </View>
          }
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join a Class</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHint}>Available codes: CS101A, DSA202</Text>

            <Text style={styles.label}>Class Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CS101A"
              placeholderTextColor="#9CA3AF"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={6}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleJoinSubject}>
                <Text style={styles.confirmButtonText}>Join Class</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderColor: '#F3F4F6',
  },
  greeting: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  userName: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 2, textTransform: 'capitalize' },
  notifButton: { position: 'relative', backgroundColor: '#F3F4F6', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  notifIcon: { fontSize: 18, fontWeight: '700', color: '#374151' },
  notifBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  notifBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  joinButton: {
    backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  joinButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  list: { paddingBottom: 32 },
  subjectCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    padding: 16, borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  cardIcon: { backgroundColor: '#ECFDF5', width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardIconText: { fontSize: 20, fontWeight: '800', color: '#059669' },
  cardContent: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subjectMeta: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  chevron: { fontSize: 22, color: '#9CA3AF', fontWeight: '300' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, color: '#D1D5DB', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  modalClose: { fontSize: 20, color: '#9CA3AF', fontWeight: '600', padding: 4 },
  modalHint: { fontSize: 13, color: '#059669', marginBottom: 20, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 18, color: '#111827', letterSpacing: 2, textAlign: 'center', fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, marginRight: 12 },
  cancelButtonText: { color: '#4B5563', fontWeight: 'bold', fontSize: 15 },
  confirmButton: { flex: 1, backgroundColor: '#059669', paddingVertical: 16, alignItems: 'center', borderRadius: 12 },
  confirmButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});
