const mockDeleteAccount = jest.fn();
const mockClearSession = jest.fn();
const mockClearOwnerData = jest.fn();
const mockClearPending = jest.fn();
const mockDeleteLocations = jest.fn();
const mockResetLocation = jest.fn();
const mockClearNotifications = jest.fn(async () => undefined);

jest.mock('../src/services/api/AuthService', () => ({
  AuthService: { deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args) },
}));
jest.mock('../src/store/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({ clearSession: () => mockClearSession() }),
  },
}));
jest.mock('../src/store/useUserStore', () => ({
  useUserStore: {
    getState: () => ({
      profile: { backendUserId: 'user-7', email: 'user@example.com' },
    }),
  },
}));
jest.mock('../src/store/useRecommendationExperienceStore', () => ({
  useRecommendationExperienceStore: {
    getState: () => ({ clearCurrentOwnerData: () => mockClearOwnerData() }),
  },
}));
jest.mock('../src/services/recommendationExperience/ProductAnalytics', () => ({
  ProductAnalytics: {
    clearPending: (...args: unknown[]) => mockClearPending(...args),
  },
}));
jest.mock('../src/services/database/DatabaseService', () => ({
  databaseService: { deleteAllLocations: () => mockDeleteLocations() },
}));
jest.mock('../src/services/tracking/LocationAccessCoordinator', () => ({
  locationAccessCoordinator: {
    resetForSignedOutSession: () => mockResetLocation(),
  },
}));
jest.mock('../src/services/NotificationService', () => ({
  clearUserNotifications: () => mockClearNotifications(),
}));

import { AccountDeletionService } from '../src/services/account/AccountDeletionService';

const expectLocalDataCleared = () => {
  expect(mockClearOwnerData).toHaveBeenCalledTimes(1);
  expect(mockClearPending).toHaveBeenCalledWith({
    backendUserId: 'user-7',
    email: 'user@example.com',
  });
  expect(mockDeleteLocations).toHaveBeenCalledTimes(1);
  expect(mockResetLocation).toHaveBeenCalledTimes(1);
  expect(mockClearSession).toHaveBeenCalledTimes(1);
  expect(mockClearNotifications).toHaveBeenCalledTimes(1);
};

describe('AccountDeletionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears local user data after confirmed deletion', async () => {
    mockDeleteAccount.mockResolvedValueOnce(undefined);

    await expect(
      AccountDeletionService.deleteCurrentAccount(),
    ).resolves.toBe('deleted');

    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    expectLocalDataCleared();
  });

  it('keeps the session for a definite backend rejection', async () => {
    const error = { isAxiosError: true, response: { status: 400 } };
    mockDeleteAccount.mockRejectedValueOnce(error);

    await expect(
      AccountDeletionService.deleteCurrentAccount(),
    ).rejects.toBe(error);

    expect(mockClearSession).not.toHaveBeenCalled();
    expect(mockClearOwnerData).not.toHaveBeenCalled();
  });

  it('does not retry after an ambiguous network failure and signs out locally', async () => {
    mockDeleteAccount.mockRejectedValueOnce({
      isAxiosError: true,
      code: 'ECONNABORTED',
    });

    await expect(
      AccountDeletionService.deleteCurrentAccount(),
    ).resolves.toBe('unconfirmed');

    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    expectLocalDataCleared();
  });
});
