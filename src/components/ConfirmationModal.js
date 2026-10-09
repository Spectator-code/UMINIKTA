/**
 * ============================================================================
 * MODULE: Institutional Universal Confirmation Modal
 * DIRECTORY: src/components/ConfirmationModal.js
 * ROLE/SCOPE: Universal Accessible Confirmation Dialog Engine
 * DESCRIPTION:
 *   Cross-platform modal dialog providing reliable, accessible confirmation
 *   prompts across Web and Native platforms. Replaces non-functional stubs like
 *   Alert.alert on react-native-web and browser popup-blocked window.confirm.
 *   Strictly adheres to University of Mindanao institutional design standards:
 *   Zero-Emoji, Zero-PII, high-contrast WCAG 2.1 AA/AAA compliance.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT INSTANTIATION & PROPS INTERFACE
 *   3. KEYBOARD & WEB LIFECYCLE LISTENERS
 *   4. VIEW STRUCTURE & RENDERER
 *   5. INSTITUTIONAL STYLESHEET
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import UIcon from './UIcon';

// ============================================================================
// SECTION 2: COMPONENT INSTANTIATION & PROPS INTERFACE
// ============================================================================
/**
 * Institutional Confirmation Dialog Component.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Modal display state
 * @param {string} [props.title='Confirm Action'] - Primary heading
 * @param {string} [props.message='Are you sure you want to proceed?'] - Subtitle/prompt
 * @param {string} [props.confirmText='Confirm'] - Affirmative action label
 * @param {string} [props.cancelText='Cancel'] - Dismiss action label
 * @param {string} [props.confirmColor='#DC2626'] - Affirmative button accent hex
 * @param {string} [props.icon='alert'] - UIcon glyph key ('logout', 'trash', 'alert', etc.)
 * @param {boolean} [props.isDestructive=true] - Whether the action permanently destroys state
 * @param {Function} props.onConfirm - Callback triggered when confirmed
 * @param {Function} props.onCancel - Callback triggered when cancelled/dismissed
 */
export default function ConfirmationModal({
  visible = false,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#DC2626',
  icon = 'alert',
  isDestructive = true,
  onConfirm,
  onCancel,
}) {
  // ==========================================================================
  // SECTION 3: KEYBOARD & WEB LIFECYCLE LISTENERS
  // ==========================================================================
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || typeof window === 'undefined') return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onCancel, onConfirm]);

  if (!visible) return null;

  // Compute icon badge background tint
  const iconBg =
    icon === 'logout'
      ? '#EEF2FF'
      : isDestructive
      ? '#FEF2F2'
      : '#F0FDF4';

  const iconColor =
    icon === 'logout'
      ? '#4F46E5'
      : isDestructive
      ? '#DC2626'
      : '#16A34A';

  // ==========================================================================
  // SECTION 4: VIEW STRUCTURE & RENDERER
  // ==========================================================================
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityRole="alertdialog"
      accessibilityModal={true}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlayBackdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={styles.dialogCard}
              accessible={true}
              accessibilityLabel={title}
            >
              {/* Institutional Header Banner */}
              <View style={styles.institutionalBanner}>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>UNIVERSITY OF MINDANAO</Text>
                </View>
                <Text style={styles.subBannerText}>VERIFICATION PROTOCOL</Text>
              </View>

              {/* Graphic Icon & Status Visual */}
              <View style={styles.contentBody}>
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                  <UIcon name={icon} size={28} color={iconColor} strokeWidth={2.2} />
                </View>

                {/* Dialog Heading & Body */}
                <Text style={styles.dialogTitle}>{title}</Text>
                <Text style={styles.dialogMessage}>{message}</Text>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={cancelText}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: confirmColor }]}
                  onPress={onConfirm}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={confirmText}
                >
                  <UIcon
                    name={icon === 'logout' ? 'logout' : icon === 'trash' ? 'trash' : 'check'}
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ============================================================================
// SECTION 5: INSTITUTIONAL STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    width: '100%',
    maxWidth: 440,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 10,
  },
  institutionalBanner: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subBannerText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contentBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  dialogTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  dialogMessage: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1.2,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
