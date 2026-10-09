import { storage } from './storage';
import { LocationPayload } from './api';

const OFFLINE_QUEUE_KEY = 'fst_pending_locations_sqlite_queue';
const MAX_QUEUE_LIMIT = 200; // Controlled retention limit (Section 8 of specification)

export interface PendingLocationRecord extends LocationPayload {
  id: string;
  session_id?: number;
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED';
  created_at: string;
}

export class OfflineQueueService {
  /**
   * Enqueue a GPS location point to the local persistent queue when internet is unavailable.
   * Capped to MAX_QUEUE_LIMIT to prevent unbounded device memory growth.
   */
  static enqueueLocation(loc: LocationPayload, sessionId?: number): PendingLocationRecord {
    let queue = this.getPendingLocations();
    const record: PendingLocationRecord = {
      ...loc,
      id: loc.client_id || `QUEUE-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      session_id: sessionId,
      sync_status: 'PENDING',
      created_at: new Date().toISOString()
    };

    queue.push(record);
    // Enforce controlled retention limit (drop oldest if exceeding capacity)
    if (queue.length > MAX_QUEUE_LIMIT) {
      queue = queue.slice(queue.length - MAX_QUEUE_LIMIT);
    }

    try {
      storage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Local storage queue error:', e);
    }
    return record;
  }

  /**
   * Retrieve all pending offline locations.
   */
  static getPendingLocations(): PendingLocationRecord[] {
    try {
      const data = storage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Count of pending locations in offline queue.
   */
  static getPendingCount(): number {
    return this.getPendingLocations().length;
  }

  /**
   * Remove records from the local queue after successful server sync confirmation.
   */
  static removeSynced(clientIds: string[]) {
    const queue = this.getPendingLocations();
    const idSet = new Set(clientIds);
    const remaining = queue.filter((item) => !idSet.has(item.id) && !idSet.has(item.client_id || ''));
    try {
      storage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.warn('Error clearing synced queue:', e);
    }
  }

  /**
   * Clear all pending locations (used upon logout or clean reset).
   */
  static clearQueue() {
    storage.removeItem(OFFLINE_QUEUE_KEY);
  }
}
