import { WellbeingService } from '../../src/services/api/WellbeingService';
import { loadWeeklyHydrationReadings } from '../../src/services/recommendationExperience/WeeklyHydrationRepository';

jest.mock('../../src/services/api/WellbeingService', () => ({
  WellbeingService: {
    getCatalog: jest.fn(),
    getLogStrict: jest.fn(),
  },
}));

const mockedWellbeingService = WellbeingService as jest.Mocked<
  typeof WellbeingService
>;

describe('weekly hydration readings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads a complete week using the API water goal', async () => {
    mockedWellbeingService.getCatalog.mockResolvedValue({
      water_goal_ml: 2000,
      moods: [],
      feelings: [],
    });
    mockedWellbeingService.getLogStrict.mockImplementation(async date => ({
      date,
      water_amount: date.endsWith('02') ? 2100 : 1200,
      mood_ids: [],
      feeling_ids: [],
    }));

    await expect(
      loadWeeklyHydrationReadings(['2026-09-01', '2026-09-02']),
    ).resolves.toEqual({
      '2026-09-01': { amountMl: 1200, goalMl: 2000 },
      '2026-09-02': { amountMl: 2100, goalMl: 2000 },
    });
  });

  it('returns unavailable instead of treating a partial API failure as zero', async () => {
    mockedWellbeingService.getCatalog.mockResolvedValue({
      water_goal_ml: 2000,
      moods: [],
      feelings: [],
    });
    mockedWellbeingService.getLogStrict
      .mockResolvedValueOnce({
        date: '2026-09-01',
        water_amount: 1200,
        mood_ids: [],
        feeling_ids: [],
      })
      .mockRejectedValueOnce(new Error('offline'));

    await expect(
      loadWeeklyHydrationReadings(['2026-09-01', '2026-09-02']),
    ).resolves.toBeNull();
  });
});
