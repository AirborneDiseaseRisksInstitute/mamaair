import BackgroundFetch from 'react-native-background-fetch';
import Geolocation from '@react-native-community/geolocation';
import { databaseService } from '../database/DatabaseService';
import { MovementsService } from '../api/MovementsService';
import { IndoorOutdoorClassifier } from '../logic/IndoorOutdoorClassifier';
import { storage } from '../../store/useAuthStore';
import { appLogger } from '../logger/AppLogger';

class BackgroundSync {
  private isSyncing = false;

  async init() {
    await BackgroundFetch.configure(
      {
        minimumFetchInterval: 60, // 60 minutes
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
      },
      async (taskId) => {
        console.log('[BackgroundFetch] taskId: ', taskId);
        await this.captureBackupLocation();
        await this.performSync();
        BackgroundFetch.finish(taskId);
      },
      (error) => {
        console.error('[BackgroundFetch] configure error: ', error);
      }
    );
  }

  /**
   * Backup: get a single GPS fix and save to DB.
   * Used as safety net when foreground service is killed by aggressive OEMs.
   */
  private async captureBackupLocation(): Promise<void> {
    const token = storage.getString('auth_token');
    if (!token) return; // Not authenticated — skip

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy, speed } = position.coords;
            const timestamp = position.timestamp;
            const classifier = IndoorOutdoorClassifier.getInstance();
            const state = await classifier.classify({
              latitude, longitude, accuracy, speed: speed || 0,
            });

            if (state !== 'Indoor') {
              databaseService.insertLocation({
                latitude, longitude, accuracy,
                speed: speed || 0,
                timestamp,
                isOutdoor: state === 'Outdoor' ? 1 : 0,
              });
              appLogger.info('Sync', `Backup GPS fix saved (${state})`);
            } else {
              appLogger.info('Sync', 'Backup GPS fix: Indoor — skipped');
            }
          } catch (err: any) {
            appLogger.error('Sync', `Backup location classify error: ${err?.message}`);
          }
          resolve();
        },
        (error) => {
          appLogger.warn('Sync', `Backup GPS fix failed: ${error.message}`);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      );
    });
  }

  /** Public wrapper for headless task access */
  async captureBackupLocationHeadless(): Promise<void> {
    return this.captureBackupLocation();
  }

  async performSync() {
    // Prevent concurrent syncs from racing on getAllLocations / deleteLocations.
    // Three triggers can fire at once: HomeScreen 60s timer, 15min interval, BackgroundFetch.
    if (this.isSyncing) {
      appLogger.info('Sync', 'Already syncing — skipping concurrent call');
      return;
    }
    this.isSyncing = true;

    try {
      appLogger.info('Sync', 'Starting sync...');

      let locations: ReturnType<typeof databaseService.getAllLocations>;
      try {
        locations = databaseService.getAllLocations();
      } catch (dbError: any) {
        appLogger.error('Sync', `DB access failed: ${dbError?.message}`);
        return;
      }

      appLogger.info('Sync', `Found ${locations.length} locations in DB`);

      if (locations.length === 0) {
        return;
      }

      const token = storage.getString('auth_token');
      if (!token) {
        appLogger.error('Sync', 'No auth token — skipping upload');
        return;
      }

      // Timestamp must include local timezone offset, NOT UTC.
      // Backend buckets exposure by date — late-evening events for users west of UTC
      // would otherwise appear under "tomorrow", causing "yesterday's data is gone" complaints.
      const formatLocalISO = (ms: number) => {
        const d = new Date(ms);
        const pad = (n: number) => String(n).padStart(2, '0');
        const offsetMin = -d.getTimezoneOffset();
        const sign = offsetMin >= 0 ? '+' : '-';
        const oh = pad(Math.floor(Math.abs(offsetMin) / 60));
        const om = pad(Math.abs(offsetMin) % 60);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${oh}:${om}`;
      };
      const movements = locations.map((loc) => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        timestamp: formatLocalISO(loc.timestamp),
      }));

      try {
        const response = await MovementsService.uploadMovementsJson(movements);
        appLogger.info('Sync', `Upload SUCCESS: ${JSON.stringify(response)}`);

        // Only delete locations after confirmed upload — preserves data on failure
        const ids = locations.map(l => l.id!).filter(id => id !== undefined);
        databaseService.deleteLocations(ids);
        storage.set('last_upload_time', Date.now());
      } catch (error: any) {
        appLogger.error('Sync', `Upload FAILED: ${error?.message}`);
        // Locations stay in DB for next sync attempt
      }
    } finally {
      this.isSyncing = false;
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
    await backgroundSync.captureBackupLocationHeadless();
    await backgroundSync.performSync();
    BackgroundFetch.finish(taskId);
};
