jest.mock('../../src/config/dev', () => ({
  DEV_LOCAL_SESSION: false,
  DEV_LOCAL_SESSION_RESET_TOKEN: 0,
}));

jest.mock('../../src/services/api/ExposureService', () => ({
  ExposureService: {
    getExposureHistory: jest.fn(),
  },
}));

import { ExposureService } from '../../src/services/api/ExposureService';
import { loadExposureTrend } from '../../src/services/recommendationExperience/ExposureTrendRepository';

const historyMock = ExposureService.getExposureHistory as jest.Mock;

describe('exposure history capability handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps capability status explicit when an empty response needs presentation values', async () => {
    historyMock.mockResolvedValue({ items: [] });
    const result = await loadExposureTrend({
      summary: null,
      endDate: '2026-07-27',
      pregnancyWeek: 19,
    });

    expect(result.status).toBe('available');
    expect(result.source).toBe('presentation');
    expect(result.points).toHaveLength(7);
    expect(result.points[6].date).toBe('2026-07-27');
  });

  it('uses already-loaded summary history after a temporary history failure', async () => {
    historyMock.mockRejectedValue(new Error('offline'));
    const result = await loadExposureTrend({
      endDate: '2026-07-27',
      pregnancyWeek: 19,
      summary: {
        exposure_history: {
          start_date: '2026-07-26',
          end_date: '2026-07-27',
          days_requested: 2,
          items: [
            { date: '2026-07-26', integrated_score: 42 },
            { date: '2026-07-27', integrated_score: 39 },
          ],
        },
      },
    });

    expect(result.status).toBe('unavailable');
    expect(result.source).toBe('summary');
    expect(result.points).toHaveLength(2);
  });

  it('keeps valid history values ahead of presentation values', async () => {
    historyMock.mockResolvedValue({
      items: [
        {
          date: '2026-07-27',
          pm25: 12,
          temperature: 24,
        },
      ],
    });

    const result = await loadExposureTrend({
      summary: null,
      endDate: '2026-07-27',
      pregnancyWeek: 19,
    });

    expect(result.status).toBe('available');
    expect(result.source).toBe('history');
    expect(result.points).toEqual([
      {
        date: '2026-07-27',
        integratedScore: undefined,
        aqi: undefined,
        pm25: 12,
        temperature: 24,
        humidity: undefined,
        uvi: undefined,
      },
    ]);
  });
});
