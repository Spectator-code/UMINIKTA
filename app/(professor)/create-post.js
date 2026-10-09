import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../src/context/AuthContext';
import { useConfirm } from '../../src/context/ConfirmContext';
import { queueDatabaseMutation, syncOfflineQueue } from '../../src/utils/offlineQueue';
import UIcon from '../../src/components/UIcon';
import { compressImageAttachment } from '../../src/utils/mediaCompressor';

export default function CreatePost() {
  const { subjectId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const [postType, setPostType] = useState('announcement'); // 'announcement' | 'activity' | 'simple'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRemoveFile = async () => {
    const proceed = await confirm({
      title: 'Remove Attached File',
      message: `Do you want to detach and remove "${file?.name || 'this file'}" from your post draft?`,
      confirmText: 'Remove File',
      confirmColor: '#DC2626',
      icon: 'trash',
      isDestructive: true,
    });
    if (proceed) {
      setFile(null);
    }
  };

  // Multi-Section Broadcasting Configuration
  const AVAILABLE_SECTIONS = [
    { id: subjectId || 'sec-1', name: 'Section 1 (Primary Active)' },
    { id: 'sec-2', name: 'Section 2 (CC105-B)' },
    { id: 'sec-3', name: 'Section 3 (CC105-C)' },
  ];
  const [selectedSections, setSelectedSections] = useState([subjectId || 'sec-1']);

  // Assignment Cutoff & Schedule Timer Configuration
  const [deadlinePreset, setDeadlinePreset] = useState('2days'); // 'today' | '2days' | '5days' | '7days'
  const [lockAfterDeadline, setLockAfterDeadline] = useState(true);
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(false);

  const toggleSection = (secId) => {
    setSelectedSections((prev) => {
      if (prev.includes(secId)) {
        if (prev.length === 1) {
          Alert.alert('Selection Error', 'At least one section must be selected.');
          return prev;
        }
        return prev.filter((id) => id !== secId);
      } else {
        return [...prev, secId];
      }
    });
  };

  const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15MB Institutional Upload Ceiling

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/zip',
          'image/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let pickedFile = result.assets[0];

        // F-07 Remediation: Check file size to prevent browser memory spikes and network timeouts
        if (pickedFile.size && pickedFile.size > MAX_ATTACHMENT_SIZE) {
          const fileSizeMB = (pickedFile.size / (1024 * 1024)).toFixed(1);
          const limitMsg = `The selected file (${fileSizeMB} MB) exceeds the 15MB institutional upload ceiling. Please compress or select a smaller document.`;
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert('File Too Large:\n\n' + limitMsg);
          } else {
            Alert.alert('File Too Large', limitMsg);
          }
          return;
        }

        // Client-side image compression (PERF-01 remediation)
        pickedFile = await compressImageAttachment(pickedFile);
        setFile(pickedFile);
      }
    } catch (err) {
      console.warn('Failed to pick document', err);
    }
  };

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for this classroom post.');
      return;
    }

    if (title.length > 100) {
      Alert.alert('Title Too Long', 'Title cannot exceed 100 characters.');
      return;
    }

    if (content.length > 5000) {
      Alert.alert('Content Too Long', 'Content cannot exceed 5000 characters.');
      return;
    }

    setLoading(true);

    try {
      // Synchronously broadcast across all chosen sections
      const cutoffOffsetMs =
        deadlinePreset === 'today'
          ? 14400000
          : deadlinePreset === '2days'
          ? 86400000 * 2
          : deadlinePreset === '5days'
          ? 86400000 * 5
          : 86400000 * 7;

      for (const secId of selectedSections) {
        const newPost = {
          subject_id: secId,
          professor_id: user?.id,
          type: postType,
          title: title.trim(),
          content: content.trim(),
          file_name: file ? file.name : null,
          file_uri: file ? file.uri : null,
          cutoff_schedule: postType === 'activity' ? {
            deadlinePreset,
            cutoffTimestamp: new Date(Date.now() + cutoffOffsetMs).toISOString(),
            lockAfterDeadline,
            allowLateSubmissions,
            latePenaltyPerDay: allowLateSubmissions ? 5 : 0,
          } : null,
          created_at: new Date().toISOString(),
        };
        await queueDatabaseMutation('posts', newPost);
      }

      syncOfflineQueue(); // Fire and forget
      Alert.alert(
        'Broadcast Published',
        `Successfully broadcasted to ${selectedSections.length} course section${selectedSections.length > 1 ? 's' : ''}!`
      );
      router.back();
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Classroom Post</Text>
          <TouchableOpacity
            style={[
              styles.publishBtn,
              (loading || !title.trim()) && styles.publishBtnDisabled,
            ]}
            onPress={handlePost}
            disabled={loading || !title.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.publishBtnText}>Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardContainer}>
            {/* Post Type Selector */}
            <Text style={styles.sectionLabel}>Post Category</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  postType === 'announcement' && styles.typeOptionAnnouncementActive,
                ]}
                onPress={() => setPostType('announcement')}
              >
                <UIcon
                  name="megaphone"
                  size={16}
                  color={postType === 'announcement' ? '#D97706' : '#64748B'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    postType === 'announcement' && styles.typeOptionTextAnnouncementActive,
                  ]}
                >
                  Announcement
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  postType === 'activity' && styles.typeOptionActivityActive,
                ]}
                onPress={() => setPostType('activity')}
              >
                <UIcon
                  name="document"
                  size={16}
                  color={postType === 'activity' ? '#2563EB' : '#64748B'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    postType === 'activity' && styles.typeOptionTextActivityActive,
                  ]}
                >
                  Assignment / Task
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  postType === 'simple' && styles.typeOptionSimpleActive,
                ]}
                onPress={() => setPostType('simple')}
              >
                <UIcon
                  name="book"
                  size={16}
                  color={postType === 'simple' ? '#059669' : '#64748B'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    postType === 'simple' && styles.typeOptionTextSimpleActive,
                  ]}
                >
                  Study Material
                </Text>
              </TouchableOpacity>
            </View>

            {/* Multi-Section Synchronous Broadcasting Selector */}
            <View style={styles.sectionGroup}>
              <View style={styles.broadcastHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <UIcon name="broadcast" size={15} color="#4F46E5" />
                  <Text style={styles.sectionLabel}>Target Course Sections</Text>
                </View>
                <View style={styles.broadcastBadge}>
                  <Text style={styles.broadcastBadgeText}>
                    {selectedSections.length} Selected
                  </Text>
                </View>
              </View>
              <Text style={styles.broadcastHelpText}>
                Select sections to synchronously broadcast this post simultaneously:
              </Text>
              <View style={styles.sectionsChipRow}>
                {AVAILABLE_SECTIONS.map((sec) => {
                  const isSelected = selectedSections.includes(sec.id);
                  return (
                    <TouchableOpacity
                      key={sec.id}
                      style={[styles.sectionChip, isSelected && styles.sectionChipActive]}
                      onPress={() => toggleSection(sec.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.sectionCheckbox, isSelected && styles.sectionCheckboxActive]}>
                        {isSelected && <UIcon name="check" size={12} color="#FFFFFF" />}
                      </View>
                      <Text style={[styles.sectionChipText, isSelected && styles.sectionChipTextActive]}>
                        {sec.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Assignment Cutoff & Submission Schedule Timer (when Assignment selected) */}
            {postType === 'activity' && (
              <View style={styles.cutoffGroup}>
                <View style={styles.cutoffHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <UIcon name="clock" size={15} color="#D97706" />
                    <Text style={styles.sectionLabel}>Submission Deadline & Schedule Lock</Text>
                  </View>
                  <View style={styles.cutoffBadge}>
                    <Text style={styles.cutoffBadgeText}>Automated Timer</Text>
                  </View>
                </View>

                <Text style={styles.broadcastHelpText}>
                  Choose assignment due date and automatic submission lock policy:
                </Text>

                <View style={styles.presetRow}>
                  {[
                    { key: 'today', label: 'Today (11:59 PM)' },
                    { key: '2days', label: 'In 2 Days' },
                    { key: '5days', label: 'In 5 Days' },
                    { key: '7days', label: 'In 7 Days' },
                  ].map((preset) => {
                    const isActive = deadlinePreset === preset.key;
                    return (
                      <TouchableOpacity
                        key={preset.key}
                        style={[styles.presetChip, isActive && styles.presetChipActive]}
                        onPress={() => setDeadlinePreset(preset.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Lock After Deadline Toggle */}
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setLockAfterDeadline((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.toggleCheckbox, lockAfterDeadline && styles.toggleCheckboxActive]}>
                    {lockAfterDeadline && <UIcon name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>Lock Submissions After Cutoff</Text>
                    <Text style={styles.toggleSubtext}>
                      Submissions automatically close and lock when the deadline expires.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Allow Late Submissions Toggle */}
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setAllowLateSubmissions((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.toggleCheckbox, allowLateSubmissions && styles.toggleCheckboxAmberActive]}>
                    {allowLateSubmissions && <UIcon name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>Allow Late Submissions (-5 pts / day)</Text>
                    <Text style={styles.toggleSubtext}>
                      Students can turn in after deadline with automated gradebook penalty flag.
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Title</Text>
                <Text style={styles.charCount}>{title.length}/100</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Midterm Project Guidelines & Milestones"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            {/* Content Textarea */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Instructions / Details</Text>
                <Text style={styles.charCount}>{content.length}/5000</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Provide comprehensive instructions, deadlines, or classroom notices..."
                placeholderTextColor="#94A3B8"
                value={content}
                onChangeText={setContent}
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* File Attachment */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Resource Attachment (Optional)</Text>
              {file ? (
                <View style={styles.attachedCard}>
                  <View style={styles.attachedIconBox}>
                    <UIcon name="file" size={22} color="#4F46E5" />
                  </View>
                  <View style={styles.attachedDetails}>
                    <Text style={styles.attachedFileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.attachedFileSize}>
                      {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Document Attached'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeFileBtn}
                    onPress={handleRemoveFile}
                  >
                    <UIcon name="close" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.attachmentTrigger}
                  onPress={handlePickDocument}
                  activeOpacity={0.7}
                >
                  <UIcon name="attachment" size={20} color="#4F46E5" />
                  <Text style={styles.attachmentTriggerText}>
                    Attach PDF, Slides, Document, or Syllabus
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 64,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  publishBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  publishBtnDisabled: {
    opacity: 0.5,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  typeOption: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  typeOptionAnnouncementActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  typeOptionActivityActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  typeOptionSimpleActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  typeOptionTextAnnouncementActive: {
    color: '#D97706',
    fontWeight: '700',
  },
  typeOptionTextActivityActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  typeOptionTextSimpleActive: {
    color: '#059669',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 140,
  },
  attachmentTrigger: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  attachmentTriggerText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  attachedCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachedIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachedDetails: {
    flex: 1,
  },
  attachedFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  attachedFileSize: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  removeFileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Multi-Section Broadcasting Styles
  sectionGroup: {
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  broadcastHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  broadcastBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  broadcastBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  broadcastHelpText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  sectionsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  sectionChipActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  sectionCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCheckboxActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  sectionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  sectionChipTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  // Cutoff Schedule & Lock Styles
  cutoffGroup: {
    marginBottom: 20,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  cutoffHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cutoffBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cutoffBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  toggleCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  toggleCheckboxActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  toggleCheckboxAmberActive: {
    backgroundColor: '#B45309',
    borderColor: '#B45309',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  toggleSubtext: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
});

