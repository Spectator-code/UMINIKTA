import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBJECTS_KEY = '@mock_subjects';
const POSTS_KEY = '@mock_posts';
const COMMENTS_KEY = '@mock_comments';
const SUBMISSIONS_KEY = '@mock_submissions';



const getDefaultSubjects = () => ([
  {
    id: 'sub-1',
    name: 'Computer Science 101',
    code: 'CS101A',
    professorId: null,
    professorEmail: 'prof.garcia@umindanao.edu.ph',
    students: [],
    bannedStudents: [],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'sub-2',
    name: 'Data Structures & Algorithms',
    code: 'DSA202',
    professorId: null,
    professorEmail: 'prof.garcia@umindanao.edu.ph',
    students: [],
    bannedStudents: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
]);

const getDefaultPosts = () => ([
  {
    id: 'post-1',
    subjectId: 'sub-1',
    type: 'announcement',
    title: 'Welcome to Computer Science 101',
    content: 'Welcome to the class. Please review the syllabus attached below and come prepared for the first lecture.',
    fileName: null,
    fileUri: null,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'post-2',
    subjectId: 'sub-1',
    type: 'activity',
    title: 'Assignment 1: Introduction to Programming',
    content: 'Write a simple program that prints your name, student ID, and a brief introduction. Submit as a .docx file.',
    fileName: 'Assignment_1_Instructions.docx',
    fileUri: null,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'post-3',
    subjectId: 'sub-1',
    type: 'simple',
    title: 'Reminder: No class tomorrow',
    content: 'Due to a faculty meeting, there will be no class session tomorrow. Please use the time to work on Assignment 1.',
    fileName: null,
    fileUri: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'post-4',
    subjectId: 'sub-2',
    type: 'announcement',
    title: 'DSA Course Overview',
    content: 'This semester we will cover arrays, linked lists, trees, graphs, sorting, and searching algorithms.',
    fileName: null,
    fileUri: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'post-5',
    subjectId: 'sub-2',
    type: 'activity',
    title: 'Lab Exercise: Array Operations',
    content: 'Implement insert, delete, and search operations on an array. Upload your source code as a .zip file.',
    fileName: 'Lab1_ArrayOps.zip',
    fileUri: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]);

export async function loadSubjects() {
  try {
    const stored = await AsyncStorage.getItem(SUBJECTS_KEY);
    if (stored) return JSON.parse(stored);
    const defaults = getDefaultSubjects();
    await AsyncStorage.setItem(SUBJECTS_KEY, JSON.stringify(defaults));
    return defaults;
  } catch (e) {
    console.warn('Failed to load subjects:', e);
    return getDefaultSubjects();
  }
}

export async function saveSubjects(subjects) {
  try {
    await AsyncStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
  } catch (e) {
    console.warn('Failed to save subjects:', e);
  }
}

export async function loadPosts() {
  try {
    const stored = await AsyncStorage.getItem(POSTS_KEY);
    if (stored) return JSON.parse(stored);
    const defaults = getDefaultPosts();
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(defaults));
    return defaults;
  } catch (e) {
    console.warn('Failed to load posts:', e);
    return getDefaultPosts();
  }
}

export async function savePosts(posts) {
  try {
    await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  } catch (e) {
    console.warn('Failed to save posts:', e);
  }
}

export async function loadComments() {
  try {
    const stored = await AsyncStorage.getItem(COMMENTS_KEY);
    if (stored) return JSON.parse(stored);
    return [];
  } catch (e) {
    console.warn('Failed to load comments:', e);
    return [];
  }
}

export async function saveComments(comments) {
  try {
    await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  } catch (e) {
    console.warn('Failed to save comments:', e);
  }
}

export async function loadSubmissions() {
  try {
    const stored = await AsyncStorage.getItem(SUBMISSIONS_KEY);
    if (stored) return JSON.parse(stored);
    return [];
  } catch (e) {
    console.warn('Failed to load submissions:', e);
    return [];
  }
}

export async function saveSubmissions(submissions) {
  try {
    await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  } catch (e) {
    console.warn('Failed to save submissions:', e);
  }
}

export async function resetAllMockData() {
  try {
    await AsyncStorage.multiRemove([SUBJECTS_KEY, POSTS_KEY, COMMENTS_KEY, SUBMISSIONS_KEY]);
  } catch (e) {
    console.warn('Failed to reset mock data:', e);
  }
}
