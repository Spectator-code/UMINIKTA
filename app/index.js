import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  Easing,
  SafeAreaView,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import UIcon from '../src/components/UIcon';
import PrivacyNoticeModal from '../src/components/PrivacyNoticeModal';
import theme from '../src/theme';

// Single source of truth for the role launcher cards
const ROLE_PORTALS = [
  {
    key: 'student',
    badge: 'STUDENT',
    icon: 'book',
    title: 'Student Academic Hub',
    description:
      'Join class feeds in seconds, download lecture slides, turn in assignments, and take notes offline.',
    features: [
      '1-Click Course Code Enrollment',
      'Offline Queueing & Auto-Sync',
      'Real-Time Stream Q&A',
    ],
    cta: 'Enter Student Portal',
    accent: '#34D399',
    tint: 'rgba(52, 211, 153, 0.16)',
    button: '#F59E0B',
    buttonText: '#022C22',
  },
  {
    key: 'professor',
    badge: 'FACULTY',
    icon: 'graduation',
    title: 'Faculty Control Desk',
    description:
      'Create course streams, broadcast study materials, monitor class capacity caps, and govern rosters.',
    features: [
      '50-Student Block Capacity Control',
      'Segmented Post Authoring',
      'Instant 6-Char Code Generation',
    ],
    cta: 'Enter Faculty Portal',
    accent: '#A5B4FC',
    tint: 'rgba(165, 180, 252, 0.16)',
    button: 'rgba(255, 255, 255, 0.10)',
    buttonText: '#FFFFFF',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [quickClassCode, setQuickClassCode] = useState('');
  const [activeRolePreview, setActiveRolePreview] = useState('student'); // 'student' | 'professor'

  const scrollViewRef = useRef(null);

  // Section Y coordinates for smooth scroll
  const [sectionPositions, setSectionPositions] = useState({
    hero: 0,
    offer: 750,
    why: 1450,
    about: 2100,
    privacy: 2750,
    footer: 3400,
  });

  const [currentScrollY, setCurrentScrollY] = useState(0);
  const [isFullyUp, setIsFullyUp] = useState(true);
  const [isFullyDown, setIsFullyDown] = useState(false);

  // Animated values for smooth disappear / appear effect of elevator dock
  const upAnim = useRef(new Animated.Value(0)).current; // 0 = disappeared, 1 = visible
  const downAnim = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = disappeared

  useEffect(() => {
    Animated.timing(upAnim, {
      toValue: isFullyUp ? 0 : 1,
      duration: 320,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [isFullyUp]);

  useEffect(() => {
    Animated.timing(downAnim, {
      toValue: isFullyDown ? 0 : 1,
      duration: 320,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [isFullyDown]);

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  const isDesktop = screenWidth >= 992;
  const isTablet = screenWidth >= 640 && screenWidth < 992;

  // Background floating animations
  const bubble1Anim = useState(new Animated.Value(0))[0];
  const bubble2Anim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const animate1 = () => {
      Animated.sequence([
        Animated.timing(bubble1Anim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bubble1Anim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => animate1());
    };

    const animate2 = () => {
      Animated.sequence([
        Animated.timing(bubble2Anim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bubble2Anim, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => animate2());
    };

    animate1();
    animate2();
  }, []);

  const bubble1TranslateY = bubble1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });
  const bubble2TranslateX = bubble2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  // Note: Root authentication redirects are handled centrally by RootLayoutNav in app/_layout.js

  const scrollToSection = (key) => {
    if (scrollViewRef.current) {
      const y = sectionPositions[key] || 0;
      scrollViewRef.current.scrollTo({ y, animated: true });
    }
  };

  const handleLayoutSection = (key, event) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions((prev) => ({ ...prev, [key]: y }));
  };

  const handleScrollDown = () => {
    if (!scrollViewRef.current) return;
    const sortedOffsets = Object.values(sectionPositions).sort((a, b) => a - b);
    const nextOffset = sortedOffsets.find((y) => y > currentScrollY + 60);
    if (nextOffset !== undefined) {
      scrollViewRef.current.scrollTo({ y: nextOffset, animated: true });
    } else {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleScrollUp = () => {
    if (!scrollViewRef.current) return;
    const sortedOffsets = Object.values(sectionPositions).sort((a, b) => b - a);
    const prevOffset = sortedOffsets.find((y) => y < currentScrollY - 60);
    if (prevOffset !== undefined) {
      scrollViewRef.current.scrollTo({ y: Math.max(0, prevOffset), animated: true });
    } else {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const y = contentOffset?.y || 0;
    const vHeight = layoutMeasurement?.height || 0;
    const cHeight = contentSize?.height || 0;

    setCurrentScrollY(y);

    const atTop = y <= 50;
    const atBottom = cHeight > 0 && vHeight > 0 && (y + vHeight >= cHeight - 80);

    setIsFullyUp(atTop);
    setIsFullyDown(atBottom);
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebScroll = () => {
        const docElem = document.documentElement;
        const y = window.scrollY || docElem.scrollTop || 0;
        const vHeight = window.innerHeight || 0;
        const cHeight = docElem.scrollHeight || 0;

        setCurrentScrollY(y);
        const atTop = y <= 50;
        const atBottom = cHeight > 0 && vHeight > 0 && (y + vHeight >= cHeight - 80);

        setIsFullyUp(atTop);
        setIsFullyDown(atBottom);
      };

      window.addEventListener('scroll', handleWebScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleWebScroll);
    }
  }, []);

  const handleQuickJoin = () => {
    const cleanCode = quickClassCode.trim().toUpperCase();
    if (cleanCode.length > 0) {
      router.push(`/register?code=${encodeURIComponent(cleanCode)}`);
    } else {
      router.push('/register');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ================= STICKY TOP NAVIGATION ================= */}
      <View style={styles.topNavbar}>
        <View style={styles.topNavbarInner}>
          {/* Brand Logo & Title */}
          <TouchableOpacity
            style={styles.navBrand}
            onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
            activeOpacity={0.8}
          >
            <View style={styles.brandIconBox}>
              <Image
                source={require('../assets/uminikta-logo.png')}
                style={styles.brandIconImg}
                resizeMode="cover"
              />
            </View>
            <View>
              <View style={styles.brandNameRow}>
                <Text style={styles.brandTitle}>UMINIKTA</Text>
                <View style={styles.univBadgeGold}>
                  <Text style={styles.univBadgeGoldText}>UM</Text>
                </View>
              </View>
              <Text style={styles.brandSub}>Academic Portal</Text>
            </View>
          </TouchableOpacity>

          {/* Desktop Nav Links */}
          {isDesktop && (
            <View style={styles.navAnchorLinks}>
              <TouchableOpacity onPress={() => scrollToSection('about')} style={styles.anchorLink}>
                <Text style={styles.anchorText}>About Us</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => scrollToSection('offer')} style={styles.anchorLink}>
                <Text style={styles.anchorText}>What We Offer</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => scrollToSection('why')} style={styles.anchorLink}>
                <Text style={styles.anchorText}>Why UMINIKTA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPrivacyModalVisible(true)}
                style={styles.anchorLink}
              >
                <Text style={styles.anchorText}>Privacy Notice</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CTA Action Buttons */}
          <View style={styles.navCtaRow}>
            <TouchableOpacity
              style={styles.signInBtnOutline}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.signInBtnOutlineText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.getStartedBtn}
              onPress={() => router.push('/register')}
              activeOpacity={0.85}
            >
              <Text style={styles.getStartedBtnText}>Join Class</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================= MAIN SCROLL CONTENT ================= */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ================= 1. HERO SHOWCASE ================= */}
        <View
          style={styles.heroSection}
          onLayout={(e) => handleLayoutSection('hero', e)}
        >
          <Animated.View
            style={[
              styles.heroCircle1,
              { transform: [{ translateY: bubble1TranslateY }] },
            ]}
          />
          <Animated.View
            style={[
              styles.heroCircle2,
              { transform: [{ translateX: bubble2TranslateX }] },
            ]}
          />

          <View style={styles.heroContentWrapper}>
            {/* Institutional Tag */}
            <View style={styles.institutionTagRow}>
              <View style={styles.univPill}>
                <UIcon name="institution" size={14} color="#A7F3D0" />
                <Text style={styles.univPillText}>UNIVERSITY OF MINDANAO</Text>
              </View>
              <View style={styles.goldPill}>
                <Text style={styles.goldPillText}>ACADEMIC EXCELLENCE</Text>
              </View>
            </View>

            <Text style={styles.heroMainHeadline}>
              Next-Generation Academic Continuity & Collaborative Classrooms
            </Text>

            <Text style={styles.heroSubheadline}>
              Empowering students, faculty, and guardians across all University of Mindanao campuses with cloud-native class feeds, offline resilience, and 007 defense.
            </Text>

            {/* Quick Class Code Join Box */}
            <View style={styles.classCodeJoinContainer}>
              <View style={styles.classCodeJoinBox}>
                <View style={styles.classCodeInputWrapper}>
                  <UIcon name="key" size={18} color="#D97706" />
                  <TextInput
                    style={styles.classCodeInput}
                    placeholder="Enter 6-char Class Code (e.g. CS101A)"
                    placeholderTextColor="#94A3B8"
                    value={quickClassCode}
                    onChangeText={(text) => setQuickClassCode(text.toUpperCase())}
                    maxLength={8}
                    autoCapitalize="characters"
                  />
                </View>
                <TouchableOpacity
                  style={styles.classCodeJoinBtn}
                  onPress={handleQuickJoin}
                  activeOpacity={0.85}
                >
                  <Text style={styles.classCodeJoinBtnText}>Join Block →</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.classCodeHint}>
                Received a code from your professor? Enter it above to register directly into your course block.
              </Text>
            </View>

            {/* Role-First Interactive Launcher */}
            <View style={styles.roleLauncherWrapper}>
              <View style={styles.roleLauncherHeaderRow}>
                <View style={styles.roleLauncherHeaderBar} />
                <View>
                  <Text style={styles.roleLauncherHeaderTitle}>Choose Your Academic Portal</Text>
                  <Text style={styles.roleLauncherHeaderSub}>Tailored cockpits designed specifically for your institutional role</Text>
                </View>
              </View>

              <View style={[styles.roleLauncherGrid, (isDesktop || isTablet) && styles.roleLauncherGridDesktop]}>
                {ROLE_PORTALS.map((portal) => {
                  const isActive = activeRolePreview === portal.key;
                  return (
                    <TouchableOpacity
                      key={portal.key}
                      style={[
                        styles.roleLauncherCard,
                        isActive && {
                          backgroundColor: 'rgba(255, 255, 255, 0.12)',
                          borderColor: portal.accent,
                        },
                      ]}
                      onPress={() => setActiveRolePreview(portal.key)}
                      activeOpacity={0.92}
                    >
                      <View style={[styles.roleCardAccentLine, { backgroundColor: portal.accent }]} />

                      <View style={styles.roleCardTopRow}>
                        <View
                          style={[
                            styles.roleCardIconBox,
                            { backgroundColor: portal.tint, borderColor: portal.accent },
                          ]}
                        >
                          <UIcon name={portal.icon} size={24} color={portal.accent} />
                        </View>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleBadgeText}>{portal.badge}</Text>
                        </View>
                      </View>

                      <Text style={styles.roleCardTitle}>{portal.title}</Text>
                      <Text style={styles.roleCardDescription}>{portal.description}</Text>

                      <View style={styles.roleFeaturesList}>
                        {portal.features.map((feature) => (
                          <View key={feature} style={styles.roleFeatureRow}>
                            <View style={[styles.roleFeatureCheck, { backgroundColor: portal.tint }]}>
                              <UIcon name="check" size={11} color={portal.accent} strokeWidth={3} />
                            </View>
                            <Text style={styles.roleFeatureItem}>{feature}</Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={[styles.roleActionBtn, { backgroundColor: portal.button }]}
                        onPress={() => router.push('/login')}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.roleActionBtnText, { color: portal.buttonText }]}>
                          {portal.cta}
                        </Text>
                        <UIcon
                          name="arrow-right"
                          size={15}
                          color={portal.buttonText}
                          style={{ marginLeft: 8 }}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Privacy Compliance Callout */}
            <TouchableOpacity
              style={styles.heroPrivacyCallout}
              onPress={() => setPrivacyModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.privacyCheckIcon}>
                <UIcon name="check" size={12} color="#059669" />
              </View>
              <Text style={styles.heroPrivacyText}>
                Protected by the Philippine Data Privacy Act (RA 10173) • <Text style={styles.heroPrivacyUnderline}>Read Institutional Notice</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= 2. WHAT WE OFFER ================= */}
        <View
          style={styles.sectionContainer}
          onLayout={(e) => handleLayoutSection('offer', e)}
        >
          <View style={styles.sectionHeaderCol}>
            <View style={styles.sectionBadgeGold}>
              <Text style={styles.sectionBadgeGoldText}>WHAT WE OFFER</Text>
            </View>
            <Text style={styles.sectionTitle}>Built for Higher Education Excellence</Text>
            <Text style={styles.sectionDescription}>
              Everything students and faculty need to manage coursework, foster discussion, and maintain academic continuity in one unified ecosystem.
            </Text>
          </View>

          <View style={[styles.featuresGrid, (isDesktop || isTablet) && styles.featuresGridDesktop]}>
            {/* Feature 1 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#ECFDF5' }]}>
                <UIcon name="book" size={26} color="#059669" />
              </View>
              <Text style={styles.featureTitle}>Virtual Classrooms & Streams</Text>
              <Text style={styles.featureBody}>
                Interactive class feeds for announcements, syllabus distribution, lecture slide sharing, and student Q&A threads in real-time.
              </Text>
              <View style={styles.featurePillTag}>
                <Text style={styles.featurePillTagText}>Live Academic Stream</Text>
              </View>
            </View>

            {/* Feature 2 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#EEF2FF' }]}>
                <UIcon name="institution" size={26} color="#4F46E5" />
              </View>
              <Text style={styles.featureTitle}>007 Cybersecurity WAF Defense</Text>
              <Text style={styles.featureBody}>
                Military-grade perimeter security featuring automated geo-blocking, anonymizer proxy interception, and real-time SIEM network telemetry.
              </Text>
              <View style={[styles.featurePillTag, { backgroundColor: '#EEF2FF' }]}>
                <Text style={[styles.featurePillTagText, { color: '#4F46E5' }]}>Perimeter Protection</Text>
              </View>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#F0FDFA' }]}>
                <UIcon name="refresh" size={26} color="#0D9488" />
              </View>
              <Text style={styles.featureTitle}>Offline-First Data Sync</Text>
              <Text style={styles.featureBody}>
                Unstable dorm or mobile data connection? Queue post creations and submissions offline with automatic cloud synchronization when signal restores.
              </Text>
              <View style={[styles.featurePillTag, { backgroundColor: '#F0FDFA' }]}>
                <Text style={[styles.featurePillTagText, { color: '#0D9488' }]}>High Resilience</Text>
              </View>
            </View>

            {/* Feature 4 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FFFBEB' }]}>
                <UIcon name="key" size={26} color="#D97706" />
              </View>
              <Text style={styles.featureTitle}>Instant Class Code Enrollment</Text>
              <Text style={styles.featureBody}>
                No complicated registration procedures. Students join classes in a single second using unique 6-character faculty enrollment codes.
              </Text>
              <View style={[styles.featurePillTag, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.featurePillTagText, { color: '#D97706' }]}>Zero Friction</Text>
              </View>
            </View>

            {/* Feature 5 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#F5F3FF' }]}>
                <UIcon name="users" size={26} color="#7C3AED" />
              </View>
              <Text style={styles.featureTitle}>Faculty Control Desk & Rosters</Text>
              <Text style={styles.featureBody}>
                Comprehensive instructor dashboards for tracking class capacity (up to 50 students per block), roster management, and multi-file attachments.
              </Text>
              <View style={[styles.featurePillTag, { backgroundColor: '#F5F3FF' }]}>
                <Text style={[styles.featurePillTagText, { color: '#7C3AED' }]}>Faculty Governance</Text>
              </View>
            </View>

            {/* Feature 6 */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: '#F0FDF4' }]}>
                <UIcon name="academic" size={26} color="#16A34A" />
              </View>
              <Text style={styles.featureTitle}>Role-Tailored Dashboards</Text>
              <Text style={styles.featureBody}>
                Specially designed user interfaces for Students (Emerald), Professors (Royal Indigo), and SecOps Guardians (Cyber Obsidian) with zero clutter.
              </Text>
              <View style={[styles.featurePillTag, { backgroundColor: '#F0FDF4' }]}>
                <Text style={[styles.featurePillTagText, { color: '#16A34A' }]}>Purpose-Built</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================= 3. WHY UMINIKTA ================= */}
        <View
          style={[styles.sectionContainer, styles.sectionAltBg]}
          onLayout={(e) => handleLayoutSection('why', e)}
        >
          <View style={styles.sectionHeaderCol}>
            <View style={styles.sectionBadgeGold}>
              <Text style={styles.sectionBadgeGoldText}>WHY UMINIKTA</Text>
            </View>
            <Text style={styles.sectionTitle}>Engineered for Focus, Speed & Security</Text>
            <Text style={styles.sectionDescription}>
              See how UMINIKTA elevates the University of Mindanao learning experience over generic public tools.
            </Text>
          </View>

          <View style={[styles.whyGrid, (isDesktop || isTablet) && styles.whyGridDesktop]}>
            <View style={styles.whyCard}>
              <View style={styles.whyCardHeader}>
                <View style={styles.whyNumberBox}>
                  <Text style={styles.whyNumber}>01</Text>
                </View>
                <Text style={styles.whyTitle}>Institutional Integrity</Text>
              </View>
              <Text style={styles.whyBody}>
                Exclusively reserved for verified university accounts. Outsiders, spammers, and non-verified personas cannot enter classrooms or disturb academic sessions.
              </Text>
            </View>

            <View style={styles.whyCard}>
              <View style={styles.whyCardHeader}>
                <View style={styles.whyNumberBox}>
                  <Text style={styles.whyNumber}>02</Text>
                </View>
                <Text style={styles.whyTitle}>Zero Distractions & Ads</Text>
              </View>
              <Text style={styles.whyBody}>
                Unlike commercial platforms, UMINIKTA displays zero advertisements, sponsored posts, or algorithmic dopamine loops. Every screen is tuned for academic output.
              </Text>
            </View>

            <View style={styles.whyCard}>
              <View style={styles.whyCardHeader}>
                <View style={styles.whyNumberBox}>
                  <Text style={styles.whyNumber}>03</Text>
                </View>
                <Text style={styles.whyTitle}>Strict Data Sovereignty</Text>
              </View>
              <Text style={styles.whyBody}>
                Your academic submissions, grades, and personal data remain under university stewardship and are never commercialized, sold, or shared with third-party advertisers.
              </Text>
            </View>

            <View style={styles.whyCard}>
              <View style={styles.whyCardHeader}>
                <View style={styles.whyNumberBox}>
                  <Text style={styles.whyNumber}>04</Text>
                </View>
                <Text style={styles.whyTitle}>Cross-Platform Parity</Text>
              </View>
              <Text style={styles.whyBody}>
                Whether you access UMINIKTA on a MacBook in a campus computer lab, a Windows PC at home, or an Android smartphone on the bus, the experience remains crisp and responsive.
              </Text>
            </View>
          </View>
        </View>

        {/* ================= 4. ABOUT US ================= */}
        <View
          style={styles.sectionContainer}
          onLayout={(e) => handleLayoutSection('about', e)}
        >
          <View style={styles.aboutWrapper}>
            <View style={styles.aboutTextCol}>
              <View style={styles.sectionBadgeGold}>
                <Text style={styles.sectionBadgeGoldText}>ABOUT UMINIKTA</Text>
              </View>
              <Text style={styles.aboutHeading}>
                Empowering the University of Mindanao Academic Journey
              </Text>
              <Text style={styles.aboutParagraph}>
                UMINIKTA was conceived within the <Text style={styles.aboutBold}>College of Computing Education (CCE)</Text> to answer the real-world challenges faced by university students and faculty: connection dropouts, cluttered commercial learning systems, and cybersecurity vulnerabilities.
              </Text>
              <Text style={styles.aboutParagraph}>
                Our mission is simple: provide a lightning-fast, beautifully designed, and bulletproof academic home where educators can inspire and learners can achieve their fullest academic potential.
              </Text>

              <View style={styles.aboutHighlightsRow}>
                <View style={styles.aboutHighlight}>
                  <Text style={styles.aboutHighlightNum}>CCE</Text>
                  <Text style={styles.aboutHighlightLabel}>Computing Education</Text>
                </View>

                <View style={styles.aboutHighlight}>
                  <Text style={styles.aboutHighlightNum}>Davao City</Text>
                  <Text style={styles.aboutHighlightLabel}>Main Campus Matina</Text>
                </View>
              </View>
            </View>

            <View style={styles.aboutCardSide}>
              <View style={styles.aboutEmblemCard}>
                <Image
                  source={require('../assets/uminikta-logo.png')}
                  style={styles.aboutLogoBig}
                  resizeMode="contain"
                />
                <Text style={styles.aboutCardTitle}>UMINIKTA Academic Portal</Text>
                <Text style={styles.aboutCardSubtitle}>
                  University of Mindanao • Excellence • Character • Competence
                </Text>
                <View style={styles.aboutCardDivider} />
                <Text style={styles.aboutCardQuote}>
                  "Connecting knowledge, securing education, and innovating the academic future."
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================= 5. PRIVACY NOTICE SHOWCASE ================= */}
        <View
          style={[styles.sectionContainer, styles.privacySectionBg]}
          onLayout={(e) => handleLayoutSection('privacy', e)}
        >
          <View style={styles.privacyCardMain}>
            <View style={styles.privacyCardHeader}>
              <View style={styles.privacyShieldIcon}>
                <UIcon name="institution" size={28} color="#059669" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <View style={styles.badgeRow}>
                  <View style={styles.lawPill}>
                    <Text style={styles.lawPillText}>REPUBLIC ACT NO. 10173</Text>
                  </View>
                  <View style={styles.dpaBadge}>
                    <Text style={styles.dpaBadgeText}>NATIONAL PRIVACY COMMISSION COMPLIANT</Text>
                  </View>
                </View>
                <Text style={styles.privacyMainTitle}>Institutional Privacy Notice</Text>
              </View>
            </View>

            <Text style={styles.privacyMainDescription}>
              The University of Mindanao guarantees the security, confidentiality, and lawful processing of all student and faculty data on UMINIKTA. In strict observance of the Philippine Data Privacy Act of 2012, your personal identification, course enrollments, and academic submissions are encrypted and processed solely for verified institutional purposes.
            </Text>

            <TouchableOpacity
              style={styles.openPrivacyBtn}
              onPress={() => setPrivacyModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.openPrivacyBtnText}>
                Open Full Privacy Notice & DPO Details →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= 6. CALL TO ACTION BANNER ================= */}
        <View style={styles.ctaBannerSection}>
          <View style={styles.ctaBannerCard}>
            <Text style={styles.ctaBannerHeading}>Ready to Connect Your Academic Journey?</Text>
            <Text style={styles.ctaBannerSub}>
              Sign in with your institutional University of Mindanao account or join your first classroom block right now.
            </Text>

            <View style={styles.ctaBannerButtonsRow}>
              <TouchableOpacity
                style={styles.ctaBannerPrimaryBtn}
                onPress={() => router.push('/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaBannerPrimaryBtnText}>Launch Portal Now →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ctaBannerSecondaryBtn}
                onPress={() => router.push('/register')}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaBannerSecondaryBtnText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ================= 7. INSTITUTIONAL FOOTER ================= */}
        <View
          style={styles.footerSection}
          onLayout={(e) => handleLayoutSection('footer', e)}
        >
          <View style={styles.footerInner}>
            <View style={styles.footerTopRow}>
              {/* Brand Info */}
              <View style={styles.footerBrandCol}>
                <View style={styles.footerBrandRow}>
                  <Image
                    source={require('../assets/uminikta-logo.png')}
                    style={styles.footerLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.footerBrandTitle}>UMINIKTA</Text>
                </View>
                <Text style={styles.footerTagline}>
                  The official next-generation collaborative academic learning platform of the University of Mindanao.
                </Text>
                <Text style={styles.footerAddress}>
                  Guillermo E. Torres (Main) Matina Campus, Davao City, 8000 Davao del Sur, Philippines
                </Text>
              </View>

              {/* Quick Navigation Buttons */}
              <View style={styles.footerLinksCol}>
                <View style={styles.footerColTitleRow}>
                  <UIcon name="sparkles" size={16} color="#F59E0B" />
                  <Text style={styles.footerColTitle}>Quick Navigation</Text>
                </View>

                <View style={styles.quickNavGrid}>
                  <TouchableOpacity
                    style={styles.quickNavBtn}
                    onPress={() => scrollToSection('about')}
                    activeOpacity={0.75}
                  >
                    <View style={styles.quickNavBtnLeft}>
                      <View style={[styles.quickNavIconBadge, { backgroundColor: 'rgba(52, 211, 153, 0.14)' }]}>
                        <UIcon name="document" size={15} color="#34D399" />
                      </View>
                      <Text style={styles.quickNavBtnText}>About Us</Text>
                    </View>
                    <UIcon name="arrow-right" size={14} color="#64748B" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickNavBtn}
                    onPress={() => scrollToSection('offer')}
                    activeOpacity={0.75}
                  >
                    <View style={styles.quickNavBtnLeft}>
                      <View style={[styles.quickNavIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
                        <UIcon name="sparkles" size={15} color="#F59E0B" />
                      </View>
                      <Text style={styles.quickNavBtnText}>What We Offer</Text>
                    </View>
                    <UIcon name="arrow-right" size={14} color="#64748B" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickNavBtn}
                    onPress={() => scrollToSection('why')}
                    activeOpacity={0.75}
                  >
                    <View style={styles.quickNavBtnLeft}>
                      <View style={[styles.quickNavIconBadge, { backgroundColor: 'rgba(165, 180, 252, 0.14)' }]}>
                        <UIcon name="graduation" size={15} color="#A5B4FC" />
                      </View>
                      <Text style={styles.quickNavBtnText}>Why UMINIKTA</Text>
                    </View>
                    <UIcon name="arrow-right" size={14} color="#64748B" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickNavBtn}
                    onPress={() => setPrivacyModalVisible(true)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.quickNavBtnLeft}>
                      <View style={[styles.quickNavIconBadge, { backgroundColor: 'rgba(52, 211, 153, 0.14)' }]}>
                        <UIcon name="shield-check" size={15} color="#34D399" />
                      </View>
                      <Text style={styles.quickNavBtnText}>Privacy Notice (RA 10173)</Text>
                    </View>
                    <UIcon name="arrow-right" size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* UM Campuses */}

            </View>

            <View style={styles.footerDivider} />

            <View style={styles.footerBottomRow}>
              <Text style={styles.footerCopyright}>
                © 2026 University of Mindanao • College of Computing Education. All Rights Reserved.
              </Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(true)}>
                <Text style={styles.footerPrivacyLink}>Institutional Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================= FLOATING UP & DOWN ELEVATOR DOCK (FAR RIGHT) ================= */}
      <View style={styles.floatingScrollDock}>
        {/* UP BUTTON (Disappears with smooth effect when fully up) */}
        <Animated.View
          style={[
            styles.animatedBtnWrap,
            {
              opacity: upAnim,
              transform: [
                {
                  scale: upAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
              maxHeight: upAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 48],
              }),
            },
            Platform.OS === 'web' && {
              pointerEvents: isFullyUp ? 'none' : 'auto',
              transition: 'all 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.floatingScrollBtn}
            onPress={handleScrollUp}
            disabled={isFullyUp}
            activeOpacity={0.75}
            accessibilityLabel="Scroll to Previous Section or Top"
          >
            <UIcon name="chevron-up" size={20} color="#FFFFFF" strokeWidth={2.6} />
          </TouchableOpacity>
        </Animated.View>

        {/* SEPARATOR (Disappears when either button is hidden) */}
        <Animated.View
          style={[
            styles.floatingScrollDivider,
            {
              opacity: Animated.multiply(upAnim, downAnim),
              height: Animated.multiply(upAnim, downAnim).interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              marginVertical: Animated.multiply(upAnim, downAnim).interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
            },
          ]}
        />

        {/* DOWN BUTTON (Disappears with smooth effect when fully down) */}
        <Animated.View
          style={[
            styles.animatedBtnWrap,
            {
              opacity: downAnim,
              transform: [
                {
                  scale: downAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
              maxHeight: downAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 48],
              }),
            },
            Platform.OS === 'web' && {
              pointerEvents: isFullyDown ? 'none' : 'auto',
              transition: 'all 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.floatingScrollBtn}
            onPress={handleScrollDown}
            disabled={isFullyDown}
            activeOpacity={0.75}
            accessibilityLabel="Scroll to Next Section or Bottom"
          >
            <UIcon name="chevron-down" size={20} color="#FFFFFF" strokeWidth={2.6} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Privacy Notice Modal */}
      <PrivacyNoticeModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNavbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    width: '100%',
    zIndex: 200,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
  },
  topNavbarInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    height: 72,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  brandIconImg: {
    width: '100%',
    height: '100%',
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  univBadgeGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  univBadgeGoldText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  brandSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  navAnchorLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  anchorLink: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  anchorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  navCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signInBtnOutline: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
  },
  signInBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  getStartedBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  getStartedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ================= HERO SECTION ================= */
  heroSection: {
    backgroundColor: '#064E3B',
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 64,
    paddingBottom: 72,
    paddingHorizontal: 24,
  },
  heroCircle1: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  heroCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(5, 150, 105, 0.14)',
  },
  heroContentWrapper: {
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    zIndex: 10,
  },
  institutionTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  univPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 95, 70, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  univPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  goldPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  goldPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FCD34D',
    letterSpacing: 0.5,
  },
  heroMainHeadline: {
    fontSize: Platform.OS === 'web' ? 44 : 32,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: Platform.OS === 'web' ? 52 : 38,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  heroSubheadline: {
    fontSize: 16,
    color: '#D1FAE5',
    lineHeight: 26,
    maxWidth: 760,
    marginBottom: 28,
  },

  /* Quick Class Code Box */
  classCodeJoinContainer: {
    marginBottom: 40,
    maxWidth: 620,
  },
  classCodeJoinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  classCodeInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  classCodeInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 10,
    outlineStyle: 'none',
  },
  classCodeJoinBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  classCodeJoinBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  classCodeHint: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },

  /* Role-First Interactive Launcher */
  roleLauncherWrapper: {
    backgroundColor: 'rgba(2, 44, 34, 0.45)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.28)',
    marginBottom: 24,
  },
  roleLauncherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  roleLauncherHeaderBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  roleLauncherHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  roleLauncherHeaderSub: {
    fontSize: 13,
    color: '#A7F3D0',
  },
  roleLauncherGrid: {
    flexDirection: 'column',
    gap: 18,
  },
  roleLauncherGridDesktop: {
    flexDirection: 'row',
  },
  roleLauncherCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
  },
  roleCardAccentLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  roleCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  roleCardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.55)',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#FEF3C7',
  },
  roleCardTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  roleCardDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 20,
    marginBottom: 18,
  },
  roleFeaturesList: {
    gap: 10,
    marginBottom: 22,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 16,
  },
  roleFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleFeatureCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  roleFeatureItem: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.92)',
  },
  roleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  roleActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* Privacy callout in hero */
  heroPrivacyCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 95, 70, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  privacyCheckIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPrivacyText: {
    fontSize: 12,
    color: '#D1FAE5',
  },
  heroPrivacyUnderline: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: '#FFFFFF',
  },

  /* ================= SECTION COMMON ================= */
  sectionContainer: {
    paddingVertical: 64,
    paddingHorizontal: 24,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  sectionAltBg: {
    backgroundColor: '#F8FAFC',
    maxWidth: '100%',
    paddingHorizontal: 24,
    alignSelf: 'stretch',
  },
  sectionHeaderCol: {
    alignItems: 'center',
    marginBottom: 44,
  },
  sectionBadgeGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sectionBadgeGoldText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 32 : 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  sectionDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 680,
    lineHeight: 24,
  },

  /* ================= 2. WHAT WE OFFER (3-COLUMN PRESTIGE CARDS) ================= */
  featuresGrid: {
    flexDirection: 'column',
    gap: 20,
  },
  featuresGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureCard: {
    flexBasis: Platform.OS === 'web' ? '31.3%' : '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  featureIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  featureBody: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  featurePillTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.15)',
  },
  featurePillTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  /* ================= 3. WHY UMINIKTA ================= */
  whyGrid: {
    flexDirection: 'column',
    gap: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  whyGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  whyCard: {
    flexBasis: Platform.OS === 'web' ? '48%' : '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  whyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  whyNumberBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  whyNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#B45309',
  },
  whyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  whyBody: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 22,
  },

  /* ================= 4. ABOUT US ================= */
  aboutWrapper: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 40,
    alignItems: 'center',
  },
  aboutTextCol: {
    flex: 1,
  },
  aboutHeading: {
    fontSize: Platform.OS === 'web' ? 30 : 22,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: Platform.OS === 'web' ? 38 : 30,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  aboutParagraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 14,
  },
  aboutBold: {
    fontWeight: '700',
    color: '#059669',
  },
  aboutHighlightsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  aboutHighlight: {
    flex: 1,
  },
  aboutHighlightNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 2,
  },
  aboutHighlightLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  aboutCardSide: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
  },
  aboutEmblemCard: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  aboutLogoBig: {
    width: 88,
    height: 88,
    marginBottom: 16,
  },
  aboutCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aboutCardSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  aboutCardDivider: {
    width: 48,
    height: 2,
    backgroundColor: '#FDE68A',
    marginBottom: 14,
  },
  aboutCardQuote: {
    fontSize: 12,
    color: '#D1FAE5',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  /* ================= 5. PRIVACY NOTICE SHOWCASE ================= */
  privacySectionBg: {
    backgroundColor: '#F8FAFC',
    maxWidth: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 24,
  },
  privacyCardMain: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  privacyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  privacyShieldIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  lawPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  lawPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  dpaBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dpaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  privacyMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  privacyMainDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 20,
  },
  openPrivacyBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  openPrivacyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* ================= 6. CTA BANNER ================= */
  ctaBannerSection: {
    paddingVertical: 56,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  ctaBannerCard: {
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#064E3B',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  ctaBannerHeading: {
    fontSize: Platform.OS === 'web' ? 32 : 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaBannerSub: {
    fontSize: 15,
    color: '#D1FAE5',
    textAlign: 'center',
    maxWidth: 620,
    lineHeight: 22,
    marginBottom: 28,
  },
  ctaBannerButtonsRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaBannerPrimaryBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },
  ctaBannerPrimaryBtnText: {
    color: '#064E3B',
    fontSize: 14,
    fontWeight: '800',
  },
  ctaBannerSecondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },
  ctaBannerSecondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* ================= 7. INSTITUTIONAL FOOTER ================= */
  footerSection: {
    backgroundColor: '#0F172A',
    paddingTop: 56,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  footerInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  footerTopRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    gap: 36,
    marginBottom: 40,
  },
  footerBrandCol: {
    flex: 2,
    maxWidth: 400,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  footerLogo: {
    width: 36,
    height: 36,
  },
  footerBrandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  footerTagline: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 12,
  },
  footerAddress: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  footerLinksCol: {
    flex: Platform.OS === 'web' ? 3 : 1,
    minWidth: 280,
  },
  footerColTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  footerColTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  quickNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 200,
    flex: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    } : {}),
  },
  quickNavBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  quickNavIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNavBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    flexShrink: 1,
  },
  footerLink: {
    fontSize: 13,
    color: '#94A3B8',
  },
  footerStaticLink: {
    fontSize: 13,
    color: '#64748B',
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginBottom: 24,
  },
  footerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#64748B',
  },
  footerPrivacyLink: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },

  /* ================= FLOATING UP/DOWN ELEVATOR DOCK ================= */
  floatingScrollDock: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    right: 24,
    bottom: 28,
    zIndex: 9999,
    backgroundColor: 'rgba(6, 78, 59, 0.95)',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)', // gold accent border
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(10px)',
      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    } : {}),
  },
  animatedBtnWrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingScrollBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.2s ease' } : {}),
  },
  floatingScrollDivider: {
    width: 20,
    backgroundColor: 'rgba(253, 230, 138, 0.35)', // subtle gold divider
  },
});
