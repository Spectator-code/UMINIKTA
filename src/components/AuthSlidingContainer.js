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
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function AuthSlidingContainer({ initialSignUp = false }) {
  const [isSignUpMode, setIsSignUpMode] = useState(initialSignUp);
  const [containerWidth, setContainerWidth] = useState(960);

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up form state
  const [signUpCampus, setSignUpCampus] = useState('Matina Campus');
  const [signUpName, setSignUpName] = useState('');
  const [signUpIdNumber, setSignUpIdNumber] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Slide animation: 0 = Sign In mode (overlay on right), 1 = Sign Up mode (overlay on left)
  const slideAnim = useRef(new Animated.Value(initialSignUp ? 1 : 0)).current;

  const { login, register } = useAuth();
  const router = useRouter();

  // Responsive screen width tracking
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );

  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  const isDesktop = screenWidth >= 768;
  const halfWidth = containerWidth / 2;

  // Toggle handlers
  const handleToggleSignUp = () => {
    setIsSignUpMode(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  };

  const handleToggleSignIn = () => {
    setIsSignUpMode(false);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  };

  // Synchronize .sign-up-mode class on the parent container and attach JS listeners
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

  // Handle Sign In submission
  const handleSignIn = async () => {
    if (!signInEmail || !signInPassword) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setSignInLoading(true);
    try {
      await login(signInEmail, signInPassword);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setSignInLoading(false);
    }
  };

  // Handle Sign Up submission
  const handleSignUp = async () => {
    if (!signUpName.trim() || !signUpIdNumber.trim() || !signUpEmail.trim() || !signUpPassword) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (!signUpEmail.trim().toLowerCase().endsWith('@umindanao.edu.ph')) {
      Alert.alert(
        'Invalid Email',
        'You must register with a valid @umindanao.edu.ph institutional email address.'
      );
      return;
    }
    if (signUpPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setSignUpLoading(true);
    try {
      await register({
        name: signUpName.trim(),
        idNumber: signUpIdNumber.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        role: 'student',
        campus: signUpCampus,
      });
    } catch (e) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setSignUpLoading(false);
    }
  };

  // Overlay moves: from right (halfWidth) when 0 to left (0) when 1
  const overlayTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [halfWidth || 480, 0],
  });

  const signInOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.2, 0],
  });

  const signUpOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.2, 1],
  });

  const helloPanelOpacity = slideAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0, 0],
  });

  const welcomePanelOpacity = slideAnim.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <ImageBackground
      source={require('../../bvckg/dced0fbf3606307f771b384f786c8fe8.jpg')}
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
        {isDesktop ? (
          /* ================= DESKTOP SLIDING MODE ================= */
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
              <ScrollView
                contentContainerStyle={styles.formContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.header}>
                  <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                    <Image source={require('../../assets/uminikta-logo.png')} style={{ width: 44, height: 44, borderRadius: 12, marginRight: 10 }} resizeMode="cover" />
                    <Text style={styles.logoMark}>Uminekta</Text>
                  </View>
                  <View style={styles.logoDivider} />
                  <Text style={styles.subtitle}>
                    Welcome back. Sign in to continue.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. student@umindanao.edu.ph"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={signInEmail}
                      onChangeText={setSignInEmail}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showSignInPassword}
                      value={signInPassword}
                      onChangeText={setSignInPassword}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowSignInPassword(!showSignInPassword)
                      }
                      style={styles.eyeButton}
                    >
                      <Text style={styles.eyeText}>
                        {showSignInPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    signInLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleSignIn}
                  disabled={signInLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {signInLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.togglePromptRow}>
                  <Text style={styles.togglePromptText}>
                    Don't have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={handleToggleSignUp}>
                    <Text style={styles.toggleLinkText}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
              <ScrollView
                contentContainerStyle={styles.formContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.header}>
                  <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                    <Image source={require('../../assets/uminikta-logo.png')} style={{ width: 44, height: 44, borderRadius: 12, marginRight: 10 }} resizeMode="cover" />
                    <Text style={styles.logoMark}>Uminekta</Text>
                  </View>
                  <View style={styles.logoDivider} />
                  <Text style={styles.subtitle}>
                    Create your academic account to get started.
                  </Text>
                </View>

                {/* Campus Selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Campus</Text>
                  <View style={[styles.roleSelectorRow, { marginBottom: 0 }]}>
                    {['Matina Campus', 'Visayan Campus', 'Arellano Campus'].map((campusOption) => {
                      const displayNames = {
                        'Matina Campus': 'Matina',
                        'Visayan Campus': 'Visayan',
                        'Arellano Campus': 'Arellano'
                      };
                      return (
                        <TouchableOpacity
                          key={campusOption}
                          style={[
                            styles.roleButton,
                            signUpCampus === campusOption && styles.roleButtonActive,
                          ]}
                          onPress={() => setSignUpCampus(campusOption)}
                        >
                          <Text
                            style={[
                              styles.roleButtonText,
                              signUpCampus === campusOption && styles.roleButtonTextActive,
                              { fontSize: 13 }
                            ]}
                          >
                            {displayNames[campusOption]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Full Name Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Juan Dela Cruz"
                      placeholderTextColor="#9CA3AF"
                      value={signUpName}
                      onChangeText={setSignUpName}
                    />
                  </View>
                </View>

                {/* ID Number Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Student ID Number</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 2024-00123"
                      placeholderTextColor="#9CA3AF"
                      value={signUpIdNumber}
                      onChangeText={setSignUpIdNumber}
                    />
                  </View>
                </View>

                {/* Email Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>University Email</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. student@umindanao.edu.ph"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={signUpEmail}
                      onChangeText={setSignUpEmail}
                    />
                  </View>
                  <Text style={styles.hint}>
                    Must end with @umindanao.edu.ph
                  </Text>
                </View>

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Create password (min 6 characters)"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showSignUpPassword}
                      value={signUpPassword}
                      onChangeText={setSignUpPassword}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowSignUpPassword(!showSignUpPassword)
                      }
                      style={styles.eyeButton}
                    >
                      <Text style={styles.eyeText}>
                        {showSignUpPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    signUpLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleSignUp}
                  disabled={signUpLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {signUpLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.togglePromptRow}>
                  <Text style={styles.togglePromptText}>
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={handleToggleSignIn}>
                    <Text style={styles.toggleLinkText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
                {/* Decorative circles */}
                <View style={[styles.decorCircle, styles.circleTopRight]} />
                <View style={[styles.decorCircle, styles.circleBottomLeft]} />

                {/* Panel 1: "Hello, Friend!" (Active during Sign In mode) */}
                <Animated.View
                  style={[
                    styles.overlayPanelInner,
                    {
                      opacity: helloPanelOpacity,
                      pointerEvents: isSignUpMode ? 'none' : 'auto',
                    },
                  ]}
                >
                  <Text style={styles.overlayTitle}>Hello, Friend!</Text>
                  <Text style={styles.overlaySubtitle}>
                    Enter your student or faculty details and start your connected
                    academic journey with Uminekta.
                  </Text>
                  <TouchableOpacity
                    id="sign-up-btn"
                    style={styles.ghostButton}
                    onPress={handleToggleSignUp}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.ghostButtonText}>SIGN UP</Text>
                  </TouchableOpacity>
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
                  <Text style={styles.overlayTitle}>Welcome Back!</Text>
                  <Text style={styles.overlaySubtitle}>
                    To keep connected with your university portal and
                    appointments, please sign in with your account.
                  </Text>
                  <TouchableOpacity
                    id="sign-in-btn"
                    style={styles.ghostButton}
                    onPress={handleToggleSignIn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.ghostButtonText}>SIGN IN</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>
          </View>
        ) : (
          /* ================= MOBILE ADAPTIVE MODE ================= */
          <View style={styles.mobileWrapper}>
            {/* Mobile Tab Switcher */}
            <View style={styles.mobileTabContainer}>
              <TouchableOpacity
                id="sign-in-btn-mobile"
                style={[
                  styles.mobileTab,
                  !isSignUpMode && styles.mobileTabActive,
                ]}
                onPress={handleToggleSignIn}
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
              >
                <Text
                  style={[
                    styles.mobileTabText,
                    isSignUpMode && styles.mobileTabTextActive,
                  ]}
                >
                  Sign Up
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
                  <View style={styles.header}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                      <Image source={require('../../assets/uminikta-logo.png')} style={{ width: 44, height: 44, borderRadius: 12, marginRight: 10 }} resizeMode="cover" />
                      <Text style={styles.logoMark}>Uminekta</Text>
                    </View>
                    <View style={styles.logoDivider} />
                    <Text style={styles.subtitle}>
                      Welcome back. Sign in to continue.
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. student@umindanao.edu.ph"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={signInEmail}
                        onChangeText={setSignInEmail}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showSignInPassword}
                        value={signInPassword}
                        onChangeText={setSignInPassword}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setShowSignInPassword(!showSignInPassword)
                        }
                        style={styles.eyeButton}
                      >
                        <Text style={styles.eyeText}>
                          {showSignInPassword ? 'Hide' : 'Show'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      signInLoading && styles.buttonDisabled,
                    ]}
                    onPress={handleSignIn}
                    disabled={signInLoading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {signInLoading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.togglePromptRow}>
                    <Text style={styles.togglePromptText}>
                      Don't have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={handleToggleSignUp}>
                      <Text style={styles.toggleLinkText}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Mobile Single Sign Up Form */
                <View style={styles.mobileForm}>
                  <View style={styles.header}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                      <Image source={require('../../assets/uminikta-logo.png')} style={{ width: 44, height: 44, borderRadius: 12, marginRight: 10 }} resizeMode="cover" />
                      <Text style={styles.logoMark}>Uminekta</Text>
                    </View>
                    <View style={styles.logoDivider} />
                    <Text style={styles.subtitle}>
                      Create your academic account to get started.
                    </Text>
                  </View>

                  {/* Role Selector Mobile */}
                  <View style={styles.roleSelectorRow}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        signUpRole === 'student' && styles.roleButtonActive,
                      ]}
                      onPress={() => setSignUpRole('student')}
                    >
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
                    >
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

                  {/* Full Name Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Juan Dela Cruz"
                        placeholderTextColor="#9CA3AF"
                        value={signUpName}
                        onChangeText={setSignUpName}
                      />
                    </View>
                  </View>

                  {/* ID Number Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      {signUpRole === 'student' ? 'Student ID Number' : 'Employee ID Number'}
                    </Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder={signUpRole === 'student' ? 'e.g. 2024-00123' : 'e.g. EMP-2024-089'}
                        placeholderTextColor="#9CA3AF"
                        value={signUpIdNumber}
                        onChangeText={setSignUpIdNumber}
                      />
                    </View>
                  </View>

                  {/* Email Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>University Email</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder={
                          signUpRole === 'student'
                            ? 'e.g. student@umindanao.edu.ph'
                            : 'e.g. prof@umindanao.edu.ph'
                        }
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={signUpEmail}
                        onChangeText={setSignUpEmail}
                      />
                    </View>
                    {signUpRole === 'student' && (
                      <Text style={styles.hint}>
                        Must end with @umindanao.edu.ph
                      </Text>
                    )}
                  </View>

                  {/* Password Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="Create password (min 6 characters)"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showSignUpPassword}
                        value={signUpPassword}
                        onChangeText={setSignUpPassword}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setShowSignUpPassword(!showSignUpPassword)
                        }
                        style={styles.eyeButton}
                      >
                        <Text style={styles.eyeText}>
                          {showSignUpPassword ? 'Hide' : 'Show'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      signUpLoading && styles.buttonDisabled,
                    ]}
                    onPress={handleSignUp}
                    disabled={signUpLoading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {signUpLoading ? 'Creating Account...' : 'Create Account'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.togglePromptRow}>
                    <Text style={styles.togglePromptText}>
                      Already have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={handleToggleSignIn}>
                      <Text style={styles.toggleLinkText}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    padding: 16,
  },
  containerCard: {
    width: '100%',
    maxWidth: 960,
    minHeight: 680,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 36,
    elevation: 16,
  },
  containerCardMobile: {
    maxWidth: 440,
    minHeight: 600,
    borderRadius: 24,
  },
  desktopContainerInner: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    minHeight: 680,
    position: 'relative',
  },
  leftHalfContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    zIndex: 2,
  },
  rightHalfContainer: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '50%',
    zIndex: 2,
  },
  slidingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    zIndex: 10,
    overflow: 'hidden',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: '#059669',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circleTopRight: {
    width: 240,
    height: 240,
    top: -60,
    right: -60,
  },
  circleBottomLeft: {
    width: 260,
    height: 260,
    bottom: -70,
    left: -70,
  },
  formContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 44,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoMark: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.5,
  },
  logoDivider: {
    width: 40,
    height: 4,
    backgroundColor: '#059669',
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  roleSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  roleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleButtonTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  hint: {
    fontSize: 11,
    color: '#059669',
    marginTop: 3,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  eyeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eyeText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  togglePromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  togglePromptText: {
    color: '#6B7280',
    fontSize: 13,
  },
  toggleLinkText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  overlayTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
    textAlign: 'center',
  },
  overlaySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  ghostButton: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 36,
    backgroundColor: 'transparent',
  },
  ghostButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mobileWrapper: {
    flex: 1,
    padding: 20,
  },
  mobileTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  mobileTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  mobileTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mobileTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  mobileTabTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  mobileScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mobileForm: {
    width: '100%',
  },
});
