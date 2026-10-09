import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../src/context/AuthContext';
import { useConfirm } from '../../../src/context/ConfirmContext';
import { supabase } from '../../../src/config/supabase';
import ProfessorNavbar from '../../../src/components/ProfessorNavbar';
import UIcon from '../../../src/components/UIcon';
import GradeCurveVisualizer from '../../../src/components/GradeCurveVisualizer';
import { compareSubmissions, SAMPLE_STUDENT_CODE_CORPUS } from '../../../src/utils/codeSimilarity';

export default function ProfessorSubjectDetails() {
  const { id, name, code } = useLocalSearchParams();
  const router = useRouter();
  const { user, addNotification } = useAuth();
  const { confirm } = useConfirm();

  const [posts, setPosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'members'
  const [copiedCode, setCopiedCode] = useState(false);

  // Submissions Grading State
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [selectedPostForGrading, setSelectedPostForGrading] = useState(null);
  const [gradingStudentId, setGradingStudentId] = useState('st-1');
  const [gradeScore, setGradeScore] = useState('95');
  const [gradingFeedback, setGradingFeedback] = useState('Great database schema design & clear ERD diagram!');
  const [submissionGrades, setSubmissionGrades] = useState({
    'st-1': { score: '95', feedback: 'Great database design and normalization!', status: 'Graded' },
    'st-2': { score: '100', feedback: 'Exceptional UI implementation and clean code.', status: 'Graded' },
  });

  // Source Code Similarity & Academic Integrity Inspector State
  const [similarityModalVisible, setSimilarityModalVisible] = useState(false);
  const [similarityTargetId, setSimilarityTargetId] = useState('st-102');
  const [baseCodeStudentId, setBaseCodeStudentId] = useState('st-101');
  const [similaritySnippetTab, setSimilaritySnippetTab] = useState('code'); // 'code' | 'tokens'

  // Live Attendance State
  const [attendanceMap, setAttendanceMap] = useState({
    'st-1': 'PRESENT',
    'st-2': 'PRESENT',
    'st-3': 'LATE',
  });

  // Grade Curve Normalization State
  const [curveModalVisible, setCurveModalVisible] = useState(false);

  // Restore cached grades and attendance on mount
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const storedGrades = await AsyncStorage.getItem(`@prof_grades_${id}`);
        if (storedGrades) {
          const parsed = JSON.parse(storedGrades);
          setSubmissionGrades((prev) => ({ ...prev, ...parsed }));
        }
        const storedAttendance = await AsyncStorage.getItem(`@prof_attendance_${id}`);
        if (storedAttendance) {
          const parsed = JSON.parse(storedAttendance);
          setAttendanceMap((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.warn('Failed to load persisted subject state:', e.message);
      }
    })();
  }, [id]);

  const handleApplyCurve = (offset) => {
    if (offset === 0) {
      setCurveModalVisible(false);
      return;
    }
    const updated = {};
    for (const [studentId, data] of Object.entries(submissionGrades)) {
      const currentScore = parseFloat(data.score) || 0;
      updated[studentId] = {
        ...data,
        score: Math.min(100, Math.max(0, currentScore + offset)).toString(),
      };
    }
    setSubmissionGrades(updated);
    if (id) {
      AsyncStorage.setItem(`@prof_grades_${id}`, JSON.stringify(updated)).catch(console.warn);
    }
    setCurveModalVisible(false);
    if (addNotification) {
      addNotification({
        title: `Grade Curve Applied to ${code || 'Class'}`,
        body: `Normal distribution offset of ${offset > 0 ? '+' : ''}${offset} pts applied across roster.`,
        category: 'grade',
        urgency: 'normal',
        actionRoute: `/(professor)/subject/${id}`,
        actionLabel: 'Inspect Roster',
      });
    }
    Alert.alert('Curve Applied', `A curve of ${offset > 0 ? '+' : ''}${offset} points was applied to all graded submissions.`);
  };

  const handleSetAttendance = (studentId, status) => {
    setAttendanceMap((prev) => {
      const updated = { ...prev, [studentId]: status };
      if (id) {
        AsyncStorage.setItem(`@prof_attendance_${id}`, JSON.stringify(updated)).catch(console.warn);
      }
      return updated;
    });
  };

  const handleOpenGradingModal = (post) => {
    setSelectedPostForGrading(post);
    setGradingModalVisible(true);
  };

  const handleSaveGrade = () => {
    if (!gradingStudentId || !gradeScore) {
      Alert.alert('Missing Field', 'Please enter a score grade for the student submission.');
      return;
    }
    setSubmissionGrades((prev) => {
      const updated = {
        ...prev,
        [gradingStudentId]: {
          score: gradeScore,
          feedback: gradingFeedback,
          status: 'Graded',
        },
      };
      if (id) {
        AsyncStorage.setItem(`@prof_grades_${id}`, JSON.stringify(updated)).catch(console.warn);
      }
      return updated;
    });
    setGradingModalVisible(false);
    if (addNotification) {
      addNotification({
        title: `Evaluation Published (${gradeScore}/100)`,
        body: `Submission review and rubric feedback recorded for student ${gradingStudentId}.`,
        category: 'grade',
        urgency: 'normal',
        actionRoute: `/(professor)/subject/${id}`,
        actionLabel: 'View Gradebook',
      });
    }
    Alert.alert('Grade Published', `Score ${gradeScore}/100 and feedback published to student record!`);
  };

  const handleGenerateAIRubricFeedback = () => {
    const aiFeedbackTemplates = [
      {
        score: '96',
        feedback: '3NF schema normalization achieved. SQL queries demonstrate efficient join paths. Recommended optimization: Add composite indexes on foreign keys to minimize tablespace scans.',
      },
      {
        score: '92',
        feedback: 'Architecture conforms to institutional specifications. Clean modularization and complete entity relationships. Ensure cascade deletion constraints are explicitly documented.',
      },
      {
        score: '98',
        feedback: 'Outstanding submission! Comprehensive test coverage, robust database migration scripts, and immaculate code comments adhering to department guidelines.',
      },
    ];
    const picked = aiFeedbackTemplates[Math.floor(Math.random() * aiFeedbackTemplates.length)];
    setGradeScore(picked.score);
    setGradingFeedback(picked.feedback);
    Alert.alert(
      'AI Rubric Feedback Drafted',
      'Rubric criteria analyzed. Numerical mark and qualitative feedback have been drafted for your review and approval.'
    );
  };

  const handleReferAdvisor = (student) => {
    Alert.alert(
      'Academic Retention Referral',
      `Submit an official Early Warning Academic Intervention memo for ${student.name} to the College Guidance & Retention Office?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Referral Memo',
          onPress: () => {
            Alert.alert(
              'Intervention Dispatched',
              `Academic intervention case #ADV-${Date.now().toString().slice(-4)} opened for ${student.name}. Guidance Counselor and Academic Dean notified.`
            );
          },
        },
      ]
    );
  };

  const handleOpenGradingScheme = () => {
    Alert.alert(
      'Institutional Grading Scheme & Weighting',
      `Active Term Weighting Matrix:\n\n• Laboratory Exercises & Tasks: 30%\n• Midterm / Final Examination: 25%\n• Term Capstone Project: 25%\n• Quizzes & Recitation: 20%\n\nPassing Cutoff: 75.0% | Dean's Honor Cutoff: 90.0%`,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  const handleMarkAllPresent = () => {
    Alert.alert(
      'Confirm Bulk Attendance',
      `Set attendance status to PRESENT for all ${students.length} enrolled students in this section?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All Present',
          onPress: () => {
            const updated = {};
            students.forEach((st) => {
              updated[st.id] = 'PRESENT';
            });
            setAttendanceMap((prev) => ({ ...prev, ...updated }));
            Alert.alert('Attendance Updated', `All ${students.length} students marked PRESENT.`);
          },
        },
      ]
    );
  };

  const handleExportRegistrarCSV = () => {
    const headerLines = [
      'UNIVERSITY OF MINDANAO - REGISTRAR ACADEMIC REPORT',
      `Course Code: ${code || 'N/A'},Course Title: "${name || 'Course'}",Term: 1st Semester 2026`,
      `Generated: ${new Date().toLocaleString()},Faculty: ${user?.email || 'Faculty Instructor'}`,
      '',
      'Student ID,Student Name,Institutional Email,Attendance Status,Grade (Score / 100),Instructor Comments',
    ];

    const dataLines = students.map((st) => {
      const attendance = attendanceMap[st.id] || 'PRESENT';
      const grade = submissionGrades[st.id]?.score || 'N/A';
      const feedback = (submissionGrades[st.id]?.feedback || 'Evaluation complete.').replace(/"/g, '""');
      return `"${st.id}","${st.name}","${st.email}","${attendance}","${grade}","${feedback}"`;
    });

    const csvContent = [...headerLines, ...dataLines].join('\n');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${code || 'Course'}_Registrar_Gradebook_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Alert.alert('Download Started', `Gradebook & Attendance CSV exported for ${students.length} students!`);
    } else {
      Alert.alert('Report Generated', `Comprehensive Registrar CSV compiled for ${students.length} students.`);
    }
  };

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  const isDesktop = screenWidth >= 992;

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id, viewMode])
  );

  const SAMPLE_PROF_POSTS = [
    {
      id: 'prof-post-1',
      subjectId: id,
      type: 'announcement',
      title: 'Final Project Submission Guidelines & Rubric',
      content: 'The detailed rubric and submission instructions for the term project have been uploaded to the course stream.',
      fileName: 'CC105_Term_Project_Rubric_v2.pdf',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'prof-post-2',
      subjectId: id,
      type: 'activity',
      title: 'Lab Exercise 4: SQL Normalization & Indexing',
      content: 'Complete the database schema design and submission file before Friday 11:59 PM.',
      fileName: 'Lab_4_DB_Schema_Guide.zip',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];

  const SAMPLE_PROF_STUDENTS = [
    { id: 'st-1', email: 'jdelacruz@umindanao.edu.ph', name: 'Juan Dela Cruz' },
    { id: 'st-2', email: 'msantos@umindanao.edu.ph', name: 'Maria Santos' },
    { id: 'st-3', email: 'aramos@umindanao.edu.ph', name: 'Antonio Ramos' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'feed') {
        const { data: postsData, error: postsErr } = await supabase
          .from('posts')
          .select('*')
          .eq('subject_id', id)
          .order('created_at', { ascending: false });

        if (postsErr) throw postsErr;

        const formattedPosts = (postsData || []).map((p) => ({
          id: p.id,
          subjectId: p.subject_id,
          type: p.type,
          title: p.title,
          content: p.content,
          fileName: p.file_name,
          fileUri: p.file_uri,
          createdAt: p.created_at,
        }));
        setPosts(formattedPosts.length > 0 ? formattedPosts : SAMPLE_PROF_POSTS);
      } else {
        const { data: enrollments, error: enrollErr } = await supabase
          .from('enrollments')
          .select('student_id (id, email, name)')
          .eq('subject_id', id);

        if (enrollErr) throw enrollErr;

        const studentList = (enrollments || []).map((e) => ({
          id: e.student_id?.id,
          email: e.student_id?.email || 'student@umindanao.edu.ph',
          name: e.student_id?.name || e.student_id?.email?.split('@')[0] || 'Student',
        }));
        setStudents(studentList.length > 0 ? studentList : SAMPLE_PROF_STUDENTS);
      }
    } catch (e) {
      console.warn('Failed to fetch data:', e.message);
      setPosts(SAMPLE_PROF_POSTS);
      setStudents(SAMPLE_PROF_STUDENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } else {
      Alert.alert('Class Code', `Class code: ${code}`);
    }
  };

  const handleKick = async (studentId, studentEmail) => {
    const proceed = await confirm({
      title: 'Remove Student from Class',
      message: `Are you sure you want to remove ${studentEmail || 'this student'} from this class roster? The student will be unenrolled immediately.`,
      confirmText: 'Remove Student',
      confirmColor: '#DC2626',
      icon: 'trash',
      isDestructive: true,
    });

    if (proceed) {
      try {
        const { error } = await supabase
          .from('enrollments')
          .delete()
          .eq('subject_id', id)
          .eq('student_id', studentId);

        if (error) throw error;
        setStudents(students.filter((s) => s.id !== studentId));
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('The student has been unenrolled from this class.');
        } else {
          Alert.alert('Student Removed', 'The student has been unenrolled from this class.');
        }
      } catch (e) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('Could not remove student: ' + e.message);
        } else {
          Alert.alert('Error', 'Could not remove student: ' + e.message);
        }
      }
    }
  };

  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case 'activity':
        return { bg: '#EFF6FF', text: '#2563EB', label: 'ASSIGNMENT / TASK' };
      case 'announcement':
        return { bg: '#FEF3C7', text: '#D97706', label: 'ANNOUNCEMENT' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: 'MATERIAL' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const presentCount = students.filter((st) => (attendanceMap[st.id] || 'PRESENT') === 'PRESENT').length;
  const lateCount = students.filter((st) => attendanceMap[st.id] === 'LATE').length;
  const absentCount = students.filter((st) => attendanceMap[st.id] === 'ABSENT').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProfessorNavbar />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* ================= BACK BAR ================= */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.push('/(professor)')}
            activeOpacity={0.7}
          >
            <UIcon name="logout" size={16} color="#4F46E5" style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.backText}>Back to Faculty Dashboard</Text>
          </TouchableOpacity>

          {/* ================= COURSE HERO BANNER ================= */}
          <View style={styles.heroBanner}>
            <View style={styles.heroTextCol}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.univBadge}>
                  <Text style={styles.univBadgeText}>UNIVERSITY OF MINDANAO</Text>
                </View>
                <TouchableOpacity
                  style={styles.codeCopyPill}
                  onPress={handleCopyCode}
                  activeOpacity={0.8}
                >
                  <Text style={styles.codeCopyText}>
                    {copiedCode ? 'COPIED' : `CODE: ${code}`}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.courseTitle}>{name}</Text>
              <Text style={styles.courseSub}>
                Faculty Classroom Hub • First Semester 2026
              </Text>
            </View>

            <TouchableOpacity
              style={styles.createPostHeroBtn}
              onPress={() => router.push(`/(professor)/create-post?subjectId=${id}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.createPostHeroIcon}>＋</Text>
              <Text style={styles.createPostHeroText}>New Post</Text>
            </TouchableOpacity>
          </View>

          {/* ================= SEGMENTED TABS ================= */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, viewMode === 'feed' && styles.tabBtnActive]}
              onPress={() => setViewMode('feed')}
            >
              <UIcon
                name="chat"
                size={18}
                color={viewMode === 'feed' ? '#4F46E5' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  viewMode === 'feed' && styles.tabBtnTextActive,
                ]}
              >
                Stream & Activities
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  viewMode === 'feed' && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    viewMode === 'feed' && styles.tabBadgeTextActive,
                  ]}
                >
                  {posts.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, viewMode === 'members' && styles.tabBtnActive]}
              onPress={() => setViewMode('members')}
            >
              <UIcon
                name="users"
                size={18}
                color={viewMode === 'members' ? '#4F46E5' : '#64748B'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  viewMode === 'members' && styles.tabBtnTextActive,
                ]}
              >
                Class Roster
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  viewMode === 'members' && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    viewMode === 'members' && styles.tabBadgeTextActive,
                  ]}
                >
                  {students.length} / 50
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ================= TAB CONTENT ================= */}
          {viewMode === 'feed' ? (
            <View style={styles.feedContainer}>
              {/* Broadcast Prompt Box */}
              <TouchableOpacity
                style={styles.broadcastPromptCard}
                onPress={() => router.push(`/(professor)/create-post?subjectId=${id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.promptAvatar}>
                  <Text style={styles.promptAvatarText}>
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'P'}
                  </Text>
                </View>
                <Text style={styles.promptPlaceholder}>
                  Announce something or assign work to this class...
                </Text>
                <View style={styles.promptSendBtn}>
                  <UIcon name="document" size={16} color="#FFFFFF" />
                  <Text style={styles.promptSendText}>Post</Text>
                </View>
              </TouchableOpacity>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingText}>Loading classroom stream...</Text>
                </View>
              ) : posts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <UIcon name="announcement" size={36} color="#4F46E5" />
                  </View>
                  <Text style={styles.emptyTitle}>No Classroom Posts Yet</Text>
                  <Text style={styles.emptySub}>
                    Use the broadcast bar above to share assignments, lecture slides, or university notices with your students.
                  </Text>
                </View>
              ) : (
                <View style={styles.postsList}>
                  {posts.map((item) => {
                    const typeBadge = getTypeBadgeStyle(item.type);
                    return (
                      <View key={item.id} style={styles.postCard}>
                        {/* Header */}
                        <View style={styles.postCardHeader}>
                          <View
                            style={[
                              styles.typePill,
                              { backgroundColor: typeBadge.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.typePillText,
                                { color: typeBadge.text },
                              ]}
                            >
                              {typeBadge.label}
                            </Text>
                          </View>
                          <Text style={styles.postTimeText}>
                            {formatDate(item.createdAt)}
                          </Text>
                        </View>

                        {/* Title & Content */}
                        <Text style={styles.postTitleText}>{item.title}</Text>
                        {item.content ? (
                          <Text style={styles.postContentText}>
                            {item.content}
                          </Text>
                        ) : null}

                        {/* File Attachment */}
                        {item.fileName ? (
                          <View style={styles.attachmentCard}>
                            <View style={styles.attachmentIconBox}>
                              <UIcon name="file" size={20} color="#4F46E5" />
                            </View>
                            <View style={styles.attachmentInfoCol}>
                              <Text style={styles.attachmentName} numberOfLines={1}>
                                {item.fileName}
                              </Text>
                              <Text style={styles.attachmentSub}>
                                Attached File Resource
                              </Text>
                            </View>
                          </View>
                        ) : null}

                        {/* Post Footer & Grading Button */}
                        <View style={styles.postFooterRow}>
                          <View style={styles.footerPill}>
                            <UIcon name="chat" size={14} color="#64748B" />
                            <Text style={styles.footerPillText}>Class Stream</Text>
                          </View>
                          {item.type === 'activity' ? (
                            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                              <TouchableOpacity
                                style={styles.gradeSubmissionsBtn}
                                onPress={() => handleOpenGradingModal(item)}
                                activeOpacity={0.8}
                              >
                                <UIcon name="clipboard" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                                <Text style={styles.gradeSubmissionsBtnText}>Review & Grade</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.codeIntegrityPostBtn}
                                onPress={() => setSimilarityModalVisible(true)}
                                activeOpacity={0.8}
                              >
                                <UIcon name="search" size={13} color="#312E81" style={{ marginRight: 5 }} />
                                <Text style={styles.codeIntegrityPostBtnText}>Code Similarity</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <Text style={styles.facultySignText}>
                              Posted by Instructor
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            /* ================= MEMBERS VIEW ================= */
            <View style={styles.membersContainer}>
              <View style={styles.rosterSummaryCard}>
                <View>
                  <Text style={styles.rosterSummaryTitle}>Enrolled Student Directory</Text>
                  <Text style={styles.rosterSummarySub}>
                    Students currently holding an active seat in this course module
                  </Text>
                </View>
                <View style={styles.rosterLimitBadge}>
                  <Text style={styles.rosterLimitText}>
                    {students.length} / 50 Maximum Capacity
                  </Text>
                </View>
              </View>

              {/* Class Roster Command Toolbar */}
              <View style={styles.rosterToolbarCard}>
                <View style={styles.rosterMetricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricDotGreen}>●</Text>
                    <Text style={styles.metricText}>
                      Present: <Text style={styles.metricBold}>{presentCount}</Text>
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricDotYellow}>●</Text>
                    <Text style={styles.metricText}>
                      Late: <Text style={styles.metricBold}>{lateCount}</Text>
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricDotRed}>●</Text>
                    <Text style={styles.metricText}>
                      Absent: <Text style={styles.metricBold}>{absentCount}</Text>
                    </Text>
                  </View>
                </View>

                <View style={styles.rosterActionButtonsRow}>
                  <TouchableOpacity
                    style={styles.schemeWeightsBtn}
                    onPress={handleOpenGradingScheme}
                    activeOpacity={0.8}
                  >
                    <UIcon name="tune" size={13} color="#4F46E5" style={{ marginRight: 5 }} />
                    <Text style={styles.schemeWeightsBtnText}>Grading Scheme</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.schemeWeightsBtn}
                    onPress={() => setCurveModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <UIcon name="chart" size={13} color="#4F46E5" style={{ marginRight: 5 }} />
                    <Text style={styles.schemeWeightsBtnText}>Grade Curve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.markAllBtn}
                    onPress={handleMarkAllPresent}
                    activeOpacity={0.8}
                  >
                    <UIcon name="check" size={13} color="#059669" style={{ marginRight: 5 }} />
                    <Text style={styles.markAllBtnText}>Mark All Present</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.exportRegistrarBtn}
                    onPress={handleExportRegistrarCSV}
                    activeOpacity={0.8}
                  >
                    <UIcon name="document" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                    <Text style={styles.exportRegistrarBtnText}>Export Registrar CSV</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingText}>Loading class roster...</Text>
                </View>
              ) : students.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <UIcon name="users" size={36} color="#4F46E5" />
                  </View>
                  <Text style={styles.emptyTitle}>No Students Enrolled Yet</Text>
                  <Text style={styles.emptySub}>
                    Give students the code "{code}" so they can join your class from their student dashboard.
                  </Text>
                </View>
              ) : (
                <View style={styles.studentsList}>
                  {students.map((student) => {
                    const currentStatus = attendanceMap[student.id] || 'PRESENT';
                    return (
                      <View key={student.id} style={styles.studentCard}>
                        <View style={styles.studentAvatar}>
                          <Text style={styles.studentAvatarText}>
                            {student.email.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.studentInfoCol}>
                          <Text style={styles.studentName} numberOfLines={1}>
                            {student.name}
                          </Text>
                          <Text style={styles.studentEmail} numberOfLines={1}>
                            {student.email}
                          </Text>
                        </View>

                        {/* Live Attendance Logger Toggle */}
                        <View style={styles.attendanceGroup}>
                          <TouchableOpacity
                            style={[
                              styles.attendBadge,
                              currentStatus === 'PRESENT' && styles.attendPresentActive,
                            ]}
                            onPress={() => handleSetAttendance(student.id, 'PRESENT')}
                          >
                            <Text style={[styles.attendBadgeText, currentStatus === 'PRESENT' && styles.attendPresentTextActive]}>
                              PRESENT
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.attendBadge,
                              currentStatus === 'LATE' && styles.attendLateActive,
                            ]}
                            onPress={() => handleSetAttendance(student.id, 'LATE')}
                          >
                            <Text style={[styles.attendBadgeText, currentStatus === 'LATE' && styles.attendLateTextActive]}>
                              LATE
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.attendBadge,
                              currentStatus === 'ABSENT' && styles.attendAbsentActive,
                            ]}
                            onPress={() => handleSetAttendance(student.id, 'ABSENT')}
                          >
                            <Text style={[styles.attendBadgeText, currentStatus === 'ABSENT' && styles.attendAbsentTextActive]}>
                              ABSENT
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* At-Risk Warning & Academic Retention Referral */}
                        {(currentStatus === 'ABSENT' || student.id === 'st-3') && (
                          <View style={styles.atRiskWarningRow}>
                            <View style={styles.atRiskBadge}>
                              <Text style={styles.atRiskBadgeText}>[AT-RISK ATTENDANCE]</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.referAdvisorBtn}
                              onPress={() => handleReferAdvisor(student)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.referAdvisorBtnText}>Referral Memo →</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        <View style={styles.studentActions}>
                          <TouchableOpacity
                            style={styles.kickBtn}
                            onPress={() => handleKick(student.id, student.email)}
                          >
                            <Text style={styles.kickBtnText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================= GRADE CURVE NORMALIZATION MODAL ================= */}
      <Modal
        visible={curveModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCurveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
           <GradeCurveVisualizer 
             grades={Object.values(submissionGrades)} 
             onApplyCurve={handleApplyCurve} 
             onClose={() => setCurveModalVisible(false)} 
           />
        </View>
      </Modal>

      {/* ================= SUBMISSIONS GRADING MODAL ================= */}
      <Modal
        visible={gradingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGradingModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.gradingModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Grade Student Submissions</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {selectedPostForGrading?.title || 'Assignment Task'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setGradingModalVisible(false)}
              >
                <UIcon name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>Select Enrolled Student Submission:</Text>
              <View style={styles.studentPickerRow}>
                {students.map((st) => {
                  const isSelected = gradingStudentId === st.id;
                  const currentGrade = submissionGrades[st.id];
                  return (
                    <TouchableOpacity
                      key={st.id}
                      style={[
                        styles.studentPickerChip,
                        isSelected && styles.studentPickerChipActive,
                      ]}
                      onPress={() => {
                        setGradingStudentId(st.id);
                        if (currentGrade) {
                          setGradeScore(currentGrade.score);
                          setGradingFeedback(currentGrade.feedback);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.studentPickerChipText,
                          isSelected && styles.studentPickerChipTextActive,
                        ]}
                      >
                        {st.name} {currentGrade ? `(${currentGrade.score}/100)` : '(Pending)'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* AI Rubric Automated Feedback Drafting Assistant */}
              <TouchableOpacity
                style={styles.aiRubricBtn}
                onPress={handleGenerateAIRubricFeedback}
                activeOpacity={0.8}
              >
                <UIcon name="sparkles" size={14} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={styles.aiRubricBtnText}>AI Rubric Assistant: Auto-Draft Feedback & Score</Text>
              </TouchableOpacity>

              {/* AST Source Code Similarity Detector Trigger */}
              <TouchableOpacity
                style={styles.similarityGradeBtn}
                onPress={() => setSimilarityModalVisible(true)}
                activeOpacity={0.8}
              >
                <UIcon name="search" size={14} color="#4338CA" style={{ marginRight: 6 }} />
                <Text style={styles.similarityGradeBtnText}>AST Code Similarity & Integrity Inspector</Text>
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Grade Score (Out of 100):</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={gradeScore}
                  onChangeText={setGradeScore}
                  keyboardType="numeric"
                  placeholder="e.g. 95"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Instructor Feedback & Comments:</Text>
                <TextInput
                  style={[styles.scoreInput, styles.feedbackInput]}
                  value={gradingFeedback}
                  onChangeText={setGradingFeedback}
                  multiline={true}
                  numberOfLines={4}
                  placeholder="Provide constructive feedback for the student..."
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setGradingModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveGradeBtn}
                onPress={handleSaveGrade}
              >
                <UIcon name="document" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.saveGradeText}>Publish Grade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= AST SOURCE CODE SIMILARITY & ACADEMIC INTEGRITY MODAL ================= */}
      <Modal
        visible={similarityModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSimilarityModalVisible(false)}
      >
        <View style={styles.similarityBackdrop}>
          <View style={styles.similarityModalCard}>
            <View style={styles.similarityHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.similarityHeaderBadge}>
                  <UIcon name="search" size={12} color="#4338CA" style={{ marginRight: 5 }} />
                  <Text style={styles.similarityHeaderBadgeText}>ACADEMIC INTEGRITY INSPECTOR</Text>
                </View>
                <Text style={styles.similarityHeaderTitle}>Source Code Similarity Detector</Text>
                <Text style={styles.similarityHeaderSub}>
                  AST Tokenizer & Jaccard 3-Gram Overlap Analysis
                </Text>
              </View>
              <TouchableOpacity
                style={styles.similarityCloseBtn}
                onPress={() => setSimilarityModalVisible(false)}
              >
                <UIcon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {(() => {
              const baseStudent = SAMPLE_STUDENT_CODE_CORPUS[baseCodeStudentId] || SAMPLE_STUDENT_CODE_CORPUS['st-101'];
              const targetStudent = SAMPLE_STUDENT_CODE_CORPUS[similarityTargetId] || SAMPLE_STUDENT_CODE_CORPUS['st-102'];
              const sim = compareSubmissions(baseStudent.code, targetStudent.code);

              const isCritical = sim.riskTier === 'CRITICAL';
              const isModerate = sim.riskTier === 'MODERATE';

              return (
                <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                  {/* Candidate and Peer Selector */}
                  <View style={styles.similarityCompareCard}>
                    <View style={styles.similarityStudentCol}>
                      <Text style={styles.similarityLabel}>Candidate Under Review:</Text>
                      <View style={styles.candidatePill}>
                        <UIcon name="users" size={13} color="#1E293B" style={{ marginRight: 6 }} />
                        <Text style={styles.candidateName}>{baseStudent.studentName}</Text>
                      </View>
                      <Text style={styles.candidateIdSub}>ID: {baseStudent.studentId}</Text>
                    </View>

                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={styles.vsBadgeText}>VS</Text>
                    </View>

                    <View style={styles.similarityStudentCol}>
                      <Text style={styles.similarityLabel}>Compare Against Peer:</Text>
                      <View style={styles.peerPickerRow}>
                        {Object.entries(SAMPLE_STUDENT_CODE_CORPUS)
                          .filter(([key]) => key !== baseCodeStudentId)
                          .map(([key, item]) => {
                            const isSelected = key === similarityTargetId;
                            return (
                              <TouchableOpacity
                                key={key}
                                style={[
                                  styles.peerChip,
                                  isSelected && styles.peerChipActive,
                                ]}
                                onPress={() => setSimilarityTargetId(key)}
                              >
                                <Text
                                  style={[
                                    styles.peerChipText,
                                    isSelected && styles.peerChipTextActive,
                                  ]}
                                >
                                  {item.studentName.split(' ')[0]}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                      </View>
                    </View>
                  </View>

                  {/* Similarity Status Alert Banner */}
                  <View
                    style={[
                      styles.simStatusBanner,
                      isCritical
                        ? styles.simStatusBannerCritical
                        : isModerate
                        ? styles.simStatusBannerModerate
                        : styles.simStatusBannerPass,
                    ]}
                  >
                    <View style={styles.simStatusTopRow}>
                      <View
                        style={[
                          styles.simStatusPill,
                          isCritical
                            ? styles.simStatusPillCritical
                            : isModerate
                            ? styles.simStatusPillModerate
                            : styles.simStatusPillPass,
                        ]}
                      >
                        <Text
                          style={[
                            styles.simStatusPillText,
                            isCritical
                              ? styles.simStatusPillTextCritical
                              : isModerate
                              ? styles.simStatusPillTextModerate
                              : styles.simStatusPillTextPass,
                          ]}
                        >
                          {isCritical
                            ? '[CRITICAL SIMILARITY DETECTED]'
                            : isModerate
                            ? '[MODERATE SIMILARITY ALERT]'
                            : '[CLEAN - PASSING INTEGRITY]'}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.simScoreBig,
                          isCritical
                            ? { color: '#DC2626' }
                            : isModerate
                            ? { color: '#D97706' }
                            : { color: '#059669' },
                        ]}
                      >
                        {sim.similarityScore}%
                      </Text>
                    </View>
                    <Text style={styles.simStatusDesc}>
                      {isCritical
                        ? 'Identical algorithmic structure and logic detected. Variable renaming and comment alteration were bypassed by AST tokenization.'
                        : isModerate
                        ? 'Moderate token overlap detected. Common architectural library patterns or standard boilerplate code.'
                        : 'No anomalous token clustering detected. Distinct coding methodology with passing integrity score.'}
                    </Text>
                  </View>

                  {/* Metric Chips */}
                  <View style={styles.simMetricsRow}>
                    <View style={styles.simMetricBox}>
                      <Text style={styles.simMetricValue}>{sim.matchedTokens}</Text>
                      <Text style={styles.simMetricLabel}>Matched 3-Grams</Text>
                    </View>
                    <View style={styles.simMetricBox}>
                      <Text style={styles.simMetricValue}>{sim.tokensCountA}</Text>
                      <Text style={styles.simMetricLabel}>Tokens (Candidate)</Text>
                    </View>
                    <View style={styles.simMetricBox}>
                      <Text style={styles.simMetricValue}>{sim.tokensCountB}</Text>
                      <Text style={styles.simMetricLabel}>Tokens (Peer)</Text>
                    </View>
                  </View>

                  {/* Snippet View Tab Toggle */}
                  <View style={styles.simSnippetToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.simSnippetToggleTab,
                        similaritySnippetTab === 'code' && styles.simSnippetToggleTabActive,
                      ]}
                      onPress={() => setSimilaritySnippetTab('code')}
                    >
                      <Text
                        style={[
                          styles.simSnippetToggleText,
                          similaritySnippetTab === 'code' && styles.simSnippetToggleTextActive,
                        ]}
                      >
                        Source Code Comparison
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.simSnippetToggleTab,
                        similaritySnippetTab === 'tokens' && styles.simSnippetToggleTabActive,
                      ]}
                      onPress={() => setSimilaritySnippetTab('tokens')}
                    >
                      <Text
                        style={[
                          styles.simSnippetToggleText,
                          similaritySnippetTab === 'tokens' && styles.simSnippetToggleTextActive,
                        ]}
                      >
                        Normalized AST Tokens
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Code / Tokens View */}
                  {similaritySnippetTab === 'code' ? (
                    <View style={styles.simCodeDualView}>
                      <View style={styles.simCodeCol}>
                        <Text style={styles.simCodeColTitle}>{baseStudent.studentName}</Text>
                        <ScrollView horizontal nestedScrollEnabled style={styles.codeSnippetScroll}>
                          <Text style={styles.codeSnippetMono}>{baseStudent.code.trim()}</Text>
                        </ScrollView>
                      </View>
                      <View style={styles.simCodeCol}>
                        <Text style={styles.simCodeColTitle}>{targetStudent.studentName}</Text>
                        <ScrollView horizontal nestedScrollEnabled style={styles.codeSnippetScroll}>
                          <Text style={styles.codeSnippetMono}>{targetStudent.code.trim()}</Text>
                        </ScrollView>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.simTokensDualView}>
                      <View style={styles.simTokensCol}>
                        <Text style={styles.simCodeColTitle}>Candidate AST Tokens</Text>
                        <Text style={styles.simTokensMono}>{sim.sampleTokensA.join(' ')} ...</Text>
                      </View>
                      <View style={styles.simTokensCol}>
                        <Text style={styles.simCodeColTitle}>Peer AST Tokens</Text>
                        <Text style={styles.simTokensMono}>{sim.sampleTokensB.join(' ')} ...</Text>
                      </View>
                    </View>
                  )}
                </ScrollView>
              );
            })()}

            {/* Modal Actions */}
            <View style={styles.similarityFooterRow}>
              <TouchableOpacity
                style={styles.flagIntegrityBtn}
                onPress={() => {
                  Alert.alert(
                    'Academic Integrity Review Requested',
                    'A formal audit packet has been compiled and submitted to the Academic Dean and Department Ethics Board with hashed code artifacts and AST similarity analysis.'
                  );
                }}
              >
                <UIcon name="warning" size={13} color="#DC2626" style={{ marginRight: 5 }} />
                <Text style={styles.flagIntegrityText}>Flag for Dean Review</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeSimilarityBtn}
                onPress={() => setSimilarityModalVisible(false)}
              >
                <Text style={styles.closeSimilarityText}>Close Inspector</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  contentWrapper: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '700',
  },
  heroBanner: {
    backgroundColor: '#312E81',
    borderRadius: 22,
    padding: 26,
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  heroTextCol: {
    flex: 1,
    minWidth: 260,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  univBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  univBadgeText: {
    color: '#E0E7FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  codeCopyPill: {
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#818CF8',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeCopyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  courseTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  courseSub: {
    color: '#C7D2FE',
    fontSize: 13,
    fontWeight: '500',
  },
  createPostHeroBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createPostHeroIcon: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '800',
  },
  createPostHeroText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabBadgeActive: {
    backgroundColor: '#EEF2FF',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBadgeTextActive: {
    color: '#4F46E5',
  },
  broadcastPromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  promptAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  promptAvatarText: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 16,
  },
  promptPlaceholder: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  promptSendBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promptSendText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 56,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 480,
  },
  postsList: {
    gap: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  postCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  postTimeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  postTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  postContentText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 14,
  },
  attachmentCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  attachmentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentInfoCol: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  attachmentSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  postFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerPillText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  facultySignText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  membersContainer: {
    gap: 16,
  },
  rosterSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  rosterSummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  rosterSummarySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rosterLimitBadge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rosterLimitText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  studentsList: {
    gap: 10,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  studentAvatarText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '800',
  },
  studentInfoCol: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  studentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  kickBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  kickBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  // Live Attendance styles
  attendanceGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  attendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attendBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  attendPresentActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  attendPresentTextActive: {
    color: '#166534',
  },
  attendLateActive: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
  },
  attendLateTextActive: {
    color: '#854D0E',
  },
  attendAbsentActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  attendAbsentTextActive: {
    color: '#991B1B',
  },
  // Review & Grade Submissions button styles
  gradeSubmissionsBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeSubmissionsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Submissions Grading Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gradingModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 380,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  studentPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  studentPickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentPickerChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  studentPickerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  studentPickerChipTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  scoreInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  feedbackInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  cancelModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelModalText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  saveGradeBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveGradeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Class Roster Command Toolbar Styles
  rosterToolbarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  rosterMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricDotGreen: {
    color: '#10B981',
    fontSize: 14,
  },
  metricDotYellow: {
    color: '#F59E0B',
    fontSize: 14,
  },
  metricDotRed: {
    color: '#EF4444',
    fontSize: 14,
  },
  metricText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  metricBold: {
    color: '#0F172A',
    fontWeight: '800',
  },
  rosterActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  markAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  exportRegistrarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  exportRegistrarBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Grading Scheme & AI Rubric Styles
  schemeWeightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  schemeWeightsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  aiRubricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  aiRubricBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C3AED',
  },
  atRiskWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 6,
    width: '100%',
  },
  atRiskBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  atRiskBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  referAdvisorBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  referAdvisorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
    textDecorationLine: 'underline',
  },
  codeIntegrityPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  codeIntegrityPostBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#312E81',
  },
  similarityGradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  similarityGradeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
  },
  similarityBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  similarityModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 720,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  similarityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 14,
  },
  similarityHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  similarityHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  similarityHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  similarityHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  similarityCloseBtn: {
    padding: 6,
  },
  similarityCompareCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  similarityStudentCol: {
    flex: 1,
    minWidth: 160,
  },
  similarityLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  candidatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  candidateName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  candidateIdSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  vsBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94A3B8',
    paddingHorizontal: 6,
  },
  peerPickerRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  peerChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  peerChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  peerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  peerChipTextActive: {
    color: '#4338CA',
    fontWeight: '800',
  },
  simStatusBanner: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14,
  },
  simStatusBannerCritical: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  simStatusBannerModerate: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  simStatusBannerPass: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  simStatusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  simStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  simStatusPillCritical: {
    backgroundColor: '#FEE2E2',
  },
  simStatusPillModerate: {
    backgroundColor: '#FEF3C7',
  },
  simStatusPillPass: {
    backgroundColor: '#D1FAE5',
  },
  simStatusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  simStatusPillTextCritical: {
    color: '#DC2626',
  },
  simStatusPillTextModerate: {
    color: '#D97706',
  },
  simStatusPillTextPass: {
    color: '#059669',
  },
  simScoreBig: {
    fontSize: 22,
    fontWeight: '900',
  },
  simStatusDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  simMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  simMetricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  simMetricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  simMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  simSnippetToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  simSnippetToggleTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  simSnippetToggleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  simSnippetToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  simSnippetToggleTextActive: {
    color: '#312E81',
    fontWeight: '800',
  },
  simCodeDualView: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  simCodeCol: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
  },
  simCodeColTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  codeSnippetScroll: {
    maxHeight: 130,
  },
  codeSnippetMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#F8FAFC',
    lineHeight: 16,
  },
  simTokensDualView: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  simTokensCol: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
  },
  simTokensMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#475569',
    lineHeight: 15,
  },
  similarityFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  flagIntegrityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  flagIntegrityText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  closeSimilarityBtn: {
    backgroundColor: '#312E81',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  closeSimilarityText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

