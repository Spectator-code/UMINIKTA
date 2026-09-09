import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { loadSubjects, saveSubjects, loadPosts, loadComments, loadSubmissions } from '../../../src/utils/mockData';

export default function ProfessorSubjectDetails() {
  const { id, name, code } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('feed');

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id, viewMode])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'feed') {
        const allPosts = await loadPosts();
        const subjectPosts = allPosts.filter(p => p.subjectId === id);
        subjectPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(subjectPosts);

        const allComments = await loadComments();
        setComments(allComments);

        const allSubs = await loadSubmissions();
        setSubmissions(allSubs.filter(s => s.subjectId === id));
      } else {
        const allSubjects = await loadSubjects();
        const subject = allSubjects.find(s => s.id === id);
        if (subject) {
          const studentList = subject.students.map((sId, index) => ({
            id: sId,
            email: `student${index + 1}@umindanao.edu.ph`,
          }));
          setStudents(studentList);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (studentId) => {
    try {
      const allSubjects = await loadSubjects();
      const subject = allSubjects.find(s => s.id === id);
      if (subject) {
        subject.students = subject.students.filter(sId => sId !== studentId);
        await saveSubjects(allSubjects);
        setStudents(students.filter(s => s.id !== studentId));
        Alert.alert('Success', 'Student removed from class.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not remove student.');
    }
  };

  const handleBan = async (studentId) => {
    try {
      const allSubjects = await loadSubjects();
      const subject = allSubjects.find(s => s.id === id);
      if (subject) {
        subject.students = subject.students.filter(sId => sId !== studentId);
        if (!subject.bannedStudents) subject.bannedStudents = [];
        subject.bannedStudents.push(studentId);
        await saveSubjects(allSubjects);
        setStudents(students.filter(s => s.id !== studentId));
        Alert.alert('Success', 'Student has been banned.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not ban student.');
    }
  };

  const handleUnban = async (studentId) => {
    try {
      const allSubjects = await loadSubjects();
      const subject = allSubjects.find(s => s.id === id);
      if (subject) {
        subject.bannedStudents = (subject.bannedStudents || []).filter(sId => sId !== studentId);
        await saveSubjects(allSubjects);
        Alert.alert('Success', 'Student has been unbanned. They can rejoin with the class code.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not unban student.');
    }
  };

  const getPostCommentCount = (postId) => {
    return comments.filter(c => c.postId === postId).length;
  };

  const getPostSubmissionCount = (postId) => {
    return submissions.filter(s => s.postId === postId).length;
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'activity': return 'Activity';
      case 'announcement': return 'Announcement';
      default: return 'Post';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'activity': return '#4F46E5';
      case 'announcement': return '#D97706';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.subjectName} numberOfLines={1}>{name}</Text>
          <Text style={styles.subjectCode}>Code: {code}</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'feed' && styles.activeTab]}
          onPress={() => setViewMode('feed')}
        >
          <Text style={[styles.tabText, viewMode === 'feed' && styles.activeTabText]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'members' && styles.activeTab]}
          onPress={() => setViewMode('members')}
        >
          <Text style={[styles.tabText, viewMode === 'members' && styles.activeTabText]}>Members</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'feed' ? (
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.createPostButton}
            onPress={() => router.push(`/(professor)/create-post?subjectId=${id}`)}
          >
            <Text style={styles.createPostText}>Create a new post...</Text>
            <View style={styles.createPostArrow}>
              <Text style={styles.createPostArrowText}>+</Text>
            </View>
          </TouchableOpacity>

          {loading ? <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} /> : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '15' }]}>
                      <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>{getTypeLabel(item.type)}</Text>
                    </View>
                    <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
                  </View>

                  <Text style={styles.postTitle}>{item.title}</Text>
                  {item.content && <Text style={styles.postContent}>{item.content}</Text>}

                  {item.fileName && (
                    <View style={styles.attachment}>
                      <Text style={styles.attachIcon}>F</Text>
                      <Text style={styles.attachmentText} numberOfLines={1}>{item.fileName}</Text>
                    </View>
                  )}

                  <View style={styles.postStats}>
                    <Text style={styles.statText}>{getPostCommentCount(item.id)} comments</Text>
                    {item.type === 'activity' && (
                      <Text style={styles.statText}>{getPostSubmissionCount(item.id)} submissions</Text>
                    )}
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No Posts</Text>
                  <Text style={styles.emptyText}>Create your first post above.</Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersCount}>{students.length} / 50 Students</Text>
          </View>
          {loading ? <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} /> : (
            <FlatList
              data={students}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{item.email.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberEmail} numberOfLines={1}>{item.email}</Text>
                  <View style={styles.memberActions}>
                    <TouchableOpacity style={styles.kickButton} onPress={() => handleKick(item.id)}>
                      <Text style={styles.kickText}>Kick</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.banButton} onPress={() => handleBan(item.id)}>
                      <Text style={styles.banText}>Ban</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No Students</Text>
                  <Text style={styles.emptyText}>Students can join using code: {code}</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F3F4F6',
  },
  backButton: { paddingVertical: 4, paddingRight: 12 },
  backText: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  subjectName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  subjectCode: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F3F4F6' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderColor: '#4F46E5' },
  tabText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  activeTabText: { color: '#4F46E5' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  createPostButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB',
  },
  createPostText: { flex: 1, color: '#9CA3AF', fontSize: 15, marginLeft: 8 },
  createPostArrow: { backgroundColor: '#4F46E5', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  createPostArrowText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  postCard: {
    backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: '700' },
  postDate: { fontSize: 12, color: '#9CA3AF' },
  postTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  postContent: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 14 },
  attachment: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 14,
  },
  attachIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#EEF2FF', textAlign: 'center', lineHeight: 28, color: '#4F46E5', fontWeight: '700', fontSize: 14, marginRight: 10 },
  attachmentText: { color: '#374151', fontSize: 14, fontWeight: '500', flex: 1 },
  postStats: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 12, gap: 16 },
  statText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  membersHeader: { marginBottom: 16 },
  membersCount: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6',
  },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberAvatarText: { fontSize: 16, fontWeight: '700', color: '#6B7280' },
  memberEmail: { fontSize: 15, fontWeight: '500', color: '#111827', flex: 1 },
  memberActions: { flexDirection: 'row' },
  kickButton: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  kickText: { color: '#4B5563', fontWeight: '700', fontSize: 13 },
  banButton: { backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  banText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
});
