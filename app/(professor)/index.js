import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, Modal, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { loadSubjects, saveSubjects } from '../../src/utils/mockData';

export default function ProfessorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
    }, [])
  );

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const allSubjects = await loadSubjects();
      setSubjects(allSubjects);
    } catch (e) {
      console.warn('Failed to fetch subjects:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert('Error', 'Please enter a subject name.');
      return;
    }

    try {
      const allSubjects = await loadSubjects();
      const code = generateCode();
      const newSub = {
        id: `sub-${Date.now()}`,
        name: newSubjectName.trim(),
        code,
        professorId: user.uid,
        professorEmail: user.email,
        students: [],
        bannedStudents: [],
        createdAt: new Date().toISOString(),
      };
      allSubjects.push(newSub);
      await saveSubjects(allSubjects);
      setSubjects(allSubjects);
      setModalVisible(false);
      setNewSubjectName('');
      Alert.alert('Success', `Created "${newSub.name}" with code: ${code}`);
    } catch (e) {
      Alert.alert('Error', 'Could not create subject.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.subjectCard}
      onPress={() => router.push(`/(professor)/subject/${item.id}?name=${encodeURIComponent(item.name)}&code=${item.code}`)}
    >
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.subjectName}>{item.name}</Text>
        <Text style={styles.subjectMeta}>Code: {item.code}  ·  {item.students.length}/50 students</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email ? user.email.charAt(0).toUpperCase() : 'P'}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Dashboard</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Subjects</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+ Create</Text>
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
              <Text style={styles.emptyTitle}>{loading ? 'Loading...' : 'No Subjects Yet'}</Text>
              <Text style={styles.emptyText}>{loading ? '' : 'Tap "+ Create" to add a new subject.'}</Text>
            </View>
          }
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Subject</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Subject Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mathematics 101"
              placeholderTextColor="#9CA3AF"
              value={newSubjectName}
              onChangeText={setNewSubjectName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateSubject}>
                <Text style={styles.createButtonText}>Create</Text>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#4F46E5' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#111827' },
  email: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  logoutButton: { padding: 10, backgroundColor: '#FEF2F2', borderRadius: 12 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addButton: {
    backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  list: { paddingBottom: 32 },
  subjectCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    padding: 16, borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  cardIcon: { backgroundColor: '#EEF2FF', width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardIconText: { fontSize: 20, fontWeight: '800', color: '#4F46E5' },
  cardContent: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subjectMeta: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  chevron: { fontSize: 22, color: '#9CA3AF', fontWeight: '300' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  modalClose: { fontSize: 20, color: '#9CA3AF', fontWeight: '600', padding: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 16, color: '#111827' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, marginRight: 12 },
  cancelButtonText: { color: '#4B5563', fontWeight: 'bold', fontSize: 15 },
  createButton: { flex: 1, backgroundColor: '#4F46E5', paddingVertical: 16, alignItems: 'center', borderRadius: 12 },
  createButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});
