/**
 * ============================================================================
 * MODULE: Institutional Authentication & Session State Context
 * DIRECTORY: src/context/AuthContext.js
 * ROLE/SCOPE: Universal Session Security & Role-Based Access Control (RBAC)
 * DESCRIPTION:
 *   Central state authority managing authenticated user sessions, institutional
 *   email domain verification (@umindanao.edu.ph), role resolution (Student,
 *   Faculty, SecOps Admin), quarantine status, avatar/cover photo storage,
 *   and real-time notifications.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. CROSS-PLATFORM SECURE STORAGE ADAPTERS
 *   3. CONTEXT INSTANTIATION & CONSUMER HOOK (useAuth)
 *   4. AUTH PROVIDER & REACTIVE STATE REPOSITORY
 *   5. SESSION INITIALIZATION & AUTH STATE LISTENER
 *   6. PROFILE & ROLE RESOLUTION (fetchUserProfile)
 *   7. AUTHENTICATION ACTIONS (login, register, logout)
 *   8. PROFILE MEDIA & NOTIFICATION CONTROLS
 *   9. CONTEXT PROVIDER VALUE & EXPORT
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { ActivityLogger } from '../utils/ActivityLogger';
import { getInitialDemoNotifications, NOTIFICATION_CATEGORIES, NOTIFICATION_URGENCY } from '../utils/notificationEngine';
import { performSafeSignOut } from '../utils/logoutHelper';

// ============================================================================
// SECTION 2: CROSS-PLATFORM SECURE STORAGE ADAPTERS
// ============================================================================
const getItemAsync = async (key) => Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
const setItemAsync = async (key, value) => Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
const deleteItemAsync = async (key) => Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);

// ============================================================================
// SECTION 3: CONTEXT INSTANTIATION & CONSUMER HOOK
// ============================================================================
const AuthContext = createContext({});

/**
 * Accesses institutional user authentication, profile data, and RBAC roles.
 *
 * @returns {Object} Active user state, auth methods, and profile utilities.
 */
export const useAuth = () => useContext(AuthContext);

// ============================================================================
// SECTION 4: AUTH PROVIDER & REACTIVE STATE REPOSITORY
// ============================================================================
const PROFILE_PICTURE_KEY = '@profile_picture';
const NOTIFICATIONS_KEY = '@app_notifications_v2';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeToast, setActiveToast] = useState(null);
  const [notificationPreferences, setNotificationPreferences] = useState({
    deadlineAlerts: true,
    gradeAlerts: true,
    announcements: true,
    inAppBanners: true,
  });

  // ==========================================================================
  // SECTION 5: SESSION INITIALIZATION & AUTH STATE LISTENER
  // ==========================================================================

  useEffect(() => {
    // B-04 Remediation: Sanitize sensitive OAuth/magic-link tokens from browser URL hash
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.includes('access_token=') || hash.includes('refresh_token=') || hash.includes('type=recovery') || hash.includes('error=')) {
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }, 500);
      }
    }

    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const enrichedUser = {
          ...session.user,
          displayName: session.user.user_metadata?.display_name,
          idNumber: session.user.user_metadata?.id_number,
          campus: session.user.user_metadata?.campus,
        };
        setUser(enrichedUser);
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const enrichedUser = {
          ...session.user,
          displayName: session.user.user_metadata?.display_name,
          idNumber: session.user.user_metadata?.id_number,
          campus: session.user.user_metadata?.campus,
        };
        setUser(enrichedUser);
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setRole(null);
        setIsBanned(false);
        setProfilePicture(null);
        setCoverPhoto(null);
        setLoading(false);
      }
    });

    loadLocalData();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // ==========================================================================
  // SECTION 6: PROFILE & ROLE RESOLUTION
  // ==========================================================================

  /**
   * Fetches enriched institutional profile data from database, including RBAC role,
   * quarantine status, and custom profile assets.
   *
   * @param {string} userId - UUID of the authenticated user
   * @returns {Promise<void>}
   */
  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('role, is_banned, profile_picture_url, cover_photo_url')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('[AuthContext] fetchUserProfile error:', error.message, error.code);
        throw error;
      }
      if (data) {
        const normalizedRole = (data.role || 'student').trim().toLowerCase();
        setRole(normalizedRole);
        setIsBanned(data.is_banned || false);
        if (data.profile_picture_url) {
          setProfilePicture(data.profile_picture_url);
          setItemAsync(PROFILE_PICTURE_KEY, data.profile_picture_url).catch(console.warn);
        }
        if (data.cover_photo_url) setCoverPhoto(data.cover_photo_url);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const sessionRole = session?.user?.user_metadata?.role || 'student';
        setRole(sessionRole.trim().toLowerCase());
      }
    } catch (error) {
      console.error('[AuthContext] fetchUserProfile caught:', error.message);
      const { data: { session } } = await supabase.auth.getSession();
      const sessionRole = session?.user?.user_metadata?.role || 'student';
      setRole(sessionRole.trim().toLowerCase());
    } finally {
      setLoading(false);
    }
  };

  /**
   * Restores cached profile photo and offline notification backlog from secure local storage.
   *
   * @returns {Promise<void>}
   */
  const loadLocalData = async () => {
    try {
      const savedPic = await getItemAsync(PROFILE_PICTURE_KEY);
      if (savedPic) setProfilePicture(prev => prev || savedPic);

      const savedNotifs = await getItemAsync(NOTIFICATIONS_KEY);
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
        } else {
          setNotifications(getInitialDemoNotifications(role || 'student'));
        }
      } else {
        setNotifications(getInitialDemoNotifications(role || 'student'));
      }
    } catch (e) {
      console.warn('Failed to load local data:', e);
      setNotifications(getInitialDemoNotifications(role || 'student'));
    }
  };

  // ==========================================================================
  // SECTION 7: AUTHENTICATION ACTIONS
  // ==========================================================================

  /**
   * Authenticates user credentials against institutional auth backend.
   * Enforces @umindanao.edu.ph domain validation and minimum password length.
   * Automatically falls back to offline/demo simulation if backend is unreachable.
   *
   * @param {string} email - Institutional email address
   * @param {string} password - Account secret password
   * @returns {Promise<Object>} Session payload with authenticated user object
   */
  const login = async (email, password) => {
    if (!email || !password) throw new Error('Email and password are required.');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith('@umindanao.edu.ph')) {
      throw new Error('You must use a valid @umindanao.edu.ph institutional email address.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters in length.');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      try {
        ActivityLogger.logAction(data.user.id, 'LOGIN', 'Logged in successfully');
      } catch (e) {}
      return data;
    } catch (err) {
      const isConfigError =
        !process.env.EXPO_PUBLIC_SUPABASE_URL ||
        process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project.supabase.co');
      const isNetworkError =
        /failed to fetch|network request|fetch failed|network error/i.test(err?.message || '');

      // Only engage demo mock fallback if Supabase is unconfigured or network is completely unreachable
      if (isConfigError || isNetworkError) {
        const detectedRole = cleanEmail.includes('prof') || cleanEmail.includes('faculty') || cleanEmail.includes('teacher') ? 'professor' : 'student';
        const demoUser = {
          id: 'demo-user-' + Date.now(),
          email: cleanEmail,
          user_metadata: {
            display_name: cleanEmail.split('@')[0].toUpperCase(),
            id_number: '2024-00123',
            role: detectedRole,
            campus: 'UM Matina Campus',
          },
          displayName: cleanEmail.split('@')[0].toUpperCase(),
          idNumber: '2024-00123',
          campus: 'UM Matina Campus',
        };
        setUser(demoUser);
        setRole(detectedRole);
        setIsBanned(false);
        setLoading(false);
        return { user: demoUser };
      }

      // Re-throw genuine authentication errors (e.g. Invalid login credentials, Email not confirmed)
      throw new Error(err.message || 'Unable to authenticate credentials.');
    }
  };

  /**
   * Registers a new institutional account with role and campus metadata.
   * Supports positional parameters or configuration object.
   *
   * @param {string|Object} nameOrEmail - Full name or parameters object
   * @param {string} [idNumberOrPassword] - Student/Faculty ID or password
   * @param {string} [emailOrRole] - Institutional email or role
   * @param {string} [passwordParam] - Password if using positional params
   * @param {string} [roleParam] - Designated role ('student' or 'professor')
   * @returns {Promise<Object>} Created user registration object
   */
  const register = async (nameOrEmail, idNumberOrPassword, emailOrRole, passwordParam, roleParam) => {
    let name = '';
    let idNumber = '';
    let email = '';
    let password = '';
    let selectedRole = 'student';
    let campus = 'UM Matina Campus';

    // Support flexible argument signatures
    if (typeof nameOrEmail === 'object' && nameOrEmail !== null) {
      name = nameOrEmail.name || '';
      idNumber = nameOrEmail.idNumber || '';
      email = nameOrEmail.email || '';
      password = nameOrEmail.password || '';
      selectedRole = nameOrEmail.role || 'student';
      campus = nameOrEmail.campus || 'UM Matina Campus';
    } else if (passwordParam !== undefined) {
      name = nameOrEmail;
      idNumber = idNumberOrPassword;
      email = emailOrRole;
      password = passwordParam;
      selectedRole = roleParam || 'student';
    } else {
      email = nameOrEmail;
      password = idNumberOrPassword;
      selectedRole = emailOrRole || 'student';
      name = email.split('@')[0];
    }

    if (!email || !password) throw new Error('Email and password are required.');
    
    if (!email.toLowerCase().endsWith('@umindanao.edu.ph')) {
      throw new Error('You must register with a valid @umindanao.edu.ph institutional email address.');
    }

    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    const safeRole = selectedRole === 'professor' ? 'professor' : 'student';

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: name,
            id_number: idNumber,
            role: safeRole,
            campus: campus,
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: email.trim(),
        user_metadata: {
          display_name: name || email.split('@')[0],
          id_number: idNumber || '2024-00123',
          role: safeRole,
          campus: campus,
        },
        displayName: name || email.split('@')[0],
        idNumber: idNumber || '2024-00123',
        campus: campus,
      };
      setUser(demoUser);
      setRole(safeRole);
      setIsBanned(false);
      setLoading(false);
      return { user: demoUser };
    }
  };

  /**
   * Signs out current user session, clears cached credentials, and purges state.
   *
   * @returns {Promise<void>}
   */
  const logout = async () => {
    await performSafeSignOut({
      userId: user?.id,
      onStateCleared: () => {
        setUser(null);
        setRole(null);
        setIsBanned(false);
        setProfilePicture(null);
        setCoverPhoto(null);
        setNotifications([]);
      },
    });
  };

  // ==========================================================================
  // SECTION 8: PROFILE MEDIA & NOTIFICATION CONTROLS
  // ==========================================================================

  /**
   * Uploads raw media blob to designated Supabase storage bucket under user partition.
   *
   * @param {string} bucket - Storage bucket identifier ('avatars' | 'covers')
   * @param {string} uri - Local file URI of the image
   * @returns {Promise<string>} Publicly accessible asset URL
   */
  const uploadImageToSupabase = async (bucket, uri) => {
    if (!user) throw new Error('Not logged in');
    
    let ext = uri.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) ext = 'jpg';
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    
    // Partition files under the user UUID
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const res = await fetch(uri);
    const blob = await res.blob();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, { contentType, upsert: true });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl;
  };

  /**
   * Updates user avatar URL in cloud database and updates local session storage.
   *
   * @param {string} uri - Local file URI of new avatar
   * @returns {Promise<void>}
   */
  const updateProfilePicture = async (uri) => {
    try {
      const publicUrl = await uploadImageToSupabase('avatars', uri);
      setProfilePicture(publicUrl);
      
      await supabase.from('users').update({ profile_picture_url: publicUrl }).eq('id', user.id);
      await setItemAsync(PROFILE_PICTURE_KEY, publicUrl);
    } catch (e) {
      console.warn('Failed to save profile picture:', e);
      throw e;
    }
  };

  /**
   * Updates user profile cover banner URL in database.
   *
   * @param {string} uri - Local file URI of new cover image
   * @returns {Promise<void>}
   */
  const updateCoverPhoto = async (uri) => {
    try {
      const publicUrl = await uploadImageToSupabase('covers', uri);
      setCoverPhoto(publicUrl);
      
      await supabase.from('users').update({ cover_photo_url: publicUrl }).eq('id', user.id);
    } catch (e) {
      console.warn('Failed to save cover photo:', e);
      throw e;
    }
  };

  /**
   * Dispatches a new notification to the active user's notification list and syncs storage.
   *
   * @param {Object} notif - Notification payload object
   * @returns {Promise<void>}
   */
  const addNotification = async (notif) => {
    const newNotif = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      read: false,
      createdAt: notif.createdAt || new Date().toISOString(),
      category: notif.category || NOTIFICATION_CATEGORIES.ACADEMIC,
      urgency: notif.urgency || NOTIFICATION_URGENCY.NORMAL,
      ...notif,
    };
    const updatedNotifs = [newNotif, ...notifications.filter(n => n.id !== newNotif.id)];
    setNotifications(updatedNotifs);
    if (notificationPreferences.inAppBanners !== false) {
      setActiveToast(newNotif);
    }
    try {
      await setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch (e) {
      console.warn('Failed to save notification:', e);
    }
  };

  /**
   * Marks a specific notification as acknowledged/read without removing it from history.
   *
   * @param {string} notifId - Unique ID of the notification
   * @returns {Promise<void>}
   */
  const markNotificationRead = async (notifId) => {
    const updatedNotifs = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
    setNotifications(updatedNotifs);
    try {
      await setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch (e) {
      console.warn('Failed to update notification:', e);
    }
  };

  /**
   * Deletes a specific notification from state and storage.
   *
   * @param {string} notifId - Unique ID of the notification
   * @returns {Promise<void>}
   */
  const deleteNotification = async (notifId) => {
    const updatedNotifs = notifications.filter(n => n.id !== notifId);
    setNotifications(updatedNotifs);
    try {
      await setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch (e) {
      console.warn('Failed to delete notification:', e);
    }
  };

  /**
   * Marks all notifications as read in reactive state and storage.
   *
   * @returns {Promise<void>}
   */
  const markAllNotificationsRead = async () => {
    const updatedNotifs = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifs);
    try {
      await setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch (e) {
      console.warn('Failed to update notifications:', e);
    }
  };

  /**
   * Purges all notifications from reactive state and storage.
   *
   * @returns {Promise<void>}
   */
  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      await setItemAsync(NOTIFICATIONS_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('Failed to clear notifications:', e);
    }
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ==========================================================================
  // SECTION 9: CONTEXT PROVIDER VALUE & EXPORT
  // ==========================================================================

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isBanned,
      loading,
      login,
      register,
      logout,
      profilePicture,
      coverPhoto,
      updateProfilePicture,
      updateCoverPhoto,
      notifications,
      addNotification,
      markNotificationRead,
      deleteNotification,
      markAllNotificationsRead,
      clearAllNotifications,
      unreadCount,
      activeToast,
      dismissToast,
      notificationPreferences,
      setNotificationPreferences,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

