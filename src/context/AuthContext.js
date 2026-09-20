import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { ActivityLogger } from '../utils/ActivityLogger';

const getItemAsync = async (key) => Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
const setItemAsync = async (key, value) => Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
const deleteItemAsync = async (key) => Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

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

  useEffect(() => {
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
    supabase.auth.onAuthStateChange((_event, session) => {
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
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('role, is_banned, profile_picture_url, cover_photo_url')
        .eq('id', userId)
        .single();
        
      if (error) {
        Alert.alert('Profile Error', 'Could not fetch your role: ' + error.message);
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
        // Fallback: If no DB profile exists, grab role from active session metadata
        const { data: { session } } = await supabase.auth.getSession();
        const sessionRole = session?.user?.user_metadata?.role || 'student';
        setRole(sessionRole.trim().toLowerCase());
      }
    } catch (error) {
      console.warn('Failed to fetch user profile, using fallback:', error.message);
      Alert.alert('Debug Auth', 'Failed to fetch DB role: ' + error.message);
      const { data: { session } } = await supabase.auth.getSession();
      const sessionRole = session?.user?.user_metadata?.role || 'student';
      setRole(sessionRole.trim().toLowerCase());
    } finally {
      setLoading(false);
    }
  };

  const loadLocalData = async () => {
    try {
      const savedPic = await getItemAsync(PROFILE_PICTURE_KEY);
      if (savedPic) setProfilePicture(prev => prev || savedPic);

      const savedNotifs = await getItemAsync(NOTIFICATIONS_KEY);
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
    } catch (e) {
      console.warn('Failed to load local data:', e);
    }
  };

  const login = async (email, password) => {
    if (!email || !password) throw new Error('Email and password are required.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw new Error(error.message);

    // 007 Hardening: Record user IP upon login for threat intel via secure HTTPS
    try {
      const response = await fetch('https://ipapi.co/json/', { headers: { 'User-Agent': 'nodejs' }});
      const ipData = await response.json();
      if (ipData && ipData.ip) {
        await supabase.from('users').update({ last_ip: ipData.ip }).eq('id', data.user.id);
      }
    } catch (e) {
      console.warn('Failed to update last IP:', e);
    }
    
    // Log Activity
    ActivityLogger.logAction(data.user.id, 'LOGIN', 'Logged in successfully');
  };

  const register = async (nameOrEmail, idNumberOrPassword, emailOrRole, passwordParam, roleParam) => {
    let name = '';
    let idNumber = '';
    let email = '';
    let password = '';
    let selectedRole = 'student';
    let campus = 'UM Matina Campus';

    // Flexible arguments
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

    if (error) throw new Error(error.message);

    // The user profile is now automatically created in the public.users table 
    // by a Supabase Database Trigger (on_auth_user_created) the moment they register.
  };

  const logout = async () => {
    if (user) {
      ActivityLogger.logAction(user.id, 'LOGOUT', 'Logged out successfully');
    }
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('Error signing out:', error.message);
    
    setUser(null);
    setRole(null);
    setIsBanned(false);
    setProfilePicture(null);
    setCoverPhoto(null);
    setNotifications([]);
    
    try {
      await deleteItemAsync(PROFILE_PICTURE_KEY);
      await deleteItemAsync(NOTIFICATIONS_KEY);
    } catch (e) {
      console.warn('Failed to clear secure session:', e);
    }
  };

  const uploadImageToSupabase = async (bucket, uri) => {
    if (!user) throw new Error('Not logged in');
    
    let ext = uri.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) ext = 'jpg';
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    
    // Upload into a folder named after the user's ID
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const res = await fetch(uri);
    const blob = await res.blob();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, { contentType, upsert: true });

    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl;
  };

  const updateProfilePicture = async (uri) => {
    try {
      const publicUrl = await uploadImageToSupabase('avatars', uri);
      setProfilePicture(publicUrl);
      
      // Save to database
      await supabase.from('users').update({ profile_picture_url: publicUrl }).eq('id', user.id);
      
      // Cache locally
      await setItemAsync(PROFILE_PICTURE_KEY, publicUrl);
    } catch (e) {
      console.warn('Failed to save profile picture:', e);
      throw e;
    }
  };

  const updateCoverPhoto = async (uri) => {
    try {
      const publicUrl = await uploadImageToSupabase('covers', uri);
      setCoverPhoto(publicUrl);
      
      // Save to database
      await supabase.from('users').update({ cover_photo_url: publicUrl }).eq('id', user.id);
    } catch (e) {
      console.warn('Failed to save cover photo:', e);
      throw e;
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
      await setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch (e) {
      console.warn('Failed to save notification:', e);
    }
  };

  const markNotificationRead = async (notifId) => {
    const updatedNotifs = notifications.filter(n => n.id !== notifId);
    setNotifications(updatedNotifs);
    try {
      await setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch (e) {
      console.warn('Failed to update notification:', e);
    }
  };

  const markAllNotificationsRead = async () => {
    const updatedNotifs = [];
    setNotifications(updatedNotifs);
    try {
      await setItemAsync(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifs));
    } catch (e) {
      console.warn('Failed to update notifications:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
      markAllNotificationsRead,
      unreadCount,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
