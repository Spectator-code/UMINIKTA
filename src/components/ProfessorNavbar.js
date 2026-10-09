/**
 * ============================================================================
 * MODULE: Faculty Portal Navigation Bar & Notification Center
 * DIRECTORY: src/components/ProfessorNavbar.js
 * ROLE/SCOPE: Primary Responsive Header for Faculty Workspace
 * DESCRIPTION:
 *   Top-level navigation header for authenticated professors and faculty members.
 *   Provides swift navigation between teaching subjects, subject creation triggers,
 *   unread activity notifications modal, and secure session logout.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT INSTANTIATION & STATE HOOKS
 *   3. AUTHENTICATION & LOGOUT HANDLER
 *   4. RENDER: DESKTOP & MOBILE BRAND / NAVIGATION
 *   5. RENDER: FACULTY NOTIFICATIONS MODAL
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
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import UIcon from './UIcon';
import theme from '../theme';
import NotificationsDrawer from './NotificationsDrawer';
import NotificationToast from './NotificationToast';

// ============================================================================
// SECTION 2: COMPONENT INSTANTIATION & STATE HOOKS
// ============================================================================

/**
 * Top navigation bar specifically configured for faculty workspaces.
 *
 * @param {Object} props
 * @param {Function} [props.onCreateSubjectPress] - Optional callback triggered to open subject creation modal
 * @returns {React.ReactElement} Responsive faculty header
 */
export default function ProfessorNavbar({ onCreateSubjectPress }) {
  const { user, logout, profilePicture, notifications = [], unreadCount = 0 } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  const isDesktop = screenWidth >= 768;
  const isDashboardActive = pathname === '/(professor)' || pathname === '/(professor)/' || pathname.includes('subject');

  const { confirm } = useConfirm();

  // ==========================================================================
  // SECTION 3: AUTHENTICATION & LOGOUT HANDLER
  // ==========================================================================

  /**
   * Prompts faculty user for logout confirmation and terminates active session.
   */
  const handleLogout = async () => {
    const proceed = await confirm({
      title: 'Confirm Faculty Sign Out',
      message: 'Are you sure you want to end your faculty session? Any unsaved grades or notices will be lost.',
      confirmText: 'Sign Out',
      confirmColor: '#DC2626',
      icon: 'logout',
      isDestructive: true,
    });

    if (proceed) {
      try {
        await logout();
        router.replace('/');
      } catch (e) {
        console.warn('Logout error:', e);
      }
    }
  };

  const getInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'P';
  };

  // ==========================================================================
  // SECTION 4: RENDER: DESKTOP & MOBILE BRAND / NAVIGATION
  // ==========================================================================
  return (
    <View style={styles.navbarWrapper}>
      <View style={[styles.navbarContainer, !isDesktop && styles.navbarContainerMobile]}>
        {/* Left: Brand Logo & Faculty Portal Badge */}
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => router.push('/(professor)')}
          activeOpacity={0.8}
        >
          <View style={styles.brandIconContainer}>
            <Image
              source={require('../../assets/uminikta-logo.png')}
              style={styles.brandIconImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.brandTextCol}>
            <View style={styles.logoMarkRow}>
              <Text style={styles.brandName}>UMINIKTA</Text>
              <View style={styles.facultyBadge}>
                <Text style={styles.facultyBadgeText}>FACULTY</Text>
              </View>
            </View>
            <Text style={styles.brandTagline}>Academic Faculty Portal</Text>
          </View>
        </TouchableOpacity>

        {/* Center: Desktop Navigation Links */}
        {isDesktop && (
          <View style={styles.navLinksRow}>
            <TouchableOpacity
              style={[styles.navLink, isDashboardActive && styles.navLinkActive]}
              onPress={() => router.push('/(professor)')}
            >
              <View style={[styles.navDot, isDashboardActive && styles.navDotActive]} />
              <Text style={[styles.navLinkText, isDashboardActive && styles.navLinkTextActive]}>
                My Classes
              </Text>
            </TouchableOpacity>

            {onCreateSubjectPress && (
              <TouchableOpacity
                style={styles.createClassNavLink}
                onPress={onCreateSubjectPress}
                activeOpacity={0.85}
              >
                <Text style={styles.createClassNavText}>+ New Subject</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Right: Actions & Faculty User Profile */}
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
              <View style={styles.userInfoRow}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.userAvatarImg} />
                ) : (
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{getInitial()}</Text>
                  </View>
                )}
                <View style={styles.userNameCol}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.displayName || user?.email?.split('@')[0] || 'Professor'}
                  </Text>
                  <Text style={styles.userRoleText}>Faculty Member</Text>
                </View>
              </View>

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
              style={styles.logoutButtonMobile}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutButtonTextMobile}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ==================================================================== */}
      {/* SECTION 5: RENDER: FACULTY NOTIFICATIONS DRAWER & IN-APP TOAST        */}
      {/* ==================================================================== */}
      <NotificationsDrawer
        visible={notifModalVisible}
        onClose={() => setNotifModalVisible(false)}
        role="professor"
      />
      <NotificationToast />
    </View>
  );
}

// ============================================================================
// SECTION 6: COMPONENT STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  navbarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%',
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
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
    height: 62,
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconContainer: {
    width: 44,
    height: 44,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  brandIconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
  facultyBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  facultyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
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
    gap: 4,
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
    backgroundColor: '#4F46E5',
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  navLinkTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  createClassNavLink: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginLeft: 4,
  },
  createClassNavText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    paddingLeft: 12,
    flexShrink: 0,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexShrink: 0,
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4F46E5',
  },
  userAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginRight: 8,
    flexShrink: 0,
  },
  userNameCol: {
    justifyContent: 'center',
    maxWidth: 110,
    flexShrink: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  userRoleText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    flexShrink: 0,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  logoutButtonMobile: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonTextMobile: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
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
    maxWidth: 460,
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
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  notifCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifList: {
    maxHeight: 360,
  },
  emptyNotifs: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyNotifTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
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
  notifIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifBodyCol: {
    flex: 1,
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  notifItemBody: {
    fontSize: 12,
    color: '#4B5563',
  },
});
