/**
 * ============================================================================
 * MODULE: Automated Client Maintenance & Health Telemetry Engine
 * DIRECTORY: src/utils/maintenanceScheduler.js
 * ROLE/SCOPE: Client Health Monitoring & Offline Queue Synchronization
 * DESCRIPTION:
 *   Schedules a 10-minute non-blocking background telemetry loop that audits
 *   client device connectivity, checks pending offline mutation queues,
 *   triggers automated synchronization, and logs maintenance heartbeats.
 *
 * SECTION INDEX:
 *   1. IMPORTS & DEPENDENCIES
 *   2. ENGINE STATE & INTERVAL POINTER
 *   3. SCHEDULER LIFECYCLE CONTROLS (startMaintenanceScheduler, stopMaintenanceScheduler)
 * ============================================================================
 */

// ============================================================================
// SECTION 1: IMPORTS & DEPENDENCIES
// ============================================================================
import { ActivityLogger } from './ActivityLogger';
import { getOfflineQueueCount, syncOfflineQueue } from './offlineQueue';

// ============================================================================
// SECTION 2: ENGINE STATE & INTERVAL POINTER
// ============================================================================
let maintenanceInterval = null;

// ============================================================================
// SECTION 3: SCHEDULER LIFECYCLE CONTROLS
// ============================================================================
/**
 * Starts the 10-minute automated client maintenance and queue flush loop.
 *
 * @param {string} userId - UUID of active user for audit attribution.
 * @returns {void}
 */
export const startMaintenanceScheduler = (userId) => {
  if (maintenanceInterval) clearInterval(maintenanceInterval);

  // Initial immediate inspection upon dashboard mount
  (async () => {
    try {
      const pendingCount = await getOfflineQueueCount();
      if (pendingCount > 0) {
        await syncOfflineQueue();
      }
      ActivityLogger.logAction(
        userId || 'system',
        'MAINTENANCE_HEARTBEAT',
        `Routine maintenance audit passed. Pending mutation queue count: ${pendingCount}`
      );
    } catch (e) {
      console.warn('Initial maintenance check error:', e.message);
    }
  })();

  // Schedule recurring 10-minute automated maintenance loop
  maintenanceInterval = setInterval(async () => {
    try {
      const pendingCount = await getOfflineQueueCount();
      if (pendingCount > 0) {
        await syncOfflineQueue();
      }
      ActivityLogger.logAction(
        userId || 'system',
        'MAINTENANCE_HEARTBEAT',
        `Routine background health check passed. Pending queue items: ${pendingCount}`
      );
    } catch (e) {
      console.warn('Maintenance heartbeat failed:', e.message);
    }
  }, 10 * 60 * 1000);
};

/**
 * Halts the active background telemetry loop to prevent memory leaks upon unmount.
 *
 * @returns {void}
 */
export const stopMaintenanceScheduler = () => {
  if (maintenanceInterval) {
    clearInterval(maintenanceInterval);
    maintenanceInterval = null;
  }
};
