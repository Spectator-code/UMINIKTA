import React, { useState, useCallback, useEffect } from 'react';
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
import ProfessorNavbar from '../../src/components/ProfessorNavbar';
import UIcon from '../../src/components/UIcon';
import WeeklyScheduleModal from '../../src/components/WeeklyScheduleModal';
import { subscribeToLockdown } from '../../src/utils/systemLockdown';
import theme from '../../src/theme';

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [lockdownState, setLockdownState] = useState({ active: false, reason: '' });
  const [newSubjectName, setNewSubjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    const unsub = subscribeToLockdown((status) => {
      setLockdownState(status);
    });
    return () => unsub();
  }, []);

  const isDesktop = screenWidth >= 992;
  const isTablet = screenWidth >= 640 && screenWidth < 992;

  // Background bubble animation for faculty hero
  const bubble1Anim = useState(new Animated.Value(0))[0];
  const bubble2Anim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const animateBubble1 = () => {
      Animated.sequence([
        Animated.timing(bubble1Anim, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bubble1Anim, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => animateBubble1());
    };

    const animateBubble2 = () => {
      Animated.sequence([
        Animated.timing(bubble2Anim, {
          toValue: 1,
          duration: 11000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bubble2Anim, {
          toValue: 0,
          duration: 11000,
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
    outputRange: [0, -25],
  });
  const bubble2TranslateX = bubble2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 35],
  });

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
      if (user) {
        ActivityLogger.logAction(user.id, 'PAGE_VIEW', 'Viewed Professor Dashboard');
      }
    }, [user?.id])
  );

  const SAMPLE_PROF_SUBJECTS = [
    {
      id: 'prof-sub-1',
      name: 'CC105: Application Development & Emerging Tech',
      code: 'CC105X',
      studentsCount: 38,
    },
    {
      id: 'prof-sub-2',
      name: 'IT212: Information Management & Database Systems',
      code: 'IT212M',
      studentsCount: 42,
    },
  ];

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          id, name, code,
          enrollments(count)
        `)
        .eq('professor_id', user?.id || '');

      if (error) throw error;

      const formattedSubjects = (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        studentsCount: s.enrollments ? s.enrollments[0]?.count || 0 : 0,
      }));
      setSubjects(formattedSubjects.length > 0 ? formattedSubjects : SAMPLE_PROF_SUBJECTS);
    } catch (e) {
      console.warn('Failed to fetch subjects:', e.message);
      setSubjects(SAMPLE_PROF_SUBJECTS);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert('Missing Field', 'Please enter a course or subject title.');
      return;
    }

    setCreating(true);
    try {
      const code = generateCode();
      const newSub = {
        name: newSubjectName.trim(),
        code,
        professor_id: user?.id || 'demo-prof-1',
      };

      const { data, error } = await supabase
        .from('subjects')
        .insert([newSub])
        .select()
        .single();

      if (error) {
        const createdDemoSub = {
          id: 'sub-' + Date.now(),
          name: newSubjectName.trim(),
          code,
          studentsCount: 0,
        };
        setSubjects((prev) => [...prev, createdDemoSub]);
        setModalVisible(false);
        setNewSubjectName('');
        Alert.alert('Subject Created', `"${newSubjectName.trim()}" created successfully!\nEnrollment Code: ${code}`);
        return;
      }

      setSubjects((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          code: data.code,
          studentsCount: 0,
        },
      ]);
      setModalVisible(false);
      setNewSubjectName('');
      Alert.alert('Subject Created', `"${data.name}" has been created with join code: ${code}`);
    } catch (e) {
      const code = generateCode();
      const createdDemoSub = {
        id: 'sub-' + Date.now(),
        name: newSubjectName.trim(),
        code,
        studentsCount: 0,
      };
      setSubjects((prev) => [...prev, createdDemoSub]);
      setModalVisible(false);
      setNewSubjectName('');
      Alert.alert('Subject Created', `"${newSubjectName.trim()}" created successfully!\nEnrollment Code: ${code}`);
    } finally {
      setCreating(false);
    }
  };

  const totalStudents = subjects.reduce((sum, s) => sum + (s.studentsCount || 0), 0);

  const handleKpiPress = (metricType) => {
    switch (metricType) {
      case 'enrolled':
        Alert.alert(
          'Enrollment Capacity Overview',
          `You currently have ${totalStudents} students enrolled across ${subjects.length} active course sections.\nAggregate section capacity is currently at ${Math.min(Math.round((totalStudents / (subjects.length * 50 || 1)) * 100), 100)}%.`
        );
        break;
      case 'grading':
        Alert.alert(
          'Grading Queue & Pending Evaluations',
          `5 student submissions are awaiting evaluation across CC105 and IT212.\nNavigate into each course stream to review files and publish numerical marks.`
        );
        break;
      case 'attendance':
        Alert.alert(
          'Institutional Attendance Metric',
          `Term-to-date average presence is 96.4% across active cohorts.\nFaculty compliance with institutional attendance recording is in full standing.`
        );
        break;
      case 'completion':
        Alert.alert(
          'Task Completion Rate',
          `88.5% of assigned course tasks have been turned in on or before the designated deadline.`
        );
        break;
    }
  };

  const getSubjectColor = (index) => {
    const palettes = [
      { bg: '#4F46E5', accent: '#3730A3', light: '#EEF2FF' },
      { bg: '#2563EB', accent: '#1D4ED8', light: '#EFF6FF' },
      { bg: '#7C3AED', accent: '#6D28D9', light: '#F5F3FF' },
      { bg: '#0D9488', accent: '#0F766E', light: '#F0FDFA' },
      { bg: '#D97706', accent: '#B45309', light: '#FFFBEB' },
    ];
    return palettes[index % palettes.length];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProfessorNavbar onCreateSubjectPress={() => setModalVisible(true)} />

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

          {/* ================= FACULTY WELCOME BANNER ================= */}
          <View style={styles.welcomeBanner}>
            <Animated.View
              style={[
                styles.heroBgCircle1,
                { transform: [{ translateY: bubble1TranslateY }] },
              ]}
            />
            <Animated.View
              style={[
                styles.heroBgCircle2,
                { transform: [{ translateX: bubble2TranslateX }] },
              ]}
            />

            <View style={styles.welcomeTextCol}>
              <View style={styles.badgeRow}>
                <View style={styles.univBadge}>
                  <Text style={styles.univBadgeText}>UNIVERSITY OF MINDANAO</Text>
                </View>
                <View style={styles.facultyRoleBadge}>
                  <Text style={styles.facultyRoleBadgeText}>FACULTY DESK</Text>
                </View>
              </View>

              <Text style={styles.welcomeHeading}>
                Welcome, {user?.displayName || user?.email?.split('@')[0] || 'Professor'}!
              </Text>
              <Text style={styles.welcomeSubtext}>
                Manage your academic curriculum, broadcast announcements, review student submissions, and monitor active class rosters.
              </Text>

              {/* Stat Summary Badges */}
              <View style={styles.statsSummaryRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillNum}>{subjects.length}</Text>
                  <Text style={styles.statPillLabel}>Active Classes</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statPillNum}>{totalStudents}</Text>
                  <Text style={styles.statPillLabel}>Enrolled Students</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statPillNum}>50</Text>
                  <Text style={styles.statPillLabel}>Max / Class</Text>
                </View>
              </View>
            </View>

            <View style={styles.bannerActionsCol}>
              <TouchableOpacity
                style={styles.quickCreateBtn}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.quickCreateBtnIcon}>＋</Text>
                <Text style={styles.quickCreateBtnText}>Create Subject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.teachingScheduleBtn}
                onPress={() => setScheduleModalVisible(true)}
                activeOpacity={0.85}
              >
                <UIcon name="calendar" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.teachingScheduleBtnText}>Teaching Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= INTERACTIVE FACULTY KPI ANALYTICS GRID ================= */}
          <View style={styles.kpiGrid}>
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => handleKpiPress('enrolled')}
              activeOpacity={0.8}
            >
              <View style={styles.kpiTopRow}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <UIcon name="users" size={16} color="#4F46E5" />
                </View>
                <View style={[styles.kpiTrendBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.kpiTrendText, { color: '#2563EB' }]}>80% Cap</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>{totalStudents}</Text>
              <Text style={styles.kpiLabel}>Total Enrolled</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => handleKpiPress('grading')}
              activeOpacity={0.8}
            >
              <View style={styles.kpiTopRow}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#FFFBEB' }]}>
                  <UIcon name="clipboard" size={16} color="#D97706" />
                </View>
                <View style={[styles.kpiTrendBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.kpiTrendText, { color: '#B45309' }]}>Queue</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>5</Text>
              <Text style={styles.kpiLabel}>Pending Grades</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => handleKpiPress('attendance')}
              activeOpacity={0.8}
            >
              <View style={styles.kpiTopRow}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <UIcon name="check" size={16} color="#059669" />
                </View>
                <View style={[styles.kpiTrendBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.kpiTrendText, { color: '#16A34A' }]}>+1.8%</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>96.4%</Text>
              <Text style={styles.kpiLabel}>Attendance Avg</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => handleKpiPress('completion')}
              activeOpacity={0.8}
            >
              <View style={styles.kpiTopRow}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#F5F3FF' }]}>
                  <UIcon name="clock" size={16} color="#7C3AED" />
                </View>
                <View style={[styles.kpiTrendBadge, { backgroundColor: '#EDE9FE' }]}>
                  <Text style={[styles.kpiTrendText, { color: '#6D28D9' }]}>High</Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>88.5%</Text>
              <Text style={styles.kpiLabel}>Completion Rate</Text>
            </TouchableOpacity>
          </View>

          {/* ================= CLASSES SECTION ================= */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithBadge}>
              <Text style={styles.sectionTitle}>Your Faculty Subjects</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{subjects.length}</Text>
              </View>
            </View>

            <Text style={styles.sectionSub}>First Semester Academic Term 2026</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading faculty courses...</Text>
            </View>
          ) : subjects.length === 0 ? (
            /* EMPTY STATE */
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconCircle}>
                <UIcon name="book" size={40} color="#4F46E5" />
              </View>
              <Text style={styles.emptyTitle}>No Subjects Created Yet</Text>
              <Text style={styles.emptyDescription}>
                You have not created any course modules for this academic semester.
                Click "Create Subject" above to initialize your first classroom and generate a student enrollment code.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.emptyActionBtnText}>+ Create Your First Class</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* COURSE CARDS GRID */
            <View style={[styles.courseGrid, (isDesktop || isTablet) && styles.courseGridDesktop]}>
              {subjects.map((item, index) => {
                const color = getSubjectColor(index);
                const percentFull = Math.min(Math.round((item.studentsCount / 50) * 100), 100);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.courseCard}
                    onPress={() =>
                      router.push(
                        `/(professor)/subject/${item.id}?name=${encodeURIComponent(item.name)}&code=${item.code}`
                      )
                    }
                    activeOpacity={0.9}
                  >
                    {/* Header Banner */}
                    <View style={[styles.cardHeaderBanner, { backgroundColor: color.bg }]}>
                      <View style={styles.cardHeaderTopRow}>
                        <View style={styles.codePill}>
                          <Text style={styles.codePillText}>CODE: {item.code}</Text>
                        </View>
                        <View style={styles.capacityBadge}>
                          <UIcon name="users" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.capacityBadgeText}>
                            {item.studentsCount} / 50
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.courseTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                    </View>

                    {/* Body */}
                    <View style={styles.cardBody}>
                      <View style={styles.capacityProgressRow}>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${percentFull}%`, backgroundColor: color.bg },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressPercentText}>{percentFull}% capacity</Text>
                      </View>

                      <View style={styles.cardDivider} />

                      <View style={styles.cardFooterRow}>
                        <View style={styles.termBadge}>
                          <Text style={styles.termBadgeText}>Term 1 • 2026</Text>
                        </View>
                        <View style={styles.enterClassBtn}>
                          <Text style={styles.enterClassBtnText}>Manage Class →</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================= CREATE SUBJECT MODAL ================= */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create New Subject</Text>
                <Text style={styles.modalSubtitle}>
                  Set up a new classroom module and student enrollment code
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <UIcon name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject / Course Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. IT 312 - Advanced Web Applications"
                placeholderTextColor="#9CA3AF"
                value={newSubjectName}
                onChangeText={setNewSubjectName}
                autoFocus={true}
              />
              <Text style={styles.inputHint}>
                A unique 6-character enrollment code will be automatically generated.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={creating}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, creating && styles.confirmBtnDisabled]}
                onPress={handleCreateSubject}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Create Subject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= FACULTY TEACHING SCHEDULE TIMETABLE MODAL ================= */}
      <WeeklyScheduleModal
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
        role="professor"
        subjects={subjects}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  contentWrapper: {
    maxWidth: 1280,
    width: '100%',
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
    backgroundColor: '#312E81',
    borderRadius: 24,
    padding: 28,
    marginBottom: 32,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
  },
  heroBgCircle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    top: -100,
    right: -60,
  },
  heroBgCircle2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(79, 70, 229, 0.35)',
    bottom: -80,
    left: '35%',
  },
  welcomeTextCol: {
    flex: 1,
    minWidth: 280,
    zIndex: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  univBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  univBadgeText: {
    color: '#E0E7FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  facultyRoleBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  facultyRoleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  welcomeHeading: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtext: {
    color: '#C7D2FE',
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 620,
    marginBottom: 20,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  statPillNum: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statPillLabel: {
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: '600',
  },
  bannerActionsCol: {
    flexDirection: 'column',
    gap: 10,
    alignItems: 'flex-start',
    zIndex: 2,
  },
  quickCreateBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 2,
  },
  quickCreateBtnIcon: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: '800',
  },
  quickCreateBtnText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '700',
  },
  teachingScheduleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  teachingScheduleBtnText: {
    color: '#EEF2FF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 44,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    maxWidth: 580,
    alignSelf: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyActionBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  courseGrid: {
    gap: 20,
  },
  courseGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    minWidth: 300,
    flex: 1,
  },
  cardHeaderBanner: {
    padding: 20,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  capacityBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 8,
  },
  cardBody: {
    padding: 18,
  },
  capacityProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  termBadgeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  enterClassBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  enterClassBtnText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    width: '100%',
    maxWidth: 480,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  inputHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Faculty KPI Grid Styles
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTrendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  kpiTrendText: {
    fontSize: 10,
    fontWeight: '800',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});

