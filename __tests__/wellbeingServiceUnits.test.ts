jest.mock('../src/services/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../src/services/api/client';
import { WellbeingService } from '../src/services/api/WellbeingService';

const mockedApi = api as jest.Mocked<typeof api>;

describe('WellbeingService water units', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes catalog goals and daily amounts to millilitres', async () => {
    mockedApi.get
      .mockResolvedValueOnce({
        data: {
          water_goal: { value: 2.1, unit: 'l' },
          moods: [],
          feelings: [],
        },
      } as any)
      .mockResolvedValueOnce({
        data: {
          date: '2026-09-26',
          water_amount: 1.25,
          water_unit: 'litres',
          moods: [],
          feelings: [],
        },
      } as any);

    await expect(WellbeingService.getCatalog()).resolves.toMatchObject({
      water_goal_ml: 2100,
      water_goal_unit: 'ml',
    });
    await expect(
      WellbeingService.getLogStrict('2026-09-26'),
    ).resolves.toMatchObject({
      water_amount: 1250,
      water_unit: 'ml',
    });
  });

  it('rejects an unsupported daily water unit instead of comparing it as ml', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        date: '2026-09-26',
        water_amount: 8,
        water_unit: 'cups',
        moods: [],
        feelings: [],
      },
    } as any);

    await expect(
      WellbeingService.getLogStrict('2026-09-26'),
    ).rejects.toThrow('Unsupported wellbeing water unit');
  });
});
