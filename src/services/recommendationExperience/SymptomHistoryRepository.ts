import type {
  CapabilityStatus,
  FeelingCheckInItem,
  RecommendationExperienceIdentity,
} from '../../types/recommendationExperience';
import {
  SymptomsService,
} from '../api/SymptomsService';
import { loadFeelingCheckInExperience } from './FeelingCheckInRepository';
import {
  getSymptomClass,
  type SymptomClassKey,
} from './SymptomClassTrendRepository';

export interface SymptomHistoryEntry {
  key: string;
  name: string;
  source: 'api' | 'localFallback';
}

export interface SymptomHistoryClassEntry {
  key: SymptomClassKey;
  level: 1 | 2 | 3 | 4;
  total: number;
  mommyCount: number;
  babyCount: number;
}

export interface SymptomHistoryDay {
  date: string;
  classes: SymptomHistoryClassEntry[];
  recordState: 'recorded' | 'unknown';
  mommyStatus: CapabilityStatus;
  babyStatus: 'available' | 'unavailable';
}

type ClassCountRecord = Record<SymptomClassKey, number>;

interface SymptomClassStatisticsItem {
  symptom_class?: number | string;
  class?: number | string;
  level?: number | string;
  quantity?: number;
  count?: number;
  total?: number;
}

interface SymptomClassStatisticsResponse {
  classes?: SymptomClassStatisticsItem[];
}

const CLASS_KEYS: readonly SymptomClassKey[] = [
  'class1',
  'class2',
  'class3',
  'class4',
];

const emptyClassCounts = (): ClassCountRecord => ({
  class1: 0,
  class2: 0,
  class3: 0,
  class4: 0,
});

const classKeyForLevel = (
  value: number | string | undefined,
): SymptomClassKey | null => {
  const level =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value)
      : NaN;
  if (level === 1) return 'class1';
  if (level === 2) return 'class2';
  if (level === 3) return 'class3';
  if (level === 4) return 'class4';
  return null;
};

const countValue = (
  item: SymptomClassStatisticsItem,
): number => {
  const value = item.quantity ?? item.count ?? item.total ?? 0;
  return Number.isFinite(value) ? value : 0;
};

const countsFromStatistics = (
  response: SymptomClassStatisticsResponse | null,
): ClassCountRecord => {
  const counts = emptyClassCounts();
  (response?.classes ?? []).forEach(item => {
    const key = classKeyForLevel(
      item.symptom_class ?? item.class ?? item.level,
    );
    if (key) counts[key] += countValue(item);
  });
  return counts;
};

const localMommyClassCounts = (
  items: FeelingCheckInItem[],
  selectedKeys: readonly string[],
): ClassCountRecord => {
  const counts = emptyClassCounts();
  const selected = new Set(selectedKeys);
  items.forEach(item => {
    if (item.kind !== 'mommySymptom' || !selected.has(item.key)) {
      return;
    }
    const symptomClass = getSymptomClass(item.name);
    if (symptomClass) counts[symptomClass] += 1;
  });
  return counts;
};

const classEntries = (
  mommyCounts: ClassCountRecord,
  babyCounts: ClassCountRecord,
): SymptomHistoryClassEntry[] =>
  CLASS_KEYS.map((key, index) => ({
    key,
    level: (index + 1) as 1 | 2 | 3 | 4,
    mommyCount: mommyCounts[key],
    babyCount: babyCounts[key],
    total: mommyCounts[key] + babyCounts[key],
  })).filter(entry => entry.total > 0);

/*
 * Exact symptom-event history is disabled for this release. Keep the model and
 * mapper available here so the previous UI can be restored without rebuilding
 * the backend selection wiring.
const selectedEntries = (
  items: FeelingCheckInItem[],
  selectedKeys: string[],
  group: FeelingCheckInItem['group'],
): SymptomHistoryEntry[] => {
  const selected = new Set(selectedKeys);
  return items
    .filter(item => item.group === group && selected.has(item.key))
    .map(item => ({
      key: item.key,
      name: item.name,
      source: item.source,
    }));
};
*/

export const loadSymptomHistoryDay = async (
  identity: RecommendationExperienceIdentity,
  date: string,
): Promise<SymptomHistoryDay> => {
  const [experience, mommyStatisticsResult, babyStatisticsResult] =
    await Promise.all([
      loadFeelingCheckInExperience(identity, date),
      SymptomsService.getMommyStatisticsClasses({
        date,
      })
        .then(
          data =>
            ({
              status: 'fulfilled',
              value: data,
            }) as const,
        )
        .catch(
          () =>
            ({
              status: 'rejected',
            }) as const,
        ),
      SymptomsService.getBabyStatisticsClasses({
        date,
      })
        .then(
          data =>
            ({
              status: 'fulfilled',
              value: data,
            }) as const,
        )
        .catch(
          () =>
            ({
              status: 'rejected',
            }) as const,
        ),
    ]);

  const mommyStatus =
    experience.capabilities.mommySymptomsSelection.status;
  const mommyCounts =
    mommyStatisticsResult.status === 'fulfilled'
      ? countsFromStatistics(mommyStatisticsResult.value)
      : localMommyClassCounts(
          experience.mommySymptoms,
          experience.selection.mommySymptomKeys,
        );
  const babyStatus =
    babyStatisticsResult.status === 'fulfilled'
      ? 'available'
      : 'unavailable';
  const babyCounts =
    babyStatisticsResult.status === 'fulfilled'
      ? countsFromStatistics(babyStatisticsResult.value)
      : emptyClassCounts();

  /*
 * Exact baby event history is intentionally disabled. Do not fetch
   * getBabyChecklist/getBabySelection here because the history view should
   * expose only class-level statistics.
   */
  const classes = classEntries(mommyCounts, babyCounts);

  return {
    date,
    classes,
    recordState:
      experience.recordState === 'recorded' ||
      classes.length > 0
        ? 'recorded'
        : 'unknown',
    mommyStatus,
    babyStatus,
  };
};
