import { supabase } from '../config/supabase';

export class ActivityLogger {
  /**
   * Logs a user action to the database.
   * @param {string} userId - The UUID of the user.
   * @param {string} action - Short code for the action (e.g., 'LOGIN', 'PAGE_VIEW').
   * @param {string} details - Human readable details (e.g., 'Viewed Student Dashboard').
   */
  static async logAction(userId, action, details = '') {
    if (!userId) return;
    try {
      await supabase.from('user_activity_logs').insert([{
        user_id: userId,
        action: action,
        details: details
      }]);
    } catch (e) {
      // Fire and forget, don't crash the app if logging fails
      console.warn('Activity logging failed:', e.message);
    }
  }
}
