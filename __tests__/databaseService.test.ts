const mockOpen = jest.fn((_options: unknown) => {
  throw new Error('Legacy database does not exist');
});

jest.mock('react-native-nitro-sqlite', () => ({
  open: (options: unknown) => mockOpen(options),
}));

type DatabaseModule = typeof import('../src/services/database/DatabaseService');

const loadDatabase = (): DatabaseModule =>
  require('../src/services/database/DatabaseService') as DatabaseModule;

const clearMMKV = (): void => {
  const mmkvMock = jest.requireMock('react-native-mmkv') as {
    __stores: Map<string, Map<string, unknown>>;
  };
  mmkvMock.__stores.clear();
};

describe('encrypted location queue', () => {
  beforeEach(() => {
    jest.resetModules();
    mockOpen.mockReset();
    mockOpen.mockImplementation((_options: unknown) => {
      throw new Error('Legacy database does not exist');
    });
    clearMMKV();
  });

  it('does not create a plaintext SQLite database on a new install', () => {
    loadDatabase();

    expect(mockOpen).toHaveBeenCalledWith({
      name: 'mamaair.sqlite',
      readOnly: true,
    });
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it('stores, scopes and deletes location points in MMKV', () => {
    const { databaseService } = loadDatabase();
    const point = {
      ownerKey: 'owner:v1:abc123',
      latitude: -1.286389,
      longitude: 36.817223,
      accuracy: 12,
      speed: 1.2,
      timestamp: 1_700_000_000_000,
      isOutdoor: 1,
    };

    databaseService.insertLocation(point);
    expect(
      databaseService.getLocationsForOwners([point.ownerKey], point.timestamp),
    ).toEqual([{ ...point, id: 1 }]);
    expect(
      databaseService.getLocationsForOwners(
        ['owner:v1:other'],
        point.timestamp,
      ),
    ).toEqual([]);

    databaseService.deleteLocations([1]);
    expect(
      databaseService.getLocationsForOwners([point.ownerKey], point.timestamp),
    ).toEqual([]);
  });

  it('removes expired points and only the requested account data', () => {
    const { databaseService, LOCATION_RETENTION_MS } = loadDatabase();
    const now = 1_800_000_000_000;
    const makePoint = (ownerKey: string, timestamp: number) => ({
      ownerKey,
      latitude: 1,
      longitude: 2,
      accuracy: 3,
      speed: 0,
      timestamp,
      isOutdoor: 1,
    });

    databaseService.insertLocation(
      makePoint('owner:v1:first', now - LOCATION_RETENTION_MS - 1),
    );
    databaseService.insertLocation(makePoint('owner:v1:first', now));
    databaseService.insertLocation(makePoint('owner:v1:second', now));

    databaseService.pruneExpiredLocations(now);
    databaseService.deleteLocationsForOwners(['owner:v1:first']);

    expect(
      databaseService.getLocationsForOwners(['owner:v1:first'], now),
    ).toEqual([]);
    expect(
      databaseService.getLocationsForOwners(['owner:v1:second'], now),
    ).toHaveLength(1);
  });

  it('migrates attributable SQLite rows and removes the plaintext database', () => {
    const legacyPoint = {
      id: 7,
      ownerKey: 'owner:v1:legacy',
      latitude: -1.2,
      longitude: 36.8,
      accuracy: 10,
      speed: 0,
      timestamp: Date.now(),
      isOutdoor: 1,
    };
    const probe = { close: jest.fn() };
    const legacyDb = {
      close: jest.fn(),
      delete: jest.fn(),
      execute: jest.fn((query: string) => {
        if (query.startsWith('PRAGMA')) {
          return {
            rows: { length: 1, item: () => ({ name: 'ownerKey' }) },
          };
        }
        if (query.startsWith('SELECT')) {
          return {
            rows: { length: 1, item: () => legacyPoint },
          };
        }
        return undefined;
      }),
    };
    mockOpen
      .mockImplementationOnce(() => probe as never)
      .mockImplementationOnce(() => legacyDb as never);

    const { databaseService } = loadDatabase();

    expect(
      databaseService.getLocationsForOwners(
        [legacyPoint.ownerKey],
        legacyPoint.timestamp,
      ),
    ).toEqual([{ ...legacyPoint, id: 1 }]);
    expect(legacyDb.delete).toHaveBeenCalledTimes(1);
  });
});
