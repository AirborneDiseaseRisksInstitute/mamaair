import { storage } from '../../store/useAuthStore';

// react-native-quick-sqlite (v8.2.7) is officially deprecated by margelo and
// incompatible with React Native 0.83's bridgeless mode — its JSI host objects
// install on the legacy bridge path, racing with the bridgeless runtime
// lifecycle. The result is a hard native SIGSEGV the first time a write hits
// the connection (in our case: first GPS fix → insertLocation, which matches
// every crash report we have from real devices).
//
// MMKV is already used elsewhere in this app and is fully bridgeless-native
// (via react-native-nitro-modules). Backing the LocationPoint store with MMKV
// removes the broken dependency entirely while keeping the public API
// identical — no other call site needs to change.

export interface LocationPoint {
  id?: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  timestamp: number;
  isOutdoor: number; // 1 for true, 0 for false
}

const POINTS_KEY = 'location_points_v1';
const NEXT_ID_KEY = 'location_points_next_id_v1';

function readAll(): LocationPoint[] {
  const raw = storage.getString(POINTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocationPoint[]) : [];
  } catch {
    return [];
  }
}

function writeAll(points: LocationPoint[]) {
  storage.set(POINTS_KEY, JSON.stringify(points));
}

function nextId(): number {
  const current = storage.getNumber(NEXT_ID_KEY) || 0;
  const id = current + 1;
  storage.set(NEXT_ID_KEY, id);
  return id;
}

class DatabaseService {
  public insertLocation(point: LocationPoint) {
    try {
      const points = readAll();
      points.push({ ...point, id: nextId() });
      writeAll(points);
    } catch (e) {
      console.error('Failed to insert location', e);
    }
  }

  public getAllLocations(): LocationPoint[] {
    try {
      return readAll();
    } catch (e) {
      console.error('Failed to get locations', e);
      return [];
    }
  }

  public deleteLocations(ids: number[]) {
    if (ids.length === 0) return;
    try {
      const toDelete = new Set(ids);
      const remaining = readAll().filter((p) => p.id === undefined || !toDelete.has(p.id));
      writeAll(remaining);
    } catch (e) {
      console.error('Failed to delete locations', e);
    }
  }

  public deleteAllLocations() {
    try {
      storage.set(POINTS_KEY, '[]');
    } catch (e) {
      console.error('Failed to delete all locations', e);
    }
  }
}

export const databaseService = new DatabaseService();
