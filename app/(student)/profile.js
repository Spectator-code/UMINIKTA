import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert, FlatList, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { loadSubjects, loadSubmissions } from '../../src/utils/mockData';
import * as ImagePicker from 'expo-image-picker';

export default function StudentProfile() {
  const {
    user, logout, profilePicture, updateProfilePicture,
    notifications, markNotificationRead, markAllNotificationsRead, unreadCount,
  } = useAuth();

  const [stats, setStats] = useState({ classes: 0, submissions: 0 });
  const [loading, setLoading] = useState(true);
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      const allSubjects = await loadSubjects();
      const enrolled = allSubjects.filter(s => s.students.includes(user.uid));
      const allSubmissions = await loadSubmissions();
      const mySubmissions = allSubmissions.filter(s => s.studentId === user.uid);
      setStats({ classes: enrolled.length, submissions: mySubmissions.length });
    } catch (e) {
      console.warn('Failed to fetch stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow access to your photo library to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await updateProfilePicture(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await updateProfilePicture(result.assets[0].uri);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose a method',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickImage },
        ...(profilePicture ? [{ text: 'Remove Photo', onPress: () => updateProfilePicture(null), style: 'destructive' }] : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => setNotifModalVisible(true)} style={styles.headerNotif}>
          <Text style={styles.headerNotifText}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarTouchable}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{user?.email ? user.email.charAt(0).toUpperCase() : 'S'}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>Edit</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0] || 'Student'}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Student Account</Text>
          </View>
        </View>


        <Text style={styles.sectionTitle}>Activity Overview</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
              <Text style={[styles.statIconText, { color: '#4F46E5' }]}>C</Text>
            </View>
            <Text style={styles.statNumber}>{loading ? '-' : stats.classes}</Text>
            <Text style={styles.statLabel}>Enrolled Classes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.statIconText, { color: '#059669' }]}>A</Text>
            </View>
            <Text style={styles.statNumber}>{loading ? '-' : stats.submissions}</Text>
            <Text style={styles.statLabel}>Submitted</Text>
          </View>
        </View>




        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Uminekta v1.0.0 Beta</Text>
      </ScrollView>


      <Modal visible={notifModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={styles.modalHeaderActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllNotificationsRead} style={styles.markAllButton}>
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                  <Text style={styles.modalClose}>X</Text>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.notifItem, !item.read && styles.notifItemUnread]}
                  onPress={() => markNotificationRead(item.id)}
                >
                  <View style={[styles.notifDot, item.read && styles.notifDotRead]} />
                  <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifBody}>{item.body}</Text>
                    <Text style={styles.notifTime}>{formatDate(item.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyNotif}>
                  <Text style={styles.emptyNotifText}>No notifications.</Text>
                </View>
              }
            />
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  headerNotif: { flexDirection: 'row', alignItems: 'center' },
  headerNotifText: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  headerBadge: { backgroundColor: '#EF4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  headerBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  content: { padding: 24, paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  avatarTouchable: { marginBottom: 16, position: 'relative' },
  avatarImage: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#ECFDF5' },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#ECFDF5',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#D1FAE5',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#059669' },
  editBadge: {
    position: 'absolute', bottom: 0, right: -4,
    backgroundColor: '#4F46E5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  editBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4, textTransform: 'capitalize' },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  roleBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: '#059669', fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, alignItems: 'center',
    marginHorizontal: 6, borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statIconText: { fontSize: 20, fontWeight: '800' },
  statNumber: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
  emptyNotif: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#F3F4F6' },
  emptyNotifText: { color: '#9CA3AF', fontSize: 15 },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF',
    padding: 16, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6',
  },
  notifItemUnread: { backgroundColor: '#F0FDF4', borderColor: '#D1FAE5' },
  notifDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#059669', marginTop: 5, marginRight: 12, flexShrink: 0 },
  notifDotRead: { backgroundColor: '#D1D5DB' },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  notifBody: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 6 },
  notifTime: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  viewAllButton: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 32, marginTop: 8 },
  viewAllText: { color: '#4F46E5', fontWeight: '700', fontSize: 14 },
  logoutButton: {
    backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FEE2E2',
  },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  versionText: { textAlign: 'center', color: '#D1D5DB', fontSize: 13, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  modalHeaderActions: { flexDirection: 'row', alignItems: 'center' },
  markAllButton: { marginRight: 16 },
  markAllText: { color: '#059669', fontWeight: '700', fontSize: 14 },
  modalClose: { fontSize: 20, color: '#9CA3AF', fontWeight: '600', padding: 4 },
});
