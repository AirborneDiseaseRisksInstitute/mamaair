import BackgroundFetch from 'react-native-background-fetch';
import RNFS from 'react-native-fs';
import { databaseService } from '../database/DatabaseService';
import { MovementsService } from '../api/MovementsService';
import { storage } from '../../store/useAuthStore';

class BackgroundSync {
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
        await this.performSync();
        BackgroundFetch.finish(taskId);
      },
      (error) => {
        console.error('[BackgroundFetch] configure error: ', error);
      }
    );
  }

  async performSync() {
    console.log('[BackgroundSync] Starting sync...');
    const locations = databaseService.getAllLocations();

    if (locations.length === 0) {
      console.log('[BackgroundSync] No locations to upload.');
      return;
    }

    try {
      // Generate CSV
      // Headers: latitude,longitude,timestamp
      const header = 'latitude,longitude,timestamp\n';
      const rows = locations
        .map((loc) => {
            const isoTime = new Date(loc.timestamp).toISOString();
            return `${loc.latitude},${loc.longitude},${isoTime}`;
        })
        .join('\n');

      const csvContent = header + rows;
      const path = `${RNFS.DocumentDirectoryPath}/movements.csv`;

      await RNFS.writeFile(path, csvContent, 'utf8');

      // Upload
      await MovementsService.uploadMovements(path);

      // On Success
      console.log('[BackgroundSync] Upload successful.');
      
      // Delete uploaded rows
      // Ideally we should delete only the ones we fetched.
      // Since getAllLocations returns all, we can delete all or by ID.
      // To be safe against race conditions (new points added during upload), we should delete by ID.
      const ids = locations.map(l => l.id!).filter(id => id !== undefined);
      databaseService.deleteLocations(ids);

      // Update Last Upload Time
      storage.set('last_upload_time', Date.now());

      // Cleanup file
      await RNFS.unlink(path);

    } catch (error) {
      console.error('[BackgroundSync] Sync failed', error);
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
    await backgroundSync.performSync();
    BackgroundFetch.finish(taskId);
};
