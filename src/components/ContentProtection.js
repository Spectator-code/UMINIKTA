/**
 * ============================================================================
 * MODULE: Institutional Data & Content Protection Perimeter (RA 10173 Guard)
 * DIRECTORY: src/components/ContentProtection.js
 * ROLE/SCOPE: Client-Side Anti-Scraping, Anti-Exfiltration & Content Shield
 * DESCRIPTION:
 *   Enforces University of Mindanao Academic Data Governance policies:
 *   - Restricts text selection (`user-select: none`) across portal views
 *   - Intercepts unauthorized copy, cut, and paste events on sensitive data
 *   - Disables right-click context menus on academic dashboards and exams
 *   - Permits legitimate input fields (<input>, <textarea>, [contenteditable])
 *   - Displays an institutional security alert badge when copy is intercepted
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. STYLESHEET & INLINE CSS INJECTION
 *   3. COMPONENT IMPLEMENTATION & EVENT GUARDS
 * ============================================================================
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import UIcon from './UIcon';

const GLOBAL_PROTECTION_STYLES = `
  /* Institutional Academic Content Protection - RA 10173 */
  *, *::before, *::after {
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
    -webkit-touch-callout: none !important;
  }

  /* Whitelist: Allow interaction in form inputs, text areas, and code snippet inspectors */
  input, textarea, select, [contenteditable="true"], [data-allow-copy="true"], pre, code,
  input *, textarea *, select *, [contenteditable="true"] *, [data-allow-copy="true"] * {
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
  }

  /* Prevent text highlighting visual artifacts on non-whitelisted elements */
  body *:not(input):not(textarea):not(select):not([contenteditable="true"]):not(pre):not(code)::selection {
    background: transparent !important;
    color: inherit !important;
  }
`;

export default function ContentProtection({ children }) {
  const [toastMessage, setToastMessage] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);

  const triggerProtectionAlert = (message) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    setToastMessage(message);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    hideTimerRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setToastMessage(null);
      });
    }, 2800);
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    // 1. Inject global CSS user-select: none rule into document head
    let styleTag = document.getElementById('uminikta-content-protection-css');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'uminikta-content-protection-css';
      styleTag.type = 'text/css';
      styleTag.appendChild(document.createTextNode(GLOBAL_PROTECTION_STYLES));
      document.head.appendChild(styleTag);
    }

    // Helper: checks if event occurred inside legitimate user input
    const isInputElement = (el) => {
      if (!el) return false;
      const tagName = el.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
      if (el.isContentEditable) return true;
      if (el.getAttribute && el.getAttribute('data-allow-copy') === 'true') return true;
      if (el.closest && el.closest('input, textarea, select, [contenteditable="true"], [data-allow-copy="true"]')) {
        return true;
      }
      return false;
    };

    // 2. Prevent right-click context menu on protected areas
    const handleContextMenu = (e) => {
      if (!isInputElement(e.target)) {
        e.preventDefault();
        triggerProtectionAlert('Right-click context menu is restricted under academic data protection policy.');
      }
    };

    // 3. Prevent text selection dragging
    const handleSelectStart = (e) => {
      if (!isInputElement(e.target)) {
        e.preventDefault();
      }
    };

    // 4. Prevent copy operations on protected text
    const handleCopy = (e) => {
      if (!isInputElement(e.target)) {
        e.preventDefault();
        triggerProtectionAlert('Copying academic portal data is restricted under UM Data Protection Policy (RA 10173).');
      }
    };

    // 5. Prevent cut operations on protected text
    const handleCut = (e) => {
      if (!isInputElement(e.target)) {
        e.preventDefault();
        triggerProtectionAlert('Cutting content from academic viewports is restricted.');
      }
    };

    // 6. Prevent paste operations outside editable inputs
    const handlePaste = (e) => {
      if (!isInputElement(e.target)) {
        e.preventDefault();
        triggerProtectionAlert('Pasting content outside editable form inputs is restricted.');
      }
    };

    // 7. Intercept keyboard shortcuts (Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+U, Ctrl+P, Ctrl+S)
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd) {
        const key = e.key?.toLowerCase();
        if (key === 'c' && !isInputElement(e.target)) {
          e.preventDefault();
          triggerProtectionAlert('Copy shortcut is disabled for protected academic records.');
        } else if (key === 'a' && !isInputElement(e.target)) {
          e.preventDefault();
          triggerProtectionAlert('Selecting portal content is restricted under academic data protection policy.');
        } else if (key === 'x' && !isInputElement(e.target)) {
          e.preventDefault();
          triggerProtectionAlert('Cut shortcut is disabled for protected academic records.');
        } else if (key === 'v' && !isInputElement(e.target)) {
          e.preventDefault();
          triggerProtectionAlert('Paste shortcut is disabled outside editable fields.');
        } else if (key === 'u') {
          e.preventDefault();
          triggerProtectionAlert('Source view inspection is restricted.');
        } else if (key === 'p') {
          e.preventDefault();
          triggerProtectionAlert('Printing portal viewports is restricted to prevent unauthorized record reproduction.');
        } else if (key === 's') {
          e.preventDefault();
          triggerProtectionAlert('Saving local offline snapshots is restricted.');
        }
      }
    };

    // 8. Prevent drag-and-drop text/image exfiltration
    const handleDragStart = (e) => {
      if (!isInputElement(e.target)) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return (
    <View style={styles.container}>
      {children}

      {/* Floating Institutional Data Protection Notice */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.protectionBanner,
            { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
          pointerEvents="none"
        >
          <View style={styles.badgeIconBox}>
            <UIcon name="shield-check" size={16} color="#DC2626" />
          </View>
          <View style={styles.badgeTextBox}>
            <Text style={styles.badgeHeader}>DATA PROTECTION GUARD</Text>
            <Text style={styles.badgeMessage}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  protectionBanner: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 9999,
  },
  badgeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeTextBox: {
    flex: 1,
  },
  badgeHeader: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  badgeMessage: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
