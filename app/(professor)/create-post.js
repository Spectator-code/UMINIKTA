import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../src/context/AuthContext';
import { loadPosts, savePosts } from '../../src/utils/mockData';

export default function CreatePost() {
  const { subjectId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [postType, setPostType] = useState('simple');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePickDocument = async () => {
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
        setFile(result.assets[0]);
      }
    } catch (err) {
      console.warn("Failed to pick document", err);
    }
  };

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }

    setLoading(true);

    try {
      const allPosts = await loadPosts();
      const newPost = {
        id: `post-${Date.now()}`,
        subjectId,
        professorId: user.uid,
        type: postType,
        title: title.trim(),
        content: content.trim(),
        fileName: file ? file.name : null,
        fileUri: file ? file.uri : null,
        createdAt: new Date().toISOString(),
      };
      allPosts.push(newPost);
      await savePosts(allPosts);

      Alert.alert('Success', 'Post published!');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            style={[styles.postButton, loading || !title.trim() ? styles.postButtonDisabled : {}]}
            onPress={handlePost}
            disabled={loading || !title.trim()}
          >
            {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.postButtonText}>Post</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Post Type</Text>
          <View style={styles.typeContainer}>
            {['simple', 'announcement', 'activity'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeButton, postType === type && styles.typeButtonActive]}
                onPress={() => setPostType(type)}
              >
                <Text style={[styles.typeText, postType === type && styles.typeTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.inputTitle}
            placeholder="Post Title"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.inputContent}
            placeholder="Write your description or instructions here..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
          />

          {(postType === 'activity' || postType === 'announcement') && (
            <View style={styles.fileSection}>
              {!file ? (
                <TouchableOpacity style={styles.attachButton} onPress={handlePickDocument}>
                  <Text style={styles.attachIconText}>Upload</Text>
                  <Text style={styles.attachTitle}>Attach File</Text>
                  <Text style={styles.attachSubtitle}>DOCX, PPTX, ZIP, PDF</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.filePreview}>
                  <Text style={styles.fileIcon}>F</Text>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <TouchableOpacity onPress={() => setFile(null)} style={styles.removeFileBtn}>
                    <Text style={styles.removeFileBtnText}>X</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#F3F4F6',
  },
  closeButton: { paddingVertical: 4 },
  closeText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  postButton: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  postButtonDisabled: { backgroundColor: '#A5B4FC' },
  postButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  content: { flexGrow: 1, padding: 24 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  typeContainer: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 4, marginBottom: 28, borderWidth: 1, borderColor: '#E5E7EB' },
  typeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  typeButtonActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  typeText: { fontSize: 13, color: '#6B7280', fontWeight: '700' },
  typeTextActive: { color: '#4F46E5' },
  inputTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16, paddingVertical: 8 },
  inputContent: { fontSize: 16, color: '#4B5563', lineHeight: 24, height: 180, marginBottom: 24 },
  fileSection: { marginTop: 8 },
  attachButton: {
    backgroundColor: '#F9FAFB', borderRadius: 16, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed',
  },
  attachIconText: { fontSize: 16, fontWeight: '700', color: '#4F46E5', marginBottom: 8 },
  attachTitle: { color: '#111827', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  attachSubtitle: { color: '#6B7280', fontSize: 13 },
  filePreview: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
  },
  fileIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', textAlign: 'center', lineHeight: 36, color: '#4F46E5', fontWeight: '700', fontSize: 16, marginRight: 12 },
  fileName: { fontSize: 15, fontWeight: '500', color: '#111827', flex: 1, marginRight: 12 },
  removeFileBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  removeFileBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
});
