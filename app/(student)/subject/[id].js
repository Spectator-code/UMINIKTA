import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { supabase } from '../../../src/config/supabase';
import * as DocumentPicker from 'expo-document-picker';
import StudentNavbar from '../../../src/components/StudentNavbar';
import UIcon from '../../../src/components/UIcon';

export default function StudentSubjectDetails() {
  const { id, name } = useLocalSearchParams();
  const { user, addNotification } = useAuth();
  const router = useRouter();

  const [subjectInfo, setSubjectInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'announcement' | 'activity'

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentsViewModal, setCommentsViewModal] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [uploading, setUploading] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      // 007 Hardening: Fetch securely from Supabase
      const { data: subject, error: subErr } = await supabase
        .from('subjects')
        .select('id, name, code, professor_id(email)')
        .eq('id', id)
        .single();
        
      if (subErr) throw subErr;
      
      setSubjectInfo({
        ...subject,
        professorEmail: subject.professor_id ? subject.professor_id.email : 'Unknown'
      });

      const { data: postsData, error: postsErr } = await supabase
        .from('posts')
        .select('*')
        .eq('subject_id', id)
        .order('created_at', { ascending: false });
        
      if (postsErr) throw postsErr;
      
      const formattedPosts = postsData.map(p => ({
        id: p.id,
        subjectId: p.subject_id,
        type: p.type,
        title: p.title,
        content: p.content,
        fileName: p.file_name,
        fileUri: p.file_uri,
        createdAt: p.created_at
      }));
      setPosts(formattedPosts);

      setComments([]); // Comments table not implemented in schema yet
      setSubmissions([]); // Submissions table not implemented in schema yet
    } catch (e) {
      console.warn("Failed to fetch subject details:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmission = async (postId, postTitle) => {
    Alert.alert('Not Implemented', 'Submissions functionality requires the submissions table in Supabase.');
  };

  const handleAddComment = async () => {
    Alert.alert('Not Implemented', 'Comments functionality requires the comments table in Supabase.');
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

  const getPostSubmission = (postId) => {
    return submissions.find(s => s.postId === postId);
  };

  const filteredPosts = posts.filter(p => {
    if (filterType === 'all') return true;
    return p.type === filterType;
  });

  const announcementCount = posts.filter(p => p.type === 'announcement').length;
  const activityCount = posts.filter(p => p.type === 'activity').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentNavbar currentTab="classes" />

      <View style={styles.container}>
        <View style={styles.mainWrapper}>
          {/* ================= COURSE HERO BANNER ================= */}
          <View style={styles.heroBanner}>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => router.push('/(student)')}
              activeOpacity={0.7}
            >
              <Text style={styles.backLinkText}>← Back to My Classes</Text>
            </TouchableOpacity>

            <View style={styles.bannerHeaderRow}>
              <View style={styles.courseDetailsCol}>
                <View style={styles.codeRow}>
                  <View style={styles.courseCodeBadge}>
                    <Text style={styles.courseCodeText}>
                      {subjectInfo?.code || 'COURSE'}
                    </Text>
                  </View>
                  <View style={styles.univTermPill}>
                    <Text style={styles.univTermText}>1st Semester 2026</Text>
                  </View>
                </View>

                <Text style={styles.bannerCourseTitle}>
                  {subjectInfo?.name || name || 'Classroom Stream'}
                </Text>

                <View style={styles.instructorRow}>
                  <View style={styles.instructorAvatar}>
                    <Text style={styles.instructorAvatarText}>
                      {subjectInfo?.professorEmail ? subjectInfo.professorEmail.charAt(0).toUpperCase() : 'P'}
                    </Text>
                  </View>
                  <Text style={styles.instructorEmail}>
                    {subjectInfo?.professorEmail || 'Faculty Instructor'}
                  </Text>
                </View>
              </View>

              <View style={styles.bannerMetaCol}>
                <View style={styles.enrolledPill}>
                  <UIcon name="users" size={13} color="#D1FAE5" style={{ marginRight: 6 }} />
                  <Text style={styles.enrolledPillText}>
                    {subjectInfo?.students?.length || 1} Students Enrolled
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ================= STREAM FILTER TABS ================= */}
          <View style={styles.filterTabsRow}>
            <TouchableOpacity
              style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
                All Posts ({posts.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filterType === 'announcement' && styles.filterTabActive]}
              onPress={() => setFilterType('announcement')}
            >
              <Text style={[styles.filterTabText, filterType === 'announcement' && styles.filterTabTextActive]}>
                Announcements ({announcementCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filterType === 'activity' && styles.filterTabActive]}
              onPress={() => setFilterType('activity')}
            >
              <Text style={[styles.filterTabText, filterType === 'activity' && styles.filterTabTextActive]}>
                Tasks & Activities ({activityCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= STREAM POSTS ================= */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Loading class feed...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPosts}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.postListContent}
              renderItem={({ item }) => {
                const postComments = getPostComments(item.id);
                const submission = item.type === 'activity' ? getPostSubmission(item.id) : null;
                const isTurnedIn = !!submission;

                return (
                  <View style={styles.postCard}>
                    {/* Post Top Row */}
                    <View style={styles.postTopRow}>
                      <View style={styles.authorRow}>
                        <View style={styles.authorAvatar}>
                          <UIcon
                            name={item.type === 'activity' ? 'clipboard' : 'announcement'}
                            size={16}
                            color="#059669"
                          />
                        </View>
                        <View style={styles.authorCol}>
                          <Text style={styles.authorName}>
                            {subjectInfo?.professorEmail || 'Faculty Instructor'}
                          </Text>
                          <Text style={styles.postDate}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </Text>
                        </View>
                      </View>

                      {/* Type Badge */}
                      <View
                        style={[
                          styles.postTypeBadge,
                          item.type === 'activity' ? styles.badgeActivity : styles.badgeAnnouncement,
                        ]}
                      >
                        <Text
                          style={[
                            styles.postTypeBadgeText,
                            item.type === 'activity' ? styles.badgeTextActivity : styles.badgeTextAnnouncement,
                          ]}
                        >
                          {item.type === 'activity' ? 'ASSIGNMENT' : 'ANNOUNCEMENT'}
                        </Text>
                      </View>
                    </View>

                    {/* Post Title & Description */}
                    <Text style={styles.postTitle}>{item.title}</Text>
                    {item.content && (
                      <Text style={styles.postContent}>{item.content}</Text>
                    )}

                    {/* Attached Instructions File */}
                    {item.fileName && (
                      <View style={styles.attachmentCard}>
                        <View style={styles.attachmentIconBox}>
                          <UIcon name="file" size={16} color="#059669" />
                        </View>
                        <View style={styles.attachmentInfoCol}>
                          <Text style={styles.attachmentName} numberOfLines={1}>
                            {item.fileName}
                          </Text>
                          <Text style={styles.attachmentType}>Instruction Document</Text>
                        </View>
                      </View>
                    )}

                    {/* Activity Submission Section */}
                    {item.type === 'activity' && (
                      <View style={styles.submissionBox}>
                        <View style={styles.submissionStatusRow}>
                          <Text style={styles.submissionSectionTitle}>Your Submission</Text>
                          <View
                            style={[
                              styles.statusPill,
                              isTurnedIn ? styles.statusPillTurnedIn : styles.statusPillPending,
                            ]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <UIcon
                                name={isTurnedIn ? 'check' : 'clock'}
                                size={12}
                                color={isTurnedIn ? '#065F46' : '#92400E'}
                                style={{ marginRight: 4 }}
                              />
                              <Text
                                style={[
                                  styles.statusPillText,
                                  isTurnedIn ? styles.statusTextTurnedIn : styles.statusTextPending,
                                ]}
                              >
                                {isTurnedIn ? 'TURNED IN' : 'PENDING'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {isTurnedIn ? (
                          <View style={styles.submittedFileInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                              <UIcon name="paperclip" size={14} color="#059669" style={{ marginRight: 5 }} />
                              <Text style={styles.submittedFileName}>{submission.fileName}</Text>
                            </View>
                            <Text style={styles.submittedDate}>
                              Submitted on {new Date(submission.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <TouchableOpacity
                              style={styles.resubmitBtn}
                              onPress={() => handleUploadSubmission(item.id, item.title)}
                              disabled={uploading}
                            >
                              <Text style={styles.resubmitBtnText}>Resubmit File</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.uploadBtn}
                            onPress={() => handleUploadSubmission(item.id, item.title)}
                            disabled={uploading}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.uploadBtnText}>+ Upload Work (.pdf, .docx, .zip)</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Post Footer Actions */}
                    <View style={styles.postFooterRow}>
                      <TouchableOpacity
                        style={styles.commentActionBtn}
                        onPress={() => openCommentModal(item.id)}
                      >
                        <UIcon name="chat" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                        <Text style={styles.commentActionBtnText}>Add Comment</Text>
                      </TouchableOpacity>

                      {postComments.length > 0 && (
                        <TouchableOpacity
                          style={styles.viewCommentsLink}
                          onPress={() => openCommentsView(item.id)}
                        >
                          <Text style={styles.viewCommentsLinkText}>
                            {postComments.length} class comment{postComments.length !== 1 ? 's' : ''}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyFeedBox}>
                  <UIcon name="inbox" size={44} color="#9CA3AF" />
                  <Text style={styles.emptyFeedTitle}>No Posts in this Category</Text>
                  <Text style={styles.emptyFeedSub}>
                    Check back soon or select another filter tab above.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* ================= ADD COMMENT MODAL ================= */}
      <Modal visible={commentModalVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.commentModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Class Comment</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <UIcon name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.commentInputField}
              placeholder="Write a comment to the class..."
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
              value={commentText}
              onChangeText={setCommentText}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCommentModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.postCommentButton}
                onPress={handleAddComment}
              >
                <Text style={styles.postCommentButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= VIEW COMMENTS MODAL ================= */}
      <Modal visible={commentsViewModal} animationType="fade" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.commentsListModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Class Discussion</Text>
              <TouchableOpacity onPress={() => setCommentsViewModal(false)}>
                <UIcon name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={getPostComments(activePostId)}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <View style={styles.commentRowItem}>
                  <View style={styles.commentAuthorAvatar}>
                    <Text style={styles.commentAuthorInitial}>
                      {item.studentName ? item.studentName.charAt(0) : 'S'}
                    </Text>
                  </View>
                  <View style={styles.commentBodyCol}>
                    <View style={styles.commentMetaRow}>
                      <Text style={styles.commentAuthorName}>
                        {item.studentName || item.studentEmail}
                      </Text>
                      <Text style={styles.commentDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.commentBodyText}>{item.text}</Text>
                  </View>
                </View>
              )}
            />
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
  container: {
    flex: 1,
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1,
  },
  heroBanner: {
    backgroundColor: '#059669',
    borderRadius: 22,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  backLink: {
    marginBottom: 14,
  },
  backLinkText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '700',
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  courseDetailsCol: {
    flex: 1,
    minWidth: 260,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  courseCodeBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  courseCodeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  univTermPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  univTermText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  bannerCourseTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructorAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  instructorEmail: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  bannerMetaCol: {
    alignItems: 'flex-end',
  },
  enrolledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  enrolledPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    gap: 4,
    flexWrap: 'wrap',
  },
  filterTab: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: '#ECFDF5',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  loadingBox: {
    padding: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
  },
  postListContent: {
    paddingBottom: 40,
    gap: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  postTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarText: {
    fontSize: 18,
  },
  authorCol: {
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  postDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  postTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActivity: {
    backgroundColor: '#FEF3C7',
  },
  badgeAnnouncement: {
    backgroundColor: '#DBEAFE',
  },
  postTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTextActivity: {
    color: '#B45309',
  },
  badgeTextAnnouncement: {
    color: '#1D4ED8',
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 14,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  attachmentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  attachmentIcon: {
    fontSize: 16,
  },
  attachmentInfoCol: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  attachmentType: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  submissionBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  submissionStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  submissionSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillTurnedIn: {
    backgroundColor: '#059669',
  },
  statusPillPending: {
    backgroundColor: '#F59E0B',
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextTurnedIn: {
    color: '#FFFFFF',
  },
  statusTextPending: {
    color: '#FFFFFF',
  },
  submittedFileInfo: {
    gap: 4,
  },
  submittedFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  submittedDate: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  resubmitBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resubmitBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  uploadBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  postFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  commentActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  viewCommentsLink: {
    paddingVertical: 4,
  },
  viewCommentsLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  emptyFeedBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyFeedEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyFeedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  emptyFeedSub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  commentModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
    padding: 20,
  },
  commentsListModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  commentInputField: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    color: '#111827',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  postCommentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  postCommentButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  commentRowItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  commentAuthorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAuthorInitial: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  commentBodyCol: {
    flex: 1,
  },
  commentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  commentDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  commentBodyText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
});
