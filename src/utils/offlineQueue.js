import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../config/supabase';

const QUEUE_KEY = '@offline_mutation_queue';
let isSyncing = false; // Mutex Lock to prevent duplicate sync loops

export const queueDatabaseMutation = async (table, payload) => {
  try {
    if (!table || !payload) {
      console.warn('Invalid mutation data attempted to be queued.');
      return false;
    }

    const existingQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
    const existingQueue = existingQueueStr ? JSON.parse(existingQueueStr) : [];
    
    const newMutation = { 
      table,
      payload, 
      _localId: Date.now().toString(),
      _queuedAt: new Date().toISOString()
    };
    
    existingQueue.push(newMutation);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existingQueue));
    return true;
  } catch (e) {
    console.error('Failed to save post to offline queue:', e);
    return false;
  }
};

export const syncOfflineQueue = async () => {
  if (isSyncing) return; // Mutex Lock check

  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    const existingQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
    if (!existingQueueStr) return;

    const existingQueue = JSON.parse(existingQueueStr);
    if (existingQueue.length === 0) return;

    isSyncing = true; // Lock acquired
    console.log(`Syncing ${existingQueue.length} items to Supabase...`);

    const failedQueue = [];

    for (const item of existingQueue) {
      try {
        const { table, payload } = item;
        
        // 007 Hardening: Implement timeout for backend requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const { error } = await supabase
          .from(table)
          .insert([payload])
          .abortSignal(controller.signal);
          
        clearTimeout(timeoutId);

        if (error) {
          throw new Error(error.message);
        }
      } catch (e) {
        console.warn(`Failed to sync item ${item._localId}:`, e.message);
        failedQueue.push(item);
      }
    }

    // Retain only the ones that failed
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedQueue));

  } catch (e) {
    console.error('Error during sync process:', e);
  } finally {
    isSyncing = false; // Release lock
  }
};
