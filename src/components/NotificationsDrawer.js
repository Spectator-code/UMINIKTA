import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import UIcon from './UIcon';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_URGENCY,
  SIMULATION_PRESETS,
} from '../utils/notificationEngine';

export default function NotificationsDrawer({ visible, onClose, role = 'student' }) {
  const router = useRouter();
  const {
    notifications = [],
    markNotificationRead,
    deleteNotification,
    markAllNotificationsRead,
    clearAllNotifications,
    unreadCount = 0,
    addNotification,
    notificationPreferences = {},
    setNotificationPreferences,
  } = useAuth();
  const { confirm } = useConfirm();

  const handleClearAll = async () => {
    const proceed = await confirm({
      title: 'Clear All Notifications',
      message: 'Are you sure you want to dismiss and clear all notification advisories from your inbox?',
      confirmText: 'Clear All',
      confirmColor: '#DC2626',
      icon: 'trash',
      isDestructive: true,
    });
    if (proceed) {
      clearAllNotifications();
    }
  };

  const handleDismissOne = async (id) => {
    const proceed = await confirm({
      title: 'Dismiss Notification',
      message: 'Are you sure you want to dismiss this notification advisory?',
      confirmText: 'Dismiss',
      confirmColor: '#DC2626',
      icon: 'trash',
      isDestructive: true,
    });
    if (proceed) {
      deleteNotification(id);
    }
  };

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'academic' | 'grade' | 'announcement'
  const [showPreferences, setShowPreferences] = useState(false);

  const isProf = role === 'professor' || role === 'faculty';
  const themePrimary = isProf ? '#312E81' : '#064E3B';
  const themeAction = isProf ? '#4F46E5' : '#059669';
  const themeLight = isProf ? '#EEF2FF' : '#ECFDF5';

  // Filter notifications according to active tab
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'academic':
        return notifications.filter(
          (n) => n.category === NOTIFICATION_CATEGORIES.ACADEMIC || n.urgency === NOTIFICATION_URGENCY.URGENT
        );
      case 'grade':
        return notifications.filter((n) => n.category === NOTIFICATION_CATEGORIES.GRADE);
      case 'announcement':
        return notifications.filter(
          (n) =>
            n.category === NOTIFICATION_CATEGORIES.ANNOUNCEMENT ||
            n.category === NOTIFICATION_CATEGORIES.SYSTEM ||
            n.category === NOTIFICATION_CATEGORIES.PEER_REVIEW
        );
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const handleAction = (item) => {
    if (!item.read) {
      markNotificationRead(item.id);
    }
    if (item.actionRoute) {
      onClose();
      router.push(item.actionRoute);
    }
  };

  const handleTogglePref = (key) => {
    if (!setNotificationPreferences) return;
    setNotificationPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const past = new Date(isoString).getTime();
      const now = new Date().getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay < 7) return `${diffDay}d ago`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  const getItemUrgencyMeta = (item) => {
    if (item.urgency === NOTIFICATION_URGENCY.URGENT) {
      return {
        badge: '[URGENT DEADLINE]',
        color: '#EF4444',
        bg: '#FEF2F2',
        icon: 'clock',
      };
    }
    if (item.urgency === NOTIFICATION_URGENCY.WARNING) {
      return {
        badge: item.category === NOTIFICATION_CATEGORIES.PEER_REVIEW ? '[PEER REVIEW]' : '[ATTENTION]',
        color: '#D97706',
        bg: '#FFFBEB',
        icon: 'users',
      };
    }
    if (item.category === NOTIFICATION_CATEGORIES.GRADE) {
      return {
        badge: '[GRADE PUBLISHED]',
        color: '#059669',
        bg: '#ECFDF5',
        icon: 'check',
      };
    }
    if (item.category === NOTIFICATION_CATEGORIES.ANNOUNCEMENT) {
      return {
        badge: '[CAMPUS MEMO]',
        color: '#4F46E5',
        bg: '#EEF2FF',
        icon: 'megaphone',
      };
    }
    if (item.category === NOTIFICATION_CATEGORIES.SYSTEM) {
      return {
        badge: '[SECURITY ALERT]',
        color: '#334155',
        bg: '#F1F5F9',
        icon: 'shield',
      };
    }
    return {
      badge: '[CLASS NOTICE]',
      color: themeAction,
      bg: themeLight,
      icon: 'clipboard',
    };
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.drawerCard}>
          {/* Header */}
          <View style={[styles.drawerHeader, { borderBottomColor: themeLight }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconBox, { backgroundColor: themeLight }]}>
                <UIcon name="bell" size={18} color={themeAction} />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {isProf ? 'Faculty Notifications' : 'Student Notifications'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  Institutional alerts & deadline intelligence
                </Text>
              </View>
            </View>

            <View style={styles.headerRightControls}>
              <TouchableOpacity
                style={[styles.headerControlBtn, showPreferences && { backgroundColor: themeLight }]}
                onPress={() => setShowPreferences(!showPreferences)}
                activeOpacity={0.7}
              >
                <UIcon name={showPreferences ? 'chevron-up' : 'refresh'} size={16} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerControlBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <UIcon name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Preferences & Simulation Panel (Collapsible) */}
          {showPreferences && (
            <View style={styles.prefPanel}>
              <View style={styles.prefSectionHeader}>
                <Text style={styles.prefSectionTitle}>Notification Settings & Simulation</Text>
                <Text style={styles.prefSectionSub}>Configure delivery channels or dispatch test alerts</Text>
              </View>

              {/* Toggles */}
              <View style={styles.togglesGrid}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Urgent Deadline Reminders</Text>
                  <Switch
                    value={notificationPreferences.deadlineAlerts !== false}
                    onValueChange={() => handleTogglePref('deadlineAlerts')}
                    trackColor={{ false: '#CBD5E1', true: themeAction }}
                  />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Evaluation & Grade Alerts</Text>
                  <Switch
                    value={notificationPreferences.gradeAlerts !== false}
                    onValueChange={() => handleTogglePref('gradeAlerts')}
                    trackColor={{ false: '#CBD5E1', true: themeAction }}
                  />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>In-App Animated Banners</Text>
                  <Switch
                    value={notificationPreferences.inAppBanners !== false}
                    onValueChange={() => handleTogglePref('inAppBanners')}
                    trackColor={{ false: '#CBD5E1', true: themeAction }}
                  />
                </View>
              </View>

              {/* Test Alert Dispatcher */}
              <View style={styles.simWrapper}>
                <Text style={styles.simHeaderTitle}>Dispatch Evaluator Test Alert</Text>
                <View style={styles.simButtonsRow}>
                  {SIMULATION_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[styles.simBtn, { borderColor: preset.color }]}
                      onPress={() => addNotification(preset.payload)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.simDot, { backgroundColor: preset.color }]} />
                      <Text style={[styles.simBtnText, { color: preset.color }]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Filter Tabs Bar */}
          <View style={styles.tabsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              <TouchableOpacity
                style={[styles.tabPill, activeTab === 'all' && [styles.tabPillActive, { backgroundColor: themeLight }]]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.tabPillText, activeTab === 'all' && [styles.tabPillTextActive, { color: themeAction }]]}>
                  All ({notifications.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabPill, activeTab === 'unread' && [styles.tabPillActive, { backgroundColor: themeLight }]]}
                onPress={() => setActiveTab('unread')}
              >
                <Text style={[styles.tabPillText, activeTab === 'unread' && [styles.tabPillTextActive, { color: themeAction }]]}>
                  Unread ({unreadCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabPill, activeTab === 'academic' && [styles.tabPillActive, { backgroundColor: themeLight }]]}
                onPress={() => setActiveTab('academic')}
              >
                <Text style={[styles.tabPillText, activeTab === 'academic' && [styles.tabPillTextActive, { color: themeAction }]]}>
                  Deadlines
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabPill, activeTab === 'grade' && [styles.tabPillActive, { backgroundColor: themeLight }]]}
                onPress={() => setActiveTab('grade')}
              >
                <Text style={[styles.tabPillText, activeTab === 'grade' && [styles.tabPillTextActive, { color: themeAction }]]}>
                  Grades
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabPill, activeTab === 'announcement' && [styles.tabPillActive, { backgroundColor: themeLight }]]}
                onPress={() => setActiveTab('announcement')}
              >
                <Text style={[styles.tabPillText, activeTab === 'announcement' && [styles.tabPillTextActive, { color: themeAction }]]}>
                  Advisories
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Action Bar (Mark All / Clear) */}
          <View style={styles.subActionsBar}>
            <Text style={styles.itemsCountText}>
              Showing {filteredNotifications.length} items
            </Text>
            <View style={styles.subActionsRight}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={markAllNotificationsRead}
                  style={styles.textActionBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.textActionBtnLabel, { color: themeAction }]}>Mark all read</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearAll}
                  style={styles.textActionBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.textActionBtnLabel, { color: '#EF4444' }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Notifications Stream */}
          <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <UIcon name="inbox" size={32} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>Zero Notifications</Text>
                <Text style={styles.emptyBody}>
                  {activeTab === 'unread'
                    ? 'All academic advisories and submission alerts have been read.'
                    : 'No alerts match the selected filter category.'}
                </Text>
              </View>
            ) : (
              filteredNotifications.map((item) => {
                const meta = getItemUrgencyMeta(item);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.notifCard,
                      !item.read && styles.notifCardUnread,
                      { borderLeftColor: meta.color },
                    ]}
                  >
                    <View style={[styles.cardIconCircle, { backgroundColor: meta.bg }]}>
                      <UIcon name={meta.icon} size={16} color={meta.color} />
                    </View>

                    <View style={styles.cardContent}>
                      {/* Meta header */}
                      <View style={styles.cardMetaRow}>
                        <View style={[styles.urgencyPill, { backgroundColor: meta.bg }]}>
                          <Text style={[styles.urgencyText, { color: meta.color }]}>
                            {meta.badge}
                          </Text>
                        </View>
                        <View style={styles.cardTimeWrap}>
                          <Text style={styles.cardTime}>{formatRelativeTime(item.createdAt)}</Text>
                          {!item.read && <View style={styles.unreadIndicator} />}
                        </View>
                      </View>

                      {/* Content */}
                      <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardBody}>
                        {item.body}
                      </Text>

                      {/* Deep Link Action */}
                      {item.actionLabel && (
                        <TouchableOpacity
                          style={[styles.cardActionBtn, { backgroundColor: meta.bg }]}
                          onPress={() => handleAction(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.cardActionText, { color: meta.color }]}>
                            {item.actionLabel}
                          </Text>
                          <UIcon name="arrow-right" size={12} color={meta.color} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      )}

                      {/* Item Footer Controls */}
                      <View style={styles.cardFooterControls}>
                        <TouchableOpacity
                          style={styles.footerAction}
                          onPress={() => markNotificationRead(item.id)}
                        >
                          <UIcon
                            name="check"
                            size={12}
                            color={item.read ? '#94A3B8' : themeAction}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[styles.footerActionText, !item.read && { color: themeAction }]}>
                            {item.read ? 'Read' : 'Mark as read'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.footerAction}
                          onPress={() => handleDismissOne(item.id)}
                        >
                          <UIcon name="close" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                          <Text style={styles.footerActionText}>Dismiss</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  drawerCard: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerControlBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  prefPanel: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 16,
  },
  prefSectionHeader: {
    marginBottom: 10,
  },
  prefSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  prefSectionSub: {
    fontSize: 11,
    color: '#64748B',
  },
  togglesGrid: {
    gap: 8,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  simWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  simHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  simButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  simDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  simBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabsBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabPillActive: {},
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabPillTextActive: {
    fontWeight: '800',
  },
  subActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemsCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  subActionsRight: {
    flexDirection: 'row',
    gap: 12,
  },
  textActionBtn: {
    paddingVertical: 2,
  },
  textActionBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  notifList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 10,
  },
  notifCardUnread: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  cardIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  urgencyPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  unreadIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  cardTitleUnread: {
    fontWeight: '800',
    color: '#0F172A',
  },
  cardBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 6,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerActionText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
