import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const PROFILE_PICTURE_KEY = '@profile_picture';
const NOTIFICATIONS_KEY = '@notifications';
const REGISTERED_USERS_KEY = '@registered_users';

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

  const getRegisteredUsers = async () => {
    try {
      const data = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const registeredUsers = await getRegisteredUsers();
    const existingUser = registeredUsers.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    let loggedInUser;
    let userRole;

    if (existingUser) {
      if (existingUser.password !== password) {
        throw new Error('Incorrect password. Please check your credentials.');
      }
      loggedInUser = {
        uid: existingUser.uid,
        email: existingUser.email,
        displayName: existingUser.displayName || existingUser.name,
        idNumber: existingUser.idNumber,
      };
      userRole = existingUser.role;
    } else {
      // Fallback for demo/mock accounts
      userRole = email.toLowerCase().includes('prof') ? 'professor' : 'student';
      loggedInUser = {
        uid: `mock-${Date.now()}`,
        email: email.trim(),
        displayName: email.split('@')[0],
      };
    }

    setUser(loggedInUser);
    setRole(userRole);
    setIsMockMode(true);

    const welcomeNotif = {
      id: `notif-${Date.now()}`,
      title: 'Welcome to Uminekta',
      body: `Logged in as ${userRole}.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    };
    const updatedNotifs = [welcomeNotif, ...notifications];
    setNotifications(updatedNotifs);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));

    await saveSession(loggedInUser, userRole);
  };

  const register = async (nameOrEmail, idNumberOrPassword, emailOrRole, passwordParam, roleParam) => {
    let name = '';
    let idNumber = '';
    let email = '';
    let password = '';
    let selectedRole = 'student';

    // Handle object parameter
    if (typeof nameOrEmail === 'object' && nameOrEmail !== null) {
      name = nameOrEmail.name || '';
      idNumber = nameOrEmail.idNumber || '';
      email = nameOrEmail.email || '';
      password = nameOrEmail.password || '';
      selectedRole = nameOrEmail.role || 'student';
    } else if (passwordParam !== undefined) {
      // (name, idNumber, email, password, role)
      name = nameOrEmail;
      idNumber = idNumberOrPassword;
      email = emailOrRole;
      password = passwordParam;
      selectedRole = roleParam || 'student';
    } else {
      // Legacy fallback (email, password, role)
      email = nameOrEmail;
      password = idNumberOrPassword;
      selectedRole = emailOrRole || 'student';
      name = email.split('@')[0];
    }

    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    if (selectedRole === 'student' && !email.toLowerCase().endsWith('@umindanao.edu.ph')) {
      throw new Error('Students must register with a valid @umindanao.edu.ph email address.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Check if user already exists
    const registeredUsers = await getRegisteredUsers();
    if (registeredUsers.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const newUser = {
      uid: `user-${Date.now()}`,
      email: email.trim(),
      displayName: name || email.split('@')[0],
      name: name || email.split('@')[0],
      idNumber: idNumber || '',
      password: password,
      role: selectedRole,
      createdAt: new Date().toISOString(),
    };

    // Save to persistent user list
    const updatedUsers = [...registeredUsers, newUser];
    await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedUsers));

    const sessionUser = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      idNumber: newUser.idNumber,
    };

    setUser(sessionUser);
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
    const updatedNotifs = [welcomeNotif, ...notifications];
    setNotifications(updatedNotifs);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));

    await saveSession(sessionUser, selectedRole);
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
