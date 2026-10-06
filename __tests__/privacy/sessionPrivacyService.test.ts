const mockDeleteLocationsForOwners = jest.fn();
const mockDeleteUnownedLocations = jest.fn();
const mockClearPending = jest.fn();
const mockStopTracking = jest.fn();
const mockClearUserNotifications = jest.fn(async () => undefined);

jest.mock('../../src/services/database/DatabaseService', () => ({
  databaseService: {
    deleteLocationsForOwners: (ownerKeys: string[]) =>
      mockDeleteLocationsForOwners(ownerKeys),
    deleteUnownedLocations: () => mockDeleteUnownedLocations(),
  },
}));
jest.mock(
  '../../src/services/recommendationExperience/ProductAnalytics',
  () => ({
    ProductAnalytics: {
      clearPending: (identity: unknown) => mockClearPending(identity),
    },
  }),
);
jest.mock('../../src/services/tracking/LocationTracker', () => ({
  locationTracker: {
    stopTracking: () => mockStopTracking(),
  },
}));
jest.mock('../../src/services/NotificationService', () => ({
  clearUserNotifications: () => mockClearUserNotifications(),
}));

import { SessionPrivacyService } from '../../src/services/privacy/SessionPrivacyService';

describe('SessionPrivacyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stops tracking and removes account-bound local data on sign-out', async () => {
    const identity = {
      backendUserId: '42',
      email: 'person@example.com',
    };

    await SessionPrivacyService.clearForSignedOutSession(identity);

    expect(mockStopTracking).toHaveBeenCalledTimes(1);
    expect(mockDeleteLocationsForOwners).toHaveBeenCalledWith([
      expect.stringMatching(/^owner:v1:/),
      expect.stringMatching(/^owner:v1:/),
    ]);
    expect(mockDeleteUnownedLocations).toHaveBeenCalledTimes(1);
    expect(mockClearPending).toHaveBeenCalledWith(identity);
    expect(mockClearUserNotifications).toHaveBeenCalledTimes(1);
  });
});
