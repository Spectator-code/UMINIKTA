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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/config/supabase';
import StudentNavbar from '../../src/components/StudentNavbar';
import UIcon from '../../src/components/UIcon';

export default function StudentExplore() {
  const { user, addNotification } = useAuth();
  const router = useRouter();

  const [allSubjects, setAllSubjects] = useState([]);
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningId, setJoiningId] = useState(null);

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

  const isDesktop = screenWidth >= 992;

  useFocusEffect(
    useCallback(() => {
      fetchAllSubjects();
    }, [user?.uid])
  );

  const fetchAllSubjects = async () => {
    setLoading(true);
    try {
      // 1. Fetch user's enrollments
      const { data: enrollments, error: enrollErr } = await supabase
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', user.id);
      
      if (enrollErr) throw enrollErr;
      const enrolledIds = new Set(enrollments.map(e => e.subject_id));
      setEnrolledSubjectIds(enrolledIds);

      // 2. Fetch ALL subjects
      const { data: subjectsData, error: subErr } = await supabase
        .from('subjects')
        .select('id, name, code, professor_id ( email, name )')
        .order('created_at', { ascending: false });
        
      if (subErr) throw subErr;
      
      const formattedSubjects = subjectsData.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        professorEmail: s.professor_id?.email || 'Unknown',
        professorName: s.professor_id?.name || s.professor_id?.email || 'Unknown',
      }));
      setAllSubjects(formattedSubjects);
    } catch (e) {
      console.warn('Failed to fetch explore data:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubject = async (subject) => {
    if (enrolledSubjectIds.has(subject.id)) {
      Alert.alert('Already Enrolled', `You are already enrolled in "${subject.name}".`);
      return;
    }

    setJoiningId(subject.id);
    try {
      const { error: insertErr } = await supabase
        .from('enrollments')
        .insert([{ subject_id: subject.id, student_id: user.id }]);

      if (insertErr) throw insertErr;

      Alert.alert('Enrollment Successful', `You are now enrolled in "${subject.name}"!`);
      
      // Update local state instead of full refetch for speed
      setEnrolledSubjectIds(prev => {
        const newSet = new Set(prev);
        newSet.add(subject.id);
        return newSet;
      });

    } catch (e) {
      Alert.alert('Error', 'Could not join class. Please try again.');
    } finally {
      setJoiningId(null);
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

  const filteredSubjects = allSubjects.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.professorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentNavbar currentTab="explore" />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.headerArea}>
            <View>
              <Text style={styles.pageTitle}>Explore Classes</Text>
              <Text style={styles.pageSubtitle}>Browse all available classes across the university.</Text>
            </View>
            <View style={styles.searchBox}>
              <UIcon name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, code, or professor..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Loading all classes...</Text>
            </View>
          ) : filteredSubjects.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconCircle}>
                <UIcon name="search" size={38} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>No Classes Found</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery ? "We couldn't find any classes matching your search." : "There are currently no classes available to join."}
              </Text>
            </View>
          ) : (
            <View style={styles.courseCardsGrid}>
              {filteredSubjects.map((item, index) => {
                const color = getSubjectColor(index);
                const isEnrolled = enrolledSubjectIds.has(item.id);
                const isJoining = joiningId === item.id;

                return (
                  <View key={item.id} style={styles.courseCard}>
                    <View style={[styles.cardHeaderBanner, { backgroundColor: color.bg }]}>
                      <View style={styles.cardHeaderTopRow}>
                        <View style={styles.codePill}>
                          <Text style={styles.codePillText}>{item.code}</Text>
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
                        {isEnrolled ? (
                          <TouchableOpacity
                            style={styles.openClassBtn}
                            onPress={() => router.push(`/(student)/subject/${item.id}?name=${encodeURIComponent(item.name)}`)}
                          >
                            <Text style={styles.openClassBtnText}>Open Class</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.joinClassBtn, isJoining && styles.joinClassBtnDisabled]}
                            onPress={() => handleJoinSubject(item)}
                            disabled={isJoining}
                          >
                            {isJoining ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={styles.joinClassBtnText}>+ Join Class</Text>
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
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    flex: 1,
    minWidth: 250,
    maxWidth: 400,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
    outlineStyle: 'none',
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
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
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
    color: '#111827',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 18,
    marginBottom: 20,
  },
  courseCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  courseCard: {
    width: '100%',
    maxWidth: 380,
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
    flexGrow: 1,
  },
  cardHeaderBanner: {
    padding: 20,
    paddingBottom: 24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  enrolledText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  cardBody: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  professorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4B5563',
  },
  profInfoCol: {
    flex: 1,
  },
  profRoleLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  profEmailText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  joinClassBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinClassBtnDisabled: {
    backgroundColor: '#10B981',
    opacity: 0.7,
  },
  joinClassBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  openClassBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openClassBtnText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
});
