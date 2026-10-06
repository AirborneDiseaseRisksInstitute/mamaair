jest.mock('react-native-background-fetch', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(async () => 2),
    finish: jest.fn(),
    NETWORK_TYPE_ANY: 1,
  },
}));

jest.mock('../src/services/database/DatabaseService', () => ({
  databaseService: {
    getLocationsForOwners: jest.fn(),
    deleteLocations: jest.fn(),
  },
}));

jest.mock('../src/store/useUserStore', () => {
  const profile = {
    backendUserId: '42',
    email: 'user@example.com',
  };
  return {
    useUserStore: { getState: () => ({ profile }) },
    __profile: profile,
  };
});

jest.mock('../src/services/api/MovementsService', () => ({
  MovementsService: {
    uploadMovementsJson: jest.fn(),
  },
}));

jest.mock('../src/store/useAuthStore', () => {
  const state = {
    token: 'access-token' as string | null,
    hydrateSession: jest.fn(async () => undefined),
  };
  return {
    storage: { set: jest.fn() },
    useAuthStore: { getState: () => state },
    __state: state,
  };
});

import { BackgroundSync } from '../src/services/sync/BackgroundSync';

const databaseMock = jest.requireMock(
  '../src/services/database/DatabaseService',
) as {
  databaseService: {
    getLocationsForOwners: jest.Mock;
    deleteLocations: jest.Mock;
  };
};
const movementsMock = jest.requireMock(
  '../src/services/api/MovementsService',
) as {
  MovementsService: { uploadMovementsJson: jest.Mock };
};
const authStoreMock = jest.requireMock('../src/store/useAuthStore') as {
  storage: { set: jest.Mock };
  __state: { token: string | null; hydrateSession: jest.Mock };
};
const userStoreMock = jest.requireMock('../src/store/useUserStore') as {
  __profile: { backendUserId: string | null; email: string | null };
};
const mockGetLocationsForOwners =
  databaseMock.databaseService.getLocationsForOwners;
const mockDeleteLocations = databaseMock.databaseService.deleteLocations;
const mockUploadMovementsJson =
  movementsMock.MovementsService.uploadMovementsJson;
const mockStorageSet = authStoreMock.storage.set;

describe('BackgroundSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStoreMock.__state.token = 'access-token';
    authStoreMock.__state.hydrateSession.mockResolvedValue(undefined);
    userStoreMock.__profile.backendUserId = '42';
    userStoreMock.__profile.email = 'user@example.com';
    mockGetLocationsForOwners.mockReturnValue([]);
    mockUploadMovementsJson.mockResolvedValue({});
  });

  it('uploads queued points with the preferred JSON contract and deletes the snapshot', async () => {
    mockGetLocationsForOwners.mockReturnValue([
      {
        id: 7,
        latitude: 35.7219,
        longitude: 51.3347,
        accuracy: 8,
        speed: 1.2,
        timestamp: Date.parse('2026-09-29T10:30:00.000Z'),
        isOutdoor: 1,
      },
    ]);
    const sync = new BackgroundSync();

    const uploaded = jest.fn();
    sync.addUploadListener(uploaded);

    await sync.performSync();

    expect(uploaded).toHaveBeenCalledTimes(1);
    expect(mockGetLocationsForOwners).toHaveBeenCalledWith([
      expect.stringMatching(/^owner:v1:/),
      expect.stringMatching(/^owner:v1:/),
    ]);

    expect(mockUploadMovementsJson).toHaveBeenCalledWith([
      {
        latitude: 35.7219,
        longitude: 51.3347,
        timestamp: '2026-09-29T10:30:00.000Z',
        indoor: false,
      },
    ]);
    expect(mockDeleteLocations).toHaveBeenCalledWith([7]);
    expect(mockStorageSet).toHaveBeenCalledWith(
      'last_upload_time',
      expect.any(Number),
    );
  });

  it('keeps queued points when the upload fails', async () => {
    mockGetLocationsForOwners.mockReturnValue([
      {
        id: 8,
        latitude: 35,
        longitude: 51,
        timestamp: Date.now(),
        isOutdoor: 1,
      },
    ]);
    mockUploadMovementsJson.mockRejectedValue(new Error('network error'));
    const sync = new BackgroundSync();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const uploaded = jest.fn();
    sync.addUploadListener(uploaded);

    await sync.performSync();

    expect(uploaded).not.toHaveBeenCalled();
    expect(mockDeleteLocations).not.toHaveBeenCalled();
    expect(mockStorageSet).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does not call the API when no locations are queued', async () => {
    const sync = new BackgroundSync();

    await sync.performSync();

    expect(mockUploadMovementsJson).not.toHaveBeenCalled();
    expect(mockDeleteLocations).not.toHaveBeenCalled();
  });

  it('keeps queued locations when there is no authenticated session', async () => {
    authStoreMock.__state.token = null;
    mockGetLocationsForOwners.mockReturnValue([
      {
        id: 9,
        latitude: 35,
        longitude: 51,
        timestamp: Date.now(),
        isOutdoor: 1,
      },
    ]);
    const sync = new BackgroundSync();

    await sync.performSync();

    expect(mockUploadMovementsJson).not.toHaveBeenCalled();
    expect(mockDeleteLocations).not.toHaveBeenCalled();
  });

  it('does not read or upload queued locations without a stable user identity', async () => {
    userStoreMock.__profile.backendUserId = null;
    userStoreMock.__profile.email = null;
    const sync = new BackgroundSync();

    await sync.performSync();

    expect(mockGetLocationsForOwners).not.toHaveBeenCalled();
    expect(mockUploadMovementsJson).not.toHaveBeenCalled();
  });

  it('coalesces location events into one scheduled upload', async () => {
    jest.useFakeTimers();
    try {
      mockGetLocationsForOwners.mockReturnValue([
        {
          id: 10,
          latitude: 35,
          longitude: 51,
          timestamp: Date.now(),
          isOutdoor: 1,
        },
      ]);
      const sync = new BackgroundSync();

      sync.scheduleSync(1000);
      sync.scheduleSync(1000);
      await jest.advanceTimersByTimeAsync(1000);

      expect(mockUploadMovementsJson).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
