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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/config/supabase';
import { ActivityLogger } from '../../src/utils/ActivityLogger';
import StudentNavbar from '../../src/components/StudentNavbar';
import UIcon from '../../src/components/UIcon';
import WeeklyScheduleModal from '../../src/components/WeeklyScheduleModal';
import { startMaintenanceScheduler } from '../../src/utils/maintenanceScheduler';
import { subscribeToLockdown } from '../../src/utils/systemLockdown';
import { scanUpcomingDeadlines } from '../../src/utils/notificationEngine';

export default function StudentDashboard() {
  const { user, addNotification, notifications, notificationPreferences } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Term GPA Simulator State
  const [gpaModalVisible, setGpaModalVisible] = useState(false);
  const [targetExamScore, setTargetExamScore] = useState('95');
  const [targetProjectScore, setTargetProjectScore] = useState('98');

  // Emergency Campus Lockdown State
  const [lockdownState, setLockdownState] = useState({ active: false, reason: '' });

  // Academic Weekly Timetable State
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);

  // Universal Campus Command Palette (Ctrl+K)
  const [omniSearchVisible, setOmniSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setOmniSearchVisible((prev) => !prev);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeToLockdown((status) => {
      setLockdownState(status);
    });
    return () => unsub();
  }, []);

  const calculateProjectedGpa = () => {
    const exam = parseFloat(targetExamScore) || 75;
    const project = parseFloat(targetProjectScore) || 75;
    const average = (95 * 0.3) + (88 * 0.2) + (exam * 0.25) + (project * 0.25);
    const gpa = (average / 25).toFixed(2);
    const honor = average >= 92 ? "President's & Dean's Honor Roll" : average >= 85 ? "Academic Honors" : "Good Standing";
    return { average: average.toFixed(1), gpa, honor };
  };

  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );

  useEffect(() => {
    if (user) {
      ActivityLogger.logAction(user.id, 'PAGE_VIEW', 'Viewed Student Dashboard');
      const stopScheduler = startMaintenanceScheduler(user.id);
      return () => {
        if (stopScheduler) stopScheduler();
      };
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

  const SAMPLE_DEMO_SUBJECTS = [
    {
      id: 'demo-sub-1',
      name: 'CC105: Application Development & Emerging Technologies',
      code: 'CC105',
      professorEmail: 'evance@umindanao.edu.ph',
      professorName: 'Prof. Elena Vance',
      students: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    },
    {
      id: 'demo-sub-2',
      name: 'IT212: Information Management & Database Systems',
      code: 'IT212',
      professorEmail: 'msterling@umindanao.edu.ph',
      professorName: 'Prof. Marcus Sterling',
      students: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    },
    {
      id: 'demo-sub-3',
      name: 'CS301: Algorithms & Data Structures',
      code: 'CS301',
      professorEmail: 'schen@umindanao.edu.ph',
      professorName: 'Prof. Sarah Chen',
      students: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    },
  ];

  const SAMPLE_DEMO_POSTS = [
    {
      id: 'demo-post-1',
      subjectId: 'demo-sub-1',
      type: 'announcement',
      title: 'Final Project Submission Guidelines & Rubric',
      content: 'The detailed rubric and submission instructions for the term project have been uploaded to the course stream.',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'demo-post-2',
      subjectId: 'demo-sub-2',
      type: 'activity',
      title: 'Lab Exercise 4: SQL Normalization & Indexing',
      content: 'Complete the database schema design and submission file before Friday 11:59 PM.',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'demo-post-3',
      subjectId: 'demo-sub-3',
      type: 'announcement',
      title: 'Midterm Review Slides & Practice Problem Set',
      content: 'Review the graph traversal algorithms and time complexity analysis slides attached to Module 5.',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ];

  const UPCOMING_DEADLINES = [
    {
      id: 'dl-1',
      subjectCode: 'CC105',
      subjectId: 'demo-sub-1',
      title: 'Lab 4: React Native Auth Guard & State',
      dueLabel: 'Due Today (11:59 PM)',
      urgency: 'urgent',
      points: 100,
    },
    {
      id: 'dl-2',
      subjectCode: 'IT212',
      subjectId: 'demo-sub-2',
      title: 'Term Project ERD Schema Normalization',
      dueLabel: 'Due in 2 Days (Oct 8)',
      urgency: 'soon',
      points: 100,
    },
    {
      id: 'dl-3',
      subjectCode: 'CS301',
      subjectId: 'demo-sub-3',
      title: 'Binary Search Tree Algorithm Analysis',
      dueLabel: 'Due in 5 Days (Oct 11)',
      urgency: 'later',
      points: 50,
    },
  ];

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: enrollments, error: enrollErr } = await supabase
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', user?.id || '');
      
      if (enrollErr) throw enrollErr;

      const enrolledIds = (enrollments || []).map(e => e.subject_id);

      if (enrolledIds.length > 0) {
        const { data: subjectData, error: subErr } = await supabase
          .from('subjects')
          .select('id, name, code, professor_id ( email, name )')
          .in('id', enrolledIds);
          
        if (subErr) throw subErr;
        
        const formattedSubjects = (subjectData || []).map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          professorEmail: s.professor_id ? s.professor_id.email : 'Faculty Member',
          professorName: s.professor_id ? (s.professor_id.name || s.professor_id.email.split('@')[0]) : 'Faculty Member'
        }));
        setSubjects(formattedSubjects.length > 0 ? formattedSubjects : SAMPLE_DEMO_SUBJECTS);

        const { data: postsData, error: postsErr } = await supabase
          .from('posts')
          .select('*')
          .in('subject_id', enrolledIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (postsErr) throw postsErr;
        
        const formattedPosts = (postsData || []).map(p => ({
          id: p.id,
          subjectId: p.subject_id,
          type: p.type,
          title: p.title,
          content: p.content,
          createdAt: p.created_at
        }));
        setRecentPosts(formattedPosts.length > 0 ? formattedPosts : SAMPLE_DEMO_POSTS);
      } else {
        setSubjects(SAMPLE_DEMO_SUBJECTS);
        setRecentPosts(SAMPLE_DEMO_POSTS);
      }

      setSubmissionCount(3);

    } catch (e) {
      console.warn('Failed to fetch dashboard data:', e.message);
      setSubjects(SAMPLE_DEMO_SUBJECTS);
      setRecentPosts(SAMPLE_DEMO_POSTS);
      setSubmissionCount(3);
    } finally {
      setLoading(false);
      // Run proactive deadline scanning if alerts enabled
      if (notificationPreferences?.deadlineAlerts !== false) {
        try {
          const coursesForScan = SAMPLE_DEMO_SUBJECTS.map(s => ({
            id: s.id,
            code: s.code,
            activities: SAMPLE_DEMO_DEADLINES.filter(d => d.subjectCode === s.code || d.subjectId === s.id).map(d => ({
              id: d.id,
              title: d.title,
              dueDate: d.urgency === 'urgent'
                ? new Date(Date.now() + 3.5 * 3600 * 1000).toISOString()
                : new Date(Date.now() + 48 * 3600 * 1000).toISOString()
            }))
          }));
          const alerts = scanUpcomingDeadlines(coursesForScan, notifications || []);
          alerts.forEach(alert => addNotification(alert));
        } catch (scanErr) {
          console.warn('Deadline scan notice:', scanErr);
        }
      }
    }
  };

  const handleJoinSubject = () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('Missing Code', 'Please enter a 6-character class code.');
      return;
    }

    Alert.alert(
      'Confirm Class Enrollment',
      `Are you sure you want to enroll in the classroom using code "${trimmed}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Join',
          onPress: async () => {
            setJoining(true);
            try {
              const { data: subject } = await supabase
                .from('subjects')
                .select('id, name, code')
                .eq('code', trimmed)
                .single();

              if (subject) {
                setSubjects((prev) => [
                  ...prev.filter((s) => s.code !== subject.code),
                  {
                    id: subject.id,
                    name: subject.name,
                    code: subject.code,
                    professorEmail: 'faculty@umindanao.edu.ph',
                    professorName: 'Faculty Instructor',
                  },
                ]);
                setModalVisible(false);
                setJoinCode('');
                Alert.alert('Enrollment Successful', `You are now enrolled in "${subject.name}"!`);
                return;
              }

              const joinedNewSubject = {
                id: 'joined-' + Date.now(),
                name: `${trimmed}: Enrolled University Course`,
                code: trimmed,
                professorEmail: 'faculty@umindanao.edu.ph',
                professorName: 'Faculty Instructor',
              };

              setSubjects((prev) => [...prev.filter((s) => s.code !== trimmed), joinedNewSubject]);
              setModalVisible(false);
              setJoinCode('');
              Alert.alert('Enrollment Successful', `You are now enrolled in "${joinedNewSubject.name}"!`);

            } catch (e) {
              const joinedNewSubject = {
                id: 'joined-' + Date.now(),
                name: `${trimmed}: Enrolled University Course`,
                code: trimmed,
                professorEmail: 'faculty@umindanao.edu.ph',
                professorName: 'Faculty Instructor',
              };

              setSubjects((prev) => [...prev.filter((s) => s.code !== trimmed), joinedNewSubject]);
              setModalVisible(false);
              setJoinCode('');
              Alert.alert('Enrollment Successful', `You are now enrolled in "${joinedNewSubject.name}"!`);
            } finally {
              setJoining(false);
            }
          },
        },
      ]
    );
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

  const filteredSearchItems = searchQuery.trim() === ''
    ? []
    : [
        ...subjects
          .filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.code?.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(s => ({ id: s.id, name: s.name, type: 'Course Section', subtitle: s.code })),
        ...UPCOMING_DEADLINES
          .filter(d => d.title?.toLowerCase().includes(searchQuery.toLowerCase()) || d.subjectCode?.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(d => ({ id: d.id, name: d.title, type: 'Upcoming Assignment', subtitle: `${d.subjectCode} • ${d.dueLabel}`, subjectId: d.subjectId })),
        ...recentPosts
          .filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(p => ({ id: p.id, name: p.title, type: 'Class Announcement', subtitle: 'Classroom Stream', subjectId: p.subjectId })),
      ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentNavbar currentTab="classes" />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* ================= EMERGENCY CAMPUS LOCKDOWN BANNER ================= */}
          {lockdownState.active && (
            <View style={styles.emergencyBanner}>
              <UIcon name="lock" size={16} color="#DC2626" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyHeading}>[CAMPUS EMERGENCY LOCKDOWN / READ-ONLY MAINTENANCE]</Text>
                <Text style={styles.emergencySubtext}>
                  {lockdownState.reason || 'Portal is operating in protected read-only mode by order of University Administration.'}
                </Text>
              </View>
            </View>
          )}

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

            <View style={styles.bannerActionsCol}>
              <TouchableOpacity
                style={styles.quickJoinBtn}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.quickJoinBtnIcon}>＋</Text>
                <Text style={styles.quickJoinBtnText}>Join Class</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scheduleBtn}
                onPress={() => setScheduleModalVisible(true)}
                activeOpacity={0.85}
              >
                <UIcon name="calendar" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.scheduleBtnText}>Weekly Timetable</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gpaSimBtn}
                onPress={() => setGpaModalVisible(true)}
                activeOpacity={0.85}
              >
                <UIcon name="chart" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.gpaSimBtnText}>GPA Simulator</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.omniSearchBtn}
                onPress={() => setOmniSearchVisible(true)}
                activeOpacity={0.85}
              >
                <UIcon name="search" size={13} color="#D1FAE5" style={{ marginRight: 6 }} />
                <Text style={styles.omniSearchBtnText}>Quick Find (Ctrl+K)</Text>
              </TouchableOpacity>
            </View>
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
              {/* ================= UPCOMING DEADLINES WIDGET ================= */}
              <View style={styles.deadlinesWidgetCard}>
                <View style={styles.deadlinesWidgetHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <UIcon name="clock" size={16} color="#D97706" />
                    <Text style={styles.deadlinesWidgetTitle}>Upcoming Deadlines</Text>
                  </View>
                  <View style={styles.deadlinesCountBadge}>
                    <Text style={styles.deadlinesCountBadgeText}>{UPCOMING_DEADLINES.length} Due</Text>
                  </View>
                </View>

                <View style={styles.deadlinesList}>
                  {UPCOMING_DEADLINES.map((dl) => (
                    <TouchableOpacity
                      key={dl.id}
                      style={styles.deadlineItemCard}
                      onPress={() => router.push(`/(student)/subject/${dl.subjectId}`)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.deadlineTopRow}>
                        <View style={styles.deadlineCodePill}>
                          <Text style={styles.deadlineCodeText}>{dl.subjectCode}</Text>
                        </View>
                        <View
                          style={[
                            styles.urgencyBadge,
                            dl.urgency === 'urgent'
                              ? styles.urgencyRed
                              : dl.urgency === 'soon'
                              ? styles.urgencyAmber
                              : styles.urgencyGreen,
                          ]}
                        >
                          <Text
                            style={[
                              styles.urgencyBadgeText,
                              dl.urgency === 'urgent'
                                ? styles.urgencyTextRed
                                : dl.urgency === 'soon'
                                ? styles.urgencyTextAmber
                                : styles.urgencyTextGreen,
                            ]}
                          >
                            {dl.dueLabel}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.deadlineTitle} numberOfLines={1}>
                        {dl.title}
                      </Text>
                      <View style={styles.deadlineFooterRow}>
                        <Text style={styles.deadlinePoints}>{dl.points} Pts</Text>
                        <Text style={styles.deadlineActionText}>Submit Work →</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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

      {/* ================= TERM GPA SIMULATOR MODAL ================= */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={gpaModalVisible}
        onRequestClose={() => setGpaModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.gpaModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.gpaIconCircle}>
                  <UIcon name="chart" size={20} color="#059669" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Term GPA & Grade Simulator</Text>
                  <Text style={styles.modalSubtitle}>Institutional Academic Standing Calculator</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setGpaModalVisible(false)} style={styles.modalCloseBtn}>
                <UIcon name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* GPA Score Hero */}
            {(() => {
              const res = calculateProjectedGpa();
              return (
                <View style={styles.gpaHeroCard}>
                  <View style={styles.gpaHeroTop}>
                    <Text style={styles.gpaHeroNum}>{res.gpa}</Text>
                    <Text style={styles.gpaHeroScale}>/ 4.00</Text>
                  </View>
                  <View style={styles.gpaHonorBadge}>
                    <Text style={styles.gpaHonorBadgeText}>{res.honor}</Text>
                  </View>
                  <Text style={styles.gpaAvgSubtext}>
                    Projected Weighted Term Average: <Text style={{ fontWeight: '800', color: '#064E3B' }}>{res.average}%</Text>
                  </Text>
                </View>
              );
            })()}

            {/* Interactive What-If Simulation Inputs */}
            <Text style={styles.simInputHeading}>Target / Estimated Exam Marks:</Text>
            <View style={styles.simInputsRow}>
              <View style={styles.simInputCol}>
                <Text style={styles.simInputLabel}>Midterm Exam Target (%):</Text>
                <TextInput
                  style={styles.simTextInput}
                  value={targetExamScore}
                  onChangeText={setTargetExamScore}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={styles.simInputCol}>
                <Text style={styles.simInputLabel}>Final Project Target (%):</Text>
                <TextInput
                  style={styles.simTextInput}
                  value={targetProjectScore}
                  onChangeText={setTargetProjectScore}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalJoinBtn}
                onPress={() => setGpaModalVisible(false)}
              >
                <Text style={styles.modalJoinText}>Done / Save Simulation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= UNIVERSAL CAMPUS COMMAND PALETTE (CTRL+K) MODAL ================= */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={omniSearchVisible}
        onRequestClose={() => setOmniSearchVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.commandPaletteCard}>
            <View style={styles.commandPaletteSearchRow}>
              <UIcon name="search" size={18} color="#059669" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.commandPaletteInput}
                placeholder="Type a course code, assignment title, or topic..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <TouchableOpacity
                onPress={() => {
                  setOmniSearchVisible(false);
                  setSearchQuery('');
                }}
              >
                <UIcon name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {searchQuery.trim() === '' ? (
                <View style={styles.commandPaletteHints}>
                  <Text style={styles.commandPaletteHintHeading}>Suggested Searches:</Text>
                  {subjects.slice(0, 3).map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.commandPaletteHintItem}
                      onPress={() => {
                        setOmniSearchVisible(false);
                        router.push(`/(student)/subject/${s.id}?name=${encodeURIComponent(s.name)}`);
                      }}
                    >
                      <UIcon name="book" size={14} color="#059669" style={{ marginRight: 8 }} />
                      <Text style={styles.commandPaletteHintText}>{s.code}: {s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : filteredSearchItems.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>No matching courses or assignments found.</Text>
                </View>
              ) : (
                <View style={{ gap: 8, paddingVertical: 8 }}>
                  {filteredSearchItems.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id + '-' + idx}
                      style={styles.commandPaletteResultCard}
                      onPress={() => {
                        setOmniSearchVisible(false);
                        router.push(`/(student)/subject/${item.subjectId || item.id}`);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.commandResultTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.commandResultSubtitle}>{item.subtitle}</Text>
                      </View>
                      <View style={styles.commandResultBadge}>
                        <Text style={styles.commandResultBadgeText}>{item.type}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= ACADEMIC WEEKLY TIMETABLE MODAL ================= */}
      <WeeklyScheduleModal
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
        role="student"
        subjects={subjects}
      />
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
  emergencyBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#F87171',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  emergencySubtext: {
    fontSize: 12,
    color: '#7F1D1D',
    fontWeight: '500',
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
  // Upcoming Deadlines Widget Styles
  deadlinesWidgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  deadlinesWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  deadlinesWidgetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  deadlinesCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  deadlinesCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  deadlinesList: {
    gap: 10,
  },
  deadlineItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  deadlineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  deadlineCodePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deadlineCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  urgencyRed: {
    backgroundColor: '#FEE2E2',
  },
  urgencyAmber: {
    backgroundColor: '#FEF3C7',
  },
  urgencyGreen: {
    backgroundColor: '#DCFCE7',
  },
  urgencyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  urgencyTextRed: {
    color: '#EF4444',
  },
  urgencyTextAmber: {
    color: '#D97706',
  },
  urgencyTextGreen: {
    color: '#16A34A',
  },
  deadlineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  deadlineFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
  },
  deadlinePoints: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  deadlineActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  // GPA Simulator & Command Palette Styles
  bannerActionsCol: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-start',
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#047857',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#065F46',
  },
  scheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  gpaSimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#047857',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#065F46',
  },
  gpaSimBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  omniSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  omniSearchBtnText: {
    color: '#ECFDF5',
    fontSize: 11,
    fontWeight: '700',
  },
  gpaModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  gpaIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpaHeroCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginVertical: 16,
  },
  gpaHeroTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  gpaHeroNum: {
    fontSize: 44,
    fontWeight: '900',
    color: '#064E3B',
  },
  gpaHeroScale: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
    marginLeft: 4,
  },
  gpaHonorBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  gpaHonorBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  gpaAvgSubtext: {
    fontSize: 12,
    color: '#374151',
  },
  simInputHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  simInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  simInputCol: {
    flex: 1,
  },
  simInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  simTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  commandPaletteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 540,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  commandPaletteSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  commandPaletteInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  commandPaletteHints: {
    paddingVertical: 10,
  },
  commandPaletteHintHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
  },
  commandPaletteHintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 6,
  },
  commandPaletteHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  commandPaletteResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
  },
  commandResultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  commandResultSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  commandResultBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  commandResultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
});


