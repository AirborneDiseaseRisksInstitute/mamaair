import {
  LOCAL_FEELING_CHECK_IN_SUPPLEMENT_ENABLED,
  RECOMMENDATION_CAPABILITIES,
  RECOMMENDATION_DEMO_FALLBACK_ENABLED,
  resolveRecommendationCapabilityStatus,
} from '../../config/recommendationExperience';
import { FEELING_CHECK_IN_SUPPLEMENT } from '../../data/recommendations/feelingCheckInFallback';
import type {
  BackendWriteStatus,
  CapabilityStatus,
  CapabilityState,
  ConfiguredCapabilityStatus,
  FeelingCheckInExperience,
  FeelingCheckInItem,
  FeelingCheckInRecord,
  FeelingCheckInSelection,
  FeelingCheckInSubmitResult,
  RecommendationCapability,
  RecommendationExperienceIdentity,
} from '../../types/recommendationExperience';
import { DailyCheckinService } from '../api/DailyCheckinService';
import {
  SymptomsService,
  type SymptomChecklistResponse,
  type SymptomSelectionResponse,
} from '../api/SymptomsService';
import {
  WellbeingService,
  type WellbeingCatalog,
  type WellbeingLog,
} from '../api/WellbeingService';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import { formatLocalIsoTimestamp } from '../../utils/dateUtils';
import {
  submitMommySymptomSelection,
  type MommySymptomSubmissionStatus,
} from './MommySymptomSyncService';
import { ProductAnalytics } from './ProductAnalytics';

interface CapabilityLoad<T> {
  state: CapabilityState;
  data: T | null;
}

const capabilityState = (
  configuredStatus: ConfiguredCapabilityStatus,
  status: CapabilityStatus = configuredStatus,
): CapabilityState => ({
  configuredStatus,
  status,
});

const loadConfiguredCapability = async <T>(
  capability: RecommendationCapability,
  loader: () => Promise<T>,
): Promise<CapabilityLoad<T>> => {
  const configuredStatus = RECOMMENDATION_CAPABILITIES[capability];
  const explicitStatus =
    resolveRecommendationCapabilityStatus(capability);

  if (explicitStatus !== 'available') {
    return {
      state: capabilityState(configuredStatus, explicitStatus),
      data: null,
    };
  }

  try {
    return {
      state: capabilityState(configuredStatus, 'available'),
      data: await loader(),
    };
  } catch {
    return {
      state: capabilityState(configuredStatus, 'unavailable'),
      data: null,
    };
  }
};

export const canonicalCheckInItemName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const itemIdentity = (item: FeelingCheckInItem): string =>
  `${item.kind}:${canonicalCheckInItemName(item.name)}`;

export const mergeCheckInItems = (
  apiItems: FeelingCheckInItem[],
  localItems: FeelingCheckInItem[],
): FeelingCheckInItem[] => {
  const merged = new Map<string, FeelingCheckInItem>();

  apiItems.forEach(item => merged.set(itemIdentity(item), item));
  localItems.forEach(item => {
    const identity = itemIdentity(item);
    const existing = merged.get(identity);
    if (!existing) {
      merged.set(identity, item);
      return;
    }

    // Preserve the API identity while enriching presentation metadata from
    // the reviewed local catalog.
    merged.set(identity, {
      ...item,
      ...existing,
      emoji: existing.emoji ?? item.emoji,
      displayPriority:
        existing.displayPriority ?? item.displayPriority,
    });
  });

  return Array.from(merged.values());
};

const fallbackKeys = (
  keys: string[],
  items: FeelingCheckInItem[],
): string[] => {
  const itemByKey = new Map(items.map(item => [item.key, item]));
  return keys.filter(key => itemByKey.get(key)?.source === 'localFallback');
};

const uniqueKeys = (...groups: string[][]): string[] =>
  Array.from(new Set(groups.flat()));

const remapSelectedKeys = (
  selectedKeys: string[],
  sourceItems: FeelingCheckInItem[],
  mergedItems: FeelingCheckInItem[],
): string[] => {
  const sourceByKey = new Map(sourceItems.map(item => [item.key, item]));
  const mergedByIdentity = new Map(
    mergedItems.map(item => [itemIdentity(item), item]),
  );

  return selectedKeys
    .map(key => {
      const source = sourceByKey.get(key);
      if (!source) return null;
      return mergedByIdentity.get(itemIdentity(source))?.key ?? null;
    })
    .filter((key): key is string => key !== null);
};

const apiSymptomItems = (
  checklist: SymptomChecklistResponse | null,
): FeelingCheckInItem[] =>
  (checklist?.symptoms ?? []).map((item, index) => ({
    key: `api:mommy:${item.id}`,
    kind: 'mommySymptom',
    group: classifyMommySymptomGroup(item.name),
    name: item.name,
    apiId: item.id,
    displayPriority: index,
    source: 'api',
  }));

const WARNING_SYMPTOM_TERMS = [
  'vaginal bleeding',
  'leaking fluid',
  'chest pain',
  'severe abdominal pain',
  'uterine tenderness',
  'uterine rigidity',
  'frequent contractions',
  'contraction frequency',
  'severe swelling',
  'blurred vision',
  'reduced fetal movement',
  'reduced kicks',
  'prolonged stillness',
  'heart palpitations',
  'severe vomiting',
  'upper abdominal pain',
  'fever',
];

export const classifyMommySymptomGroup = (
  name: string,
): FeelingCheckInItem['group'] => {
  const canonicalName = canonicalCheckInItemName(name);
  return WARNING_SYMPTOM_TERMS.some(term =>
    canonicalName.includes(term),
  )
    ? 'warning'
    : 'physical';
};

const apiWellbeingItems = (
  catalog: WellbeingCatalog | null,
  kind: 'mood' | 'wellbeingFeeling',
): FeelingCheckInItem[] => {
  const items = kind === 'mood' ? catalog?.moods : catalog?.feelings;
  const keyPrefix = kind === 'mood' ? 'mood' : 'feeling';

  return (items ?? []).map((item, index) => ({
    key: `api:${keyPrefix}:${item.id}`,
    kind,
    group: 'wellbeing',
    name: item.name,
    emoji: item.emoji,
    apiId: item.id,
    displayPriority: index,
    source: 'api',
  }));
};

const selectedApiKeys = (
  ids: number[],
  items: FeelingCheckInItem[],
): string[] => {
  const selectedIds = new Set(ids);
  return items
    .filter(item => item.apiId !== undefined && selectedIds.has(item.apiId))
    .map(item => item.key);
};

const localItemsForKind = (
  kind: FeelingCheckInItem['kind'],
): FeelingCheckInItem[] =>
  LOCAL_FEELING_CHECK_IN_SUPPLEMENT_ENABLED &&
  RECOMMENDATION_DEMO_FALLBACK_ENABLED &&
  RECOMMENDATION_CAPABILITIES.unifiedFeelingSupplement === 'notImplemented'
    ? FEELING_CHECK_IN_SUPPLEMENT.filter(item => item.kind === kind)
    : [];

export const loadFeelingCheckInExperience = async (
  identity: RecommendationExperienceIdentity,
  date: string,
): Promise<FeelingCheckInExperience> => {
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);

  const [
    mommyChecklistLoad,
    mommySelectionLoad,
    wellbeingCatalogLoad,
    wellbeingLogLoad,
  ] = await Promise.all([
    loadConfiguredCapability(
      'mommySymptoms',
      SymptomsService.getMommyChecklist,
    ),
    loadConfiguredCapability('mommySymptoms', () =>
      SymptomsService.getMommySelection(date),
    ),
    loadConfiguredCapability('wellbeing', WellbeingService.getCatalog),
    loadConfiguredCapability('wellbeing', () =>
      WellbeingService.getLogStrict(date),
    ),
  ]);

  const apiMommy = apiSymptomItems(
    mommyChecklistLoad.data as SymptomChecklistResponse | null,
  );
  const apiMoods = apiWellbeingItems(
    wellbeingCatalogLoad.data as WellbeingCatalog | null,
    'mood',
  );
  const apiFeelings = apiWellbeingItems(
    wellbeingCatalogLoad.data as WellbeingCatalog | null,
    'wellbeingFeeling',
  );

  const localMommy = localItemsForKind('mommySymptom');
  const localMoods = localItemsForKind('mood');
  const localFeelings = localItemsForKind('wellbeingFeeling');

  const mommySymptoms = mergeCheckInItems(apiMommy, localMommy);
  const moods = mergeCheckInItems(apiMoods, localMoods);
  const feelings = mergeCheckInItems(apiFeelings, localFeelings);

  const localRecord =
    useRecommendationExperienceStore.getState().getCheckIn(date);
  const sourceItems = [
    ...apiMommy,
    ...apiMoods,
    ...apiFeelings,
    ...localMommy,
    ...localMoods,
    ...localFeelings,
  ];

  const mommySelection =
    mommySelectionLoad.data as SymptomSelectionResponse | null;
  const wellbeingLog = wellbeingLogLoad.data as WellbeingLog | null;

  const apiMommySelectionKeys = selectedApiKeys(
    mommySelection?.symptom_ids ?? [],
    mommySymptoms,
  );
  const apiMoodKeys = selectedApiKeys(wellbeingLog?.mood_ids ?? [], moods);
  const apiFeelingKeys = selectedApiKeys(
    wellbeingLog?.feeling_ids ?? [],
    feelings,
  );

  const remappedLocalMommy = localRecord
    ? remapSelectedKeys(
        localRecord.mommySymptomKeys,
        sourceItems,
        mommySymptoms,
      )
    : [];
  const remappedLocalMoods = localRecord
    ? remapSelectedKeys(localRecord.moodKeys, sourceItems, moods)
    : [];
  const remappedLocalFeelings = localRecord
    ? remapSelectedKeys(localRecord.feelingKeys, sourceItems, feelings)
    : [];

  const useApiMommySelection =
    localRecord?.writeStatus.mommySymptoms === 'saved' &&
    mommySelectionLoad.state.status === 'available';
  const useApiWellbeingSelection =
    localRecord?.writeStatus.wellbeing === 'saved' &&
    wellbeingLogLoad.state.status === 'available';

  const selection: FeelingCheckInSelection = {
    mommySymptomKeys: localRecord
      ? useApiMommySelection
        ? uniqueKeys(
            apiMommySelectionKeys,
            fallbackKeys(remappedLocalMommy, mommySymptoms),
          )
        : remappedLocalMommy
      : apiMommySelectionKeys,
    moodKeys: localRecord
      ? useApiWellbeingSelection
        ? uniqueKeys(apiMoodKeys, fallbackKeys(remappedLocalMoods, moods))
        : remappedLocalMoods
      : apiMoodKeys,
    feelingKeys: localRecord
      ? useApiWellbeingSelection
        ? uniqueKeys(
            apiFeelingKeys,
            fallbackKeys(remappedLocalFeelings, feelings),
          )
        : remappedLocalFeelings
      : apiFeelingKeys,
    waterIncrementMl: 0,
  };

  const supplementStatus =
    RECOMMENDATION_CAPABILITIES.unifiedFeelingSupplement;
  const dailyCheckInStatus =
    RECOMMENDATION_CAPABILITIES.dailyCheckIn;

  return {
    mommySymptoms,
    moods,
    feelings,
    selection,
    waterGoalMl:
      (wellbeingCatalogLoad.data as WellbeingCatalog | null)
        ?.water_goal_ml,
    recordState:
      localRecord ||
      mommySelection?.recorded_at ||
      apiMommySelectionKeys.length > 0 ||
      apiMoodKeys.length > 0 ||
      apiFeelingKeys.length > 0
        ? 'recorded'
        : 'unknown',
    waterDailyTotalMl:
      localRecord &&
      localRecord.writeStatus.wellbeing !== 'saved'
        ? localRecord.waterDailyTotalMl ??
          (wellbeingLog?.water_amount ?? 0) +
            localRecord.waterIncrementMl
        : wellbeingLog?.water_amount ?? 0,
    capabilities: {
      mommySymptoms: mommyChecklistLoad.state,
      mommySymptomsSelection: mommySelectionLoad.state,
      wellbeing: wellbeingCatalogLoad.state,
      wellbeingLog: wellbeingLogLoad.state,
      dailyCheckIn: capabilityState(
        dailyCheckInStatus,
        resolveRecommendationCapabilityStatus('dailyCheckIn'),
      ),
      unifiedFeelingSupplement: capabilityState(supplementStatus),
    },
  };
};

export const apiIdsForSelectedKeys = (
  keys: string[],
  items: FeelingCheckInItem[],
): number[] => {
  const selectedKeys = new Set(keys);
  return items
    .filter(
      item => selectedKeys.has(item.key) && item.apiId !== undefined,
    )
    .map(item => item.apiId as number);
};

const sameNumberSet = (left: number[], right: number[]): boolean => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every(value => rightSet.has(value));
};

const statusForResult = (
  result: PromiseSettledResult<void> | null,
): BackendWriteStatus => {
  if (!result) return 'skipped';
  return result.status === 'fulfilled' ? 'saved' : 'failed';
};

const mommyStatusForResult = (
  result: PromiseSettledResult<MommySymptomSubmissionStatus> | null,
): BackendWriteStatus => {
  if (!result) return 'skipped';
  if (result.status === 'rejected') return 'failed';
  return result.value === 'pending' ? 'pending' : 'saved';
};

export const submitFeelingCheckIn = async (
  identity: RecommendationExperienceIdentity,
  date: string,
  experience: FeelingCheckInExperience,
  selection: FeelingCheckInSelection,
  options: {
    writeScope?: 'full' | 'symptoms';
  } = {},
): Promise<FeelingCheckInSubmitResult> => {
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);

  const now = new Date();
  const existingRecord = store.getCheckIn(date);
  const recordedAt = formatLocalIsoTimestamp(now);
  const initialRecord: FeelingCheckInRecord = {
    ...selection,
    date,
    recordedAt,
    updatedAt: now.toISOString(),
    scope:
      options.writeScope === 'symptoms' && existingRecord?.scope !== 'full'
        ? 'symptoms'
        : 'full',
    waterDailyTotalMl:
      experience.waterDailyTotalMl +
      selection.waterIncrementMl,
    writeStatus: {
      mommySymptoms: 'notAttempted',
      wellbeing: 'notAttempted',
      dailyCheckIn: 'notAttempted',
    },
  };
  useRecommendationExperienceStore.getState().saveCheckIn(initialRecord);

  const mommyWrite =
    experience.capabilities.mommySymptoms.status === 'available' &&
    experience.capabilities.mommySymptomsSelection.status === 'available'
      ? submitMommySymptomSelection(
          date,
          apiIdsForSelectedKeys(
            selection.mommySymptomKeys,
            experience.mommySymptoms,
          ),
          recordedAt,
        )
      : null;

  const selectedBackendMoodIds = apiIdsForSelectedKeys(
    selection.moodKeys,
    experience.moods,
  );
  const existingBackendMoodIds = apiIdsForSelectedKeys(
    experience.selection.moodKeys,
    experience.moods,
  );
  const selectedBackendFeelingIds = apiIdsForSelectedKeys(
    selection.feelingKeys,
    experience.feelings,
  );
  const existingBackendFeelingIds = apiIdsForSelectedKeys(
    experience.selection.feelingKeys,
    experience.feelings,
  );
  const shouldWriteWellbeing =
    selection.waterIncrementMl > 0 ||
    !sameNumberSet(selectedBackendMoodIds, existingBackendMoodIds) ||
    !sameNumberSet(selectedBackendFeelingIds, existingBackendFeelingIds);

  const wellbeingWrite =
    options.writeScope !== 'symptoms' &&
    experience.capabilities.wellbeing.status === 'available' &&
    experience.capabilities.wellbeingLog.status === 'available' &&
    shouldWriteWellbeing
      ? WellbeingService.saveLog({
          date,
          mood_ids: selectedBackendMoodIds,
          feeling_ids: selectedBackendFeelingIds,
          water_amount: selection.waterIncrementMl,
        })
      : null;

  const dailyCheckInWrite =
    experience.capabilities.dailyCheckIn.status === 'available'
      ? (async () => {
          const exists = await DailyCheckinService.checkExists(date);
          if (!exists) await DailyCheckinService.create(date);
        })()
      : null;

  const [mommyResult, wellbeingResult, dailyCheckInResult] =
    await Promise.all([
      mommyWrite ? Promise.allSettled([mommyWrite]).then(([result]) => result) : null,
      wellbeingWrite
        ? Promise.allSettled([wellbeingWrite]).then(([result]) => result)
        : null,
      dailyCheckInWrite
        ? Promise.allSettled([dailyCheckInWrite]).then(([result]) => result)
        : null,
    ]);

  const completedRecord: FeelingCheckInRecord = {
    ...initialRecord,
    updatedAt: new Date().toISOString(),
    writeStatus: {
      mommySymptoms: mommyStatusForResult(mommyResult),
      wellbeing: statusForResult(wellbeingResult),
      dailyCheckIn: statusForResult(dailyCheckInResult),
    },
  };
  useRecommendationExperienceStore.getState().saveCheckIn(completedRecord);
  ProductAnalytics.track(identity, 'feeling_checkin_complete', {
    hasSymptoms: selection.mommySymptomKeys.length > 0,
    moodCount: selection.moodKeys.length,
    feelingCount: selection.feelingKeys.length,
  });

  const statuses = Object.values(completedRecord.writeStatus);
  const savedCount = statuses.filter(status => status === 'saved').length;
  const savedRemotely = statuses.every(status => status === 'saved');
  const symptomsPendingSync =
    completedRecord.writeStatus.mommySymptoms === 'pending';

  if (mommyResult?.status === 'rejected') {
    throw mommyResult.reason;
  }

  return {
    record: completedRecord,
    savedRemotely,
    partiallySaved: savedCount > 0 && !savedRemotely,
    symptomsPendingSync,
  };
};
