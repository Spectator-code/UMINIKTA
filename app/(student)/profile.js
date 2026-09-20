import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/config/supabase';
import * as ImagePicker from 'expo-image-picker';
import StudentNavbar from '../../src/components/StudentNavbar';
import UIcon from '../../src/components/UIcon';

export default function StudentProfile() {
  const {
    user,
    logout,
    profilePicture,
    coverPhoto,
    updateProfilePicture,
    updateCoverPhoto,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadCount,
  } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({ classes: 0, submissions: 0 });
  const [loading, setLoading] = useState(true);
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );

  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  const isDesktop = screenWidth >= 768;

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [user?.uid])
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 007 Hardening: Secure query replacing mockData
      const { data: enrollments, error: enrollErr } = await supabase
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', user.id);
      
      if (enrollErr) throw enrollErr;

      setStats({ classes: enrollments.length, submissions: 0 }); // Submissions not implemented in schema yet
    } catch (e) {
      console.warn('Failed to fetch stats:', e.message);
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
    if (Platform.OS === 'web') {
      handlePickImage();
      return;
    }
    Alert.alert(
      'Change Profile Picture',
      'Select an option:',
      [
        { text: 'Choose from Gallery', onPress: handlePickImage },
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handlePickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow access to your photo library to set a cover photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [21, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await updateCoverPhoto(result.assets[0].uri);
    }
  };

  const handleChangeCoverPhoto = () => {
    if (Platform.OS === 'web') {
      handlePickCoverImage();
      return;
    }
    Alert.alert(
      'Change Cover Photo',
      'Select an option:',
      [
        { text: 'Choose from Gallery', onPress: handlePickCoverImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your student account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  // 007 Hardening: Removed insecure handleResetData mechanism

  const getInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'S';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentNavbar currentTab="profile" />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* ================= ACADEMIC IDENTITY CARD ================= */}
          <View style={styles.profileHeroCard}>
            {/* Top Green Accent Ribbon or Cover Photo */}
            {coverPhoto ? (
              <Image source={{ uri: coverPhoto }} style={styles.heroAccentRibbon} />
            ) : (
              <View style={styles.heroAccentRibbon} />
            )}

            <View style={styles.heroInnerContent}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  {profilePicture ? (
                    <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>{getInitial()}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.editBadge}
                    onPress={handleChangePhoto}
                    activeOpacity={0.8}
                  >
                    <UIcon name="camera" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.profileDetailsCol}>
                  <View style={styles.titleWithBadge}>
                    <Text style={styles.studentFullName}>
                      {user?.displayName || 'Student User'}
                    </Text>
                  </View>

                  <Text style={styles.studentEmailText}>
                    {user?.email || 'student@umindanao.edu.ph'}
                  </Text>

                  <View style={styles.badgeRow}>
                    <View style={styles.idPill}>
                      <Text style={styles.idLabel}>ID:</Text>
                      <Text style={styles.idValue}>{user?.idNumber || 'Not Set'}</Text>
                    </View>

                    <View style={styles.campusPill}>
                      <Text style={styles.campusText}>{user?.campus || 'UM Matina Campus'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={handleChangeCoverPhoto}
                activeOpacity={0.8}
              >
                <Text style={styles.changePhotoBtnText}>Update Cover Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= ACADEMIC METRICS OVERVIEW ================= */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Academic Activity</Text>

            <View style={styles.bentoStatsContainer}>
              <View style={[styles.bentoCard, styles.bentoHeroCard]}>
                <View style={styles.bentoHeroBgCircle} />
                <View style={styles.bentoHeroBgCircle2} />
                <View style={styles.bentoContent}>
                  <Text style={styles.bentoHeroValue}>{stats.classes}</Text>
                  <Text style={styles.bentoHeroLabel}>Active Classes</Text>
                  <Text style={styles.bentoHeroSublabel}>Enrolled course streams</Text>
                </View>
              </View>

              <View style={styles.bentoSideCol}>
                <View style={[styles.bentoCard, styles.bentoSmallCard1]}>
                  <View style={styles.bentoContent}>
                    <Text style={styles.bentoSmallValue}>{stats.submissions}</Text>
                    <Text style={styles.bentoSmallLabel}>Tasks Done</Text>
                  </View>
                </View>

                <View style={[styles.bentoCard, styles.bentoSmallCard2]}>
                  <View style={styles.bentoContent}>
                    <Text style={[styles.bentoSmallValue, { color: '#B45309' }]}>{notifications.length}</Text>
                    <Text style={[styles.bentoSmallLabel, { color: '#D97706' }]}>Class Alerts</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ================= ACCOUNT ACTIONS & PREFERENCES ================= */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Account & Options</Text>

            <View style={styles.actionsCard}>
              <TouchableOpacity
                style={styles.actionRowItem}
                onPress={() => setNotifModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.actionLeft}>
                  <UIcon name="bell" size={20} color="#059669" style={{ marginRight: 14 }} />
                  <View style={styles.actionTextCol}>
                    <Text style={styles.actionTitle}>Classroom Notifications</Text>
                    <Text style={styles.actionSub}>Review recent announcements & activity updates</Text>
                  </View>
                </View>
                {unreadCount > 0 && (
                  <View style={styles.unreadActionBadge}>
                    <Text style={styles.unreadActionBadgeText}>{unreadCount} New</Text>
                  </View>
                )}
                <Text style={styles.actionChevron}>›</Text>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={styles.actionRowItem}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={styles.actionLeft}>
                  <UIcon name="logout" size={20} color="#EF4444" style={{ marginRight: 14 }} />
                  <View style={styles.actionTextCol}>
                    <Text style={[styles.actionTitle, { color: '#EF4444' }]}>Sign Out</Text>
                    <Text style={styles.actionSub}>End your active student session</Text>
                  </View>
                </View>
                <Text style={styles.actionChevron}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <Text style={styles.footerVersion}>Uminekta Campus LMS · Version 1.0.0 Beta</Text>
            <Text style={styles.footerCopyright}>University of Mindanao Student Academic Services</Text>
          </View>
        </View>
      </ScrollView>

      {/* Notifications Drawer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={notifModalVisible}
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notifModalCard}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notifications</Text>
              <View style={styles.notifHeaderActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={markAllNotificationsRead}
                    style={styles.markAllReadBtn}
                  >
                    <Text style={styles.markAllReadText}>Mark all as read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setNotifModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <UIcon name="close" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifs}>
                  <UIcon name="inbox" size={44} color="#9CA3AF" />
                  <Text style={styles.emptyNotifTitle}>No Notifications</Text>
                  <Text style={styles.emptyNotifSub}>
                    You will receive updates when professors post in your enrolled classes.
                  </Text>
                </View>
              ) : (
                notifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={[styles.notifItem, !n.read && styles.notifItemUnread]}
                    onPress={() => markNotificationRead(n.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notifIconCircle}>
                      <UIcon
                        name={n.type === 'class' ? 'book' : n.type === 'activity' ? 'clipboard' : 'megaphone'}
                        size={16}
                        color="#059669"
                      />
                    </View>
                    <View style={styles.notifBodyCol}>
                      <Text style={styles.notifItemTitle}>{n.title}</Text>
                      <Text style={styles.notifItemBody}>{n.body}</Text>
                      <Text style={styles.notifTime}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  heroAccentRibbon: {
    height: 120, // Increased height for better cover photo aspect
    backgroundColor: '#059669',
    width: '100%',
  },
  heroInnerContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: -30,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarFallbackText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0284C7',
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editBadgeText: {
    fontSize: 12,
  },
  profileDetailsCol: {
    justifyContent: 'center',
    flex: 1,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  studentFullName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  studentEmailText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  idLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  idValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  campusPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  campusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  changePhotoBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  changePhotoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  bentoStatsContainer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  bentoCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  bentoHeroCard: {
    flex: 2,
    minWidth: '55%',
    minHeight: 180,
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  bentoHeroBgCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#10B981',
    opacity: 0.4,
  },
  bentoHeroBgCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#047857',
    opacity: 0.6,
  },
  bentoSideCol: {
    flex: 1,
    minWidth: '35%',
    gap: 16,
    flexDirection: 'column',
  },
  bentoSmallCard1: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    minHeight: 80,
    justifyContent: 'center',
    padding: 16,
  },
  bentoSmallCard2: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    minHeight: 80,
    justifyContent: 'center',
    padding: 16,
  },
  bentoContent: {
    zIndex: 1,
  },
  bentoHeroValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 60,
    letterSpacing: -2,
  },
  bentoHeroLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ECFDF5',
    marginTop: 4,
  },
  bentoHeroSublabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A7F3D0',
    marginTop: 2,
  },
  bentoSmallValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 32,
    letterSpacing: -1,
  },
  bentoSmallLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 2,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  actionRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  actionRowIcon: {
    fontSize: 20,
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  actionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  unreadActionBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  unreadActionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  actionChevron: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 54,
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerVersion: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerCopyright: {
    fontSize: 11,
    color: '#D1D5DB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  notifModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  notifTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  notifHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllReadBtn: {
    marginRight: 12,
  },
  markAllReadText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
  },
  notifList: {
    maxHeight: 400,
  },
  emptyNotifs: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyNotifEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyNotifTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptyNotifSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  notifItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notifItemUnread: {
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifIcon: {
    fontSize: 16,
  },
  notifBodyCol: {
    flex: 1,
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  notifItemBody: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
