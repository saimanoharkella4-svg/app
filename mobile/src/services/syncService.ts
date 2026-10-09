import { mobileApi } from './api';
import { OfflineQueueService } from './offlineQueueService';

export class SyncService {
  private static isSyncing = false;

  /**
   * Process offline queue and batch-upload pending points to FastAPI backend.
   */
  static async syncPendingQueue(): Promise<{ synced: number; remaining: number }> {
    if (this.isSyncing) {
      return { synced: 0, remaining: OfflineQueueService.getPendingCount() };
    }

    const pending = OfflineQueueService.getPendingLocations();
    if (pending.length === 0) {
      return { synced: 0, remaining: 0 };
    }

    this.isSyncing = true;
    try {
      // Send batch to /api/tracking/batch
      const response = await mobileApi.uploadBatch(pending);

      if (response && response.accepted_client_ids) {
        // Clear confirmed records from offline queue
        OfflineQueueService.removeSynced(response.accepted_client_ids);
        return {
          synced: response.accepted_client_ids.length,
          remaining: OfflineQueueService.getPendingCount()
        };
      }
      return { synced: 0, remaining: pending.length };
    } catch (e) {
      console.warn('Sync failed (temporary network failure):', e);
      return { synced: 0, remaining: pending.length };
    } finally {
      this.isSyncing = false;
    }
  }
}
