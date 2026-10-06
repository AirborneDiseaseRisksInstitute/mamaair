jest.mock('../src/services/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../src/services/api/client';
import { AdviceService } from '../src/services/api/AdviceService';
import { DailyPlanService } from '../src/services/api/DailyPlanService';
import { ExposureService } from '../src/services/api/ExposureService';
import { LifestyleService } from '../src/services/api/LifestyleService';
import { MovementsService } from '../src/services/api/MovementsService';
import { SummaryService } from '../src/services/api/SummaryService';

const mockedGet = api.get as jest.Mock;
const mockedPost = api.post as jest.Mock;

describe('documented dashboard API contracts', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedGet.mockResolvedValue({ data: {} });
  });

  it('uses the preferred documented JSON movement upload contract', async () => {
    mockedPost.mockResolvedValue({ data: {} });
    const movements = [
      {
        latitude: 52.2297,
        longitude: 21.0122,
        timestamp: '2026-09-29T08:30:00.000Z',
        indoor: false,
      },
    ];

    await MovementsService.uploadMovementsJson(movements);

    expect(mockedPost).toHaveBeenCalledWith('/movements/upload/json/', {
      movements,
    });
  });

  it('uses the OpenAPI paths and query parameters used by Today', async () => {
    await SummaryService.getSummary();
    await AdviceService.getAdvice();
    await DailyPlanService.getDailyPlan('2026-09-29');
    await LifestyleService.getLifestyle();
    await ExposureService.getAirExposure();

    expect(mockedGet.mock.calls).toEqual([
      ['/summary/'],
      ['/advice/'],
      ['/daily-plan/', { params: { date: '2026-09-29' } }],
      ['/lifestyle/'],
      ['/air-exposure/'],
    ]);
  });

  it('uses the documented exposure history days parameter', async () => {
    await ExposureService.getExposureHistory(7);

    expect(mockedGet).toHaveBeenCalledWith('/exposure/history/', {
      params: { days: 7 },
    });
  });

  it('treats documented 204 responses as available but empty data', async () => {
    mockedGet.mockResolvedValue({ data: null, status: 204 });

    await expect(SummaryService.getSummary()).resolves.toBeNull();
    await expect(AdviceService.getAdvice()).resolves.toBeNull();
    await expect(ExposureService.getAirExposure()).resolves.toBeNull();
  });
});
