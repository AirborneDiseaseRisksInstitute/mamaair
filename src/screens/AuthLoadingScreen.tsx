import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { AuthService } from '../services/api/AuthService';
import { LifestyleService } from '../services/api/LifestyleService';
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
          mergedProfile.pregnancyWeekSetDate = new Date().toISOString().split('T')[0];
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
        
        // 4. Check if we need to sync LOCAL -> SERVER
        // ... (omitted for brevity)

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
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // If 401, token invalid
        logout();
        onComplete('Auth');
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
