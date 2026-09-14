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
    getMommyStatisticsClasses: jest.fn(),
    getBabyStatisticsClasses: jest.fn(),
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

  it('uses grouped mommy and baby symptom class statistics without exact events', async () => {
    (
      loadFeelingCheckInExperience as jest.Mock
    ).mockResolvedValue(experience());
    (SymptomsService.getMommyStatisticsClasses as jest.Mock).mockResolvedValue({
      classes: [
        { symptom_class: 1, quantity: 2 },
        { symptom_class: 2, quantity: 1 },
      ],
    });
    (SymptomsService.getBabyStatisticsClasses as jest.Mock).mockResolvedValue({
      classes: [{ symptom_class: 3, quantity: 1 }],
    });

    const result = await loadSymptomHistoryDay(
      { backendUserId: 42 },
      '2026-07-25',
    );

    expect(SymptomsService.getMommyStatisticsClasses).toHaveBeenCalledWith({
      date: '2026-07-25',
    });
    expect(SymptomsService.getBabyStatisticsClasses).toHaveBeenCalledWith({
      date: '2026-07-25',
    });
    expect(SymptomsService.getBabyChecklist).not.toHaveBeenCalled();
    expect(SymptomsService.getBabySelection).not.toHaveBeenCalled();
    expect(result.classes).toEqual([
      {
        key: 'class1',
        level: 1,
        mommyCount: 2,
        babyCount: 0,
        total: 2,
      },
      {
        key: 'class2',
        level: 2,
        mommyCount: 1,
        babyCount: 0,
        total: 1,
      },
      {
        key: 'class3',
        level: 3,
        mommyCount: 0,
        babyCount: 1,
        total: 1,
      },
    ]);
    expect(result.recordState).toBe('recorded');
    expect(result.babyStatus).toBe('available');
  });

  it('falls back to local mommy selections as grouped classes only', async () => {
    (
      loadFeelingCheckInExperience as jest.Mock
    ).mockResolvedValue(experience());
    (SymptomsService.getMommyStatisticsClasses as jest.Mock).mockRejectedValue(
      new Error('offline'),
    );
    (SymptomsService.getBabyStatisticsClasses as jest.Mock).mockRejectedValue(
      new Error('offline'),
    );

    const result = await loadSymptomHistoryDay(
      { backendUserId: 42 },
      '2026-07-25',
    );

    expect(result.classes).toEqual([
      {
        key: 'class1',
        level: 1,
        mommyCount: 1,
        babyCount: 0,
        total: 1,
      },
      {
        key: 'class2',
        level: 2,
        mommyCount: 1,
        babyCount: 0,
        total: 1,
      },
    ]);
    expect(result.babyStatus).toBe('unavailable');
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
    (SymptomsService.getMommyStatisticsClasses as jest.Mock).mockRejectedValue(
      new Error('offline'),
    );
    (SymptomsService.getBabyStatisticsClasses as jest.Mock).mockRejectedValue(
      new Error('offline'),
    );

    const result = await loadSymptomHistoryDay(
      { email: 'dev@example.com' },
      '2026-07-24',
    );

    expect(result.recordState).toBe('unknown');
    expect(result.mommyStatus).toBe('unavailable');
    expect(result.babyStatus).toBe('unavailable');
    expect(result.classes).toEqual([]);
  });
});
