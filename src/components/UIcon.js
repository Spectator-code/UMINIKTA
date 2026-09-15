import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

/**
 * UIcon Component
 * Crisp, modern SVG vector icons for Web, with safe cross-platform fallback.
 * Eliminates all raw emojis in favor of sleek, professional academic UI icons.
 */
export default function UIcon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  style,
}) {
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

  // Fallback for native runtime if ever rendered outside web
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
          : '-'}
      </Text>
    </View>
  );
}

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
