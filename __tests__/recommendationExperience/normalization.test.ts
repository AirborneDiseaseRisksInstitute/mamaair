jest.mock('../../src/store/useRecommendationExperienceStore', () => {
  const state = {
    ensureOwner: jest.fn(),
    getCheckIn: jest.fn(() => null),
    saveCheckIn: jest.fn(),
    pendingMommySymptomSelections: {},
    savePendingMommySymptomSelection: jest.fn(),
    removePendingMommySymptomSelection: jest.fn(),
  };
  return {
    useRecommendationExperienceStore: {
      getState: () => state,
    },
    __testState: state,
  };
});

jest.mock('../../src/config/dev', () => ({
  DEV_LOCAL_SESSION: false,
  DEV_LOCAL_SESSION_RESET_TOKEN: 0,
}));

jest.mock(
  '../../src/services/recommendationExperience/ProductAnalytics',
  () => ({
    ProductAnalytics: {
      track: jest.fn(),
    },
  }),
);

jest.mock('../../src/services/api/DailyCheckinService', () => ({
  DailyCheckinService: {
    checkExists: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../src/services/api/SymptomsService', () => ({
  SymptomsService: {
    getMommyChecklist: jest.fn(),
    getMommySelection: jest.fn(),
    saveMommySelection: jest.fn(),
  },
}));

jest.mock('../../src/services/api/SummaryService', () => ({
  SummaryService: {
    getSummary: jest.fn(),
  },
}));

jest.mock('../../src/services/api/WellbeingService', () => ({
  WellbeingService: {
    getCatalog: jest.fn(),
    getLogStrict: jest.fn(),
    saveLog: jest.fn(),
  },
}));

import {
  apiIdsForSelectedKeys,
  loadFeelingCheckInExperience,
  mergeCheckInItems,
  submitFeelingCheckIn,
} from '../../src/services/recommendationExperience/FeelingCheckInRepository';
import {
  RECOMMENDATION_CAPABILITIES,
  resolveRecommendationCapabilityStatus,
} from '../../src/config/recommendationExperience';
import type { FeelingCheckInItem } from '../../src/types/recommendationExperience';
import { SymptomsService } from '../../src/services/api/SymptomsService';
import { WellbeingService } from '../../src/services/api/WellbeingService';
import { DailyCheckinService } from '../../src/services/api/DailyCheckinService';

const storeMock = jest.requireMock(
  '../../src/store/useRecommendationExperienceStore',
) as {
  __testState: {
    ensureOwner: jest.Mock;
    getCheckIn: jest.Mock;
    saveCheckIn: jest.Mock;
  };
};

const capabilityState = (
  status: 'available' | 'unavailable' | 'notImplemented',
) => ({
  configuredStatus:
    status === 'notImplemented'
      ? ('notImplemented' as const)
      : ('available' as const),
  status,
});

describe('feeling check-in normalization', () => {
  const apiHeadache: FeelingCheckInItem = {
    key: 'api:mommy:10',
    kind: 'mommySymptom',
    group: 'physical',
    name: 'Headache',
    apiId: 10,
    source: 'api',
  };
  const localHeadache: FeelingCheckInItem = {
    key: 'fallback:mommy:headache',
    kind: 'mommySymptom',
    group: 'physical',
    name: ' headache ',
    source: 'localFallback',
  };
  const localPoorSleep: FeelingCheckInItem = {
    key: 'fallback:feeling:poor-sleep',
    kind: 'wellbeingFeeling',
    group: 'wellbeing',
    name: 'Poor sleep',
    source: 'localFallback',
  };
  const apiMood: FeelingCheckInItem = {
    key: 'api:mood:30',
    kind: 'mood',
    group: 'wellbeing',
    name: 'Calm',
    apiId: 30,
    source: 'api',
  };
  const apiPoorSleep: FeelingCheckInItem = {
    key: 'api:feeling:20',
    kind: 'wellbeingFeeling',
    group: 'wellbeing',
    name: 'Poor sleep',
    apiId: 20,
    source: 'api',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    storeMock.__testState.getCheckIn.mockReturnValue(null);
  });

  it('keeps the API item when a fallback item has the same meaning', () => {
    expect(
      mergeCheckInItems(
        [apiHeadache],
        [localHeadache, localPoorSleep],
      ),
    ).toEqual([apiHeadache, localPoorSleep]);
  });

  it('filters local-only keys out of backend payload IDs', () => {
    expect(
      apiIdsForSelectedKeys(
        [apiHeadache.key, localPoorSleep.key],
        [apiHeadache, localPoorSleep],
      ),
    ).toEqual([10]);
  });

  it('declares missing capabilities explicitly in configuration', () => {
    expect(RECOMMENDATION_CAPABILITIES.mommySymptoms).toBe('available');
    expect(RECOMMENDATION_CAPABILITIES.wellbeing).toBe('available');
    expect(RECOMMENDATION_CAPABILITIES.dailyCheckIn).toBe('available');
    expect(
      RECOMMENDATION_CAPABILITIES.unifiedFeelingSupplement,
    ).toBe('notImplemented');
  });

  it('declares authenticated capabilities unavailable in local DEV', () => {
    expect(
      resolveRecommendationCapabilityStatus('mommySymptoms', true),
    ).toBe('unavailable');
    expect(
      resolveRecommendationCapabilityStatus('wellbeing', true),
    ).toBe('unavailable');
    expect(
      resolveRecommendationCapabilityStatus('dailyCheckIn', true),
    ).toBe('unavailable');
    expect(
      resolveRecommendationCapabilityStatus(
        'unifiedFeelingSupplement',
        true,
      ),
    ).toBe('notImplemented');
  });

  it('keeps empty successful API responses available', async () => {
    (SymptomsService.getMommyChecklist as jest.Mock).mockResolvedValue({
      symptoms: [],
    });
    (SymptomsService.getMommySelection as jest.Mock).mockResolvedValue({
      symptom_ids: [],
    });
    (WellbeingService.getCatalog as jest.Mock).mockResolvedValue({
      moods: [],
      feelings: [],
    });
    (WellbeingService.getLogStrict as jest.Mock).mockResolvedValue({
      date: '2026-07-23',
      water_amount: 0,
      mood_ids: [],
      feeling_ids: [],
    });

    const result = await loadFeelingCheckInExperience(
      { backendUserId: 1 },
      '2026-07-23',
    );

    expect(result.capabilities.mommySymptoms.status).toBe('available');
    expect(result.capabilities.wellbeing.status).toBe('available');
    expect(result.mommySymptoms).toEqual([]);
    expect(result.moods).toEqual([]);
    expect(result.feelings).toEqual([]);
    expect(result.capabilities.unifiedFeelingSupplement.status).toBe(
      'notImplemented',
    );
  });

  it('hydrates saved mood and feeling selections from the wellbeing log', async () => {
    (SymptomsService.getMommyChecklist as jest.Mock).mockResolvedValue({
      symptoms: [],
    });
    (SymptomsService.getMommySelection as jest.Mock).mockResolvedValue({
      symptom_ids: [],
    });
    (WellbeingService.getCatalog as jest.Mock).mockResolvedValue({
      moods: [{ id: 30, name: 'Calm' }],
      feelings: [{ id: 20, name: 'Poor sleep' }],
    });
    (WellbeingService.getLogStrict as jest.Mock).mockResolvedValue({
      date: '2026-07-23',
      water_amount: 0,
      mood_ids: [30],
      feeling_ids: [20],
    });

    const result = await loadFeelingCheckInExperience(
      { backendUserId: 1 },
      '2026-07-23',
    );

    expect(result.selection.moodKeys).toEqual(['api:mood:30']);
    expect(result.selection.feelingKeys).toEqual(['api:feeling:20']);
  });

  it('does not add local supplement items when catalog APIs are unavailable', async () => {
    (SymptomsService.getMommyChecklist as jest.Mock).mockRejectedValue(
      new Error('timeout'),
    );
    (SymptomsService.getMommySelection as jest.Mock).mockRejectedValue(
      new Error('timeout'),
    );
    (WellbeingService.getCatalog as jest.Mock).mockRejectedValue(
      new Error('network'),
    );
    (WellbeingService.getLogStrict as jest.Mock).mockRejectedValue(
      new Error('network'),
    );

    const result = await loadFeelingCheckInExperience(
      { backendUserId: 1 },
      '2026-07-23',
    );

    expect(result.mommySymptoms).toEqual([]);
    expect(result.moods).toEqual([]);
    expect(result.feelings).toEqual([]);
  });

  it('marks request failures unavailable without inferring notImplemented', async () => {
    (SymptomsService.getMommyChecklist as jest.Mock).mockRejectedValue(
      new Error('timeout'),
    );
    (SymptomsService.getMommySelection as jest.Mock).mockRejectedValue(
      new Error('404'),
    );
    (WellbeingService.getCatalog as jest.Mock).mockRejectedValue(
      new Error('network'),
    );
    (WellbeingService.getLogStrict as jest.Mock).mockRejectedValue(
      new Error('404'),
    );

    const result = await loadFeelingCheckInExperience(
      { backendUserId: 1 },
      '2026-07-23',
    );

    expect(result.capabilities.mommySymptoms.status).toBe('unavailable');
    expect(result.capabilities.mommySymptomsSelection.status).toBe(
      'unavailable',
    );
    expect(result.capabilities.wellbeing.status).toBe('unavailable');
    expect(result.capabilities.wellbeingLog.status).toBe('unavailable');
  });

  it('persists locally before independent best-effort backend writes', async () => {
    (SymptomsService.saveMommySelection as jest.Mock).mockResolvedValue({
      symptom_ids: [10],
    });
    (WellbeingService.saveLog as jest.Mock).mockRejectedValue(
      new Error('offline'),
    );
    (DailyCheckinService.checkExists as jest.Mock).mockResolvedValue(false);
    (DailyCheckinService.create as jest.Mock).mockResolvedValue(undefined);

    const result = await submitFeelingCheckIn(
      { backendUserId: 1, email: 'user@example.com' },
      '2026-07-23',
      {
        mommySymptoms: [apiHeadache],
        moods: [apiMood],
        feelings: [apiPoorSleep],
        selection: {
          mommySymptomKeys: [],
          moodKeys: [],
          feelingKeys: [],
          waterIncrementMl: 0,
        },
        waterDailyTotalMl: 500,
        recordState: 'unknown',
        capabilities: {
          mommySymptoms: {
            configuredStatus: 'available',
            status: 'available',
          },
          mommySymptomsSelection: {
            configuredStatus: 'available',
            status: 'available',
          },
          wellbeing: {
            configuredStatus: 'available',
            status: 'available',
          },
          wellbeingLog: {
            configuredStatus: 'available',
            status: 'available',
          },
          dailyCheckIn: {
            configuredStatus: 'available',
            status: 'available',
          },
          unifiedFeelingSupplement: {
            configuredStatus: 'notImplemented',
            status: 'notImplemented',
          },
        },
      },
      {
        mommySymptomKeys: [apiHeadache.key],
        moodKeys: [apiMood.key],
        feelingKeys: [apiPoorSleep.key],
        waterIncrementMl: 250,
      },
    );

    expect(storeMock.__testState.saveCheckIn).toHaveBeenCalledTimes(2);
    expect(WellbeingService.saveLog).toHaveBeenCalledWith({
      date: '2026-07-23',
      mood_ids: [30],
      feeling_ids: [20],
      water_amount: 250,
    });
    expect(result.savedRemotely).toBe(false);
    expect(result.partiallySaved).toBe(true);
    expect(result.record.writeStatus).toEqual({
      mommySymptoms: 'saved',
      wellbeing: 'failed',
      dailyCheckIn: 'saved',
    });
    expect(result.record.waterDailyTotalMl).toBe(750);
  });

  it('writes mood-only changes to the wellbeing log', async () => {
    (DailyCheckinService.checkExists as jest.Mock).mockResolvedValue(false);
    (DailyCheckinService.create as jest.Mock).mockResolvedValue(undefined);
    (WellbeingService.saveLog as jest.Mock).mockResolvedValue(undefined);

    const result = await submitFeelingCheckIn(
      { backendUserId: 1 },
      '2026-07-24',
      {
        mommySymptoms: [],
        moods: [apiMood],
        feelings: [apiPoorSleep],
        selection: {
          mommySymptomKeys: [],
          moodKeys: [],
          feelingKeys: [],
          waterIncrementMl: 0,
        },
        waterDailyTotalMl: 0,
        recordState: 'unknown',
        capabilities: {
          mommySymptoms: capabilityState('available'),
          mommySymptomsSelection: capabilityState('available'),
          wellbeing: capabilityState('available'),
          wellbeingLog: capabilityState('available'),
          dailyCheckIn: capabilityState('available'),
          unifiedFeelingSupplement:
            capabilityState('notImplemented'),
        },
      },
      {
        mommySymptomKeys: [],
        moodKeys: [apiMood.key],
        feelingKeys: [],
        waterIncrementMl: 0,
      },
    );

    expect(SymptomsService.saveMommySelection).toHaveBeenCalledWith({
      symptom_ids: [],
      recorded_at: expect.any(String),
    });
    expect(WellbeingService.saveLog).toHaveBeenCalledWith({
      date: '2026-07-24',
      mood_ids: [30],
      feeling_ids: [],
      water_amount: 0,
    });
    expect(result.record.writeStatus.wellbeing).toBe('saved');
    expect(result.record.moodKeys).toEqual([apiMood.key]);
  });

  it('keeps local DEV submissions local when API capabilities are unavailable', async () => {
    const result = await submitFeelingCheckIn(
      { email: 'dev@example.com' },
      '2026-07-23',
      {
        mommySymptoms: [localHeadache],
        moods: [],
        feelings: [localPoorSleep],
        selection: {
          mommySymptomKeys: [],
          moodKeys: [],
          feelingKeys: [],
          waterIncrementMl: 0,
        },
        waterDailyTotalMl: 0,
        recordState: 'unknown',
        capabilities: {
          mommySymptoms: {
            configuredStatus: 'available',
            status: 'unavailable',
          },
          mommySymptomsSelection: {
            configuredStatus: 'available',
            status: 'unavailable',
          },
          wellbeing: {
            configuredStatus: 'available',
            status: 'unavailable',
          },
          wellbeingLog: {
            configuredStatus: 'available',
            status: 'unavailable',
          },
          dailyCheckIn: {
            configuredStatus: 'available',
            status: 'unavailable',
          },
          unifiedFeelingSupplement: {
            configuredStatus: 'notImplemented',
            status: 'notImplemented',
          },
        },
      },
      {
        mommySymptomKeys: [localHeadache.key],
        moodKeys: [],
        feelingKeys: [localPoorSleep.key],
        waterIncrementMl: 0,
      },
    );

    expect(SymptomsService.saveMommySelection).not.toHaveBeenCalled();
    expect(WellbeingService.saveLog).not.toHaveBeenCalled();
    expect(DailyCheckinService.checkExists).not.toHaveBeenCalled();
    expect(DailyCheckinService.create).not.toHaveBeenCalled();
    expect(result.record.writeStatus).toEqual({
      mommySymptoms: 'skipped',
      wellbeing: 'skipped',
      dailyCheckIn: 'skipped',
    });
    expect(result.record.waterDailyTotalMl).toBe(0);
    expect(result.savedRemotely).toBe(false);
    expect(result.partiallySaved).toBe(false);
  });

  it('does not rewrite wellbeing when saving a quick symptom-only update', async () => {
    (SymptomsService.saveMommySelection as jest.Mock).mockResolvedValue({
      symptom_ids: [10],
    });
    (DailyCheckinService.checkExists as jest.Mock).mockResolvedValue(true);

    await submitFeelingCheckIn(
      { backendUserId: 1 },
      '2026-07-25',
      {
        mommySymptoms: [apiHeadache],
        moods: [],
        feelings: [localPoorSleep],
        selection: {
          mommySymptomKeys: [],
          moodKeys: [],
          feelingKeys: [localPoorSleep.key],
          waterIncrementMl: 0,
        },
        waterDailyTotalMl: 750,
        recordState: 'recorded',
        capabilities: {
          mommySymptoms: capabilityState('available'),
          mommySymptomsSelection: capabilityState('available'),
          wellbeing: capabilityState('available'),
          wellbeingLog: capabilityState('available'),
          dailyCheckIn: capabilityState('available'),
          unifiedFeelingSupplement:
            capabilityState('notImplemented'),
        },
      },
      {
        mommySymptomKeys: [apiHeadache.key],
        moodKeys: [],
        feelingKeys: [localPoorSleep.key],
        waterIncrementMl: 0,
      },
      { writeScope: 'symptoms' },
    );

    expect(SymptomsService.saveMommySelection).toHaveBeenCalled();
    expect(WellbeingService.saveLog).not.toHaveBeenCalled();
  });
});
