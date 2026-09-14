import axios from 'axios';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { SymptomsService } from '../api/SymptomsService';
import { SummaryService } from '../api/SummaryService';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import type { PendingMommySymptomSelection } from '../../types/recommendationExperience';

export type MommySymptomSubmissionStatus = 'saved' | 'pending';

export interface MommySymptomSyncFailure {
  date: string;
  error: unknown;
  kind: 'auth' | 'validation' | 'server';
}

export interface MommySymptomSyncResult {
  syncedDates: string[];
  failures: MommySymptomSyncFailure[];
}

type SyncListener = (syncedDates: string[]) => void;

const syncListeners = new Set<SyncListener>();
let syncInFlight: Promise<MommySymptomSyncResult> | null = null;
let operationQueue: Promise<void> = Promise.resolve();

const runExclusive = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};

export const hasInternetConnection = (state: NetInfoState): boolean =>
  state.isConnected === true && state.isInternetReachable !== false;

export const isConnectivityError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error) || error.response) return false;

  const code = error.code?.toUpperCase();
  return (
    code === 'ERR_NETWORK' ||
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    /network|offline|timeout|failed to fetch/i.test(error.message)
  );
};

const pendingRecord = (
  date: string,
  symptomIds: number[],
  recordedAt: string,
): PendingMommySymptomSelection => ({
  date,
  symptomIds: [...symptomIds].sort((a, b) => a - b),
  recordedAt,
  updatedAt: new Date().toISOString(),
});

export const submitMommySymptomSelection = (
  date: string,
  symptomIds: number[],
  recordedAt: string,
): Promise<MommySymptomSubmissionStatus> =>
  runExclusive(async () => {
    const record = pendingRecord(date, symptomIds, recordedAt);
    const connectivity = await NetInfo.fetch().catch(() => null);

    if (connectivity && !hasInternetConnection(connectivity)) {
      useRecommendationExperienceStore
        .getState()
        .savePendingMommySymptomSelection(record);
      return 'pending';
    }

    try {
      await SymptomsService.saveMommySelection({
        symptom_ids: record.symptomIds,
        recorded_at: record.recordedAt,
      });
      useRecommendationExperienceStore
        .getState()
        .removePendingMommySymptomSelection(date);
      return 'saved';
    } catch (error) {
      if (!isConnectivityError(error)) throw error;

      useRecommendationExperienceStore
        .getState()
        .savePendingMommySymptomSelection(record);
      return 'pending';
    }
  });

const failureFor = (
  date: string,
  error: unknown,
): MommySymptomSyncFailure => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return {
    date,
    error,
    kind:
      status === 401 || status === 403
        ? 'auth'
        : status !== undefined && status >= 400 && status < 500
        ? 'validation'
        : 'server',
  };
};

const performPendingSync = async (): Promise<MommySymptomSyncResult> => {
  const records = Object.values(
    useRecommendationExperienceStore.getState()
      .pendingMommySymptomSelections,
  ).sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
  const syncedRecords: PendingMommySymptomSelection[] = [];
  const failures: MommySymptomSyncFailure[] = [];

  for (const record of records) {
    try {
      await SymptomsService.saveMommySelection({
        symptom_ids: record.symptomIds,
        recorded_at: record.recordedAt,
      });
      syncedRecords.push(record);
    } catch (error) {
      if (isConnectivityError(error)) break;

      const failure = failureFor(record.date, error);
      failures.push(failure);
      if (failure.kind === 'validation') {
        useRecommendationExperienceStore
          .getState()
          .removePendingMommySymptomSelection(
            record.date,
            record.updatedAt,
          );
      }
    }
  }

  if (syncedRecords.length === 0) {
    return { syncedDates: [], failures };
  }

  // Reading summary after the writes forces Today to observe the latest
  // backend recommendation snapshot. No recommendations are built locally.
  try {
    await SummaryService.getSummary();
  } catch (error) {
    if (!isConnectivityError(error)) {
      failures.push(failureFor(syncedRecords[0].date, error));
    }
    return { syncedDates: [], failures };
  }

  syncedRecords.forEach(record => {
    useRecommendationExperienceStore
      .getState()
      .removePendingMommySymptomSelection(record.date, record.updatedAt);
  });
  const syncedDates = syncedRecords.map(record => record.date);
  syncListeners.forEach(listener => listener(syncedDates));
  return { syncedDates, failures };
};

export const syncPendingMommySymptomSelections = (): Promise<MommySymptomSyncResult> => {
  if (syncInFlight) return syncInFlight;

  syncInFlight = runExclusive(performPendingSync).finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
};

export const subscribeToMommySymptomSync = (
  listener: SyncListener,
): (() => void) => {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
};
