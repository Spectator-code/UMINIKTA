import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import UIcon from './UIcon';

export default function StudentNavbar({ currentTab = 'classes' }) {
  const {
    user,
    logout,
    profilePicture,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  const isDesktop = screenWidth >= 768;
  const isClassesActive = pathname === '/(student)' || pathname === '/' || pathname.includes('subject');
  const isProfileActive = pathname.includes('profile');

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (e) {
      console.warn('Logout error:', e);
    }
  };

  const getInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'S';
  };

  return (
    <View style={styles.navbarWrapper}>
      <View style={[styles.navbarContainer, !isDesktop && styles.navbarContainerMobile]}>
        {/* Left: Brand Logo & Portal Badge */}
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => router.push('/(student)')}
          activeOpacity={0.8}
        >
          <View style={styles.brandIconContainer}>
            <Text style={styles.brandIconText}>U</Text>
          </View>
          <View style={styles.brandTextCol}>
            <View style={styles.logoMarkRow}>
              <Text style={styles.brandName}>Uminekta</Text>
              <View style={styles.portalBadge}>
                <Text style={styles.portalBadgeText}>STUDENT</Text>
              </View>
            </View>
            <Text style={styles.brandTagline}>Academic Portal</Text>
          </View>
        </TouchableOpacity>

        {/* Center: Desktop Navigation Links */}
        {isDesktop && (
          <View style={styles.navLinksRow}>
            <TouchableOpacity
              style={[styles.navLink, isClassesActive && styles.navLinkActive]}
              onPress={() => router.push('/(student)')}
            >
              <View style={[styles.navDot, isClassesActive && styles.navDotActive]} />
              <Text style={[styles.navLinkText, isClassesActive && styles.navLinkTextActive]}>
                My Classes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navLink, isProfileActive && styles.navLinkActive]}
              onPress={() => router.push('/(student)/profile')}
            >
              <View style={[styles.navDot, isProfileActive && styles.navDotActive]} />
              <Text style={[styles.navLinkText, isProfileActive && styles.navLinkTextActive]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Right: Notifications & User Profile */}
        <View style={styles.rightActionsRow}>
          {/* Notifications Bell */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setNotifModalVisible(true)}
            activeOpacity={0.7}
          >
            <UIcon name="bell" size={20} color="#374151" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Desktop User Info & Sign Out */}
          {isDesktop ? (
            <View style={styles.userProfileSection}>
              <TouchableOpacity
                style={styles.userInfoRow}
                onPress={() => router.push('/(student)/profile')}
                activeOpacity={0.8}
              >
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.userAvatarImg} />
                ) : (
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{getInitial()}</Text>
                  </View>
                )}
                <View style={styles.userNameCol}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.displayName || 'Student User'}
                  </Text>
                  <Text style={styles.userRoleText}>
                    {user?.idNumber ? `ID: ${user.idNumber}` : 'Student'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(student)/profile')}
              activeOpacity={0.8}
            >
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.userAvatarImgMobile} />
              ) : (
                <View style={styles.userAvatarMobile}>
                  <Text style={styles.userAvatarTextMobile}>{getInitial()}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={notifModalVisible}
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notifModalCard}>
            <View style={styles.notifHeader}>
              <View style={styles.notifHeaderTitleRow}>
                <Text style={styles.notifTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.notifCountBadge}>
                    <Text style={styles.notifCountBadgeText}>{unreadCount} New</Text>
                  </View>
                )}
              </View>
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
                  <Text style={styles.emptyNotifTitle}>No Notifications Yet</Text>
                  <Text style={styles.emptyNotifSub}>
                    You will be notified when your professors post assignments or announcements.
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
                      <View style={styles.notifItemHeader}>
                        <Text style={styles.notifItemTitle}>{n.title}</Text>
                        {!n.read && <View style={styles.unreadDot} />}
                      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  navbarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%',
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  navbarContainer: {
    maxWidth: 1280,
    width: '100%',
    height: 70,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  navbarContainerMobile: {
    height: 60,
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  brandIconText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  logoMarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  portalBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  portalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  navLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 9,
  },
  navLinkActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  navDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  navDotActive: {
    backgroundColor: '#059669',
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  navLinkTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 14,
  },
  bellIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  userProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    paddingLeft: 14,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284C7',
  },
  userAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: 10,
  },
  userAvatarMobile: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  userAvatarTextMobile: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
  },
  userAvatarImgMobile: {
    width: 34,
    height: 34,
    borderRadius: 9,
  },
  userNameCol: {
    justifyContent: 'center',
    maxWidth: 130,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  userRoleText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
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
  notifHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  notifCountBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  notifCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
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
    paddingHorizontal: 20,
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
    lineHeight: 18,
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
  notifItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
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
