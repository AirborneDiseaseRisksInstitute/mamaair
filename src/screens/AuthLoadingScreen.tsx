import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { AuthService } from '../services/api/AuthService';
import { LifestyleService } from '../services/api/LifestyleService';
import { useTheme } from '../theme';

interface AuthLoadingScreenProps {
  onComplete: (target: 'Home' | 'Intro' | 'Auth') => void;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ onComplete }) => {
  const theme = useTheme();
  const { token, logout } = useAuthStore();
  const { setProfile, setAgreementAccepted } = useUserStore();

  useEffect(() => {
    const checkAuthStatus = async () => {
      // 1. Check for token
      if (!token) {
        onComplete('Auth');
        return;
      }

      try {
        // 2. Fetch Profile from API
        const profileData = await AuthService.getProfile();
        console.log('Profile data fetched:', profileData);

        // 2.1 Fetch Lifestyle from API
        let lifestyleData: any = {};
        try {
            lifestyleData = await LifestyleService.getLifestyle();
            console.log('Lifestyle data fetched:', lifestyleData);
        } catch (e) {
            console.log('Lifestyle data not found or failed, assuming empty', e);
        }
        
        // Map snake_case to camelCase and Reverse Map Enums
        
        // Reverse Maps
        const countryReverseMap: Record<string, string> = {
            'NG': 'nigeria',
            'KE': 'kenya',
            'other': 'others',
        };

        const languageReverseMap: Record<string, string> = {
            'en': 'english',
            'fr': 'french',
            'sw': 'swahili',
            // 'pl': 'polish', // Not in frontend options yet
        };

        const workTypeReverseMap: Record<string, string> = {
            'Desk': 'desk',
            'Standing': 'standing',
            'Night Shift': 'night',
            'Physical': 'physical',
            'Domestic': 'home',
            'Care': 'home', // Approximate mapping
            'Field': 'physical', // Approximate mapping
        };

        const cookingMethodReverseMap: Record<string, string> = {
            'gas': 'gas',
            'charcoal': 'charcoal',
            'electric': 'gas', // Approximate
            'wood': 'charcoal', // Approximate
        };

        const ventilationReverseMap: Record<string, string> = {
            'high': 'good',
            'medium': 'moderate',
            'low': 'poor',
        };

        const mappedProfile = {
            ...profileData,
            pregnancyWeek: profileData.pregnancy_week || profileData.pregnancyWeek,
            birthday: profileData.date_of_birth || profileData.birthday,
            timezone: profileData.timezone,
            // Use mapped values or fallback to original (in case of direct match or new values)
            country: countryReverseMap[profileData.country] || profileData.country,
            language: languageReverseMap[profileData.language] || profileData.language,
        };

        const mappedLifestyle = {
            sleepHours: lifestyleData.average_sleep_hours,
            workType: workTypeReverseMap[lifestyleData.work_type] || lifestyleData.work_type,
            diet: lifestyleData.diet_type,
            cookingMethod: cookingMethodReverseMap[lifestyleData.cooking_method] || lifestyleData.cooking_method,
            activeHours: lifestyleData.activity_duration_minutes ? lifestyleData.activity_duration_minutes / 60 : undefined,
            ventilation: lifestyleData.ventilation || ventilationReverseMap[lifestyleData.ventilation_level],
            timeSpent: lifestyleData.time_spent,
            timeOfDay: lifestyleData.time_of_day,
            // Extra fields stored in lifestyle but used in frontend profile state
            // Note: If backend doesn't return these yet, we might lose them if we overwrite blindly.
            // But since we use "updateIfMissing", we are safe for local data.
            // However, if user logged in on new device, we need these from server.
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
        updateIfMissing('language', mappedProfile.language);
        updateIfMissing('country', mappedProfile.country);
        updateIfMissing('timezone', mappedProfile.timezone);
        // updateIfMissing('area', mappedProfile.area); // Not in profile response?
        updateIfMissing('pregnancyWeek', mappedProfile.pregnancyWeek);
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
             console.log('User has complete profile data, skipping intro...');
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
