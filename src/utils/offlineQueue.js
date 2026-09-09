import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const QUEUE_KEY = '@offline_post_queue';

export const savePostToQueue = async (postData) => {
  try {
    const existingQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
    const existingQueue = existingQueueStr ? JSON.parse(existingQueueStr) : [];
    
    const newPost = { ...postData, _localId: Date.now().toString() };
    existingQueue.push(newPost);
    
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existingQueue));
    return true;
  } catch (e) {
    console.error('Failed to save post to offline queue:', e);
    return false;
  }
};

export const syncOfflineQueue = async () => {
  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    const existingQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existingQueueStr) return;

    const existingQueue = JSON.parse(existingQueueStr);
    if (existingQueue.length === 0) return;

    console.log(`Syncing ${existingQueue.length} posts to Firebase...`);

    const failedQueue = [];

    for (const post of existingQueue) {
      try {
        const { _localId, ...firebasePostData } = post;
        await addDoc(collection(db, 'posts'), firebasePostData);
      } catch (e) {
        console.warn(`Failed to sync post ${_localId}:`, e);
        failedQueue.push(post);
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedQueue));

  } catch (e) {
    console.error('Error during sync process:', e);
  }
};
