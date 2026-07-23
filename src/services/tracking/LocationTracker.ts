import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { IndoorOutdoorClassifier } from '../logic/IndoorOutdoorClassifier';
import { databaseService } from '../database/DatabaseService';
import { Platform, PermissionsAndroid, Linking } from 'react-native';

export type LocationPermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

class LocationTracker {
  private watchId: number | null = null;
  private classifier = IndoorOutdoorClassifier.getInstance();
  private listeners: ((location: { lat: number; lng: number; state: string; speed: number; accuracy: number }) => void)[] = [];

  public addListener(callback: (location: { lat: number; lng: number; state: string; speed: number; accuracy: number }) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public isTracking(): boolean {
    return this.watchId !== null;
  }

  /**
   * Returns the current permission status without requesting it.
   * iOS: uses Geolocation.requestAuthorization — safe to call, won't show dialog if already determined.
   * Android: uses PermissionsAndroid.check.
   */
  public async getPermissionStatus(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      if (auth === 'granted') return 'granted';
      if (auth === 'denied') return 'blocked';
      if (auth === 'restricted') return 'blocked';
      return 'denied';
    }

    if (Platform.OS === 'android') {
      const fine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (fine) return 'granted';
      return 'denied';
    }

    return 'unavailable';
  }

  /**
   * Request location permission only — does NOT start tracking.
   * Use this when you need the permission state without beginning a watch.
   */
  public async requestPermissionOnly(): Promise<LocationPermissionStatus> {
    return this.requestPermissions();
  }

  /**
   * Request location permission and start tracking if granted.
   * Returns the resulting status so callers can handle 'blocked' (open Settings).
   */
  public async requestAndStart(): Promise<LocationPermissionStatus> {
    const status = await this.requestPermissions();
    if (status === 'granted') {
      await this.beginWatching();
    }
    return status;
  }

  async startTracking() {
    const status = await this.requestPermissions();
    if (status !== 'granted') {
      console.warn('Location permission denied:', status);
      if (status === 'blocked') {
        Linking.openSettings();
      }
      return;
    }
    await this.beginWatching();
  }

  stopTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    notifee.stopForegroundService();
  }

  private async beginWatching() {
    if (this.watchId !== null) return; // already tracking

    await this.startForegroundService();

    this.watchId = Geolocation.watchPosition(
      async (position) => {
        await this.handleNewLocation(position);
      },
      (error) => {
        console.error('Location error', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000,
        showLocationDialog: true,
        forceRequestLocation: true,
        useSignificantChanges: false,
      }
    );
  }

  private async handleNewLocation(position: GeoPosition) {
    const { latitude, longitude, accuracy, speed } = position.coords;
    const timestamp = position.timestamp;

    const state = await this.classifier.classify({
      latitude,
      longitude,
      accuracy,
      speed: speed || 0,
    });

    console.log(`Classified location as: ${state}`);

    if (state === 'Outdoor') {
      databaseService.insertLocation({
        latitude,
        longitude,
        accuracy,
        speed: speed || 0,
        timestamp,
        isOutdoor: 1,
      });
    }

    this.listeners.forEach((listener) =>
      listener({
        lat: latitude,
        lng: longitude,
        state,
        speed: speed || 0,
        accuracy,
      })
    );

    await this.updateNotification(latitude, longitude, state);
  }

  private async startForegroundService() {
    const channelId = await notifee.createChannel({
      id: 'tracker_channel',
      name: 'Location Tracker',
      importance: AndroidImportance.LOW,
    });

    await notifee.displayNotification({
      id: 'tracker_notification',
      title: 'Tracker is working',
      body: 'Waiting for location...',
      android: {
        channelId,
        asForegroundService: true,
        ongoing: true,
        pressAction: { id: 'default' },
      },
    });
  }

  private async updateNotification(lat: number, lng: number, state: string) {
    await notifee.displayNotification({
      id: 'tracker_notification',
      title: 'Tracker is working',
      body: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} | State: ${state}`,
      android: {
        channelId: 'tracker_channel',
        asForegroundService: true,
        ongoing: true,
        onlyAlertOnce: true,
      },
    });
  }

  private async requestPermissions(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('always');
      if (auth === 'granted') return 'granted';
      if (auth === 'denied' || auth === 'restricted') return 'blocked';
      return 'denied';
    }

    if (Platform.OS === 'android') {
      // Step 1 — foreground location (fine/coarse). On Android 11+ the background
      // permission MUST NOT be requested in the same call: the system silently
      // denies it when bundled with foreground. Request foreground first.
      const fg = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineResult = fg['android.permission.ACCESS_FINE_LOCATION'];
      if (fineResult !== PermissionsAndroid.RESULTS.GRANTED) {
        if (fineResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked';
        return 'denied';
      }

      // Step 2 — background location, requested separately and only on Android 10+
      // (API 29+). Best-effort: foreground tracking (with the foreground service)
      // still works if the user declines "Allow all the time", so a background
      // denial must not block tracking from starting.
      if (
        typeof Platform.Version === 'number' &&
        Platform.Version >= 29 &&
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      ) {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          );
        } catch {
          // ignore — foreground permission is enough to start tracking
        }
      }

      return 'granted';
    }

    return 'unavailable';
  }
}

export const locationTracker = new LocationTracker();
