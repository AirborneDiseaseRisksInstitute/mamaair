import {
  type NitroSQLiteConnection,
  type SQLiteValue,
  open,
} from 'react-native-nitro-sqlite';
import {
  createEncryptedMMKV,
  ENCRYPTED_LOCATION_STORAGE_ID,
} from '../storage/EncryptedStorage';

const LEGACY_DB_NAME = 'mamaair.sqlite';
const LOCATION_POINTS_KEY = 'points:v1';
const LEGACY_MIGRATION_KEY = 'legacy-sqlite-migrated:v1';
export const LOCATION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export interface LocationPoint {
  id?: number;
  ownerKey: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  timestamp: number;
  isOutdoor: number; // 1 for true, 0 for false
}

type LocationRow = LocationPoint & Record<string, SQLiteValue>;
type TableInfoRow = { name?: string } & Record<string, SQLiteValue>;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isLocationPoint = (value: unknown): value is LocationPoint => {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<LocationPoint>;
  return (
    typeof point.ownerKey === 'string' &&
    point.ownerKey.length > 0 &&
    isFiniteNumber(point.id) &&
    isFiniteNumber(point.latitude) &&
    isFiniteNumber(point.longitude) &&
    isFiniteNumber(point.accuracy) &&
    isFiniteNumber(point.speed) &&
    isFiniteNumber(point.timestamp) &&
    isFiniteNumber(point.isOutdoor)
  );
};

const locationSignature = (point: LocationPoint): string =>
  [
    point.ownerKey,
    point.latitude,
    point.longitude,
    point.timestamp,
    point.isOutdoor,
  ].join(':');

class DatabaseService {
  private readonly storage = createEncryptedMMKV({
    id: ENCRYPTED_LOCATION_STORAGE_ID,
  });

  constructor() {
    this.migrateLegacyDatabase();
    this.pruneExpiredLocations();
  }

  private readLocations(): LocationPoint[] {
    const raw = this.storage.getString(LOCATION_POINTS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter(isLocationPoint) : [];
    } catch {
      return [];
    }
  }

  private writeLocations(locations: LocationPoint[]): void {
    this.storage.set(LOCATION_POINTS_KEY, JSON.stringify(locations));
  }

  private nextId(locations: LocationPoint[]): number {
    return (
      locations.reduce(
        (largest, point) => Math.max(largest, point.id ?? 0),
        0,
      ) + 1
    );
  }

  private openLegacyDatabase(): NitroSQLiteConnection | null {
    try {
      // A read-only probe avoids creating a plaintext database on new installs.
      const probe = open({ name: LEGACY_DB_NAME, readOnly: true });
      probe.close();
      return open({ name: LEGACY_DB_NAME });
    } catch {
      return null;
    }
  }

  private ensureLegacyOwnerColumn(db: NitroSQLiteConnection): void {
    const result = db.execute<TableInfoRow>(
      'PRAGMA table_info(LocationPoints)',
    );
    let hasOwnerColumn = false;
    if (result?.rows) {
      for (let index = 0; index < result.rows.length; index += 1) {
        if (result.rows.item(index)?.name === 'ownerKey') {
          hasOwnerColumn = true;
          break;
        }
      }
    }

    if (!hasOwnerColumn) {
      db.execute('ALTER TABLE LocationPoints ADD COLUMN ownerKey TEXT');
    }
  }

  private readLegacyLocations(db: NitroSQLiteConnection): LocationPoint[] {
    const result = db.execute<LocationRow>(
      'SELECT * FROM LocationPoints WHERE ownerKey IS NOT NULL AND ownerKey != ?',
      [''],
    );
    if (!result?.rows) return [];

    const locations: LocationPoint[] = [];
    for (let index = 0; index < result.rows.length; index += 1) {
      const row = result.rows.item(index);
      if (row && isLocationPoint(row)) locations.push(row);
    }
    return locations;
  }

  private mergeLegacyLocations(locations: LocationPoint[]): void {
    if (locations.length === 0) return;
    const current = this.readLocations();
    const signatures = new Set(current.map(locationSignature));
    let nextId = this.nextId(current);

    locations.forEach(location => {
      const signature = locationSignature(location);
      if (signatures.has(signature)) return;
      current.push({ ...location, id: nextId });
      nextId += 1;
      signatures.add(signature);
    });
    this.writeLocations(current);
  }

  private migrateLegacyDatabase(): void {
    const db = this.openLegacyDatabase();
    if (!db) return;
    let deleted = false;

    try {
      if (this.storage.getBoolean(LEGACY_MIGRATION_KEY) !== true) {
        db.execute(`
          CREATE TABLE IF NOT EXISTS LocationPoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ownerKey TEXT,
            latitude REAL,
            longitude REAL,
            accuracy REAL,
            speed REAL,
            timestamp INTEGER,
            isOutdoor INTEGER
          );
        `);
        this.ensureLegacyOwnerColumn(db);
        db.execute(
          "DELETE FROM LocationPoints WHERE ownerKey IS NULL OR ownerKey = ''",
        );
        db.execute(
          'DELETE FROM LocationPoints WHERE timestamp IS NULL OR timestamp < ?',
          [Date.now() - LOCATION_RETENTION_MS],
        );
        this.mergeLegacyLocations(this.readLegacyLocations(db));
        this.storage.set(LEGACY_MIGRATION_KEY, true);
      }

      // Removing the old file also removes recoverable plaintext from deleted
      // SQLite pages and WAL files after the encrypted migration is durable.
      db.delete();
      deleted = true;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to migrate legacy location database', error);
      }
    } finally {
      if (!deleted) {
        try {
          db.close();
        } catch {
          // The next process launch will retry the idempotent migration.
        }
      }
    }
  }

  public insertLocation(point: LocationPoint): void {
    try {
      const locations = this.readLocations();
      locations.push({ ...point, id: this.nextId(locations) });
      this.writeLocations(locations);
    } catch (error) {
      if (__DEV__) console.error('Failed to insert location', error);
    }
  }

  public getLocationsForOwners(
    ownerKeys: string[],
    now = Date.now(),
  ): LocationPoint[] {
    if (ownerKeys.length === 0) return [];
    try {
      this.pruneExpiredLocations(now);
      const allowedOwners = new Set(ownerKeys);
      return this.readLocations().filter(point =>
        allowedOwners.has(point.ownerKey),
      );
    } catch (error) {
      if (__DEV__) console.error('Failed to get locations', error);
      return [];
    }
  }

  public pruneExpiredLocations(now = Date.now()): void {
    try {
      const locations = this.readLocations();
      const retained = locations.filter(
        point => point.timestamp >= now - LOCATION_RETENTION_MS,
      );
      if (retained.length !== locations.length) this.writeLocations(retained);
    } catch (error) {
      if (__DEV__) console.error('Failed to prune expired locations', error);
    }
  }

  public deleteLocationsForOwners(ownerKeys: string[]): void {
    if (ownerKeys.length === 0) return;
    try {
      const removedOwners = new Set(ownerKeys);
      this.writeLocations(
        this.readLocations().filter(
          point => !removedOwners.has(point.ownerKey),
        ),
      );
    } catch (error) {
      if (__DEV__) console.error('Failed to delete user locations', error);
    }
  }

  public deleteUnownedLocations(): void {
    try {
      this.writeLocations(
        this.readLocations().filter(point => point.ownerKey.length > 0),
      );
    } catch (error) {
      if (__DEV__) console.error('Failed to delete unowned locations', error);
    }
  }

  public deleteLocations(ids: number[]): void {
    if (ids.length === 0) return;
    try {
      const removedIds = new Set(ids);
      this.writeLocations(
        this.readLocations().filter(
          point => point.id === undefined || !removedIds.has(point.id),
        ),
      );
    } catch (error) {
      if (__DEV__) console.error('Failed to delete locations', error);
    }
  }

  public deleteAllLocations(): void {
    try {
      this.storage.remove(LOCATION_POINTS_KEY);
      this.storage.trim();
    } catch (error) {
      if (__DEV__) console.error('Failed to delete all locations', error);
    }
  }
}

export const databaseService = new DatabaseService();
