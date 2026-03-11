import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faShield } from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing, radius } from '../../../theme';
import {
  Button,
  FixedButtonContainer,
  OrangeHalo,
  BackButton,
  ProgressBar,
  Checkbox,
} from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { AuthService } from '../../../services/api/AuthService';
import {
  ms,
  fs,
  s,
  vs,
  FIXED_BUTTON_AREA_HEIGHT,
  HEADER_CLEARANCE,
} from '../../../utils/responsive';
import { getDeviceTimezone } from '../../../utils/timezoneUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const consentCheckImage = require('../../../assets/images/consentCheck.png');

interface IntroStep14Props {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export const IntroStep14: React.FC<IntroStep14Props> = ({
  onNext,
  onBack,
  onSkip,
}) => {
  const theme = useTheme();
  const { setAgreementAccepted, profile } = useUserStore();
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // 1. Update Profile
      // Ensure we don't send local file URIs for avatar_url
      const avatarUrl = (profile.photo && profile.photo.startsWith('http')) 
        ? profile.photo 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Mama Air')}&background=FF8C00&color=fff`;

      // Map internal values to backend Enums
      const countryMap: Record<string, string> = {
        'nigeria': 'NG',
        'kenya': 'KE',
        'others': 'other',
      };

      const languageMap: Record<string, string> = {
        'english': 'en',
        'french': 'fr',
        'swahili': 'sw',
        'yoruba': 'en', // Fallback as 'ig' or 'yo' not in enum
        'arabic': 'en', // Fallback
      };

      const workTypeMap: Record<string, string> = {
        'desk': 'Desk',
        'standing': 'Standing',
        'night': 'Night Shift',
        'physical': 'Physical',
        'home': 'Domestic',
      };

      // Cooking method mapping: 'mixed' is not in enum, send null or fallback
      const cookingMethodMap: Record<string, string | null> = {
        'gas': 'gas',
        'charcoal': 'charcoal',
        'mixed': null, 
      };

      const ventilationMap: Record<string, string> = {
        'good': 'high',
        'moderate': 'medium',
        'poor': 'low',
      };

      const profilePayload = {
        name: profile.name || "",
        email: profile.email || "",
        avatar_url: avatarUrl,
        date_of_birth: profile.birthday || null,
        height: profile.height || 0,
        weight_pre_pregnancy: profile.weight || 0,
        language: languageMap[profile.language || ''] || "en",
        country: countryMap[profile.country || ''] || "other",
        week_of_pregnancy: profile.pregnancyWeek || 1,
        timezone: profile.timezone || getDeviceTimezone(),
        is_first_pregnancy: profile.pregnancyNumber === 'first',
      };

      console.log('Sending PUT profile payload:', profilePayload);
      const updatedProfile = await AuthService.putProfile(profilePayload);
      console.log('Profile updated, received ID:', updatedProfile.id);

      // 2. Update Lifestyle
      const lifestylePayload = {
        user: updatedProfile.id, // Required by backend
        average_sleep_hours: profile.sleepHours || 0,
        work_type: workTypeMap[profile.workType || ''] || null,
        diet_type: profile.diet || null,
        cooking_method: cookingMethodMap[profile.cookingMethod || ''] || null,
        activity_duration_minutes: Math.round((profile.activeHours || 0) * 60),
        // Extra fields requested to be sent to lifestyle endpoint
        area: profile.area || "",
        ventilation: profile.ventilation || null,
        ventilation_level: ventilationMap[profile.ventilation || ''] || "medium",
        time_spent: profile.timeSpent || null,
        time_of_day: profile.timeOfDay || null,
      };

      console.log('Sending PUT lifestyle payload:', lifestylePayload);
      await AuthService.putLifestyle(lifestylePayload);

      setAgreementAccepted(true);
      if (onNext) onNext();
    } catch (error: any) {
      console.error('Failed to save profile/lifestyle:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      // Even if it fails, we might want to proceed or show error
      // For now, let's allow proceeding to avoid blocking user flow
      setAgreementAccepted(true);
      if (onNext) onNext();
    } finally { setIsLoading(false); }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: '#fff' },
        scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
        contentWrapper: {
          alignItems: 'center',
          paddingHorizontal: spacing('md'),
          paddingTop: HEADER_CLEARANCE,
        },
        illustrationImage: {
          width: vs(140),
          height: vs(140),
          marginBottom: spacing('sm'),
          marginTop: spacing('md'),
          resizeMode: 'contain',
        },
        servicesBox: {
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: radius('md'),
          borderWidth: 1,
          borderColor: theme.colors.neutral200,
          marginBottom: spacing('md'),
        },
        servicesTitle: {
          fontSize: fs(16),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          padding: spacing('md'),
          paddingBottom: spacing('sm'),
        },
        servicesContent: {
          padding: spacing('md'),
          paddingTop: spacing('sm'),
        },
        serviceItem: { marginBottom: spacing('md') },
        serviceNumber: {
          fontSize: fs(14),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          marginBottom: spacing('xs'),
        },
        serviceDescription: {
          fontSize: fs(13),
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
          lineHeight: fs(20),
        },
        checkboxContainer: { width: '100%', marginBottom: 100 },
        buttonRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        skipButton: {
          paddingVertical: spacing('md'),
          paddingHorizontal: spacing('lg'),
          marginLeft: spacing('lg'),
        },
        skipText: {
          fontSize: fs(18),
          fontFamily: theme.typography.fontFamily.extraBold,
          color: theme.colors.orange500,
        },
        continueButtonWrapper: { width: s(200), marginLeft: spacing('md') },
      }),
    [theme],
  );

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo
        cx={SCREEN_WIDTH / 2}
        cy={SCREEN_HEIGHT * 0.35}
        radius={SCREEN_WIDTH * 0.6}
      />
      <BackButton onPress={onBack} />
      <ProgressBar progress={1.0} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <Image source={consentCheckImage} style={styles.illustrationImage} />
          <View style={styles.servicesBox}>
            <Text style={styles.servicesTitle}>
              By activating this consent, you will get these services:
            </Text>
            <View style={styles.servicesContent}>
              <View style={styles.serviceItem}>
                <Text style={styles.serviceNumber}>1. Emergency Care</Text>
                <Text style={styles.serviceDescription}>
                  Provides immediate medical attention to people experiencing
                  sudden, serious illness or injury to stabilize their condition
                  and prevent further harm.
                </Text>
              </View>
              <View style={styles.serviceItem}>
                <Text style={styles.serviceNumber}>
                  2. Medication prescription
                </Text>
                <Text style={styles.serviceDescription}>
                  Allows healthcare providers to prescribe medications based on
                  your medical condition and needs to ensure proper treatment
                  and recovery.
                </Text>
              </View>
              <View style={styles.serviceItem}>
                <Text style={styles.serviceNumber}>
                  3. Doctor or midwife appointment
                </Text>
                <Text style={styles.serviceDescription}>
                  Enables scheduling and management of appointments with
                  healthcare professionals to monitor your health and receive
                  ongoing care.
                </Text>
              </View>
              <View style={styles.serviceItem}>
                <Text style={styles.serviceNumber}>4. Health monitoring</Text>
                <Text style={styles.serviceDescription}>
                  Continuous tracking of vital signs and health metrics to
                  identify any changes or concerns early.
                </Text>
              </View>
              <View style={styles.serviceItem}>
                <Text style={styles.serviceNumber}>
                  5. Medical records access
                </Text>
                <Text style={styles.serviceDescription}>
                  Provides secure access to your medical history and records for
                  better coordination of care.
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.checkboxContainer}>
            <Checkbox
              label="Data Consent Agreement"
              subtitle="I consent to the processing of my data."
              checked={isConsentChecked}
              onPress={() => setIsConsentChecked(!isConsentChecked)}
              icon={
                <FontAwesomeIcon
                  icon={faShield as any}
                  size={ms(24)}
                  color="#4285F4"
                />
              }
              backgroundColor="#4285F4"
            />
          </View>
        </View>
      </ScrollView>

      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}>
            <Text style={styles.skipText}>SKIP</Text>
          </Pressable>
          <View style={styles.continueButtonWrapper}>
            <Button
              title={isLoading ? 'Saving...' : 'Agree'}
              onPress={handleNext}
              disabled={!isConsentChecked || isLoading}
            />
          </View>
        </View>
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
