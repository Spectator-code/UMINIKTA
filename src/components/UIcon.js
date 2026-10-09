/**
 * ============================================================================
 * MODULE: Universal Vector Icon Component (UIcon)
 * DIRECTORY: src/components/UIcon.js
 * ROLE/SCOPE: Pure Vector Graphic Renderer & Emoji-Free Visual Language
 * DESCRIPTION:
 *   Universal SVG icon renderer for Web with lightweight typography fallbacks
 *   for native runtimes. Provides standard geometric paths for institutional,
 *   academic, navigation, status, and communication interfaces without external
 *   binary font dependencies or raw emojis.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT INSTANTIATION & PROPERTIES
 *   3. WEB SVG PATH CATALOG (SWITCH DISPATCHER)
 *   4. NATIVE RUNTIME FALLBACK RENDERER
 *   5. COMPONENT STYLESHEET
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

// ============================================================================
// SECTION 2: COMPONENT INSTANTIATION & PROPERTIES
// ============================================================================

/**
 * Universal vector icon renderer.
 *
 * @param {Object} props
 * @param {string} props.name - Semantic icon identifier (e.g. 'book', 'bell', 'graduation')
 * @param {number} [props.size=20] - Dimensions in pixels (width and height)
 * @param {string} [props.color='currentColor'] - SVG stroke/fill color hex or CSS token
 * @param {number} [props.strokeWidth=2] - Stroke thickness in pixels
 * @param {Object} [props.style] - Inline style overrides
 * @returns {React.ReactElement} Scalable SVG element or native text fallback
 */
export default function UIcon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  style,
}) {
  // ==========================================================================
  // SECTION 3: WEB SVG PATH CATALOG (SWITCH DISPATCHER)
  // ==========================================================================
  if (Platform.OS === 'web') {
    const renderPath = () => {
      switch (name) {
        case 'book':
        case 'classes':
          return (
            <>
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 2v20" />
            </>
          );
        case 'user':
        case 'profile':
          return (
            <>
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </>
          );
        case 'bell':
          return (
            <>
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </>
          );
        case 'check':
          return <polyline points="20 6 9 17 4 12" />;
        case 'clock':
          return (
            <>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </>
          );
        case 'paperclip':
        case 'attachment':
          return (
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          );
        case 'file':
        case 'document':
          return (
            <>
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </>
          );
        case 'camera':
          return (
            <>
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </>
          );
        case 'logout':
          return (
            <>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </>
          );
        case 'refresh':
          return (
            <>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </>
          );
        case 'key':
          return (
            <>
              <circle cx="7.5" cy="15.5" r="5.5" />
              <path d="m21 2-9.6 9.6" />
              <path d="m15.5 7.5 3 3L22 7l-3-3" />
            </>
          );
        case 'search':
          return (
            <>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </>
          );
        case 'message':
        case 'chat':
          return (
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          );
        case 'users':
        case 'group':
          return (
            <>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
          );
        case 'graduation':
        case 'academic':
          return (
            <>
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </>
          );
        case 'megaphone':
        case 'announcement':
          return (
            <>
              <path d="m3 11 18-5v12L3 14v-3z" />
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </>
          );
        case 'clipboard':
        case 'activity':
        case 'task':
          return (
            <>
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="m9 14 2 2 4-4" />
            </>
          );
        case 'x':
        case 'close':
          return (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          );
        case 'institution':
        case 'school':
          return (
            <>
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </>
          );
        case 'inbox':
          return (
            <>
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </>
          );
        case 'plus':
          return (
            <>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </>
          );
        case 'chevron-up':
          return <polyline points="18 15 12 9 6 15" />;
        case 'chevron-down':
          return <polyline points="6 9 12 15 18 9" />;
        case 'arrow-up':
          return (
            <>
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </>
          );
        case 'arrow-down':
          return (
            <>
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </>
          );
        case 'mail':
        case 'email':
          return (
            <>
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </>
          );
        case 'lock':
          return (
            <>
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </>
          );
        case 'eye':
          return (
            <>
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          );
        case 'eye-off':
          return (
            <>
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </>
          );
        case 'arrow-left':
          return (
            <>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </>
          );
        case 'arrow-right':
          return (
            <>
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </>
          );
        case 'shield-check':
        case 'shield':
          return (
            <>
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </>
          );
        case 'sparkles':
          return (
            <>
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </>
          );
        case 'briefcase':
          return (
            <>
              <rect width="20" height="14" x="2" y="7" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </>
          );
        case 'building':
          return (
            <>
              <rect width="16" height="20" x="4" y="2" rx="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01" />
              <path d="M16 6h.01" />
              <path d="M12 6h.01" />
              <path d="M12 10h.01" />
              <path d="M12 14h.01" />
              <path d="M16 10h.01" />
              <path d="M16 14h.01" />
              <path d="M8 10h.01" />
              <path d="M8 14h.01" />
            </>
          );
        case 'id-card':
          return (
            <>
              <rect width="18" height="14" x="3" y="5" rx="2" />
              <path d="M7 10h4" />
              <path d="M7 14h8" />
              <circle cx="16" cy="10" r="1.5" />
            </>
          );
        case 'trash':
        case 'delete':
          return (
            <>
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </>
          );
        case 'alert':
        case 'warning':
          return (
            <>
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </>
          );
        case 'info':
          return (
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </>
          );
        default:
          return <circle cx="12" cy="12" r="8" />;
      }
    };

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      >
        {renderPath()}
      </svg>
    );
  }

  // ==========================================================================
  // SECTION 4: NATIVE RUNTIME FALLBACK RENDERER
  // ==========================================================================
  return (
    <View
      style={[
        styles.nativeIconWrap,
        { width: size, height: size },
        style,
      ]}
    >
      <Text style={[styles.nativeGlyph, { color, fontSize: Math.round(size * 0.7) }]}>
        {name === 'check'
          ? 'OK'
          : name === 'x' || name === 'close'
          ? 'X'
          : name === 'plus'
          ? '+'
          : name === 'search'
          ? 'S'
          : name === 'trash' || name === 'delete'
          ? 'DEL'
          : name === 'alert' || name === 'warning'
          ? '!'
          : name === 'logout'
          ? 'EXIT'
          : name === 'arrow-up' || name === 'chevron-up'
          ? '^'
          : name === 'arrow-down' || name === 'chevron-down'
          ? 'v'
          : '-'}
      </Text>
    </View>
  );
}

// ============================================================================
// SECTION 5: COMPONENT STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  nativeIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeGlyph: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
