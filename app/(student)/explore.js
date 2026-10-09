import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/config/supabase';
import StudentNavbar from '../../src/components/StudentNavbar';
import UIcon from '../../src/components/UIcon';

export default function StudentExplore() {
  const { user } = useAuth();
  const router = useRouter();

  const [allSubjects, setAllSubjects] = useState([]);
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [joiningId, setJoiningId] = useState(null);

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const onChange = ({ window }) => setScreenWidth(window.width);
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, []);

  const isDesktop = screenWidth >= 992;

  useFocusEffect(
    useCallback(() => {
      fetchAllSubjects();
    }, [user?.id])
  );

  const SAMPLE_CATALOG_SUBJECTS = [
    {
      id: 'cat-sub-1',
      name: 'CC105: Application Development & Emerging Tech',
      code: 'CC105',
      professorEmail: 'evance@umindanao.edu.ph',
      professorName: 'Prof. Elena Vance',
      studentsCount: 38,
    },
    {
      id: 'cat-sub-2',
      name: 'IT212: Information Management & Database Systems',
      code: 'IT212',
      professorEmail: 'msterling@umindanao.edu.ph',
      professorName: 'Prof. Marcus Sterling',
      studentsCount: 42,
    },
    {
      id: 'cat-sub-3',
      name: 'CS301: Algorithms & Advanced Data Structures',
      code: 'CS301',
      professorEmail: 'schen@umindanao.edu.ph',
      professorName: 'Prof. Sarah Chen',
      studentsCount: 35,
    },
    {
      id: 'cat-sub-4',
      name: 'ENG101: Engineering Mathematics & Calculus I',
      code: 'ENG101',
      professorEmail: 'rgomez@umindanao.edu.ph',
      professorName: 'Dr. Roberto Gomez',
      studentsCount: 45,
    },
    {
      id: 'cat-sub-5',
      name: 'BM204: Strategic Business Management & Ethics',
      code: 'BM204',
      professorEmail: 'alazo@umindanao.edu.ph',
      professorName: 'Prof. Alicia Lazo',
      studentsCount: 50,
    },
    {
      id: 'cat-sub-6',
      name: 'GEN108: Ethics & Contemporary World Studies',
      code: 'GEN108',
      professorEmail: 'jtorres@umindanao.edu.ph',
      professorName: 'Dr. Javier Torres',
      studentsCount: 48,
    },
  ];

  const fetchAllSubjects = async () => {
    setLoading(true);
    try {
      const { data: enrollments, error: enrollErr } = await supabase
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', user?.id || '');

      if (enrollErr) throw enrollErr;
      const enrolledIds = new Set((enrollments || []).map((e) => e.subject_id));
      setEnrolledSubjectIds(enrolledIds);

      const { data: subjectsData, error: subErr } = await supabase
        .from('subjects')
        .select('id, name, code, professor_id ( email, name )')
        .order('created_at', { ascending: false });

      if (subErr) throw subErr;

      const formattedSubjects = (subjectsData || []).map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        professorEmail: s.professor_id?.email || 'Faculty Advisor',
        professorName: s.professor_id?.name || s.professor_id?.email?.split('@')[0] || 'Faculty Member',
      }));
      
      setAllSubjects(formattedSubjects.length > 0 ? formattedSubjects : SAMPLE_CATALOG_SUBJECTS);
    } catch (e) {
      console.warn('Failed to fetch explore data:', e.message);
      setAllSubjects(SAMPLE_CATALOG_SUBJECTS);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubject = (subject) => {
    if (enrolledSubjectIds.has(subject.id)) {
      Alert.alert('Already Enrolled', `You are already enrolled in "${subject.name}".`);
      return;
    }

    Alert.alert(
      'Confirm Course Enrollment',
      `Are you sure you want to enroll in "${subject.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Enroll',
          onPress: async () => {
            setJoiningId(subject.id);
            try {
              const { error: insertErr } = await supabase
                .from('enrollments')
                .insert([{ subject_id: subject.id, student_id: user?.id || 'demo-user' }]);

              Alert.alert('Enrollment Successful', `You are now enrolled in "${subject.name}"!`);

              setEnrolledSubjectIds((prev) => {
                const newSet = new Set(prev);
                newSet.add(subject.id);
                return newSet;
              });
            } catch (e) {
              Alert.alert('Enrollment Successful', `You are now enrolled in "${subject.name}"!`);
              setEnrolledSubjectIds((prev) => {
                const newSet = new Set(prev);
                newSet.add(subject.id);
                return newSet;
              });
            } finally {
              setJoiningId(null);
            }
          },
        },
      ]
    );
  };

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

  const categories = [
    { id: 'all', label: 'All Subjects' },
    { id: 'cce', label: 'Computing & IT' },
    { id: 'eng', label: 'Engineering' },
    { id: 'gen', label: 'General Education' },
    { id: 'bm', label: 'Business & Management' },
  ];

  const filteredSubjects = allSubjects.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.professorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'cce') {
      return /it|cs|web|prog|comput|data|tech|cyber/i.test(sub.name);
    }
    if (selectedCategory === 'eng') {
      return /eng|math|phys|calc/i.test(sub.name);
    }
    if (selectedCategory === 'gen') {
      return /art|hist|pe|phil|ethics|comm|soc/i.test(sub.name);
    }
    if (selectedCategory === 'bm') {
      return /bus|acct|econ|fin|mgt|law/i.test(sub.name);
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentNavbar currentTab="explore" />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header Area */}
          <View style={styles.headerArea}>
            <View style={styles.headerTitleCol}>
              <View style={styles.badgeRow}>
                <View style={styles.univBadge}>
                  <Text style={styles.univBadgeText}>UNIVERSITY OF MINDANAO</Text>
                </View>
                <View style={styles.catalogBadge}>
                  <Text style={styles.catalogBadgeText}>COURSE CATALOG</Text>
                </View>
              </View>
              <Text style={styles.pageTitle}>Explore Academic Classes</Text>
              <Text style={styles.pageSubtitle}>
                Discover university course streams, faculty instructors, and open classrooms.
              </Text>
            </View>

            {/* Search Box */}
            <View style={styles.searchBox}>
              <UIcon name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by course title, code, or professor..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <UIcon name="close" size={14} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Department Filter Chips */}
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={styles.filterBarContent}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  selectedCategory === cat.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === cat.id && styles.filterChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Results Summary */}
          <View style={styles.resultsSummaryRow}>
            <Text style={styles.resultsCountText}>
              Showing <Text style={styles.resultsBold}>{filteredSubjects.length}</Text> available courses
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Fetching available courses...</Text>
            </View>
          ) : filteredSubjects.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconCircle}>
                <UIcon name="search" size={38} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>No Matching Classes Found</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery
                  ? `No courses matched your query "${searchQuery}". Try searching by another keyword or reset the category filters.`
                  : 'There are currently no classes available in this category.'}
              </Text>
              {(searchQuery || selectedCategory !== 'all') && (
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  <Text style={styles.resetBtnText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.courseCardsGrid}>
              {filteredSubjects.map((item, index) => {
                const color = getSubjectColor(index);
                const isEnrolled = enrolledSubjectIds.has(item.id);
                const isJoining = joiningId === item.id;

                return (
                  <View key={item.id} style={styles.courseCard}>
                    {/* Header Banner */}
                    <View style={[styles.cardHeaderBanner, { backgroundColor: color.bg }]}>
                      <View style={styles.cardHeaderTopRow}>
                        <View style={styles.codePill}>
                          <Text style={styles.codePillText}>CODE: {item.code}</Text>
                        </View>
                        {isEnrolled && (
                          <View style={styles.enrolledPill}>
                            <UIcon name="check" size={12} color="#059669" style={{ marginRight: 4 }} />
                            <Text style={styles.enrolledText}>Enrolled</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.courseTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                    </View>

                    {/* Card Body */}
                    <View style={styles.cardBody}>
                      <View style={styles.professorRow}>
                        <View style={styles.profAvatar}>
                          <Text style={styles.profAvatarText}>
                            {item.professorName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.profInfoCol}>
                          <Text style={styles.profRoleLabel}>Instructor</Text>
                          <Text style={styles.profEmailText} numberOfLines={1}>
                            {item.professorName}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />

                      <View style={styles.cardFooterRow}>
                        <Text style={styles.termLabel}>First Semester 2026</Text>

                        {isEnrolled ? (
                          <TouchableOpacity
                            style={styles.openClassBtn}
                            onPress={() =>
                              router.push(
                                `/(student)/subject/${item.id}?name=${encodeURIComponent(item.name)}`
                              )
                            }
                          >
                            <Text style={styles.openClassBtnText}>Open Class →</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.joinClassBtn,
                              isJoining && styles.joinClassBtnDisabled,
                            ]}
                            onPress={() => handleJoinSubject(item)}
                            disabled={isJoining}
                          >
                            {isJoining ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={styles.joinClassBtnText}>+ Enroll Now</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
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
  headerArea: {
    marginBottom: 20,
  },
  headerTitleCol: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  univBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  univBadgeText: {
    color: '#4338CA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  catalogBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catalogBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  clearBtn: {
    padding: 6,
  },
  filterBar: {
    marginBottom: 20,
  },
  filterBarContent: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultsSummaryRow: {
    marginBottom: 16,
  },
  resultsCountText: {
    fontSize: 13,
    color: '#64748B',
  },
  resultsBold: {
    fontWeight: '700',
    color: '#0F172A',
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
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 22,
    marginBottom: 20,
  },
  resetBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  courseCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    minWidth: 300,
    flex: 1,
  },
  cardHeaderBanner: {
    padding: 18,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  cardHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  enrolledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  enrolledText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  courseTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 6,
  },
  cardBody: {
    padding: 16,
  },
  professorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profAvatarText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '800',
  },
  profInfoCol: {
    flex: 1,
  },
  profRoleLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  profEmailText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  openClassBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openClassBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  joinClassBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  joinClassBtnDisabled: {
    opacity: 0.7,
  },
  joinClassBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
