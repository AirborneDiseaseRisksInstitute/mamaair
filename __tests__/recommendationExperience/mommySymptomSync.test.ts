import axios from 'axios';

const mockNetInfoFetch = jest.fn();
const mockSaveMommySelection = jest.fn();
const mockGetSummary = jest.fn();

let mockStoreState: {
  pendingMommySymptomSelections: Record<string, any>;
  savePendingMommySymptomSelection: jest.Mock;
  removePendingMommySymptomSelection: jest.Mock;
};

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: (...args: unknown[]) => mockNetInfoFetch(...args),
  },
}));

jest.mock('../../src/services/api/SymptomsService', () => ({
  SymptomsService: {
    saveMommySelection: (...args: unknown[]) =>
      mockSaveMommySelection(...args),
  },
}));

jest.mock('../../src/services/api/SummaryService', () => ({
  SummaryService: {
    getSummary: (...args: unknown[]) => mockGetSummary(...args),
  },
}));

jest.mock('../../src/store/useRecommendationExperienceStore', () => ({
  useRecommendationExperienceStore: {
    getState: () => mockStoreState,
  },
}));

import {
  submitMommySymptomSelection,
  subscribeToMommySymptomSync,
  syncPendingMommySymptomSelections,
} from '../../src/services/recommendationExperience/MommySymptomSyncService';

const setupStore = () => {
  mockStoreState = {
    pendingMommySymptomSelections: {},
    savePendingMommySymptomSelection: jest.fn(record => {
      mockStoreState.pendingMommySymptomSelections = {
        ...mockStoreState.pendingMommySymptomSelections,
        [record.date]: record,
      };
    }),
    removePendingMommySymptomSelection: jest.fn(
      (date: string, expectedUpdatedAt?: string) => {
        const current =
          mockStoreState.pendingMommySymptomSelections[date];
        if (
          !current ||
          (expectedUpdatedAt && current.updatedAt !== expectedUpdatedAt)
        ) {
          return;
        }
        const next = {
          ...mockStoreState.pendingMommySymptomSelections,
        };
        delete next[date];
        mockStoreState.pendingMommySymptomSelections = next;
      },
    ),
  };
};

describe('Mommy symptom offline sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupStore();
    mockGetSummary.mockResolvedValue({ snapshot_id: 1 });
  });

  it('keeps only the latest offline selection for a date', async () => {
    mockNetInfoFetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });

    await submitMommySymptomSelection(
      '2026-08-23',
      [16, 4],
      '2026-08-23T10:00:00+03:00',
    );
    const status = await submitMommySymptomSelection(
      '2026-08-23',
      [29, 8],
      '2026-08-23T11:00:00+03:00',
    );

    expect(status).toBe('pending');
    expect(mockSaveMommySelection).not.toHaveBeenCalled();
    expect(
      mockStoreState.pendingMommySymptomSelections['2026-08-23'],
    ).toMatchObject({
      symptomIds: [8, 29],
      recordedAt: '2026-08-23T11:00:00+03:00',
    });
    expect(
      Object.keys(mockStoreState.pendingMommySymptomSelections),
    ).toEqual(['2026-08-23']);
  });

  it('queues a request when Axios reports a connectivity failure', async () => {
    mockNetInfoFetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    mockSaveMommySelection.mockRejectedValue(
      new axios.AxiosError('Network Error', 'ERR_NETWORK'),
    );

    const status = await submitMommySymptomSelection(
      '2026-08-23',
      [4],
      '2026-08-23T10:00:00+03:00',
    );

    expect(status).toBe('pending');
    expect(
      mockStoreState.pendingMommySymptomSelections['2026-08-23'],
    ).toBeDefined();
  });

  it('surfaces validation errors instead of saving them as offline', async () => {
    mockNetInfoFetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    mockSaveMommySelection.mockRejectedValue({
      isAxiosError: true,
      message: 'Bad request',
      response: { status: 400 },
    });

    await expect(
      submitMommySymptomSelection(
        '2026-08-23',
        [999],
        '2026-08-23T10:00:00+03:00',
      ),
    ).rejects.toMatchObject({ response: { status: 400 } });
    expect(
      mockStoreState.pendingMommySymptomSelections['2026-08-23'],
    ).toBeUndefined();
  });

  it('syncs pending selections, refreshes summary, then notifies Today', async () => {
    const record = {
      date: '2026-08-23',
      symptomIds: [8, 16, 29],
      recordedAt: '2026-08-23T10:00:00+03:00',
      updatedAt: '2026-08-23T07:00:00.000Z',
    };
    mockStoreState.pendingMommySymptomSelections = {
      [record.date]: record,
    };
    mockSaveMommySelection.mockResolvedValue({ symptom_ids: record.symptomIds });
    const listener = jest.fn();
    const unsubscribe = subscribeToMommySymptomSync(listener);

    const result = await syncPendingMommySymptomSelections();
    unsubscribe();

    expect(mockSaveMommySelection).toHaveBeenCalledWith({
      symptom_ids: [8, 16, 29],
      recorded_at: record.recordedAt,
    });
    expect(mockGetSummary).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(['2026-08-23']);
    expect(result).toEqual({ syncedDates: ['2026-08-23'], failures: [] });
    expect(
      mockStoreState.pendingMommySymptomSelections['2026-08-23'],
    ).toBeUndefined();
  });
});
