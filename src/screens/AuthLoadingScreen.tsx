import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { AuthService } from '../services/api/AuthService';
import { LifestyleService } from '../services/api/LifestyleService';
import { ProfileService } from '../services/api/ProfileService';
import { getDeviceTimezone } from '../utils/timezoneUtils';
import { formatLocalDate } from '../utils/dateUtils';
import { useTheme } from '../theme';
import { DEV_BYPASS_AUTH, DEV_EMAIL, DEV_PASSWORD } from '../config/dev';

interface AuthLoadingScreenProps {
  onComplete: (target: 'Home' | 'Intro' | 'Auth') => void;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ onComplete }) => {
  const theme = useTheme();
  const { token, logout, setTokens } = useAuthStore();
  const { setProfile, setAgreementAccepted } = useUserStore();

  useEffect(() => {
    const checkAuthStatus = async () => {
      let activeToken = token;

      // DEV MODE: auto-login to bypass the login UI (useful for Genymotion)
      if (DEV_BYPASS_AUTH && !activeToken) {
        try {
          const response = await AuthService.login(DEV_EMAIL, DEV_PASSWORD);
          setTokens(response.access, response.refresh);
          activeToken = response.access;
        } catch (e) {
          console.error('[DEV] Auto-login failed:', e);
          onComplete('Auth');
          return;
        }
      }

      // 1. Check for token
      if (!activeToken) {
        onComplete('Auth');
        return;
      }

      try {
        // 2. Fetch Profile from API
        const profileData = await AuthService.getProfile();

        // 2.1 Fetch Lifestyle from API
        let lifestyleData: any = {};
        try {
            lifestyleData = await LifestyleService.getLifestyle();
        } catch {
            // silently ignore — lifestyle may not exist yet
        }

        // ventilation_level (API) → ventilation (local store)
        const ventilationReverseMap: Record<string, string> = {
            'high': 'good',
            'medium': 'moderate',
            'low': 'poor',
        };

        // Profile fields — API values are stored directly, no enum conversion needed
        const mappedProfile = {
            ...profileData,
            pregnancyWeek: profileData.week_of_pregnancy ?? profileData.pregnancyWeek,
            birthday: profileData.date_of_birth ?? profileData.birthday,
            // country, language — stored as API values (NG, KE, en, fr, etc.)
        };

        const mappedLifestyle = {
            sleepHours: lifestyleData.average_sleep_hours,
            workType: lifestyleData.work_type,
            diet: lifestyleData.diet_type,
            cookingMethod: lifestyleData.cooking_method,
            activeHours: lifestyleData.activity_duration_minutes
                ? lifestyleData.activity_duration_minutes / 60
                : undefined,
            ventilation: ventilationReverseMap[lifestyleData.ventilation_level],
            timeSpent: lifestyleData.time_spent,
            timeOfDay: lifestyleData.time_of_day,
        };
        
        // Get current local profile state non-reactively to avoid loops
        const currentProfile = useUserStore.getState().profile;

        // 3. Smart Merge & Sync Strategy
        // We want to trust LOCAL data if it exists, because the user might have just entered it 
        // and the server sync failed or hasn't happened yet.
        // We only overwrite local with server if server has data and local doesn't (or if we want to force sync from server).
        
        const mergedProfile = { ...currentProfile };
        
        // Helper to update if server has value and local is empty
        const updateIfMissing = (key: keyof typeof mergedProfile, serverValue: any) => {
            if (serverValue !== undefined && serverValue !== null && !mergedProfile[key]) {
                (mergedProfile as any)[key] = serverValue;
            }
        };

        updateIfMissing('name', mappedProfile.name);
        updateIfMissing('birthday', mappedProfile.birthday);
        updateIfMissing('height', mappedProfile.height);
        updateIfMissing('weight', mappedProfile.weight_pre_pregnancy || mappedProfile.weight);
        // Language is explicitly chosen by the user in IntroStep04 or Profile Settings.
        // The API returns 'en' as a default for all new users, which would cause IntroStep04
        // to be skipped — so we only sync language from server if the user already has a name
        // (meaning they've been through intro and have an established profile).
        if (mergedProfile.name) {
          updateIfMissing('language', mappedProfile.language);
        }
        updateIfMissing('country', mappedProfile.country);
        updateIfMissing('timezone', mappedProfile.timezone);
        // updateIfMissing('area', mappedProfile.area); // Not in profile response?
        updateIfMissing('pregnancyWeek', mappedProfile.pregnancyWeek);
        // If we got a pregnancy week but have no set date, use today so week advancement starts counting now
        if (mergedProfile.pregnancyWeek && !mergedProfile.pregnancyWeekSetDate) {
          mergedProfile.pregnancyWeekSetDate = formatLocalDate(new Date());
        }
        // Photo is handled separately usually, but if server sends URL:
        updateIfMissing('photo', mappedProfile.avatar_url || mappedProfile.photo);

        // Lifestyle fields
        updateIfMissing('sleepHours', mappedLifestyle.sleepHours);
        updateIfMissing('workType', mappedLifestyle.workType);
        updateIfMissing('diet', mappedLifestyle.diet);
        updateIfMissing('cookingMethod', mappedLifestyle.cookingMethod);
        updateIfMissing('activeHours', mappedLifestyle.activeHours);
        updateIfMissing('ventilation', mappedLifestyle.ventilation);
        updateIfMissing('timeSpent', mappedLifestyle.timeSpent);
        updateIfMissing('timeOfDay', mappedLifestyle.timeOfDay);
        
        // These fields might be missing from backend response if they are not in schema or mapped differently
        // 'area', 'ventilation', 'timeSpent', 'timeOfDay'
        // If we saved them to lifestyle endpoint (as extra fields), we need to ensure backend returns them.
        // If backend schema doesn't support them, we can't fetch them back yet.
        
        // Update the store with the merged profile
        // This ensures we don't wipe local data with empty server data
        setProfile(mergedProfile);
        
        // 4. Sync LOCAL -> SERVER when the server is missing data we hold locally.
        // Fixes data loss: if the initial profile/lifestyle save failed or was
        // done offline, the local-only data would otherwise never reach the
        // server — and after a reinstall the user would be forced through
        // onboarding again because the server can't return those fields.
        const serverMissingProfile =
          !profileData?.week_of_pregnancy || !profileData?.timezone || !profileData?.name;
        const serverMissingLifestyle =
          !lifestyleData?.work_type ||
          !lifestyleData?.cooking_method ||
          !lifestyleData?.ventilation_level ||
          !lifestyleData?.time_spent ||
          !lifestyleData?.time_of_day;
        const hasLocalData = !!(mergedProfile.name && mergedProfile.pregnancyWeek);

        if (hasLocalData && (serverMissingProfile || serverMissingLifestyle)) {
          // Best-effort and non-blocking: navigation proceeds regardless, and a
          // failure simply retries on the next launch.
          void (async () => {
            try {
              const VENTILATION_LEVEL: Record<string, string> = {
                good: 'high',
                moderate: 'medium',
                poor: 'low',
              };
              const avatarUrl =
                mergedProfile.photo && mergedProfile.photo.startsWith('http')
                  ? mergedProfile.photo
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      mergedProfile.name || 'Mama Air',
                    )}&background=FF8C00&color=fff`;

              const updated = await ProfileService.patchProfile({
                name: mergedProfile.name || '',
                avatar_url: avatarUrl,
                date_of_birth: mergedProfile.birthday || null,
                height: mergedProfile.height || 0,
                weight_pre_pregnancy: mergedProfile.weight || 0,
                language: mergedProfile.language || 'en',
                country: mergedProfile.country || 'other',
                week_of_pregnancy: mergedProfile.pregnancyWeek || 1,
                timezone: mergedProfile.timezone || getDeviceTimezone(),
                is_first_pregnancy: mergedProfile.pregnancyNumber === 'first',
                consent: true,
                tracking_enabled: true,
                notifications_enabled: true,
              });

              await LifestyleService.patchLifestyle({
                user: updated?.id ?? profileData?.id,
                average_sleep_hours: mergedProfile.sleepHours || 0,
                work_type: mergedProfile.workType || null,
                diet_type: mergedProfile.diet || null,
                cooking_method: mergedProfile.cookingMethod || null,
                activity_duration_minutes: Math.round((mergedProfile.activeHours || 0) * 60),
                area: mergedProfile.area || '',
                ventilation: mergedProfile.ventilation || null,
                ventilation_level: VENTILATION_LEVEL[mergedProfile.ventilation || ''] || 'medium',
                time_spent: mergedProfile.timeSpent || null,
                time_of_day: mergedProfile.timeOfDay || null,
              });
              console.log('[AuthLoading] Synced local profile/lifestyle to server.');
            } catch (e) {
              console.warn('[AuthLoading] Local->server sync failed (will retry next launch):', e);
            }
          })();
        }

        // 5. Navigation Decision
        // Check if user has completed all necessary onboarding steps (including new fields)
        const isOnboardingComplete = 
            mergedProfile.pregnancyWeek &&
            mergedProfile.timezone &&
            mergedProfile.timeSpent &&
            mergedProfile.timeOfDay &&
            mergedProfile.workType &&
            mergedProfile.cookingMethod &&
            mergedProfile.ventilation;

        if (isOnboardingComplete) {
             setAgreementAccepted(true);
             onComplete('Home');
             return;
        }
        
        // If we have pregnancy week but NO agreement, maybe we can shortcut to Step 14?
        // That would be cool but requires changing onComplete to accept a specific step.
        // onComplete type is (target: 'Home' | 'Intro' | 'Auth').
        
        // For now, let's stick to standard flow but rely on Pre-fill.
        // BUT, if the user explicitly wants to "not show again", maybe they consider "Pregnancy Week" as done?
        // Let's rely on Agreement for now to be legally safe, but ensuring Sync happens above fixes the data loss.
        
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
          local?.timezone &&
          local?.timeSpent &&
          local?.timeOfDay &&
          local?.workType &&
          local?.cookingMethod &&
          local?.ventilation;
        if (localOnboardingComplete) {
          setAgreementAccepted(true);
          onComplete('Home');
        } else {
          onComplete('Intro');
        }
      }
    };

    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // We only run this on mount, dependencies are stable stores

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
