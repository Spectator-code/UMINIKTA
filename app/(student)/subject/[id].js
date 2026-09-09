import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { loadPosts, loadComments, saveComments, loadSubmissions, saveSubmissions } from '../../../src/utils/mockData';
import * as DocumentPicker from 'expo-document-picker';

export default function StudentSubjectDetails() {
  const { id, name } = useLocalSearchParams();
  const { user, addNotification } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentsViewModal, setCommentsViewModal] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [commentText, setCommentText] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const allPosts = await loadPosts();
      const subjectPosts = allPosts.filter(p => p.subjectId === id);
      subjectPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPosts(subjectPosts);

      const allComments = await loadComments();
      setComments(allComments);
    } catch (e) {
      console.warn("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmission = async (postId, postTitle) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/zip'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        const allSubmissions = await loadSubmissions();
        const newSubmission = {
          id: `sub-${Date.now()}`,
          postId,
          studentId: user.uid,
          studentEmail: user.email,
          subjectId: id,
          fileName: file.name,
          fileUri: file.uri,
          submittedAt: new Date().toISOString(),
        };
        allSubmissions.push(newSubmission);
        await saveSubmissions(allSubmissions);

        await addNotification({
          title: 'Assignment Submitted',
          body: `You submitted "${file.name}" for "${postTitle}".`,
          type: 'submission',
        });

        Alert.alert('Success', `Submitted "${file.name}" successfully!`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to upload submission.');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      const allComments = await loadComments();
      const newComment = {
        id: `comment-${Date.now()}`,
        postId: activePostId,
        studentId: user.uid,
        studentEmail: user.email,
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      };
      allComments.push(newComment);
      await saveComments(allComments);
      setComments(allComments);

      setCommentModalVisible(false);
      setCommentText('');
      Alert.alert('Success', 'Comment added.');
    } catch (e) {
      Alert.alert('Error', 'Failed to add comment.');
    }
  };

  const openCommentModal = (postId) => {
    setActivePostId(postId);
    setCommentModalVisible(true);
  };

  const openCommentsView = (postId) => {
    setActivePostId(postId);
    setCommentsViewModal(true);
  };

  const getPostComments = (postId) => {
    return comments.filter(c => c.postId === postId);
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
      case 'activity': return '#059669';
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
          <Text style={styles.subjectSubtitle}>Class Feed</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const postComments = getPostComments(item.id);
              return (
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

                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => openCommentModal(item.id)}>
                      <Text style={styles.actionText}>Comment</Text>
                    </TouchableOpacity>

                    {postComments.length > 0 && (
                      <TouchableOpacity style={styles.viewCommentsButton} onPress={() => openCommentsView(item.id)}>
                        <Text style={styles.viewCommentsText}>{postComments.length} comment{postComments.length !== 1 ? 's' : ''}</Text>
                      </TouchableOpacity>
                    )}

                    {item.type === 'activity' && (
                      <TouchableOpacity style={styles.submitButton} onPress={() => handleUploadSubmission(item.id, item.title)}>
                        <Text style={styles.submitText}>Submit Work</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Posts</Text>
                <Text style={styles.emptyText}>Your professor hasn't posted anything yet.</Text>
              </View>
            }
          />
        )}
      </View>


      <Modal visible={commentModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Comment</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Write your comment..."
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
              value={commentText}
              onChangeText={setCommentText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setCommentModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postButton} onPress={handleAddComment}>
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>


      <Modal visible={commentsViewModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsViewModal(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={getPostComments(activePostId)}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{item.studentEmail.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.commentBody}>
                    <Text style={styles.commentEmail}>{item.studentEmail}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No comments yet.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
  subjectSubtitle: { fontSize: 13, color: '#059669', marginTop: 2, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
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
  postContent: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 16 },
  attachment: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16,
  },
  attachIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#EEF2FF', textAlign: 'center', lineHeight: 28, color: '#4F46E5', fontWeight: '700', fontSize: 14, marginRight: 10 },
  attachmentText: { color: '#374151', fontSize: 14, fontWeight: '500', flex: 1 },
  postActions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 14, flexWrap: 'wrap', gap: 8 },
  actionButton: { backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  viewCommentsButton: { paddingHorizontal: 14, paddingVertical: 8 },
  viewCommentsText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  submitButton: { backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  submitText: { color: '#059669', fontWeight: '700', fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  modalClose: { fontSize: 20, color: '#9CA3AF', fontWeight: '600', padding: 4 },
  commentInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, height: 120, textAlignVertical: 'top', fontSize: 16, color: '#111827', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { flex: 1, paddingVertical: 16, alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, marginRight: 12 },
  cancelButtonText: { color: '#4B5563', fontWeight: 'bold', fontSize: 15 },
  postButton: { flex: 1, backgroundColor: '#059669', paddingVertical: 16, alignItems: 'center', borderRadius: 12 },
  postButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  commentItem: { flexDirection: 'row', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  commentAvatarText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  commentBody: { flex: 1 },
  commentEmail: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4 },
  commentText: { fontSize: 15, color: '#4B5563', lineHeight: 20, marginBottom: 4 },
  commentDate: { fontSize: 12, color: '#9CA3AF' },
});
