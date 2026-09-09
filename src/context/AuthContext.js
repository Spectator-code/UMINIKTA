import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const PROFILE_PICTURE_KEY = '@profile_picture';
const NOTIFICATIONS_KEY = '@notifications';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMockMode, setIsMockMode] = useState(true);
  const [profilePicture, setProfilePicture] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const savedSession = await AsyncStorage.getItem('@user_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        setUser(session.user);
        setRole(session.role);
        setIsMockMode(true);
      }

      const savedPic = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      if (savedPic) {
        setProfilePicture(savedPic);
      }

      const savedNotifs = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }
    } catch (e) {
      console.warn('Failed to load session:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (userData, userRole) => {
    try {
      await AsyncStorage.setItem('@user_session', JSON.stringify({ user: userData, role: userRole }));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  };

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const mockRole = email.toLowerCase().includes('prof') ? 'professor' : 'student';
    const mockUser = {
      uid: `mock-${Date.now()}`,
      email: email,
      displayName: email.split('@')[0],
    };

    setUser(mockUser);
    setRole(mockRole);
    setIsMockMode(true);

    const welcomeNotif = {
      id: `notif-${Date.now()}`,
      title: 'Welcome to Uminekta',
      body: `Logged in as ${mockRole}. You are in demo mode.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    };
    const updatedNotifs = [welcomeNotif, ...notifications];
    setNotifications(updatedNotifs);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));

    await saveSession(mockUser, mockRole);
  };

  const register = async (email, password, selectedRole) => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    if (selectedRole === 'student' && !email.endsWith('@umindanao.edu.ph')) {
      throw new Error('Students must use a @umindanao.edu.ph email address.');
    }

    const mockUser = {
      uid: `mock-${Date.now()}`,
      email: email,
      displayName: email.split('@')[0],
    };

    setUser(mockUser);
    setRole(selectedRole);
    setIsMockMode(true);

    const welcomeNotif = {
      id: `notif-${Date.now()}`,
      title: 'Account Created',
      body: `Welcome to Uminekta! Your ${selectedRole} account is ready.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    };
    const updatedNotifs = [welcomeNotif];
    setNotifications(updatedNotifs);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));

    await saveSession(mockUser, selectedRole);
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    setProfilePicture(null);
    setNotifications([]);
    try {
      await AsyncStorage.multiRemove(['@user_session', PROFILE_PICTURE_KEY, NOTIFICATIONS_KEY]);
    } catch (e) {
      console.warn('Failed to clear session:', e);
    }
  };

  const updateProfilePicture = async (uri) => {
    setProfilePicture(uri);
    try {
      await AsyncStorage.setItem(PROFILE_PICTURE_KEY, uri);
    } catch (e) {
      console.warn('Failed to save profile picture:', e);
    }
  };

  const addNotification = async (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notif,
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch (e) {
      console.warn('Failed to save notification:', e);
    }
  };

  const markNotificationRead = async (notifId) => {
    const updatedNotifs = notifications.map(n =>
      n.id === notifId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifs);
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch (e) {
      console.warn('Failed to update notification:', e);
    }
  };

  const markAllNotificationsRead = async () => {
    const updatedNotifs = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifs);
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch (e) {
      console.warn('Failed to update notifications:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider value={{
      user,
      role,
      loading,
      login,
      register,
      logout,
      isMockMode,
      profilePicture,
      updateProfilePicture,
      notifications,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      unreadCount,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
