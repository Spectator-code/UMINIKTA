import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/config/supabase';
import { ActivityLogger } from '../../src/utils/ActivityLogger';
import StudentNavbar from '../../src/components/StudentNavbar';
import UIcon from '../../src/components/UIcon';

export default function StudentDashboard() {
  const { user, addNotification } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );

  useEffect(() => {
    if (user) {
      ActivityLogger.logAction(user.id, 'PAGE_VIEW', 'Viewed Student Dashboard');
    }
  }, [user]);

  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  // Bubble Animations
  const bubble1Anim = useState(new Animated.Value(0))[0];
  const bubble2Anim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const animateBubble1 = () => {
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
      ]).start(() => animateBubble1());
    };
    
    const animateBubble2 = () => {
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
      ]).start(() => animateBubble2());
    };

    animateBubble1();
    animateBubble2();
  }, []);

  const bubble1TranslateY = bubble1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30]
  });
  const bubble1Scale = bubble1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15]
  });

  const bubble2TranslateX = bubble2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40]
  });
  const bubble2Scale = bubble2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1]
  });

  const isDesktop = screenWidth >= 992;
  const isTablet = screenWidth >= 640 && screenWidth < 992;

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [user?.uid])
  );

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 007 Hardening: Removed insecure mockData fetch
      // Fetch enrollments for this student
      const { data: enrollments, error: enrollErr } = await supabase
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', user.id);
      
      if (enrollErr) throw enrollErr;

      const enrolledIds = enrollments.map(e => e.subject_id);

      // Fetch subject details for those enrollments
      if (enrolledIds.length > 0) {
        const { data: subjectData, error: subErr } = await supabase
          .from('subjects')
          .select('id, name, code, professor_id ( email )')
          .in('id', enrolledIds);
          
        if (subErr) throw subErr;
        
        // Map to UI format
        const formattedSubjects = subjectData.map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          professorEmail: s.professor_id ? s.professor_id.email : 'Unknown'
        }));
        setSubjects(formattedSubjects);

        // Fetch recent posts for these subjects
        const { data: postsData, error: postsErr } = await supabase
          .from('posts')
          .select('*')
          .in('subject_id', enrolledIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (postsErr) throw postsErr;
        
        // Map to UI format
        const formattedPosts = postsData.map(p => ({
          id: p.id,
          subjectId: p.subject_id,
          type: p.type,
          title: p.title,
          content: p.content,
          createdAt: p.created_at
        }));
        setRecentPosts(formattedPosts);
      } else {
        setSubjects([]);
        setRecentPosts([]);
      }

      setSubmissionCount(0); // Submissions table not implemented yet

    } catch (e) {
      console.warn('Failed to fetch dashboard data:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubject = async () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('Missing Code', 'Please enter a class code.');
      return;
    }

    setJoining(true);
    try {
      // Find subject by code
      const { data: subject, error: fetchErr } = await supabase
        .from('subjects')
        .select('id, name, code')
        .eq('code', trimmed)
        .single();

      if (fetchErr || !subject) {
        Alert.alert('Class Not Found', `No class matches the code "${trimmed}".`);
        return;
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('subject_id', subject.id)
        .eq('student_id', user.id)
        .single();

      if (existingEnrollment) {
        Alert.alert('Already Enrolled', `You are already enrolled in "${subject.name}".`);
        setModalVisible(false);
        setJoinCode('');
        return;
      }

      // Enroll
      const { error: insertErr } = await supabase
        .from('enrollments')
        .insert([{ subject_id: subject.id, student_id: user.id }]);

      if (insertErr) {
        throw insertErr;
      }


      setModalVisible(false);
      setJoinCode('');
      Alert.alert('Enrollment Successful', `You are now enrolled in "${subject.name}"!`);
      
      // Refresh dashboard
      fetchDashboardData();

    } catch (e) {
      Alert.alert('Error', 'Could not join class. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  // Color palette for subject card headers
  const getSubjectColor = (index) => {
    const palettes = [
      { bg: '#059669', border: '#047857' },
      { bg: '#2563EB', border: '#1D4ED8' },
      { bg: '#7C3AED', border: '#6D28D9' },
      { bg: '#D97706', border: '#B45309' },
      { bg: '#0891B2', border: '#0E7490' },
    ];
    return palettes[index % palettes.length];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentNavbar currentTab="classes" />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* ================= WELCOME BANNER ================= */}
          <View style={styles.welcomeBanner}>
            <Animated.View style={[styles.heroBgCircle1, { transform: [{ translateY: bubble1TranslateY }, { scale: bubble1Scale }] }]} />
            <Animated.View style={[styles.heroBgCircle2, { transform: [{ translateX: bubble2TranslateX }, { scale: bubble2Scale }] }]} />
            
            <View style={styles.welcomeTextCol}>
              <View style={styles.studentIdBadgeRow}>
                <View style={styles.univBadge}>
                  <Text style={styles.univBadgeText}>UNIVERSITY OF MINDANAO</Text>
                </View>
                {user?.idNumber && (
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>ID: {user.idNumber}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.welcomeHeading}>
                Welcome back, {user?.displayName || 'Student'}!
              </Text>
              <Text style={styles.welcomeSubtext}>
                Track your active university classes, review assignments, and access classroom streams.
              </Text>

              {/* Stat Summary Badges */}
              <View style={styles.statsSummaryRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillNum}>{subjects.length}</Text>
                  <Text style={styles.statPillLabel}>Enrolled Classes</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statPillNum}>{submissionCount}</Text>
                  <Text style={styles.statPillLabel}>Submissions</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statPillNum}>{recentPosts.length}</Text>
                  <Text style={styles.statPillLabel}>Active Updates</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.quickJoinBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.quickJoinBtnIcon}>＋</Text>
              <Text style={styles.quickJoinBtnText}>Join Class</Text>
            </TouchableOpacity>
          </View>

          {/* ================= MAIN DASHBOARD BODY ================= */}
          <View style={[styles.mainLayoutGrid, isDesktop && styles.mainLayoutGridDesktop]}>
            {/* LEFT COLUMN: ENROLLED CLASSES (Approx 68%) */}
            <View style={styles.leftClassesCol}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleWithBadge}>
                  <Text style={styles.sectionTitle}>Enrolled Classes</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{subjects.length}</Text>
                  </View>
                </View>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={styles.loadingText}>Loading your enrolled classes...</Text>
                </View>
              ) : subjects.length === 0 ? (
                /* EMPTY STATE */
                <View style={styles.emptyStateCard}>
                  <View style={styles.emptyIconCircle}>
                    <UIcon name="graduation" size={38} color="#059669" />
                  </View>
                  <Text style={styles.emptyTitle}>No Enrolled Classes Yet</Text>
                  <Text style={styles.emptyDescription}>
                    You haven't joined any classes this academic term. Use the "Join Class" button at the top to enroll.
                  </Text>
                </View>
              ) : (
                /* COURSE CARDS GRID */
                <View style={styles.courseCardsGrid}>
                  {subjects.map((item, index) => {
                    const color = getSubjectColor(index);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.courseCard}
                        onPress={() =>
                          router.push(
                            `/(student)/subject/${item.id}?name=${encodeURIComponent(item.name)}`
                          )
                        }
                        activeOpacity={0.9}
                      >
                        {/* Colored Top Header Banner */}
                        <View style={[styles.cardHeaderBanner, { backgroundColor: color.bg }]}>
                          <View style={styles.cardHeaderTopRow}>
                            <View style={styles.codePill}>
                              <Text style={styles.codePillText}>{item.code}</Text>
                            </View>
                            <View style={styles.studentCountPill}>
                              <UIcon name="users" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                              <Text style={styles.studentCountText}>
                                {item.students ? item.students.length : 1}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.courseTitle} numberOfLines={2}>
                            {item.name}
                          </Text>
                        </View>

                        {/* Card Content Details */}
                        <View style={styles.cardBody}>
                          <View style={styles.professorRow}>
                            <View style={styles.profAvatar}>
                              <Text style={styles.profAvatarText}>
                                {item.professorEmail ? item.professorEmail.charAt(0).toUpperCase() : 'P'}
                              </Text>
                            </View>
                            <View style={styles.profInfoCol}>
                              <Text style={styles.profRoleLabel}>Instructor</Text>
                              <Text style={styles.profEmailText} numberOfLines={1}>
                                {item.professorEmail || 'Faculty Advisor'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.cardDivider} />

                          <View style={styles.cardFooterRow}>
                            <Text style={styles.termLabel}>First Semester 2026</Text>
                            <View style={styles.enterClassBtn}>
                              <Text style={styles.enterClassBtnText}>Enter Class →</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* RIGHT COLUMN: RECENT UPDATES & DEADLINES (Approx 32% on desktop) */}
            <View style={styles.rightSidebarCol}>
              {/* Recent Updates Card */}
              <View style={styles.sideWidgetCard}>
                <View style={styles.sideWidgetHeader}>
                  <Text style={styles.sideWidgetTitle}>Recent Updates</Text>
                  <Text style={styles.sideWidgetSub}>From your enrolled courses</Text>
                </View>

                {recentPosts.length === 0 ? (
                  <View style={styles.emptySideContent}>
                    <UIcon name="announcement" size={30} color="#9CA3AF" />
                    <Text style={styles.emptySideText}>No recent posts yet.</Text>
                    <Text style={styles.emptySideSub}>
                      Class announcements and assignments will show here once posted.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.recentPostsList}>
                    {recentPosts.map((post) => (
                      <TouchableOpacity
                        key={post.id}
                        style={styles.recentPostItem}
                        onPress={() =>
                          router.push(`/(student)/subject/${post.subjectId}`)
                        }
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.postTypeBadge,
                            post.type === 'activity'
                              ? styles.postTypeActivity
                              : styles.postTypeAnnouncement,
                          ]}
                        >
                          <Text style={styles.postTypeBadgeText}>
                            {post.type === 'activity' ? 'TASK' : 'NOTICE'}
                          </Text>
                        </View>
                        <Text style={styles.recentPostTitle} numberOfLines={1}>
                          {post.title}
                        </Text>
                        <Text style={styles.recentPostSnippet} numberOfLines={2}>
                          {post.content}
                        </Text>
                        <Text style={styles.recentPostDate}>
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString()
                            : 'Recent'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>


            </View>
          </View>
        </View>
      </ScrollView>

      {/* ================= JOIN CLASS MODAL ================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <UIcon name="key" size={24} color="#059669" />
              </View>
              <Text style={styles.modalTitle}>Join a Classroom</Text>
              <Text style={styles.modalSubtitle}>
                Enter the 6-character class code provided by your instructor to enroll in the course stream.
              </Text>
            </View>

            <View style={styles.modalInputWrapper}>
              <Text style={styles.modalInputLabel}>Class Code</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. CS101A"
                placeholderTextColor="#9CA3AF"
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={8}
                autoFocus={true}
              />
              <Text style={styles.modalInputHint}>
                Ask your professor for their class enrollment code.
              </Text>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setJoinCode('');
                }}
                disabled={joining}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalJoinBtn, joining && styles.modalJoinBtnDisabled]}
                onPress={handleJoinSubject}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalJoinText}>Join Class</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  welcomeBanner: {
    backgroundColor: '#059669', // Deep UM Green
    borderRadius: 24,
    padding: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
    flexWrap: 'wrap',
    gap: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBgCircle1: {
    position: 'absolute',
    top: -50,
    right: -20,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#10B981',
    opacity: 0.3,
  },
  heroBgCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#047857',
    opacity: 0.4,
  },
  welcomeTextCol: {
    flex: 1,
    minWidth: 280,
    zIndex: 1,
  },
  studentIdBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  univBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  univBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  idBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D1FAE5',
  },
  welcomeHeading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#D1FAE5',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 600,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    gap: 32,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statPill: {
    alignItems: 'flex-start',
  },
  statPillNum: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statPillLabel: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickJoinBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 1,
  },
  quickJoinBtnIcon: {
    color: '#059669',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 8,
  },
  quickJoinBtnText: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mainLayoutGrid: {
    flexDirection: 'column',
    gap: 24,
  },
  mainLayoutGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftClassesCol: {
    flex: 2,
    minWidth: 300,
  },
  rightSidebarCol: {
    flex: 1,
    minWidth: 280,
    gap: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  countBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  joinActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  joinActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    minHeight: 280,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyIconEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 22,
    marginBottom: 0,
  },
  emptyJoinBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyJoinBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  courseCardsGrid: {
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderBanner: {
    padding: 16,
  },
  cardHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  studentCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  studentCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  cardBody: {
    padding: 16,
  },
  professorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  profAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  profInfoCol: {
    flex: 1,
  },
  profRoleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  profEmailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  enterClassBtn: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  enterClassBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  sideWidgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sideWidgetHeader: {
    marginBottom: 0,
  },
  sideWidgetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  sideWidgetSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emptySideContent: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptySideText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySideSub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  recentPostsList: {
    gap: 10,
  },
  recentPostItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  postTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  postTypeActivity: {
    backgroundColor: '#FEF3C7',
  },
  postTypeAnnouncement: {
    backgroundColor: '#DBEAFE',
  },
  postTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  recentPostTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  recentPostSnippet: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 6,
  },
  recentPostDate: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  resourceLinkList: {
    gap: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  resourceIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  resourceTextCol: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  resourceSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 440,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconText: {
    fontSize: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalInputWrapper: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 2,
    textAlign: 'center',
  },
  modalInputHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalJoinBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalJoinBtnDisabled: {
    opacity: 0.7,
  },
  modalJoinText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
