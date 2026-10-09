/**
 * ============================================================================
 * MODULE: Dual-Sliding Unified Institutional Authentication Container
 * DIRECTORY: src/components/AuthSlidingContainer.js
 * ROLE/SCOPE: Institutional Single Sign-On (SSO) & Registration Gate
 * DESCRIPTION:
 *   Desktop two-pane sliding container with smooth cubic-bezier physics, seamlessly
 *   switching between Institutional Sign In and Multi-Role Account Registration.
 *   Adapts automatically into an accessible tabbed segmented shell on mobile viewports.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. COMPONENT INSTANTIATION & REACTIVE FORM STATE
 *   3. ANIMATION TIMINGS & CUBIC BEZIER EASING INTERPOLATIONS
 *   4. FORM SUBMISSION HANDLERS (handleSignIn, handleSignUp)
 *   5. RENDER: DESKTOP TWO-PANE DUAL SLIDING SHELL
 *   6. RENDER: MOBILE RESPONSIVE TABBED AUTH CONTAINER
 *   7. COMPONENT STYLESHEET
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import PrivacyNoticeModal from './PrivacyNoticeModal';
import UIcon from './UIcon';

// ============================================================================
// SECTION 2: COMPONENT INSTANTIATION & REACTIVE FORM STATE
// ============================================================================

/**
 * Dual sliding authentication container for desktop and mobile devices.
 *
 * @param {Object} props
 * @param {boolean} [props.initialSignUp=false] - Whether to initialize container in Sign Up mode
 * @returns {React.ReactElement} Animated authentication shell
 */
export default function AuthSlidingContainer({ initialSignUp = false }) {
  const { code } = useLocalSearchParams();
  const shouldStartInSignUp = Boolean(initialSignUp || code);

  const [isSignUpMode, setIsSignUpMode] = useState(shouldStartInSignUp);
  const [containerWidth, setContainerWidth] = useState(1040);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up form state
  const [signUpRole, setSignUpRole] = useState('student');
  const [signUpCampus, setSignUpCampus] = useState('Matina Campus');
  const [signUpName, setSignUpName] = useState('');
  const [signUpIdNumber, setSignUpIdNumber] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // ==========================================================================
  // SECTION 3: ANIMATION TIMINGS & CUBIC BEZIER EASING INTERPOLATIONS
  // ==========================================================================

  // Slide animation: 0 = Sign In mode (overlay on right), 1 = Sign Up mode (overlay on left)
  const slideAnim = useRef(new Animated.Value(shouldStartInSignUp ? 1 : 0)).current;

  const { login, register } = useAuth();
  const router = useRouter();

  // Visible notice banner (Alert.alert is a silent no-op on web)
  const [notice, setNotice] = useState(null); // { type: 'error' | 'success', title, text }
  const showNotice = (type, title, text) => {
    setNotice({ type, title, text });
    if (Platform.OS !== 'web') Alert.alert(title, text);
  };
  const supabaseConfigMissing = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim() === '';
  const CONFIG_MSG =
    'Supabase is not configured. Create a .env file in the project root with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart with: npx expo start -c';

  // Responsive screen width tracking
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  const isDesktop = screenWidth >= 880;
  const halfWidth = containerWidth / 2;

  // Toggle handlers with smooth cubic easing
  const handleToggleSignUp = () => {
    setIsSignUpMode(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
      useNativeDriver: false,
    }).start();
  };

  const handleToggleSignIn = () => {
    setIsSignUpMode(false);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
      useNativeDriver: false,
    }).start();
  };

  // Synchronize .sign-up-mode class on the parent container for Web CSS compatibility
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const container = document.getElementById('auth-container');
      if (container) {
        if (isSignUpMode) {
          container.classList.add('sign-up-mode');
        } else {
          container.classList.remove('sign-up-mode');
        }
      }

      const signUpBtn = document.getElementById('sign-up-btn');
      const signInBtn = document.getElementById('sign-in-btn');

      const onSignUpClick = (e) => {
        e?.preventDefault?.();
        handleToggleSignUp();
      };
      const onSignInClick = (e) => {
        e?.preventDefault?.();
        handleToggleSignIn();
      };

      if (signUpBtn) signUpBtn.addEventListener('click', onSignUpClick);
      if (signInBtn) signInBtn.addEventListener('click', onSignInClick);

      return () => {
        if (signUpBtn) signUpBtn.removeEventListener('click', onSignUpClick);
        if (signInBtn) signInBtn.removeEventListener('click', onSignInClick);
      };
    }
  }, [isSignUpMode]);

  // ==========================================================================
  // SECTION 4: FORM SUBMISSION HANDLERS
  // ==========================================================================

  // Handle Sign In submission
  const handleSignIn = async () => {
    setNotice(null);
    if (!signInEmail.trim() || !signInPassword) {
      showNotice('error', 'Missing Fields', 'Please enter your institutional email and password.');
      return;
    }
    setSignInLoading(true);
    try {
      await login(signInEmail.trim(), signInPassword);
    } catch (e) {
      const raw = e?.message || '';
      const msg = raw || 'Unable to authenticate credentials.';
      showNotice('error', 'Login Failed', msg);
    } finally {
      setSignInLoading(false);
    }
  };

  // Handle Sign Up submission
  const handleSignUp = async () => {
    setNotice(null);
    if (!signUpName.trim() || !signUpIdNumber.trim() || !signUpEmail.trim() || !signUpPassword) {
      showNotice('error', 'Missing Information', 'Please complete all required fields to register.');
      return;
    }
    if (!signUpEmail.trim().toLowerCase().endsWith('@umindanao.edu.ph')) {
      showNotice(
        'error',
        'Institutional Email Required',
        'You must register using your official @umindanao.edu.ph email address.'
      );
      return;
    }
    if (signUpPassword.length < 6) {
      showNotice('error', 'Password Security', 'Password must be at least 6 characters in length.');
      return;
    }

    setSignUpLoading(true);
    try {
      const result = await register({
        name: signUpName.trim(),
        idNumber: signUpIdNumber.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        role: signUpRole,
        campus: signUpCampus,
      });
      if (result && !result.session) {
        showNotice(
          'success',
          'Account Created',
          'Check your @umindanao.edu.ph inbox and confirm your email, then sign in.'
        );
      }
    } catch (e) {
      const raw = e?.message || '';
      const msg = /failed to fetch|network request failed/i.test(raw)
        ? 'Cannot reach Supabase. Check your internet connection and the URL in your .env file.'
        : raw || 'Could not complete registration.';
      showNotice('error', 'Registration Failed', msg);
    } finally {
      setSignUpLoading(false);
    }
  };

  // Overlay moves: from right (halfWidth) when 0 to left (0) when 1
  const overlayTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [halfWidth || 520, 0],
  });

  const signInOpacity = slideAnim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0.1, 0],
  });

  const signUpOpacity = slideAnim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.1, 1],
  });

  const helloPanelOpacity = slideAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0, 0],
  });

  const welcomePanelOpacity = slideAnim.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [0, 0, 1],
  });

  // ==========================================================================
  // SECTION 5: RENDER: DESKTOP TWO-PANE DUAL SLIDING SHELL
  // ==========================================================================
  return (
    <ImageBackground
      source={require('../../assets/auth-background.jpg')}
      style={styles.outerWrapper}
      resizeMode="cover"
    >
      <View style={styles.backdropOverlay}>
        {/* Main Card Container */}
        <View
          id="auth-container"
          className={`container ${isSignUpMode ? 'sign-up-mode' : ''}`}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - containerWidth) > 5) {
              setContainerWidth(w);
            }
          }}
          style={[
            styles.containerCard,
            !isDesktop && styles.containerCardMobile,
          ]}
        >
          {notice && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setNotice(null)}
              style={[
                styles.noticeBanner,
                notice.type === 'success' ? styles.noticeSuccess : styles.noticeError,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text style={styles.noticeText}>{notice.text}</Text>
              </View>
              <UIcon name="close" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {isDesktop ? (
            /* ================= DESKTOP NON-SCROLLABLE SLIDING MODE ================= */
            <View style={styles.desktopContainerInner}>
              {/* 1. SIGN IN FORM (Left 50%) */}
              <Animated.View
                style={[
                  styles.leftHalfContainer,
                  {
                    opacity: signInOpacity,
                    pointerEvents: isSignUpMode ? 'none' : 'auto',
                  },
                ]}
              >
                <View style={styles.desktopFormWrapper}>
                  {/* Compact Header */}
                  <View style={styles.compactHeaderRow}>
                    <TouchableOpacity
                      onPress={() => router.push('/')}
                      style={styles.backHomeBtn}
                      activeOpacity={0.7}
                    >
                      <UIcon name="arrow-left" size={11} color="#064E3B" style={{ marginRight: 4 }} />
                      <Text style={styles.backHomeText}>Home</Text>
                    </TouchableOpacity>

                    <View style={styles.brandRow}>
                      <Image
                        source={require('../../assets/uminikta-logo.png')}
                        style={styles.brandLogo}
                        resizeMode="cover"
                      />
                      <View>
                        <Text style={styles.logoMark}>UMINIKTA</Text>
                        <Text style={styles.institutionKicker}>UNIVERSITY OF MINDANAO</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.subtitle}>
                    Sign in with institutional credentials to access your academic dashboard.
                  </Text>

                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <UIcon name="mail" size={12} color="#059669" style={{ marginRight: 5 }} />
                      <Text style={styles.label}>Institutional Email</Text>
                    </View>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. student@umindanao.edu.ph"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={signInEmail}
                        onChangeText={setSignInEmail}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <UIcon name="lock" size={12} color="#059669" style={{ marginRight: 5 }} />
                      <Text style={styles.label}>Password</Text>
                    </View>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showSignInPassword}
                        value={signInPassword}
                        onChangeText={setSignInPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowSignInPassword(!showSignInPassword)}
                        style={styles.eyeButton}
                        activeOpacity={0.7}
                      >
                        <UIcon
                          name={showSignInPassword ? 'eye-off' : 'eye'}
                          size={15}
                          color="#64748B"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Primary Sign In Button */}
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      signInLoading && styles.buttonDisabled,
                    ]}
                    onPress={handleSignIn}
                    disabled={signInLoading}
                    activeOpacity={0.85}
                  >
                    <UIcon name="lock" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryButtonText}>
                      {signInLoading ? 'Authenticating...' : 'Sign In to Portal'}
                    </Text>
                  </TouchableOpacity>

                  {/* Toggle Mode Prompt */}
                  <View style={styles.togglePromptRow}>
                    <Text style={styles.togglePromptText}>Don't have an academic account? </Text>
                    <TouchableOpacity onPress={handleToggleSignUp} activeOpacity={0.7}>
                      <Text style={styles.toggleLinkText}>Register Now</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Institutional Privacy Link */}
                  <TouchableOpacity
                    onPress={() => setPrivacyModalVisible(true)}
                    style={styles.privacyLinkRow}
                    activeOpacity={0.7}
                  >
                    <UIcon name="shield-check" size={11} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={styles.privacyLinkText}>
                      Data Governance • <Text style={styles.privacyLinkUnderline}>RA 10173 Privacy Notice</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* 2. SIGN UP FORM (Right 50%) */}
              <Animated.View
                style={[
                  styles.rightHalfContainer,
                  {
                    opacity: signUpOpacity,
                    pointerEvents: isSignUpMode ? 'auto' : 'none',
                  },
                ]}
              >
                <View style={styles.desktopFormWrapper}>
                  {/* Compact Header */}
                  <View style={styles.compactHeaderRow}>
                    <TouchableOpacity
                      onPress={() => router.push('/')}
                      style={styles.backHomeBtn}
                      activeOpacity={0.7}
                    >
                      <UIcon name="arrow-left" size={11} color="#064E3B" style={{ marginRight: 4 }} />
                      <Text style={styles.backHomeText}>Home</Text>
                    </TouchableOpacity>

                    <View style={styles.brandRow}>
                      <Image
                        source={require('../../assets/uminikta-logo.png')}
                        style={styles.brandLogo}
                        resizeMode="cover"
                      />
                      <View>
                        <Text style={styles.logoMark}>UMINIKTA</Text>
                        <Text style={styles.institutionKicker}>UNIVERSITY OF MINDANAO</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.subtitle}>
                    Create your academic account to connect with faculty and course portals.
                  </Text>

                  {/* Quick Course Code Banner if redirected from hero */}
                  {Boolean(code) && (
                    <View style={styles.courseCodeBanner}>
                      <UIcon name="sparkles" size={13} color="#D97706" style={{ marginRight: 5 }} />
                      <Text style={styles.courseCodeBannerText}>
                        Enrolling with Class Code: <Text style={styles.courseCodeHighlight}>{code.toUpperCase()}</Text>
                      </Text>
                    </View>
                  )}

                  {/* Role Selector */}
                  <View style={styles.compactSelectorGroup}>
                    <Text style={styles.label}>Account Role</Text>
                    <View style={styles.roleSelectorRow}>
                      <TouchableOpacity
                        style={[
                          styles.roleButton,
                          signUpRole === 'student' && styles.roleButtonActive,
                        ]}
                        onPress={() => setSignUpRole('student')}
                        activeOpacity={0.8}
                      >
                        <UIcon
                          name="graduation"
                          size={13}
                          color={signUpRole === 'student' ? '#064E3B' : '#64748B'}
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.roleButtonText,
                            signUpRole === 'student' && styles.roleButtonTextActive,
                          ]}
                        >
                          Student
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleButton,
                          signUpRole === 'professor' && styles.roleButtonActive,
                        ]}
                        onPress={() => setSignUpRole('professor')}
                        activeOpacity={0.8}
                      >
                        <UIcon
                          name="briefcase"
                          size={13}
                          color={signUpRole === 'professor' ? '#064E3B' : '#64748B'}
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.roleButtonText,
                            signUpRole === 'professor' && styles.roleButtonTextActive,
                          ]}
                        >
                          Professor / Faculty
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Campus Selector */}
                  <View style={styles.compactSelectorGroup}>
                    <Text style={styles.label}>Designated Campus</Text>
                    <View style={styles.campusRow}>
                      {['Matina Campus', 'Visayan Campus', 'Arellano Campus'].map((campusOption) => {
                        const isSelected = signUpCampus === campusOption;
                        const shortName = campusOption.replace(' Campus', '');
                        return (
                          <TouchableOpacity
                            key={campusOption}
                            style={[
                              styles.campusChip,
                              isSelected && styles.campusChipActive,
                            ]}
                            onPress={() => setSignUpCampus(campusOption)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.campusChipText,
                                isSelected && styles.campusChipTextActive,
                              ]}
                            >
                              {shortName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* 2x2 Desktop Form Grid: (Name + ID Number) and (Email + Password) */}
                  <View style={styles.desktopInputsGrid}>
                    {/* Row 1: Full Name & ID Number */}
                    <View style={styles.inputRow}>
                      <View style={styles.inputCol}>
                        <View style={styles.labelRow}>
                          <UIcon name="user" size={11} color="#059669" style={{ marginRight: 4 }} />
                          <Text style={styles.label}>Full Name</Text>
                        </View>
                        <View style={styles.inputWrapperCompact}>
                          <TextInput
                            style={styles.inputCompact}
                            placeholder="e.g. Juan Dela Cruz"
                            placeholderTextColor="#94A3B8"
                            value={signUpName}
                            onChangeText={setSignUpName}
                          />
                        </View>
                      </View>

                      <View style={styles.inputCol}>
                        <View style={styles.labelRow}>
                          <UIcon name="id-card" size={11} color="#059669" style={{ marginRight: 4 }} />
                          <Text style={styles.label}>
                            {signUpRole === 'student' ? 'Student ID' : 'Employee ID'}
                          </Text>
                        </View>
                        <View style={styles.inputWrapperCompact}>
                          <TextInput
                            style={styles.inputCompact}
                            placeholder={signUpRole === 'student' ? '2024-00123' : 'EMP-2024-089'}
                            placeholderTextColor="#94A3B8"
                            value={signUpIdNumber}
                            onChangeText={setSignUpIdNumber}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Row 2: University Email & Password */}
                    <View style={styles.inputRow}>
                      <View style={styles.inputCol}>
                        <View style={styles.labelRow}>
                          <UIcon name="mail" size={11} color="#059669" style={{ marginRight: 4 }} />
                          <Text style={styles.label}>Institutional Email</Text>
                        </View>
                        <View style={styles.inputWrapperCompact}>
                          <TextInput
                            style={styles.inputCompact}
                            placeholder="id@umindanao.edu.ph"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={signUpEmail}
                            onChangeText={setSignUpEmail}
                          />
                        </View>
                      </View>

                      <View style={styles.inputCol}>
                        <View style={styles.labelRow}>
                          <UIcon name="lock" size={11} color="#059669" style={{ marginRight: 4 }} />
                          <Text style={styles.label}>Password (min 6)</Text>
                        </View>
                        <View style={styles.inputWrapperCompact}>
                          <TextInput
                            style={styles.inputCompact}
                            placeholder="Min 6 characters"
                            placeholderTextColor="#94A3B8"
                            secureTextEntry={!showSignUpPassword}
                            value={signUpPassword}
                            onChangeText={setSignUpPassword}
                          />
                          <TouchableOpacity
                            onPress={() => setShowSignUpPassword(!showSignUpPassword)}
                            style={styles.eyeButtonCompact}
                            activeOpacity={0.7}
                          >
                            <UIcon
                              name={showSignUpPassword ? 'eye-off' : 'eye'}
                              size={14}
                              color="#64748B"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Primary Sign Up Button */}
                  <TouchableOpacity
                    style={[
                      styles.primaryButtonCompact,
                      signUpLoading && styles.buttonDisabled,
                    ]}
                    onPress={handleSignUp}
                    disabled={signUpLoading}
                    activeOpacity={0.85}
                  >
                    <UIcon name="shield-check" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryButtonText}>
                      {signUpLoading ? 'Registering...' : 'Complete Academic Registration'}
                    </Text>
                  </TouchableOpacity>

                  {/* Toggle Mode Prompt */}
                  <View style={styles.togglePromptRowCompact}>
                    <Text style={styles.togglePromptText}>Already have an account? </Text>
                    <TouchableOpacity onPress={handleToggleSignIn} activeOpacity={0.7}>
                      <Text style={styles.toggleLinkText}>Sign In</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Institutional Privacy Link */}
                  <TouchableOpacity
                    onPress={() => setPrivacyModalVisible(true)}
                    style={styles.privacyLinkRowCompact}
                    activeOpacity={0.7}
                  >
                    <UIcon name="shield-check" size={11} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={styles.privacyLinkText}>
                      Protected by RA 10173 • <Text style={styles.privacyLinkUnderline}>Privacy Notice</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* 3. SLIDING OVERLAY (50% Width) */}
              <Animated.View
                style={[
                  styles.slidingOverlay,
                  {
                    transform: [{ translateX: overlayTranslateX }],
                  },
                ]}
              >
                <View style={styles.overlayBackground}>
                  {/* Subtle Background Watermark Logo */}
                  <Image
                    source={require('../../assets/uminikta-logo.png')}
                    style={styles.overlayWatermark}
                    resizeMode="contain"
                  />

                  {/* Decorative Geometric Rings */}
                  <View style={[styles.decorCircle, styles.circleTopRight]} />
                  <View style={[styles.decorCircle, styles.circleBottomLeft]} />
                  <View style={styles.decorGoldRing} />

                  {/* Panel 1: "Begin Your Journey" (Active during Sign In mode) */}
                  <Animated.View
                    style={[
                      styles.overlayPanelInner,
                      {
                        opacity: helloPanelOpacity,
                        pointerEvents: isSignUpMode ? 'none' : 'auto',
                      },
                    ]}
                  >
                    <View style={styles.overlayBadge}>
                      <UIcon name="sparkles" size={12} color="#F59E0B" style={{ marginRight: 5 }} />
                      <Text style={styles.overlayBadgeText}>INSTITUTIONAL ACCESS</Text>
                    </View>

                    <Text style={styles.overlayTitle}>Begin Your Journey</Text>
                    <Text style={styles.overlaySubtitle}>
                      Join the University of Mindanao digital ecosystem. Access course portals, real-time consultations, and secure academic services across campuses.
                    </Text>

                    <TouchableOpacity
                      id="sign-up-btn"
                      style={styles.ghostButton}
                      onPress={handleToggleSignUp}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.ghostButtonText}>CREATE ACCOUNT</Text>
                      <UIcon name="arrow-right" size={14} color="#FDE68A" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>

                    <View style={styles.overlayFooterNotes}>
                      <UIcon name="shield-check" size={12} color="#A7F3D0" style={{ marginRight: 4 }} />
                      <Text style={styles.overlayFooterText}>RA 10173 Compliant - CCE Matina Campus</Text>
                    </View>
                  </Animated.View>

                  {/* Panel 2: "Welcome Back!" (Active during Sign Up mode) */}
                  <Animated.View
                    style={[
                      styles.overlayPanelInner,
                      {
                        opacity: welcomePanelOpacity,
                        pointerEvents: isSignUpMode ? 'auto' : 'none',
                      },
                    ]}
                  >
                    <View style={styles.overlayBadge}>
                      <UIcon name="institution" size={12} color="#F59E0B" style={{ marginRight: 5 }} />
                      <Text style={styles.overlayBadgeText}>CONNECTED CAMPUS</Text>
                    </View>

                    <Text style={styles.overlayTitle}>Welcome Back!</Text>
                    <Text style={styles.overlaySubtitle}>
                      Already registered your university credentials? Sign in to continue consultations, view faculty status, and manage class appointments.
                    </Text>

                    <TouchableOpacity
                      id="sign-in-btn"
                      style={styles.ghostButton}
                      onPress={handleToggleSignIn}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.ghostButtonText}>SIGN IN TO PORTAL</Text>
                      <UIcon name="arrow-right" size={14} color="#FDE68A" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>

                    <View style={styles.overlayFooterNotes}>
                      <UIcon name="lock" size={12} color="#A7F3D0" style={{ marginRight: 4 }} />
                      <Text style={styles.overlayFooterText}>Multi-Campus Unified Authentication</Text>
                    </View>
                  </Animated.View>
                </View>
              </Animated.View>
            </View>
          ) : (
            /* ============================================================== */
            /* SECTION 6: RENDER: MOBILE RESPONSIVE TABBED AUTH CONTAINER     */
            /* ============================================================== */
            <View style={styles.mobileWrapper}>
              {/* Segmented Header Switcher */}
              <View style={styles.mobileTabContainer}>
                <TouchableOpacity
                  id="sign-in-btn-mobile"
                  style={[
                    styles.mobileTab,
                    !isSignUpMode && styles.mobileTabActive,
                  ]}
                  onPress={handleToggleSignIn}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.mobileTabText,
                      !isSignUpMode && styles.mobileTabTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  id="sign-up-btn-mobile"
                  style={[
                    styles.mobileTab,
                    isSignUpMode && styles.mobileTabActive,
                  ]}
                  onPress={handleToggleSignUp}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.mobileTabText,
                      isSignUpMode && styles.mobileTabTextActive,
                    ]}
                  >
                    Register Account
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.mobileScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {!isSignUpMode ? (
                  /* Mobile Single Sign In Form */
                  <View style={styles.mobileForm}>
                    <View style={styles.headerMobile}>
                      <TouchableOpacity
                        onPress={() => router.push('/')}
                        style={styles.backHomeBtn}
                        activeOpacity={0.7}
                      >
                        <UIcon name="arrow-left" size={11} color="#064E3B" style={{ marginRight: 4 }} />
                        <Text style={styles.backHomeText}>Home</Text>
                      </TouchableOpacity>

                      <View style={styles.brandRow}>
                        <Image
                          source={require('../../assets/uminikta-logo.png')}
                          style={styles.brandLogo}
                          resizeMode="cover"
                        />
                        <View>
                          <Text style={styles.logoMark}>UMINIKTA</Text>
                          <Text style={styles.institutionKicker}>UNIVERSITY OF MINDANAO</Text>
                        </View>
                      </View>

                      <Text style={styles.subtitle}>
                        Sign in with institutional credentials to access your dashboard.
                      </Text>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <UIcon name="mail" size={12} color="#059669" style={{ marginRight: 5 }} />
                        <Text style={styles.label}>Institutional Email</Text>
                      </View>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. student@umindanao.edu.ph"
                          placeholderTextColor="#94A3B8"
                          autoCapitalize="none"
                          keyboardType="email-address"
                          value={signInEmail}
                          onChangeText={setSignInEmail}
                        />
                      </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                      <View style={styles.labelRow}>
                        <UIcon name="lock" size={12} color="#059669" style={{ marginRight: 5 }} />
                        <Text style={styles.label}>Password</Text>
                      </View>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your account password"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showSignInPassword}
                          value={signInPassword}
                          onChangeText={setSignInPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowSignInPassword(!showSignInPassword)}
                          style={styles.eyeButton}
                          activeOpacity={0.7}
                        >
                          <UIcon
                            name={showSignInPassword ? 'eye-off' : 'eye'}
                            size={15}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Button */}
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        signInLoading && styles.buttonDisabled,
                      ]}
                      onPress={handleSignIn}
                      disabled={signInLoading}
                      activeOpacity={0.85}
                    >
                      <UIcon name="lock" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryButtonText}>
                        {signInLoading ? 'Authenticating...' : 'Sign In to Portal'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.togglePromptRow}>
                      <Text style={styles.togglePromptText}>Don't have an account? </Text>
                      <TouchableOpacity onPress={handleToggleSignUp} activeOpacity={0.7}>
                        <Text style={styles.toggleLinkText}>Register Now</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => setPrivacyModalVisible(true)}
                      style={styles.privacyLinkRow}
                      activeOpacity={0.7}
                    >
                      <UIcon name="shield-check" size={11} color="#059669" style={{ marginRight: 4 }} />
                      <Text style={styles.privacyLinkText}>
                        Data Governance - <Text style={styles.privacyLinkUnderline}>RA 10173 Privacy Notice</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Mobile Single Sign Up Form */
                  <View style={styles.mobileForm}>
                    <View style={styles.headerMobile}>
                      <TouchableOpacity
                        onPress={() => router.push('/')}
                        style={styles.backHomeBtn}
                        activeOpacity={0.7}
                      >
                        <UIcon name="arrow-left" size={11} color="#064E3B" style={{ marginRight: 4 }} />
                        <Text style={styles.backHomeText}>Home</Text>
                      </TouchableOpacity>

                      <View style={styles.brandRow}>
                        <Image
                          source={require('../../assets/uminikta-logo.png')}
                          style={styles.brandLogo}
                          resizeMode="cover"
                        />
                        <View>
                          <Text style={styles.logoMark}>UMINIKTA</Text>
                          <Text style={styles.institutionKicker}>UNIVERSITY OF MINDANAO</Text>
                        </View>
                      </View>

                      <Text style={styles.subtitle}>
                        Create your academic account to connect with faculty and course portals.
                      </Text>
                    </View>

                    {/* Course code banner */}
                    {Boolean(code) && (
                      <View style={styles.courseCodeBanner}>
                        <UIcon name="sparkles" size={13} color="#D97706" style={{ marginRight: 5 }} />
                        <Text style={styles.courseCodeBannerText}>
                          Course Code: <Text style={styles.courseCodeHighlight}>{code.toUpperCase()}</Text>
                        </Text>
                      </View>
                    )}

                    {/* Role Selector Mobile */}
                    <View style={styles.compactSelectorGroup}>
                      <Text style={styles.label}>Role</Text>
                      <View style={styles.roleSelectorRow}>
                        <TouchableOpacity
                          style={[
                            styles.roleButton,
                            signUpRole === 'student' && styles.roleButtonActive,
                          ]}
                          onPress={() => setSignUpRole('student')}
                          activeOpacity={0.8}
                        >
                          <UIcon
                            name="graduation"
                            size={13}
                            color={signUpRole === 'student' ? '#064E3B' : '#64748B'}
                            style={{ marginRight: 5 }}
                          />
                          <Text
                            style={[
                              styles.roleButtonText,
                              signUpRole === 'student' && styles.roleButtonTextActive,
                            ]}
                          >
                            Student
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.roleButton,
                            signUpRole === 'professor' && styles.roleButtonActive,
                          ]}
                          onPress={() => setSignUpRole('professor')}
                          activeOpacity={0.8}
                        >
                          <UIcon
                            name="briefcase"
                            size={13}
                            color={signUpRole === 'professor' ? '#064E3B' : '#64748B'}
                            style={{ marginRight: 5 }}
                          />
                          <Text
                            style={[
                              styles.roleButtonText,
                              signUpRole === 'professor' && styles.roleButtonTextActive,
                            ]}
                          >
                            Professor
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Campus Selector Mobile */}
                    <View style={styles.compactSelectorGroup}>
                      <Text style={styles.label}>Campus</Text>
                      <View style={styles.campusRow}>
                        {['Matina Campus', 'Visayan Campus', 'Arellano Campus'].map((campusOption) => {
                          const isSelected = signUpCampus === campusOption;
                          const shortName = campusOption.replace(' Campus', '');
                          return (
                            <TouchableOpacity
                              key={campusOption}
                              style={[
                                styles.campusChip,
                                isSelected && styles.campusChipActive,
                              ]}
                              onPress={() => setSignUpCampus(campusOption)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.campusChipText,
                                  isSelected && styles.campusChipTextActive,
                                ]}
                              >
                                {shortName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Full Name Field */}
                    <View style={styles.inputGroupCompact}>
                      <View style={styles.labelRow}>
                        <UIcon name="user" size={11} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={styles.label}>Full Name</Text>
                      </View>
                      <View style={styles.inputWrapperCompact}>
                        <TextInput
                          style={styles.inputCompact}
                          placeholder="e.g. Juan Dela Cruz"
                          placeholderTextColor="#94A3B8"
                          value={signUpName}
                          onChangeText={setSignUpName}
                        />
                      </View>
                    </View>

                    {/* ID Number Field */}
                    <View style={styles.inputGroupCompact}>
                      <View style={styles.labelRow}>
                        <UIcon name="id-card" size={11} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={styles.label}>
                          {signUpRole === 'student' ? 'Student ID Number' : 'Employee ID Number'}
                        </Text>
                      </View>
                      <View style={styles.inputWrapperCompact}>
                        <TextInput
                          style={styles.inputCompact}
                          placeholder={signUpRole === 'student' ? 'e.g. 2024-00123' : 'e.g. EMP-2024-089'}
                          placeholderTextColor="#94A3B8"
                          value={signUpIdNumber}
                          onChangeText={setSignUpIdNumber}
                        />
                      </View>
                    </View>

                    {/* Email Field */}
                    <View style={styles.inputGroupCompact}>
                      <View style={styles.labelRow}>
                        <UIcon name="mail" size={11} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={styles.label}>Institutional Email</Text>
                      </View>
                      <View style={styles.inputWrapperCompact}>
                        <TextInput
                          style={styles.inputCompact}
                          placeholder={
                            signUpRole === 'student'
                              ? 'student@umindanao.edu.ph'
                              : 'prof@umindanao.edu.ph'
                          }
                          placeholderTextColor="#94A3B8"
                          autoCapitalize="none"
                          keyboardType="email-address"
                          value={signUpEmail}
                          onChangeText={setSignUpEmail}
                        />
                      </View>
                    </View>

                    {/* Password Field */}
                    <View style={styles.inputGroupCompact}>
                      <View style={styles.labelRow}>
                        <UIcon name="lock" size={11} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={styles.label}>Password (min 6)</Text>
                      </View>
                      <View style={styles.inputWrapperCompact}>
                        <TextInput
                          style={styles.inputCompact}
                          placeholder="Min 6 characters"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showSignUpPassword}
                          value={signUpPassword}
                          onChangeText={setSignUpPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowSignUpPassword(!showSignUpPassword)}
                          style={styles.eyeButtonCompact}
                          activeOpacity={0.7}
                        >
                          <UIcon
                            name={showSignUpPassword ? 'eye-off' : 'eye'}
                            size={14}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Sign Up Button */}
                    <TouchableOpacity
                      style={[
                        styles.primaryButtonCompact,
                        signUpLoading && styles.buttonDisabled,
                      ]}
                      onPress={handleSignUp}
                      disabled={signUpLoading}
                      activeOpacity={0.85}
                    >
                      <UIcon name="shield-check" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryButtonText}>
                        {signUpLoading ? 'Creating Account...' : 'Complete Academic Registration'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.togglePromptRowCompact}>
                      <Text style={styles.togglePromptText}>Already have an account? </Text>
                      <TouchableOpacity onPress={handleToggleSignIn} activeOpacity={0.7}>
                        <Text style={styles.toggleLinkText}>Sign In</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => setPrivacyModalVisible(true)}
                      style={styles.privacyLinkRowCompact}
                      activeOpacity={0.7}
                    >
                      <UIcon name="shield-check" size={11} color="#059669" style={{ marginRight: 4 }} />
                      <Text style={styles.privacyLinkText}>
                        Protected by RA 10173 - <Text style={styles.privacyLinkUnderline}>Privacy Notice</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <PrivacyNoticeModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />
    </ImageBackground>
  );
}

// ============================================================================
// SECTION 7: COMPONENT STYLESHEET
// ============================================================================
const styles = StyleSheet.create({
  noticeBanner: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  noticeError: { backgroundColor: '#B91C1C' },
  noticeSuccess: { backgroundColor: '#047857' },
  noticeTitle: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
  noticeText: { color: '#FEE2E2', fontSize: 11.5, marginTop: 2, lineHeight: 16 },
  outerWrapper: {
    flex: 1,
    minHeight: '100%',
    width: '100%',
  },
  backdropOverlay: {
    flex: 1,
    minHeight: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 40, 30, 0.48)',
    padding: 16,
  },
  containerCard: {
    width: '100%',
    maxWidth: 1040,
    height: 620,
    maxHeight: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 36,
    elevation: 18,
  },
  containerCardMobile: {
    maxWidth: 460,
    height: 'auto',
    minHeight: 580,
    maxHeight: '95%',
    borderRadius: 20,
  },
  desktopContainerInner: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  leftHalfContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    zIndex: 2,
    height: '100%',
    justifyContent: 'center',
  },
  rightHalfContainer: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '50%',
    zIndex: 2,
    height: '100%',
    justifyContent: 'center',
  },
  desktopFormWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 18,
    overflow: 'hidden',
  },
  slidingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    zIndex: 10,
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: '#064E3B',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayWatermark: {
    position: 'absolute',
    width: 240,
    height: 240,
    opacity: 0.06,
    tintColor: '#FFFFFF',
  },
  overlayPanelInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circleTopRight: {
    width: 260,
    height: 260,
    top: -70,
    right: -70,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  circleBottomLeft: {
    width: 280,
    height: 280,
    bottom: -80,
    left: -80,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  decorGoldRing: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.12)',
  },
  overlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    marginBottom: 16,
  },
  overlayBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FEF3C7',
    letterSpacing: 1.1,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  overlaySubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 26,
    maxWidth: 340,
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 9999,
    paddingVertical: 11,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  ghostButtonText: {
    color: '#FEF3C7',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  overlayFooterNotes: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 22,
  },
  overlayFooterText: {
    fontSize: 10.5,
    color: '#A7F3D0',
    fontWeight: '600',
  },
  compactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerMobile: {
    alignItems: 'center',
    marginBottom: 14,
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backHomeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#064E3B',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 9,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  logoMark: {
    fontSize: 20,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  institutionKicker: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
  },
  courseCodeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  courseCodeBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  courseCodeHighlight: {
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.6,
  },
  compactSelectorGroup: {
    marginBottom: 7,
  },
  roleSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 9,
    padding: 3,
    gap: 5,
    marginTop: 3,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FDE68A',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  roleButtonTextActive: {
    color: '#064E3B',
    fontWeight: '800',
  },
  campusRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 3,
  },
  campusChip: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: 7,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  campusChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  campusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  campusChipTextActive: {
    color: '#064E3B',
    fontWeight: '800',
  },
  desktopInputsGrid: {
    marginTop: 2,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 7,
  },
  inputCol: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputGroupCompact: {
    marginBottom: 7,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  inputWrapperCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    paddingHorizontal: 10,
    height: 38,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  inputCompact: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
  },
  eyeButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  eyeButtonCompact: {
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#064E3B',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonCompact: {
    flexDirection: 'row',
    backgroundColor: '#064E3B',
    borderRadius: 9,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#F59E0B',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  togglePromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  togglePromptRowCompact: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 9,
  },
  togglePromptText: {
    color: '#64748B',
    fontSize: 11.5,
  },
  toggleLinkText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '800',
  },
  privacyLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 2,
  },
  privacyLinkRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
    paddingVertical: 2,
  },
  privacyLinkText: {
    fontSize: 10.5,
    color: '#64748B',
    textAlign: 'center',
  },
  privacyLinkUnderline: {
    color: '#059669',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  mobileWrapper: {
    flex: 1,
    padding: 16,
  },
  mobileTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    gap: 5,
  },
  mobileTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  mobileTabActive: {
    backgroundColor: '#064E3B',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  mobileTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  mobileTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  mobileScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  mobileForm: {
    width: '100%',
  },
});
