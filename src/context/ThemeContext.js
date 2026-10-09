/**
 * ============================================================================
 * MODULE: Institutional Theme & Dark Mode Context Provider
 * DIRECTORY: src/context/ThemeContext.js
 * ROLE/SCOPE: Universal UI Theming & WCAG 2.1 AA Compliance
 * DESCRIPTION:
 *   Supplies the active design token palette (Light vs. Dark mode) across all
 *   application screens. Persists student/faculty theme preferences to local
 *   storage and exposes the `useTheme` consumption hook.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. CONTEXT INSTANTIATION & CONSTANTS
 *   3. THEME PROVIDER COMPONENT (ThemeProvider)
 *   4. CONSUMER HOOK (useTheme)
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, theme as defaultTheme } from '../theme';

// ============================================================================
// SECTION 2: CONTEXT INSTANTIATION & CONSTANTS
// ============================================================================
const STORAGE_KEY = 'uminikta_theme_mode';

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  theme: defaultTheme,
});

// ============================================================================
// SECTION 3: THEME PROVIDER COMPONENT
// ============================================================================
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setIsDark(stored === 'dark');
        }
      } catch (e) {
        console.warn('Failed to load theme preference:', e.message);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    try {
      const next = !isDark;
      setIsDark(next);
      await AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to persist theme preference:', e.message);
    }
  };

  const activeTheme = getTheme(isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme: activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// SECTION 4: CONSUMER HOOK
// ============================================================================
/**
 * Hook providing direct access to the active theme palette and toggle action.
 *
 * @returns {{ isDark: boolean, toggleTheme: Function, theme: Object }}
 */
export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
