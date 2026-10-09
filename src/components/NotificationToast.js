import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import UIcon from './UIcon';

export default function NotificationToast() {
  const { activeToast, dismissToast } = useAuth();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeToast) {
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 80,
        friction: 9,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 5500);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(0);
    }
  }, [activeToast]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      dismissToast();
    });
  };

  const handleAction = () => {
    if (activeToast?.actionRoute) {
      router.push(activeToast.actionRoute);
    }
    handleDismiss();
  };

  if (!activeToast) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 0],
  });

  const isUrgent = activeToast.urgency === 'urgent';
  const isWarning = activeToast.urgency === 'warning';
  const isGrade = activeToast.category === 'grade';

  const badgeColor = isUrgent
    ? '#EF4444'
    : isWarning
    ? '#D97706'
    : isGrade
    ? '#059669'
    : '#4F46E5';

  const badgeBg = isUrgent
    ? '#FEF2F2'
    : isWarning
    ? '#FFFBEB'
    : isGrade
    ? '#ECFDF5'
    : '#EEF2FF';

  const badgeText = isUrgent
    ? '[URGENT DEADLINE]'
    : isWarning
    ? '[ATTENTION REQUIRED]'
    : isGrade
    ? '[GRADE PUBLISHED]'
    : '[CAMPUS NOTICE]';

  const iconName = isGrade
    ? 'check'
    : isUrgent
    ? 'clock'
    : activeToast.category === 'academic'
    ? 'clipboard'
    : activeToast.category === 'peer_review'
    ? 'users'
    : 'bell';

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY }],
          opacity: slideAnim,
        },
      ]}
    >
      <View style={[styles.toastCard, { borderLeftColor: badgeColor }]}>
        <View style={[styles.iconHalo, { backgroundColor: badgeBg }]}>
          <UIcon name={iconName} size={18} color={badgeColor} />
        </View>

        <View style={styles.contentCol}>
          <View style={styles.badgeRow}>
            <View style={[styles.badgePill, { backgroundColor: badgeBg }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
            </View>
            <Text style={styles.timeLabel}>Just now</Text>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {activeToast.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {activeToast.body}
          </Text>

          {activeToast.actionLabel && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleAction}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>{activeToast.actionLabel}</Text>
              <UIcon name="arrow-right" size={12} color="#059669" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <UIcon name="close" size={14} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },
  toastCard: {
    maxWidth: 520,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  iconHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  contentCol: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
    color: '#475569',
    marginBottom: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 2,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 6,
  },
});
