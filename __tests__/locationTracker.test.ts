const mockCheck = jest.fn();
const mockRequestMultiple = jest.fn();
const mockWatchPosition = jest.fn(
  (_success: unknown, _error: unknown, _options: unknown) => 17,
);
const mockClearWatch = jest.fn();
const mockCreateChannel = jest.fn(
  async (_channel: unknown) => 'tracker_channel',
);
const mockDisplayNotification = jest.fn(
  async (_notification: { body?: string }) => undefined,
);
const mockStopForegroundService = jest.fn(async () => undefined);
const mockStorage = new Map<string, string | boolean>();

jest.mock('react-native-geolocation-service', () => ({
  __esModule: true,
  default: {
    watchPosition: mockWatchPosition,
    clearWatch: mockClearWatch,
    requestAuthorization: jest.fn(),
  },
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: mockCreateChannel,
    displayNotification: mockDisplayNotification,
    stopForegroundService: mockStopForegroundService,
  },
  AndroidForegroundServiceType: {
    FOREGROUND_SERVICE_TYPE_LOCATION: 8,
  },
  AndroidImportance: { LOW: 2 },
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getBoolean: (key: string) => {
      const value = mockStorage.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    getString: (key: string) => {
      const value = mockStorage.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    set: (key: string, value: string | boolean) => mockStorage.set(key, value),
    remove: (key: string) => mockStorage.delete(key),
  }),
}));

jest.mock('../src/services/logic/IndoorOutdoorClassifier', () => ({
  IndoorOutdoorClassifier: {
    getInstance: () => ({ classify: jest.fn() }),
  },
}));

jest.mock('../src/services/database/DatabaseService', () => ({
  databaseService: { insertLocation: jest.fn() },
}));

import { AppState, PermissionsAndroid, Platform } from 'react-native';

type LocationTrackerModule =
  typeof import('../src/services/tracking/LocationTracker');
let LocationTracker: LocationTrackerModule['LocationTracker'];

describe('LocationTracker permission flow', () => {
  beforeAll(() => {
    LocationTracker = (
      require('../src/services/tracking/LocationTracker') as LocationTrackerModule
    ).LocationTracker;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    Object.defineProperty(Platform, 'OS', { value: 'android' });
    PermissionsAndroid.check = mockCheck;
    PermissionsAndroid.requestMultiple = mockRequestMultiple;
    mockWatchPosition.mockReturnValue(17);
  });

  it('coalesces simultaneous activation into one Android permission request', async () => {
    mockCheck.mockResolvedValue(false);
    mockRequestMultiple.mockResolvedValue({
      [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]:
        PermissionsAndroid.RESULTS.GRANTED,
      [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]:
        PermissionsAndroid.RESULTS.GRANTED,
    });
    const tracker = new LocationTracker();

    await Promise.all([
      tracker.requestAndStart(),
      tracker.requestAndStart(),
      tracker.requestAndStart(),
    ]);

    expect(mockRequestMultiple).toHaveBeenCalledTimes(1);
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
  });

  it('joins an in-flight activation when the app resumes during the permission dialog', async () => {
    mockCheck.mockResolvedValue(false);
    mockRequestMultiple.mockResolvedValue({
      [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]:
        PermissionsAndroid.RESULTS.GRANTED,
      [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]:
        PermissionsAndroid.RESULTS.GRANTED,
    });
    const tracker = new LocationTracker();

    await Promise.all([tracker.requestAndStart(), tracker.resumeIfEnabled()]);

    expect(tracker.isTrackingEnabled()).toBe(true);
    expect(tracker.isTracking()).toBe(true);
    expect(mockRequestMultiple).toHaveBeenCalledTimes(1);
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
  });

  it('does not open the permission dialog when access is already granted', async () => {
    mockCheck.mockImplementation(
      async permission =>
        permission === PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );
    const tracker = new LocationTracker();

    await tracker.requestAndStart();

    expect(mockRequestMultiple).not.toHaveBeenCalled();
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
  });

  it('accepts approximate location from the single Android permission dialog', async () => {
    mockCheck.mockResolvedValue(false);
    mockRequestMultiple.mockResolvedValue({
      [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]:
        PermissionsAndroid.RESULTS.DENIED,
      [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]:
        PermissionsAndroid.RESULTS.GRANTED,
    });
    const tracker = new LocationTracker();

    await expect(tracker.requestAndStart()).resolves.toBe('granted');
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
  });

  it('resumes an enabled tracker without requesting permission again', async () => {
    mockStorage.set('location_tracking_enabled', true);
    mockCheck.mockResolvedValue(true);
    const tracker = new LocationTracker();

    await tracker.resumeIfEnabled();

    expect(mockRequestMultiple).not.toHaveBeenCalled();
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
  });

  it('recreates the native watch after a process restart with the saved preference', async () => {
    mockCheck.mockResolvedValue(true);
    const firstProcess = new LocationTracker();
    await firstProcess.requestAndStart();

    const relaunchedProcess = new LocationTracker();
    expect(relaunchedProcess.isTracking()).toBe(false);
    await relaunchedProcess.resumeIfEnabled();

    expect(relaunchedProcess.isTracking()).toBe(true);
    expect(mockWatchPosition).toHaveBeenCalledTimes(2);
    expect(mockRequestMultiple).not.toHaveBeenCalled();
  });

  it('does not leave a watch running after permission is revoked', async () => {
    mockCheck.mockResolvedValue(true);
    const tracker = new LocationTracker();
    await tracker.requestAndStart();
    mockCheck.mockResolvedValue(false);

    await expect(tracker.resumeIfEnabled()).resolves.toBe('denied');

    expect(tracker.isTracking()).toBe(false);
    expect(tracker.isTrackingEnabled()).toBe(false);
    expect(mockClearWatch).toHaveBeenCalledWith(17);
  });

  it('reports a failed watch as inactive while keeping the retry preference', async () => {
    mockCheck.mockResolvedValue(true);
    const tracker = new LocationTracker();
    const listener = jest.fn();
    tracker.addTrackingStateListener(listener);
    await tracker.requestAndStart();

    const onError = mockWatchPosition.mock.calls[0][1] as (error: Error) => void;
    onError(new Error('Location unavailable'));

    expect(tracker.isTracking()).toBe(false);
    expect(tracker.isTrackingEnabled()).toBe(true);
    expect(mockClearWatch).toHaveBeenCalledWith(17);
    expect(listener).toHaveBeenLastCalledWith(false);
    await tracker.resumeIfEnabled();
    expect(tracker.isTracking()).toBe(true);
    expect(mockRequestMultiple).not.toHaveBeenCalled();
  });

  it('retries a failed active watch and cancels a pending retry when disabled', async () => {
    jest.useFakeTimers();
    const originalAppState = AppState.currentState;
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'active',
    });
    try {
      mockCheck.mockResolvedValue(true);
      const tracker = new LocationTracker();
      await tracker.requestAndStart();
      const onError = mockWatchPosition.mock.calls[0][1] as (
        error: Error,
      ) => void;
      onError(new Error('Temporary GPS failure'));

      await jest.advanceTimersByTimeAsync(15000);
      expect(mockWatchPosition).toHaveBeenCalledTimes(2);
      expect(tracker.isTracking()).toBe(true);

      const secondError = mockWatchPosition.mock.calls[1][1] as (
        error: Error,
      ) => void;
      secondError(new Error('Temporary GPS failure'));
      tracker.stopTracking();
      await jest.advanceTimersByTimeAsync(300000);
      expect(mockWatchPosition).toHaveBeenCalledTimes(2);
    } finally {
      Object.defineProperty(AppState, 'currentState', {
        configurable: true,
        value: originalAppState,
      });
      jest.useRealTimers();
    }
  });

  it('does not create a watch after tracking is disabled during startup', async () => {
    mockCheck.mockResolvedValue(true);
    let finishNotification: (() => void) | undefined;
    mockDisplayNotification.mockImplementationOnce(
      () =>
        new Promise<undefined>(resolve => {
          finishNotification = () => resolve(undefined);
        }),
    );
    const tracker = new LocationTracker();
    const activation = tracker.requestAndStart();
    for (let attempt = 0; attempt < 10 && !finishNotification; attempt += 1) {
      await Promise.resolve();
    }
    expect(finishNotification).toBeDefined();

    tracker.stopTracking();
    finishNotification!();
    await activation;

    expect(tracker.isTracking()).toBe(false);
    expect(tracker.isTrackingEnabled()).toBe(false);
    expect(mockWatchPosition).not.toHaveBeenCalled();
  });

  it('migrates a previous permission grant without asking again', async () => {
    mockStorage.set('location_permission_granted', true);
    mockCheck.mockResolvedValue(true);
    const tracker = new LocationTracker();

    await tracker.resumeIfEnabled();

    expect(mockStorage.get('location_tracking_enabled')).toBe(true);
    expect(mockRequestMultiple).not.toHaveBeenCalled();
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
  });

  it('never places coordinates in the foreground notification', async () => {
    mockCheck.mockResolvedValue(true);
    const tracker = new LocationTracker();

    await tracker.requestAndStart();

    const notification = mockDisplayNotification.mock.calls[0]?.[0];
    expect(notification?.body).not.toMatch(/Lat:|Lng:|\d+\.\d{4}/);
  });
});
