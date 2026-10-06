import BackgroundFetch from 'react-native-background-fetch';
import { databaseService } from '../database/DatabaseService';
import { MovementsService } from '../api/MovementsService';
import { storage, useAuthStore } from '../../store/useAuthStore';

const FOREGROUND_SYNC_DELAY_MS = 15_000;

export class BackgroundSync {
  private scheduledSync: ReturnType<typeof setTimeout> | null = null;
  private syncInFlight: Promise<void> | null = null;
  private syncRequestedWhileInFlight = false;
  private uploadListeners = new Set<() => void>();

  addUploadListener(listener: () => void): () => void {
    this.uploadListeners.add(listener);
    return () => {
      this.uploadListeners.delete(listener);
    };
  }

  async init() {
    await BackgroundFetch.configure(
      {
        minimumFetchInterval: 60, // 60 minutes
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
      },
      async taskId => {
        if (__DEV__) console.log('[BackgroundFetch] taskId: ', taskId);
        try {
          await this.performSync();
        } finally {
          BackgroundFetch.finish(taskId);
        }
      },
      error => {
        if (__DEV__) console.error('[BackgroundFetch] configure error: ', error);
      },
    );
  }

  /**
   * Queue a near-term upload without creating one network request per GPS fix.
   * BackgroundFetch remains the retry/fallback path if the app process stops.
   */
  scheduleSync(delayMs = FOREGROUND_SYNC_DELAY_MS): void {
    if (this.scheduledSync) return;

    this.scheduledSync = setTimeout(() => {
      this.scheduledSync = null;
      this.performSync().catch(error => {
        if (__DEV__) console.error('[BackgroundSync] Scheduled sync failed', error);
      });
    }, delayMs);
  }

  async performSync(): Promise<void> {
    if (this.syncInFlight) {
      this.syncRequestedWhileInFlight = true;
      return this.syncInFlight;
    }

    const sync = this.runSyncLoop();
    this.syncInFlight = sync;
    try {
      await sync;
    } finally {
      if (this.syncInFlight === sync) this.syncInFlight = null;
    }
  }

  private async runSyncLoop(): Promise<void> {
    do {
      this.syncRequestedWhileInFlight = false;
      await this.performSyncOnce();
    } while (this.syncRequestedWhileInFlight);
  }

  private async performSyncOnce(): Promise<void> {
    if (__DEV__) console.log('[BackgroundSync] Starting sync...');

    await useAuthStore.getState().hydrateSession();
    if (!useAuthStore.getState().token) {
      if (__DEV__) {
        console.log(
          '[BackgroundSync] No authenticated session; keeping queued locations.',
        );
      }
      return;
    }

    const locations = databaseService.getAllLocations();

    if (locations.length === 0) {
      if (__DEV__) console.log('[BackgroundSync] No locations to upload.');
      return;
    }

    try {
      // JSON is the backend's preferred mobile upload format. Snapshot the
      // current rows so points collected during this request remain queued.
      await MovementsService.uploadMovementsJson(
        locations.map(location => ({
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(location.timestamp).toISOString(),
          indoor: location.isOutdoor !== 1,
        })),
      );

      // On Success
      if (__DEV__) console.log('[BackgroundSync] Upload successful.');

      // Delete uploaded rows
      const ids = locations.map(l => l.id!).filter(id => id !== undefined);
      databaseService.deleteLocations(ids);

      storage.set('last_upload_time', Date.now());
      this.uploadListeners.forEach(listener => {
        try {
          listener();
        } catch {
          // A UI subscriber must not turn a completed upload into a failure.
          if (__DEV__) console.warn('[BackgroundSync] Upload listener failed');
        }
      });
    } catch (error) {
      if (__DEV__) console.error('[BackgroundSync] Sync failed', error);
    }
  }
}

export const backgroundSync = new BackgroundSync();

// Register Headless Task (Should be imported in index.js)
export const BackgroundSyncHeadlessTask = async (event: any) => {
  const taskId = event.taskId;
  const isTimeout = event.timeout;
  if (isTimeout) {
    BackgroundFetch.finish(taskId);
    return;
  }
  try {
    await backgroundSync.performSync();
  } finally {
    BackgroundFetch.finish(taskId);
  }
};
