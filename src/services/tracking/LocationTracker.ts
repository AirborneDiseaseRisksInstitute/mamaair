// Swapped from react-native-geolocation-service (Agontuk, unmaintained since 2022,
// known IncompatibleClassChangeError on Play Services version mismatch — exact
// crash signature on customer's CIS device) to @react-native-community/geolocation
// which uses Android's built-in LocationManager (no Play Services dependency).
import Geolocation from '@react-native-community/geolocation';
type GeoPosition = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number | null;
    altitude?: number | null;
    heading?: number | null;
  };
  timestamp: number;
};
import notifee, { AndroidImportance } from '@notifee/react-native';
import { IndoorOutdoorClassifier } from '../logic/IndoorOutdoorClassifier';
import { databaseService } from '../database/DatabaseService';
import { storage } from '../../store/useAuthStore';
import { AppState, Platform, PermissionsAndroid, Linking } from 'react-native';
import { appLogger } from '../logger/AppLogger';
import { MotionGate, type MotionEvent } from './MotionGate';

// Android 14+ throws ForegroundServiceStartNotAllowedException if FGS is started while
// the app is briefly transitioning to background (e.g. immediately after a permission
// dialog dismisses). Wait until AppState reports 'active' before starting the service.
const FGS_FOREGROUND_WAIT_MS = 4000;
async function waitForForegroundState(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (AppState.currentState === 'active') return true;
  return new Promise<boolean>((resolve) => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        sub.remove();
        clearTimeout(timer);
        resolve(true);
      }
    });
    const timer = setTimeout(() => {
      sub.remove();
      resolve(AppState.currentState === 'active');
    }, FGS_FOREGROUND_WAIT_MS);
  });
}

/**
 * Motion-gated location tracker.
 *
 * State machine:
 *   ACTIVE — watchPosition + foreground service running. Battery is consumed.
 *   IDLE   — watchPosition stopped, FGS stopped. MotionGate still listening.
 *            Significant motion / activity transition wakes us back to ACTIVE.
 *
 * Transitions driven by MotionGate:
 *   • walking / running / vehicle / bicycle / sigmotion → ACTIVE (reset stop timer)
 *   • still                                            → schedule stop timer (60m)
 *                                                         on expiry → IDLE
 *
 * Initial state is ACTIVE for STARTUP_GRACE_MS so we always capture a fresh
 * location after sign-in / app open, even before any motion event arrives.
 */

const STOP_TIMER_MS = 60 * 60 * 1000; // 60 min still → idle
const STARTUP_GRACE_MS = 60 * 60 * 1000; // First hour after start: stay active regardless

type Mode = 'active' | 'idle' | 'stopped';

class LocationTracker {
  private watchId: number | null = null;
  private classifier = IndoorOutdoorClassifier.getInstance();
  private listeners: ((location: { lat: number; lng: number; state: string; speed: number; accuracy: number }) => void)[] = [];
  private mode: Mode = 'stopped';
  // Timestamp (ms epoch) at which we should transition to IDLE if no motion happens.
  // Using a wall-clock timestamp instead of setTimeout because setTimeout is unreliable
  // when JS thread is suspended (Doze, background). We check on every motion event.
  private stopAt: number | null = null;
  private stopCheckIntervalId: ReturnType<typeof setInterval> | null = null;
  private startedAt: number = 0;
  private motionUnsubscribe: (() => void) | null = null;
  // Permanent flag set when user denied location permission — stops watchdog from
  // re-prompting every 5 minutes. Reset only on next app open (constructor).
  private permissionPermanentlyDenied: boolean = false;

  public isPermissionPermanentlyDenied(): boolean {
    return this.permissionPermanentlyDenied;
  }

  public addListener(callback: (location: { lat: number; lng: number; state: string; speed: number; accuracy: number }) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public isTracking(): boolean {
    return this.mode !== 'stopped';
  }

  public getMode(): Mode {
    return this.mode;
  }

  async startTracking() {
    // Outer try/catch — this runs at app/onboarding boundary and must NEVER
    // throw past the caller. A native FGS failure on Android 14+ can otherwise
    // tear down the JS bridge before HomeScreen finishes mounting.
    try {
      appLogger.info('Tracker', 'startTracking called');

      // Auth guard
      const token = storage.getString('auth_token');
      if (!token) {
        appLogger.warn('Tracker', 'No auth token — tracking not started');
        return;
      }

      if (this.mode !== 'stopped') {
        appLogger.info('Tracker', `Already started (mode=${this.mode}), skipping`);
        return;
      }

      // Set mode immediately to block re-entry / racing motion events.
      // Actual GPS/FGS startup is async below.
      this.mode = 'active';
      this.startedAt = Date.now();
      this.stopAt = this.startedAt + STARTUP_GRACE_MS;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        appLogger.warn('Tracker', 'Location permission denied — tracker will stay stopped until next app launch');
        this.permissionPermanentlyDenied = true;
        this.mode = 'stopped';
        return;
      }

      // Android 13+ requires POST_NOTIFICATIONS to display the FGS notification.
      try {
        const notifSettings = await notifee.requestPermission();
        appLogger.info('Tracker', `Notification permission: authStatus=${notifSettings.authorizationStatus}`);
      } catch (err: any) {
        appLogger.warn('Tracker', `requestPermission failed: ${err?.message}`);
      }

      // MotionGate uses only TYPE_SIGNIFICANT_MOTION (no Play Services, no
      // ACTIVITY_RECOGNITION permission needed). Best-effort: tracker still
      // works in always-active mode if the sensor isn't available.
      if (MotionGate.isAvailable()) {
        try {
          await MotionGate.start();
          this.motionUnsubscribe = MotionGate.addListener((e) => this.onMotionEvent(e));
          appLogger.info('Tracker', 'MotionGate started (TYPE_SIGNIFICANT_MOTION)');
        } catch (err: any) {
          appLogger.warn('Tracker', `MotionGate failed to start: ${err?.message}`);
        }
      } else {
        appLogger.info('Tracker', 'MotionGate unavailable — always-active mode');
      }

      // Start the wall-clock idle checker — runs while app is foreground;
      // for background, AR/sigmotion events themselves trigger the same check.
      this.startStopChecker();

      // Enter ACTIVE: GPS + FGS
      await this.enterActive();
    } catch (err: any) {
      appLogger.error('Tracker', `startTracking fatal-caught: ${err?.message || err}`);
      this.mode = 'stopped';
    }
  }

  stopTracking() {
    appLogger.info('Tracker', 'stopTracking called');
    this.stopAt = null;
    this.stopStopChecker();
    this.exitActive();
    this.mode = 'stopped';

    if (this.motionUnsubscribe) {
      this.motionUnsubscribe();
      this.motionUnsubscribe = null;
    }
    MotionGate.stop().catch(() => {});

    // Clear listeners to prevent leaks across logout/login
    this.listeners = [];
  }

  private onMotionEvent(event: MotionEvent) {
    appLogger.info('Tracker', `Motion event: type=${event.type}`);

    // Only signal we get now is sigmotion (TYPE_SIGNIFICANT_MOTION).
    // STILL transitions are inferred from absence of motion — startStopChecker
    // polls every 5 min, and once stopAt elapses without a refreshing event,
    // the tracker drops to idle.
    if (event.type === 'sigmotion') {
      this.stopAt = Date.now() + STOP_TIMER_MS;
      if (this.mode === 'idle') {
        appLogger.info('Tracker', 'Motion → IDLE→ACTIVE');
        this.enterActive().catch((err) =>
          appLogger.error('Tracker', `enterActive failed: ${err?.message}`)
        );
      }
    }
  }

  private startStopChecker() {
    if (this.stopCheckIntervalId !== null) return;
    // Check every 5 min while app/JS is alive. If JS is suspended (Doze),
    // motion events themselves call checkStopDeadline.
    this.stopCheckIntervalId = setInterval(() => this.checkStopDeadline(), 5 * 60 * 1000);
  }

  private stopStopChecker() {
    if (this.stopCheckIntervalId !== null) {
      clearInterval(this.stopCheckIntervalId);
      this.stopCheckIntervalId = null;
    }
  }

  private checkStopDeadline() {
    if (this.mode !== 'active' || this.stopAt === null) return;
    if (Date.now() >= this.stopAt) {
      appLogger.info('Tracker', 'Stop deadline reached → ACTIVE→IDLE');
      this.enterIdle();
    }
  }

  private async enterActive() {
    if (this.watchId !== null) {
      this.mode = 'active'; // ensure consistency
      return;
    }

    if (Platform.OS === 'android') {
      try {
        await this.startForegroundService();
      } catch (err: any) {
        appLogger.warn('Tracker', `FGS start failed: ${err?.message}`);
      }
    }

    this.watchId = Geolocation.watchPosition(
      async (position) => {
        try {
          appLogger.info('Tracker', `GPS fix: ${position?.coords?.latitude?.toFixed(5)}, ${position?.coords?.longitude?.toFixed(5)} acc=${position?.coords?.accuracy?.toFixed(1)}`);
          await this.handleNewLocation(position);
        } catch (err: any) {
          appLogger.error('Tracker', `handleNewLocation error: ${err?.message}`);
        }
      },
      (error: any) => {
        // Defensive: error object from native may be malformed on some OEMs (Xiaomi/OPPO),
        // missing .code or .message — accessing those throws and tears down the JS bridge.
        try {
          const code = error?.code ?? '?';
          const message = error?.message ?? String(error ?? 'unknown');
          appLogger.error('Tracker', `GPS error: ${code} ${message}`);
        } catch {}
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        useSignificantChanges: false,
        // interval / fastestInterval / showLocationDialog / forceRequestLocation
        // were react-native-geolocation-service specific (Play Services-only).
        // Default Android LocationManager polling is fine for our use case.
      }
    );
    this.mode = 'active';
    appLogger.info('Tracker', `Mode=ACTIVE watchId=${this.watchId} stopAt=${this.stopAt ? new Date(this.stopAt).toISOString() : 'null'}`);
  }

  private enterIdle() {
    this.exitActive();
    this.mode = 'idle';
    appLogger.info('Tracker', 'Mode=IDLE (waiting for motion)');
  }

  private exitActive() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (Platform.OS === 'android') {
      notifee.stopForegroundService().catch(() => {});
      notifee.cancelNotification('tracker_notification').catch(() => {});
    }
  }

  private async handleNewLocation(position: GeoPosition) {
    const { latitude, longitude, accuracy, speed } = position.coords;
    const timestamp = position.timestamp;

    let state: string;
    try {
      state = await this.classifier.classify({
        latitude,
        longitude,
        accuracy,
        speed: speed || 0,
      });
    } catch (classifyError: any) {
      appLogger.error('Tracker', `Classifier failed: ${classifyError?.message}`);
      state = 'Unknown';
    }

    appLogger.info('Tracker', `Classified: ${state} | acc=${accuracy?.toFixed(1)} spd=${(speed || 0).toFixed(1)}`);

    if (state !== 'Indoor') {
      databaseService.insertLocation({
        latitude,
        longitude,
        accuracy,
        speed: speed || 0,
        timestamp,
        isOutdoor: state === 'Outdoor' ? 1 : 0,
      });
      appLogger.info('Tracker', `Point saved to DB (${state})`);
    } else {
      appLogger.info('Tracker', 'Indoor — skipped');
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
    // Android 14+ throws ForegroundServiceStartNotAllowedException (fatal) if the
    // app isn't strictly in foreground at the moment displayNotification(asForegroundService)
    // resolves natively. Wait for AppState='active' (or skip silently if we time out —
    // the watchdog in HomeScreen will retry once user returns).
    const isForeground = await waitForForegroundState();
    if (!isForeground) {
      appLogger.warn('Tracker', 'Skipping FGS start — app not foregrounded after permission grant');
      return;
    }

    appLogger.info('Tracker', 'FGS: createChannel');
    const channelId = await notifee.createChannel({
      id: 'tracker_channel',
      name: 'Location Tracker',
      importance: AndroidImportance.LOW,
    });

    appLogger.info('Tracker', 'FGS: displayNotification(asForegroundService)');
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
    appLogger.info('Tracker', 'FGS: started OK');
  }

  private async updateNotification(lat: number, lng: number, state: string) {
    if (this.watchId === null) return;
    try {
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
    } catch (err: any) {
      appLogger.warn('Tracker', `updateNotification failed: ${err?.message || err}`);
    }
  }

  private async requestPermissions() {
    if (Platform.OS === 'ios') {
      // @react-native-community/geolocation: requestAuthorization(success, error) iOS-style
      return new Promise<boolean>((resolve) => {
        Geolocation.requestAuthorization(
          () => resolve(true),
          () => resolve(false),
        );
      });
    }

    if (Platform.OS === 'android') {
      // Step 1: foreground permission. Android only shows "While using app" / "Don't allow"
      // here on API 30+ — "Allow all the time" was moved to Settings.
      const foreground = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
      const fineGranted =
        foreground['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
      if (!fineGranted) return false;

      // Step 2: background permission flow differs by API level.
      //  - API 29 (Android 10): inline runtime dialog works; call request() directly.
      //  - API 30+ (Android 11+): system intentionally suppresses the dialog and
      //    returns DENIED. The only way to upgrade to "Allow all the time" is to send
      //    the user into the app's Location settings via Linking.openSettings().
      //    PermissionsAndroid.request() must NOT be called together with FINE on API 30+
      //    or both are silently rejected (Android docs / RN PermissionsAndroid).
      try {
        const bgPerm = 'android.permission.ACCESS_BACKGROUND_LOCATION' as any;
        const alreadyGranted = await PermissionsAndroid.check(bgPerm);
        if (!alreadyGranted) {
          if (Platform.Version === 29) {
            await PermissionsAndroid.request(bgPerm, {
              title: 'Background location',
              message:
                'MamaAir needs background location access to keep monitoring air-quality exposure when the app is closed.',
              buttonPositive: 'Allow',
              buttonNegative: 'Not now',
            });
          } else if (Platform.Version >= 30) {
            // Open Settings — caller (HomeScreen) shows an explanatory sheet before
            // this point so the user knows what to pick on the Settings screen.
            appLogger.info('Tracker', 'Opening Settings for ACCESS_BACKGROUND_LOCATION upgrade');
            await Linking.openSettings();
          }
        }
      } catch (err: any) {
        appLogger.warn('Tracker', `Background permission flow error: ${err?.message}`);
      }

      // Tracker continues even if user picked "While using app" — FGS still keeps it
      // alive while the app is in the recent list. BackgroundFetch covers killed-app
      // gaps with periodic backup fixes.
      return true;
    }
    return false;
  }
}

export const locationTracker = new LocationTracker();
