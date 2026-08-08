import type {
  CapabilityStatus,
  FeelingCheckInItem,
  RecommendationExperienceIdentity,
} from '../../types/recommendationExperience';
import {
  SymptomsService,
  type SymptomChecklistResponse,
  type SymptomSelectionResponse,
} from '../api/SymptomsService';
import { loadFeelingCheckInExperience } from './FeelingCheckInRepository';

export interface SymptomHistoryEntry {
  key: string;
  name: string;
  source: 'api' | 'localFallback';
}

export interface SymptomHistoryDay {
  date: string;
  physical: SymptomHistoryEntry[];
  warning: SymptomHistoryEntry[];
  baby: SymptomHistoryEntry[];
  recordState: 'recorded' | 'unknown';
  mommyStatus: CapabilityStatus;
  babyStatus: 'available' | 'unavailable';
}

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

export const loadSymptomHistoryDay = async (
  identity: RecommendationExperienceIdentity,
  date: string,
): Promise<SymptomHistoryDay> => {
  const [experience, babyChecklistResult, babySelectionResult] =
    await Promise.all([
      loadFeelingCheckInExperience(identity, date),
      SymptomsService.getBabyChecklist()
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
      SymptomsService.getBabySelection(date)
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

  const selectedMommyKeys =
    experience.selection.mommySymptomKeys;
  const physical = selectedEntries(
    experience.mommySymptoms,
    selectedMommyKeys,
    'physical',
  );
  const warning = selectedEntries(
    experience.mommySymptoms,
    selectedMommyKeys,
    'warning',
  );

  let baby: SymptomHistoryEntry[] = [];
  const babyStatus =
    babyChecklistResult.status === 'fulfilled' &&
    babySelectionResult.status === 'fulfilled'
      ? 'available'
      : 'unavailable';

  if (
    babyChecklistResult.status === 'fulfilled' &&
    babySelectionResult.status === 'fulfilled'
  ) {
    const checklist =
      babyChecklistResult.value as SymptomChecklistResponse;
    const selection =
      babySelectionResult.value as SymptomSelectionResponse;
    const selectedIds = new Set(selection?.symptom_ids ?? []);
    baby = (checklist?.symptoms ?? [])
      .filter(item => selectedIds.has(item.id))
      .map(item => ({
        key: `api:baby:${item.id}`,
        name: item.name,
        source: 'api' as const,
      }));
  }

  return {
    date,
    physical,
    warning,
    baby,
    recordState:
      experience.recordState === 'recorded' ||
      baby.length > 0
        ? 'recorded'
        : 'unknown',
    mommyStatus:
      experience.capabilities.mommySymptomsSelection.status,
    babyStatus,
  };
};
