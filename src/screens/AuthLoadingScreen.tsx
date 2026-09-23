import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { userStorage, useUserStore } from '../store/useUserStore';
import { AuthService } from '../services/api/AuthService';
import { LifestyleService } from '../services/api/LifestyleService';
import { ProfileService } from '../services/api/ProfileService';
import { getDeviceTimezone } from '../utils/timezoneUtils';
import { formatLocalDate } from '../utils/dateUtils';
import { useTheme } from '../theme';
import {
  DEV_LOCAL_SESSION,
  DEV_LOCAL_SESSION_RESET_TOKEN,
} from '../config/dev';
import { shouldReplaceLocalProfileForAuthenticatedUser } from '../services/auth/AuthSessionIdentity';
import { locationAccessCoordinator } from '../services/tracking/LocationAccessCoordinator';
import {
  buildLifestyleApiPayload,
  buildProfileApiPayload,
  mapApiLifestyleToLocal,
  mapApiProfileToLocal,
} from '../utils/profileApiMapping';

const DEV_LOCAL_RESET_APPLIED_KEY = 'dev-local-session-reset-token-applied';

interface AuthLoadingScreenProps {
  onComplete: (target: 'Home' | 'Intro' | 'ConsentHome' | 'Auth') => void;
  authenticatedEmail?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  onComplete,
  authenticatedEmail,
}) => {
  const theme = useTheme();
  const { token, logout } = useAuthStore();
  const { clearUser, setProfile, setAgreementAccepted } = useUserStore();

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (DEV_LOCAL_SESSION) {
        const appliedResetToken = userStorage.getNumber(
          DEV_LOCAL_RESET_APPLIED_KEY,
        );

        if (appliedResetToken !== DEV_LOCAL_SESSION_RESET_TOKEN) {
          clearUser();
          userStorage.set(
            DEV_LOCAL_RESET_APPLIED_KEY,
            DEV_LOCAL_SESSION_RESET_TOKEN,
          );
        }

        const localProfile = useUserStore.getState().profile;
        const isLocalOnboardingComplete =
          localProfile.agreementAccepted && localProfile.pregnancyWeekConfirmed;

        onComplete(isLocalOnboardingComplete ? 'Home' : 'Intro');
        return;
      }

      let activeToken = token;

      // 1. Check for token
      if (!activeToken) {
        onComplete('Auth');
        return;
      }

      try {
        const sessionEmail = authenticatedEmail?.trim() || null;
        // 2. Fetch Profile from API
        const profileData = await AuthService.getProfile();

        // 2.1 Fetch Lifestyle from API
        let lifestyleData: any = {};
        try {
          lifestyleData = await LifestyleService.getLifestyle();
        } catch {
          // silently ignore — lifestyle may not exist yet
        }

        const mappedProfile = mapApiProfileToLocal(profileData, sessionEmail);
        const mappedLifestyle = mapApiLifestyleToLocal(lifestyleData);

        // Get current local profile state non-reactively to avoid loops
        let currentProfile = useUserStore.getState().profile;

        // A local profile is only safe to reuse when it is already bound to
        // the authenticated backend user. This prevents a previous local/dev
        // session, or another account on the same device, from leaking into
        // the current user's onboarding and Today data.
        if (
          shouldReplaceLocalProfileForAuthenticatedUser(
            currentProfile.backendUserId,
            mappedProfile.backendUserId,
          )
        ) {
          clearUser();
          currentProfile = useUserStore.getState().profile;
        }

        // 3. Smart Merge & Sync Strategy
        // We want to trust LOCAL data if it exists, because the user might have just entered it
        // and the server sync failed or hasn't happened yet.
        // We only overwrite local with server if server has data and local doesn't (or if we want to force sync from server).

        const mergedProfile = { ...currentProfile };

        // Helper to update if server has value and local is empty
        const updateIfMissing = (
          key: keyof typeof mergedProfile,
          serverValue: any,
        ) => {
          if (
            serverValue !== undefined &&
            serverValue !== null &&
            !mergedProfile[key]
          ) {
            (mergedProfile as any)[key] = serverValue;
          }
        };

        updateIfMissing('name', mappedProfile.name);
        updateIfMissing('backendUserId', mappedProfile.backendUserId);
        updateIfMissing('email', mappedProfile.email);
        updateIfMissing('birthday', mappedProfile.birthday);
        updateIfMissing('expectedDueDate', mappedProfile.expectedDueDate);
        updateIfMissing('height', mappedProfile.height);
        updateIfMissing('weight', mappedProfile.weight);
        // Language is explicitly chosen by the user in IntroStep04 or Profile Settings.
        // The API returns 'en' as a default for all new users, which would cause IntroStep04
        // to be skipped — so we only sync language from server if the user already has a name
        // (meaning they've been through intro and have an established profile).
        if (mergedProfile.name) {
          updateIfMissing('language', mappedProfile.language);
        }
        updateIfMissing('country', mappedProfile.country);
        updateIfMissing('timezone', mappedProfile.timezone);
        updateIfMissing('pregnancyWeek', mappedProfile.pregnancyWeek);
        updateIfMissing(
          'pregnancyWeekConfirmed',
          mappedProfile.pregnancyWeekConfirmed,
        );
        updateIfMissing('pregnancyNumber', mappedProfile.pregnancyNumber);
        // If we got a pregnancy week but have no set date, use today so week advancement starts counting now
        if (
          mergedProfile.pregnancyWeek &&
          !mergedProfile.pregnancyWeekSetDate
        ) {
          mergedProfile.pregnancyWeekSetDate = formatLocalDate(new Date());
        }
        // Photo is handled separately usually, but if server sends URL:
        updateIfMissing(
          'photo',
          mappedProfile.photo,
        );

        // Lifestyle fields
        updateIfMissing('sleepHours', mappedLifestyle.sleepHours);
        updateIfMissing('workType', mappedLifestyle.workType);
        updateIfMissing('diet', mappedLifestyle.diet);
        updateIfMissing('cookingMethod', mappedLifestyle.cookingMethod);
        updateIfMissing('activeHours', mappedLifestyle.activeHours);
        updateIfMissing('area', mappedLifestyle.area);
        updateIfMissing('ventilation', mappedLifestyle.ventilation);
        updateIfMissing('timeSpent', mappedLifestyle.timeSpent);
        updateIfMissing('timeOfDay', mappedLifestyle.timeOfDay);

        // Update the store with the merged profile
        // This ensures we don't wipe local data with empty server data
        setProfile(mergedProfile);
        if (profileData?.consent === true && !mergedProfile.agreementAccepted) {
          setAgreementAccepted(true);
          mergedProfile.agreementAccepted = true;
        }

        // 4. Sync LOCAL -> SERVER when the server is missing data we hold locally.
        // Fixes data loss: if the initial profile/lifestyle save failed or was
        // done offline, the local-only data would otherwise never reach the
        // server — and after a reinstall the user would be forced through
        // onboarding again because the server can't return those fields.
        const serverPregnancyWeek =
          profileData?.week_of_pregnancy ?? profileData?.pregnancyWeek;
        const serverMissingProfile =
          !serverPregnancyWeek ||
          !profileData?.timezone ||
          !profileData?.name ||
          !profileData?.country ||
          !profileData?.date_of_birth ||
          profileData?.height == null ||
          profileData?.weight_pre_pregnancy == null ||
          (Boolean(mergedProfile.pregnancyNumber) &&
            profileData?.pregnancy_number == null) ||
          Boolean(
            mergedProfile.pregnancyWeekConfirmed &&
              mergedProfile.pregnancyWeek &&
              Number(serverPregnancyWeek) !== mergedProfile.pregnancyWeek,
          );
        const serverMissingLifestyle =
          !lifestyleData?.work_type ||
          !lifestyleData?.cooking_method ||
          !lifestyleData?.ventilation_level ||
          !lifestyleData?.time_spent ||
          !lifestyleData?.time_of_day ||
          !lifestyleData?.area ||
          lifestyleData?.average_sleep_hours == null ||
          lifestyleData?.activity_duration_minutes == null ||
          !lifestyleData?.diet_type;
        const hasLocalData = !!(
          mergedProfile.name &&
          mergedProfile.pregnancyWeek &&
          mergedProfile.pregnancyWeekConfirmed
        );

        if (
          hasLocalData &&
          mergedProfile.agreementAccepted &&
          (serverMissingProfile || serverMissingLifestyle)
        ) {
          // Best-effort and non-blocking: navigation proceeds regardless, and a
          // failure simply retries on the next launch.
          (async () => {
            try {
              const locationState = await locationAccessCoordinator
                .getState()
                .catch(() => null);
              await ProfileService.patchProfile(
                buildProfileApiPayload(mergedProfile, {
                  trackingEnabled:
                    locationState?.trackingEnabled ?? false,
                  timezoneFallback: getDeviceTimezone(),
                }),
              );

              await LifestyleService.patchLifestyle(
                buildLifestyleApiPayload(mergedProfile),
              );
              console.log(
                '[AuthLoading] Synced local profile/lifestyle to server.',
              );
            } catch (e) {
              console.warn(
                '[AuthLoading] Local->server sync failed (will retry next launch):',
                e,
              );
            }
          })();
        }

        // 5. Navigation Decision
        // Check if user has completed all necessary onboarding steps (including new fields)
        const isOnboardingComplete =
          mergedProfile.pregnancyWeek &&
          mergedProfile.pregnancyWeekConfirmed &&
          mergedProfile.timezone &&
          mergedProfile.timeSpent &&
          mergedProfile.timeOfDay &&
          mergedProfile.workType &&
          mergedProfile.cookingMethod &&
          mergedProfile.ventilation;

        if (isOnboardingComplete) {
          onComplete(mergedProfile.agreementAccepted ? 'Home' : 'ConsentHome');
          return;
        }

        onComplete('Intro');
      } catch (error: any) {
        console.error('Failed to fetch profile:', error);
        // Only a real 401 means the token is invalid — then log out.
        if (error?.response?.status === 401) {
          logout();
          onComplete('Auth');
          return;
        }
        // Network/transient error (e.g. offline launch): keep the session and
        // decide navigation from the locally cached profile so we don't log the
        // user out or lose their data.
        const local = useUserStore.getState().profile;
        const localOnboardingComplete =
          local?.pregnancyWeek &&
          local?.pregnancyWeekConfirmed &&
          local?.timezone &&
          local?.timeSpent &&
          local?.timeOfDay &&
          local?.workType &&
          local?.cookingMethod &&
          local?.ventilation;
        if (localOnboardingComplete) {
          onComplete(local.agreementAccepted ? 'Home' : 'ConsentHome');
        } else {
          onComplete('Intro');
        }
      }
    };

    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // We only run this on mount, dependencies are stable stores

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
