import { formatLocalDate } from '../../utils/dateUtils';
import {
  createEncryptedMMKV,
  ENCRYPTED_MOVEMENT_HISTORY_STORAGE_ID,
} from '../storage/EncryptedStorage';

const MOVEMENT_HISTORY_KEY = 'daily-distance:v1';
const MOVEMENT_HISTORY_RETENTION_DAYS = 365;

interface StoredMovementDay {
  date: string;
  distanceMeters: number;
  sampleCount: number;
  updatedAt: number;
}

type StoredMovementHistory = Record<string, Record<string, StoredMovementDay>>;

interface MovementLocationSample {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface DailyMovementSummary {
  date: string;
  distanceMeters: number | null;
  sampleCount: number;
}

export interface WeeklyMovementSummary {
  days: DailyMovementSummary[];
  totalDistanceMeters: number;
  recordedDays: number;
}

const isFiniteNonNegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isDateKey = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isStoredMovementDay = (value: unknown): value is StoredMovementDay => {
  if (!value || typeof value !== 'object') return false;
  const day = value as Partial<StoredMovementDay>;
  return (
    isDateKey(day.date) &&
    isFiniteNonNegative(day.distanceMeters) &&
    isFiniteNonNegative(day.sampleCount) &&
    isFiniteNonNegative(day.updatedAt)
  );
};

const distanceBetween = (
  first: MovementLocationSample,
  second: MovementLocationSample,
): number => {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  const normalizedHaversine = Math.min(1, Math.max(0, haversine));

  return (
    earthRadiusMeters *
    2 *
    Math.atan2(
      Math.sqrt(normalizedHaversine),
      Math.sqrt(1 - normalizedHaversine),
    )
  );
};

const emptyWeek = (dates: string[]): WeeklyMovementSummary => ({
  days: dates.map(date => ({
    date,
    distanceMeters: null,
    sampleCount: 0,
  })),
  totalDistanceMeters: 0,
  recordedDays: 0,
});

export class MovementHistoryRepository {
  private readonly storage = createEncryptedMMKV({
    id: ENCRYPTED_MOVEMENT_HISTORY_STORAGE_ID,
  });

  // The previous coordinate is intentionally process-only. Persisted history
  // contains daily aggregates, never a second copy of an uploaded route.
  private readonly lastSamples = new Map<string, MovementLocationSample>();
  private readonly listeners = new Set<(ownerKey: string) => void>();

  public recordLocation(
    ownerKey: string,
    sample: MovementLocationSample,
  ): void {
    if (
      !ownerKey ||
      !Number.isFinite(sample.latitude) ||
      !Number.isFinite(sample.longitude) ||
      !Number.isFinite(sample.timestamp)
    ) {
      return;
    }
    const observedAt = new Date(sample.timestamp);
    if (Number.isNaN(observedAt.getTime())) return;

    const previous = this.lastSamples.get(ownerKey);
    if (previous && sample.timestamp <= previous.timestamp) return;

    const date = formatLocalDate(observedAt);
    const previousDate = previous
      ? formatLocalDate(new Date(previous.timestamp))
      : null;
    const segmentDistance =
      previous && previousDate === date ? distanceBetween(previous, sample) : 0;
    this.lastSamples.set(ownerKey, sample);

    const history = this.readHistory();
    const ownerHistory = history[ownerKey] ?? {};
    const current = ownerHistory[date];
    ownerHistory[date] = {
      date,
      distanceMeters:
        (current?.distanceMeters ?? 0) +
        (Number.isFinite(segmentDistance) ? segmentDistance : 0),
      sampleCount: (current?.sampleCount ?? 0) + 1,
      updatedAt: sample.timestamp,
    };
    history[ownerKey] = ownerHistory;
    this.writeHistory(this.prune(history, sample.timestamp));
    this.notify(ownerKey);
  }

  public mergeDailyDistance(
    ownerKey: string,
    date: string,
    distanceMeters: number,
    updatedAt = Date.now(),
  ): void {
    if (!ownerKey || !isDateKey(date) || !isFiniteNonNegative(distanceMeters)) {
      return;
    }

    const history = this.readHistory();
    const ownerHistory = history[ownerKey] ?? {};
    const current = ownerHistory[date];
    const nextDistance = Math.max(current?.distanceMeters ?? 0, distanceMeters);
    if (current && current.distanceMeters === nextDistance) return;

    ownerHistory[date] = {
      date,
      distanceMeters: nextDistance,
      sampleCount: current?.sampleCount ?? 0,
      updatedAt,
    };
    history[ownerKey] = ownerHistory;
    this.writeHistory(this.prune(history, updatedAt));
    this.notify(ownerKey);
  }

  public getWeeklySummary(
    ownerKeys: string[],
    dates: string[],
  ): WeeklyMovementSummary {
    if (ownerKeys.length === 0 || dates.length === 0) return emptyWeek(dates);

    const history = this.readHistory();
    const days = dates.map(date => {
      const records = ownerKeys
        .map(ownerKey => history[ownerKey]?.[date])
        .filter((record): record is StoredMovementDay => Boolean(record));
      // Backend-id and email keys can identify the same account during profile
      // hydration. Prefer the most complete aggregate instead of double-counting.
      return {
        date,
        distanceMeters:
          records.length === 0
            ? null
            : Math.max(...records.map(record => record.distanceMeters)),
        sampleCount:
          records.length === 0
            ? 0
            : Math.max(...records.map(record => record.sampleCount)),
      };
    });

    return {
      days,
      totalDistanceMeters: days.reduce(
        (total, day) => total + (day.distanceMeters ?? 0),
        0,
      ),
      recordedDays: days.filter(day => day.distanceMeters !== null).length,
    };
  }

  public addChangeListener(listener: (ownerKey: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public resetTrackingSession(): void {
    this.lastSamples.clear();
  }

  public clearOwners(ownerKeys: string[]): void {
    if (ownerKeys.length === 0) return;
    const history = this.readHistory();
    let changed = false;
    ownerKeys.forEach(ownerKey => {
      this.lastSamples.delete(ownerKey);
      if (history[ownerKey]) {
        delete history[ownerKey];
        changed = true;
      }
    });
    if (changed) this.writeHistory(history);
  }

  public clearAll(): void {
    this.lastSamples.clear();
    this.storage.remove(MOVEMENT_HISTORY_KEY);
    this.storage.trim();
  }

  private readHistory(): StoredMovementHistory {
    const raw = this.storage.getString(MOVEMENT_HISTORY_KEY);
    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(parsed).flatMap(([ownerKey, value]) => {
          if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return [];
          }
          const days = Object.fromEntries(
            Object.entries(value).filter(
              (entry): entry is [string, StoredMovementDay] =>
                isStoredMovementDay(entry[1]) && entry[0] === entry[1].date,
            ),
          );
          return [[ownerKey, days]];
        }),
      );
    } catch {
      return {};
    }
  }

  private writeHistory(history: StoredMovementHistory): void {
    this.storage.set(MOVEMENT_HISTORY_KEY, JSON.stringify(history));
  }

  private prune(
    history: StoredMovementHistory,
    now: number,
  ): StoredMovementHistory {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - MOVEMENT_HISTORY_RETENTION_DAYS);
    const cutoffDate = formatLocalDate(cutoff);

    return Object.fromEntries(
      Object.entries(history).flatMap(([ownerKey, days]) => {
        const retained = Object.fromEntries(
          Object.entries(days).filter(([date]) => date >= cutoffDate),
        );
        return Object.keys(retained).length > 0 ? [[ownerKey, retained]] : [];
      }),
    );
  }

  private notify(ownerKey: string): void {
    this.listeners.forEach(listener => {
      try {
        listener(ownerKey);
      } catch {
        if (__DEV__) {
          console.warn('[MovementHistory] Change listener failed');
        }
      }
    });
  }
}

export const movementHistoryRepository = new MovementHistoryRepository();
