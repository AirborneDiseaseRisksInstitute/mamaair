import type { RecommendationExperienceIdentity } from '../../types/recommendationExperience';
import { clearUserNotifications } from '../NotificationService';
import { databaseService } from '../database/DatabaseService';
import { ProductAnalytics } from '../recommendationExperience/ProductAnalytics';
import { locationTracker } from '../tracking/LocationTracker';
import { resolveLocationOwnerKeys } from './LocationDataOwnership';

const safelyRun = (operation: () => void): void => {
  try {
    operation();
  } catch (error) {
    if (__DEV__) console.warn('[SessionPrivacy] Local cleanup failed', error);
  }
};

export const SessionPrivacyService = {
  clearForSignedOutSession: async (
    identity: RecommendationExperienceIdentity,
  ): Promise<void> => {
    const ownerKeys = resolveLocationOwnerKeys(identity);

    safelyRun(() => locationTracker.stopTracking());
    safelyRun(() => databaseService.deleteLocationsForOwners(ownerKeys));
    safelyRun(() => databaseService.deleteUnownedLocations());
    safelyRun(() => ProductAnalytics.clearPending(identity));

    try {
      await clearUserNotifications();
    } catch (error) {
      if (__DEV__) {
        console.warn('[SessionPrivacy] Notification cleanup failed', error);
      }
    }
  },
};
