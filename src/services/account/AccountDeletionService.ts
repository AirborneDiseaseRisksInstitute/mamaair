import { AuthService } from '../api/AuthService';
import { databaseService } from '../database/DatabaseService';
import { clearUserNotifications } from '../NotificationService';
import { ProductAnalytics } from '../recommendationExperience/ProductAnalytics';
import { locationAccessCoordinator } from '../tracking/LocationAccessCoordinator';
import { useAuthStore } from '../../store/useAuthStore';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import { useUserStore } from '../../store/useUserStore';

export type AccountDeletionStatus = 'deleted' | 'unconfirmed';

const isAmbiguousNetworkFailure = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const axiosError = error as {
    isAxiosError?: boolean;
    response?: unknown;
  };
  return axiosError.isAxiosError === true && axiosError.response === undefined;
};

const clearDeletedAccountData = async (): Promise<void> => {
  const profile = useUserStore.getState().profile;
  const identity = {
    backendUserId: profile.backendUserId,
    email: profile.email,
  };

  useRecommendationExperienceStore.getState().clearCurrentOwnerData();
  ProductAnalytics.clearPending(identity);
  databaseService.deleteAllLocations();
  locationAccessCoordinator.resetForSignedOutSession();
  useAuthStore.getState().clearSession();
  await clearUserNotifications();
};

export const AccountDeletionService = {
  deleteCurrentAccount: async (): Promise<AccountDeletionStatus> => {
    try {
      await AuthService.deleteAccount();
      await clearDeletedAccountData();
      return 'deleted';
    } catch (error) {
      if (!isAmbiguousNetworkFailure(error)) throw error;

      // The server may have completed an irreversible deletion before the
      // connection failed. Do not retry; discard the local session instead.
      await clearDeletedAccountData();
      return 'unconfirmed';
    }
  },
};
