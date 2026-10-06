jest.mock('../src/services/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import api from '../src/services/api/client';
import { SummaryService } from '../src/services/api/SummaryService';

const mockedGet = api.get as jest.Mock;

describe('SummaryService', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('represents the documented 204 no-data response as null', async () => {
    mockedGet.mockResolvedValue({ data: null, status: 204 });

    await expect(SummaryService.getSummary()).resolves.toBeNull();
    expect(mockedGet).toHaveBeenCalledWith('/summary/');
  });

  it('returns a populated summary unchanged', async () => {
    const summary = { mom_exposure: { exposure_level: 2.4 } };
    mockedGet.mockResolvedValue({ data: summary, status: 200 });

    await expect(SummaryService.getSummary()).resolves.toBe(summary);
  });
});
