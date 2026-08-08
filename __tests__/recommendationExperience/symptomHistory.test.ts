jest.mock(
  '../../src/services/recommendationExperience/FeelingCheckInRepository',
  () => ({
    loadFeelingCheckInExperience: jest.fn(),
  }),
);

jest.mock('../../src/services/api/SymptomsService', () => ({
  SymptomsService: {
    getBabyChecklist: jest.fn(),
    getBabySelection: jest.fn(),
  },
}));

import { loadSymptomHistoryDay } from '../../src/services/recommendationExperience/SymptomHistoryRepository';
import { loadFeelingCheckInExperience } from '../../src/services/recommendationExperience/FeelingCheckInRepository';
import { SymptomsService } from '../../src/services/api/SymptomsService';
import type { FeelingCheckInExperience } from '../../src/types/recommendationExperience';

const capability = (
  status: 'available' | 'unavailable' | 'notImplemented',
) => ({
  configuredStatus:
    status === 'notImplemented'
      ? ('notImplemented' as const)
      : ('available' as const),
  status,
});

const experience = (
  overrides: Partial<FeelingCheckInExperience> = {},
): FeelingCheckInExperience => ({
  mommySymptoms: [
    {
      key: 'api:mommy:1',
      kind: 'mommySymptom',
      group: 'physical',
      name: 'Headache',
      apiId: 1,
      source: 'api',
    },
    {
      key: 'fallback:mommy:bleeding',
      kind: 'mommySymptom',
      group: 'warning',
      name: 'Vaginal bleeding',
      source: 'localFallback',
    },
  ],
  moods: [],
  feelings: [],
  selection: {
    mommySymptomKeys: [
      'api:mommy:1',
      'fallback:mommy:bleeding',
    ],
    moodKeys: [],
    feelingKeys: [],
    waterIncrementMl: 0,
  },
  waterDailyTotalMl: 0,
  recordState: 'recorded',
  capabilities: {
    mommySymptoms: capability('available'),
    mommySymptomsSelection: capability('available'),
    wellbeing: capability('available'),
    wellbeingLog: capability('available'),
    dailyCheckIn: capability('available'),
    unifiedFeelingSupplement: capability('notImplemented'),
  },
  ...overrides,
});

describe('symptom history repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('combines selected API/local mommy symptoms with legacy baby data', async () => {
    (
      loadFeelingCheckInExperience as jest.Mock
    ).mockResolvedValue(experience());
    (SymptomsService.getBabyChecklist as jest.Mock).mockResolvedValue({
      symptoms: [
        { id: 8, name: 'Reduced kicks' },
        { id: 9, name: 'Excessive hiccups' },
      ],
    });
    (SymptomsService.getBabySelection as jest.Mock).mockResolvedValue({
      symptom_ids: [8],
    });

    const result = await loadSymptomHistoryDay(
      { backendUserId: 42 },
      '2026-07-25',
    );

    expect(result.physical.map(item => item.name)).toEqual([
      'Headache',
    ]);
    expect(result.warning.map(item => item.name)).toEqual([
      'Vaginal bleeding',
    ]);
    expect(result.baby.map(item => item.name)).toEqual([
      'Reduced kicks',
    ]);
    expect(result.recordState).toBe('recorded');
    expect(result.babyStatus).toBe('available');
  });

  it('keeps ambiguous empty/failed sources explicit', async () => {
    (
      loadFeelingCheckInExperience as jest.Mock
    ).mockResolvedValue(
      experience({
        mommySymptoms: [],
        selection: {
          mommySymptomKeys: [],
          moodKeys: [],
          feelingKeys: [],
          waterIncrementMl: 0,
        },
        recordState: 'unknown',
        capabilities: {
          ...experience().capabilities,
          mommySymptomsSelection: capability('unavailable'),
        },
      }),
    );
    (SymptomsService.getBabyChecklist as jest.Mock).mockRejectedValue(
      new Error('offline'),
    );
    (SymptomsService.getBabySelection as jest.Mock).mockRejectedValue(
      new Error('offline'),
    );

    const result = await loadSymptomHistoryDay(
      { email: 'dev@example.com' },
      '2026-07-24',
    );

    expect(result.recordState).toBe('unknown');
    expect(result.mommyStatus).toBe('unavailable');
    expect(result.babyStatus).toBe('unavailable');
    expect(result.physical).toEqual([]);
    expect(result.warning).toEqual([]);
  });
});
