/**
 * UMINIKTA Centralized Design Token System
 * Provides standardized colors, typography, elevations, border radii, and glassmorphic utilities
 * tailored for Student, Faculty/Professor, and SecOps experiences.
 */

export const theme = {
  colors: {
    // Brand Core
    brand: {
      name: 'UMINIKTA',
      primary: '#059669',
      primaryDark: '#064E3B',
      primaryLight: '#ECFDF5',
      emeraldDeep: '#064E3B',
      emeraldForest: '#022C22',
      gold: '#F59E0B',
      goldDark: '#D97706',
      goldLight: '#FEF3C7',
      goldBorder: '#FDE68A',
      accentMaroon: '#881337',
      accentMaroonLight: '#FFE4E6',
    },

    // Student Role (Academic Emerald & Fresh Teal)
    student: {
      primary: '#059669',
      primaryHover: '#047857',
      surface: '#FFFFFF',
      surfaceAlt: '#F0FDF4',
      border: '#A7F3D0',
      badgeBg: '#ECFDF5',
      badgeText: '#059669',
      heroGradient: ['#059669', '#047857', '#065F46'],
    },

    // Professor / Faculty Role (Executive Indigo & Royal Sapphire)
    professor: {
      primary: '#4F46E5',
      primaryHover: '#4338CA',
      surface: '#FFFFFF',
      surfaceAlt: '#EEF2FF',
      border: '#C7D2FE',
      badgeBg: '#EEF2FF',
      badgeText: '#4F46E5',
      heroGradient: ['#4F46E5', '#4338CA', '#312E81'],
    },

    // SecOps Role (Obsidian Cyber Defense & Neon Accents)
    secops: {
      bg: '#020617',
      surface: '#0B132B',
      surfaceCard: '#0F172A',
      border: '#1E293B',
      borderActive: '#38BDF8',
      cyan: '#38BDF8',
      danger: '#EF4444',
      emerald: '#10B981',
      warning: '#F59E0B',
      textMuted: '#64748B',
      textPrimary: '#F8FAFC',
    },

    // Shared Neutral Scale
    neutral: {
      white: '#FFFFFF',
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
      gray200: '#E5E7EB',
      gray300: '#D1D5DB',
      gray400: '#9CA3AF',
      gray500: '#6B7280',
      gray600: '#4B5563',
      gray700: '#374151',
      gray800: '#1F2937',
      gray900: '#111827',
    },

    // Semantic Status
    status: {
      successBg: '#ECFDF5',
      successText: '#059669',
      successBorder: '#A7F3D0',

      dangerBg: '#FEF2F2',
      dangerText: '#DC2626',
      dangerBorder: '#FECACA',

      warningBg: '#FFFBEB',
      warningText: '#D97706',
      warningBorder: '#FDE68A',

      infoBg: '#EFF6FF',
      infoText: '#2563EB',
      infoBorder: '#BFDBFE',
    },
  },

  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHover: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    },
    modal: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 28,
      elevation: 12,
    },
  },

  typography: {
    fontFamily: {
      sans: 'System',
    },
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 20,
      xxl: 24,
      title: 28,
      hero: 34,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
  },
};

export const darkTheme = {
  ...theme,
  isDark: true,
  colors: {
    ...theme.colors,
    brand: {
      ...theme.colors.brand,
      primary: '#10B981',
      primaryDark: '#047857',
      primaryLight: '#064E3B',
    },
    student: {
      ...theme.colors.student,
      primary: '#10B981',
      primaryHover: '#34D399',
      surface: '#111827',
      surfaceAlt: '#1F2937',
      border: '#374151',
      badgeBg: '#064E3B',
      badgeText: '#A7F3D0',
      heroGradient: ['#064E3B', '#022C22', '#011A14'],
    },
    professor: {
      ...theme.colors.professor,
      primary: '#818CF8',
      primaryHover: '#6366F1',
      surface: '#111827',
      surfaceAlt: '#1F2937',
      border: '#374151',
      badgeBg: '#312E81',
      badgeText: '#C7D2FE',
      heroGradient: ['#312E81', '#1E1B4B', '#0F172A'],
    },
    neutral: {
      white: '#0B0F19',
      gray50: '#0F172A',
      gray100: '#1E293B',
      gray200: '#334155',
      gray300: '#475569',
      gray400: '#64748B',
      gray500: '#94A3B8',
      gray600: '#CBD5E1',
      gray700: '#E2E8F0',
      gray800: '#F1F5F9',
      gray900: '#F8FAFC',
    },
  },
};

export function getTheme(isDark = false) {
  return isDark ? darkTheme : theme;
}

export default theme;

