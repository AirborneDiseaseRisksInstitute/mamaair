import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import notifee, {
  AndroidForegroundServiceType,
  AndroidImportance,
} from '@notifee/react-native';
import { IndoorOutdoorClassifier } from '../logic/IndoorOutdoorClassifier';
import { databaseService } from '../database/DatabaseService';
import { AppState, Platform, PermissionsAndroid } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import i18n from 'i18next';

export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';

const permissionStorage = createMMKV({
  id: 'mamaair-location-permission',
});
const LOCATION_PERMISSION_GRANTED_KEY = 'location_permission_granted';
const LOCATION_PERMISSION_STATUS_KEY = 'location_permission_status';
const LOCATION_TRACKING_ENABLED_KEY = 'location_tracking_enabled';

const normalizeIosPermission = (status: string): LocationPermissionStatus => {
  if (status === 'granted') return 'granted';
  if (status === 'denied' || status === 'restricted') return 'blocked';
  if (status === 'disabled') return 'unavailable';
  return 'denied';
};

export class LocationTracker {
  private watchId: number | null = null;
  private classifier = IndoorOutdoorClassifier.getInstance();
  private permissionRequest: Promise<LocationPermissionStatus> | null = null;
  private activationRequest: Promise<LocationPermissionStatus> | null = null;
  private watchStartRequest: Promise<void> | null = null;
  private watchGeneration = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelayMs = 15000;
  private trackingStateListeners = new Set<(active: boolean) => void>();
  private lastKnownPermissionStatus: LocationPermissionStatus | null =
    (permissionStorage.getString(LOCATION_PERMISSION_STATUS_KEY) as
      | LocationPermissionStatus
      | undefined) ??
    (permissionStorage.getBoolean(LOCATION_PERMISSION_GRANTED_KEY)
      ? 'granted'
      : null);
  private listeners: ((location: {
    lat: number;
    lng: number;
    state: string;
    speed: number;
    accuracy: number;
  }) => void)[] = [];

  public addListener(
    callback: (location: {
      lat: number;
      lng: number;
      state: string;
      speed: number;
      accuracy: number;
    }) => void,
  ) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public isTracking(): boolean {
    return this.watchId !== null;
  }

  public addTrackingStateListener(listener: (active: boolean) => void) {
    this.trackingStateListeners.add(listener);
    return () => this.trackingStateListeners.delete(listener);
  }

  public isTrackingEnabled(): boolean {
    const storedPreference = permissionStorage.getBoolean(
      LOCATION_TRACKING_ENABLED_KEY,
    );
    if (storedPreference !== undefined) return storedPreference;

    // Existing installs only stored a successful permission grant. Treat that
    // as the previous tracking preference so an app update does not ask again.
    const legacyPreference =
      permissionStorage.getBoolean(LOCATION_PERMISSION_GRANTED_KEY) ?? false;
    if (legacyPreference) {
      permissionStorage.set(LOCATION_TRACKING_ENABLED_KEY, true);
    }
    return legacyPreference;
  }

  /**
   * Returns the current permission status without requesting it.
   * iOS: only re-check native authorization after a previous grant is known;
   * this avoids triggering the initial system prompt before the user taps
   * Allow in our own location sheet.
   * Android: uses PermissionsAndroid.check.
   */
  public async getPermissionStatus(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'ios') {
      if (this.lastKnownPermissionStatus !== 'granted' && !this.isTracking()) {
        return 'denied';
      }

      const auth = await Geolocation.requestAuthorization('whenInUse');
      return this.rememberPermissionStatus(normalizeIosPermission(auth));
    }

    if (Platform.OS === 'android') {
      const [fine, coarse] = await Promise.all([
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ),
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ),
      ]);
      if (fine || coarse) {
        return this.rememberPermissionStatus('granted');
      }
      return this.rememberPermissionStatus(
        this.lastKnownPermissionStatus === 'blocked' ? 'blocked' : 'denied',
      );
    }

    return 'unavailable';
  }

  /**
   * Request location permission and start tracking if granted.
   * Returns the resulting status so callers can handle 'blocked' (open Settings).
   */
  public async requestAndStart(): Promise<LocationPermissionStatus> {
    if (this.activationRequest) return this.activationRequest;

    this.activationRequest = this.activate().finally(() => {
      this.activationRequest = null;
    });
    return this.activationRequest;
  }

  public async resumeIfEnabled(): Promise<LocationPermissionStatus> {
    if (this.activationRequest) return this.activationRequest;
    if (!this.isTrackingEnabled()) {
      return this.getPermissionStatus();
    }

    const status = await this.getPermissionStatus();
    if (status === 'granted') {
      try {
        await this.beginWatching();
      } catch (error) {
        this.scheduleRetry();
        throw error;
      }
    } else {
      this.watchGeneration += 1;
      this.clearActiveWatch();
      if (status !== 'blocked') this.setTrackingEnabled(false);
    }
    return status;
  }

  public stopTracking() {
    this.watchGeneration += 1;
    this.setTrackingEnabled(false);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.retryDelayMs = 15000;
    this.clearActiveWatch();
  }

  private scheduleRetry() {
    if (
      this.retryTimer ||
      !this.isTrackingEnabled() ||
      AppState.currentState !== 'active'
    ) {
      return;
    }
    const delay = this.retryDelayMs;
    this.retryDelayMs = Math.min(delay * 2, 300000);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.isTrackingEnabled() || AppState.currentState !== 'active') {
        return;
      }
      this.resumeIfEnabled().catch(error => {
        console.warn('[LocationTracker] Retry failed', error);
      });
    }, delay);
  }

  private clearActiveWatch() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.trackingStateListeners.forEach(listener => listener(false));
    }
    if (Platform.OS === 'android') {
      notifee.stopForegroundService().catch(() => {});
    }
  }

  public reset() {
    this.stopTracking();
    permissionStorage.remove(LOCATION_PERMISSION_STATUS_KEY);
    permissionStorage.remove(LOCATION_PERMISSION_GRANTED_KEY);
    this.lastKnownPermissionStatus = null;
  }

  private async activate(): Promise<LocationPermissionStatus> {
    this.setTrackingEnabled(true);
    const status = await this.requestPermissions();
    if (status === 'granted') {
      try {
        await this.beginWatching();
      } catch (error) {
        this.setTrackingEnabled(false);
        throw error;
      }
    } else if (status !== 'blocked') {
      this.setTrackingEnabled(false);
    }
    return status;
  }

  private async beginWatching(): Promise<void> {
    if (this.watchId !== null || !this.isTrackingEnabled()) return;
    if (this.watchStartRequest) {
      await this.watchStartRequest;
      return this.beginWatching();
    }

    const request = this.startWatching();
    this.watchStartRequest = request;
    try {
      await request;
    } finally {
      if (this.watchStartRequest === request) this.watchStartRequest = null;
    }
  }

  private async startWatching() {
    if (this.watchId !== null) return;
    const generation = this.watchGeneration;

    try {
      if (Platform.OS === 'android') {
        await this.startForegroundService();
      }

      if (generation !== this.watchGeneration || !this.isTrackingEnabled()) {
        if (Platform.OS === 'android') {
          await notifee.stopForegroundService().catch(() => {});
        }
        return;
      }

      let watchId: number | null = null;
      watchId = Geolocation.watchPosition(
        async position => {
          this.retryDelayMs = 15000;
          await this.handleNewLocation(position);
        },
        error => {
          console.error('Location error', error);
          if (watchId !== null && this.watchId === watchId) {
            this.clearActiveWatch();
            this.scheduleRetry();
          }
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          fastestInterval: 2000,
          showLocationDialog: true,
          forceRequestLocation: true,
          useSignificantChanges: false,
        },
      );
      this.watchId = watchId;
      this.trackingStateListeners.forEach(listener => listener(true));
    } catch (error) {
      if (Platform.OS === 'android') {
        await notifee.stopForegroundService().catch(() => {});
      }
      throw error;
    }
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

    this.listeners.forEach(listener =>
      listener({
        lat: latitude,
        lng: longitude,
        state,
        speed: speed || 0,
        accuracy,
      }),
    );
  }

  private async startForegroundService() {
    const channelId = await notifee.createChannel({
      id: 'tracker_channel',
      name: String(i18n.t('location.tracking_notification_channel')),
      importance: AndroidImportance.LOW,
    });

    await notifee.displayNotification({
      id: 'tracker_notification',
      title: String(i18n.t('location.tracking_notification_title')),
      body: String(i18n.t('location.tracking_notification_body')),
      android: {
        channelId,
        asForegroundService: true,
        foregroundServiceTypes: [
          AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION,
        ],
        ongoing: true,
        pressAction: { id: 'default' },
      },
    });
  }

  private async requestPermissions(): Promise<LocationPermissionStatus> {
    if (this.permissionRequest) {
      return this.permissionRequest;
    }

    this.permissionRequest = this.getPermissionStatus()
      .then(status =>
        status === 'denied' ? this.performPermissionRequest() : status,
      )
      .then(status => this.rememberPermissionStatus(status))
      .finally(() => {
        this.permissionRequest = null;
      });

    return this.permissionRequest;
  }

  private async performPermissionRequest(): Promise<LocationPermissionStatus> {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return normalizeIosPermission(auth);
    }

    if (Platform.OS === 'android') {
      const fg = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineResult = fg['android.permission.ACCESS_FINE_LOCATION'];
      const coarseResult = fg['android.permission.ACCESS_COARSE_LOCATION'];
      if (
        fineResult === PermissionsAndroid.RESULTS.GRANTED ||
        coarseResult === PermissionsAndroid.RESULTS.GRANTED
      ) {
        return 'granted';
      }
      if (
        fineResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        coarseResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      ) {
        return 'blocked';
      }
      return 'denied';
    }

    return 'unavailable';
  }

  private rememberPermissionStatus(
    status: LocationPermissionStatus,
  ): LocationPermissionStatus {
    this.lastKnownPermissionStatus = status;
    permissionStorage.set(LOCATION_PERMISSION_STATUS_KEY, status);

    if (status === 'granted') {
      permissionStorage.set(LOCATION_PERMISSION_GRANTED_KEY, true);
    } else {
      permissionStorage.remove(LOCATION_PERMISSION_GRANTED_KEY);
    }

    return status;
  }

  private setTrackingEnabled(enabled: boolean) {
    permissionStorage.set(LOCATION_TRACKING_ENABLED_KEY, enabled);
  }
}

export const locationTracker = new LocationTracker();
