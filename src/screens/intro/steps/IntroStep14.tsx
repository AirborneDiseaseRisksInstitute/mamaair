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
  AccessLocationBottomSheet,
} from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { locationTracker } from '../../../services/tracking/LocationTracker';
import { AuthService } from '../../../services/api/AuthService';
import { ProfileService } from '../../../services/api/ProfileService';
import { LifestyleService } from '../../../services/api/LifestyleService';
import { LanguageService } from '../../../services/api/LanguageService';
import {
  ms,
  fs,
  s,
  vs,
  FIXED_BUTTON_AREA_HEIGHT,
  HEADER_CLEARANCE,
} from '../../../utils/responsive';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { setAgreementAccepted, profile } = useUserStore();
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // 1. Update Profile
      // Ensure we don't send local file URIs for avatar_url
      const avatarUrl = (profile.photo && profile.photo.startsWith('http')) 
        ? profile.photo 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Mama Air')}&background=FF8C00&color=fff`;

      const VENTILATION_LEVEL: Record<string, string> = {
        'good': 'high',
        'moderate': 'medium',
        'poor': 'low',
      };

      const profilePayload = {
        name: profile.name || "",
        avatar_url: avatarUrl,
        date_of_birth: profile.birthday || null,
        height: profile.height || 0,
        weight_pre_pregnancy: profile.weight || 0,
        language: profile.language || "en",
        country: profile.country || "other",
        week_of_pregnancy: profile.pregnancyWeek || 1,
        timezone: profile.timezone || getDeviceTimezone(),
        is_first_pregnancy: profile.pregnancyNumber === 'first',
        consent: true,
        tracking_enabled: true,
        notifications_enabled: true,
      };

      const updatedProfile = await ProfileService.patchProfile(profilePayload);
      LanguageService.setLanguage(profile.language || 'en').catch(() => {});

      // 2. Update Lifestyle
      const lifestylePayload = {
        user: updatedProfile.id,
        average_sleep_hours: profile.sleepHours || 0,
        work_type: profile.workType || null,
        diet_type: profile.diet || null,
        cooking_method: profile.cookingMethod || null,
        activity_duration_minutes: Math.round((profile.activeHours || 0) * 60),
        area: profile.area || "",
        ventilation: profile.ventilation || null,
        ventilation_level: VENTILATION_LEVEL[profile.ventilation || ''] || "medium",
        time_spent: profile.timeSpent || null,
        time_of_day: profile.timeOfDay || null,
      };

      await LifestyleService.patchLifestyle(lifestylePayload);

      setAgreementAccepted(true);
      setShowLocationSheet(true);
    } catch (error: any) {
      console.error('Failed to save profile/lifestyle:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      setAgreementAccepted(true);
      setShowLocationSheet(true);
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
              {t('intro.step14_services_title')}
            </Text>
            <View style={styles.servicesContent}>
              <View style={styles.serviceItem}>
                <Text style={styles.serviceNumber}>{t('intro.step14_service1_title')}</Text>
                <Text style={styles.serviceDescription}>{t('intro.step14_service1_desc')}</Text>
              </View>
              <View style={styles.serviceItem}>
                <Text style={styles.serviceNumber}>{t('intro.step14_service2_title')}</Text>
                <Text style={styles.serviceDescription}>{t('intro.step14_service2_desc')}</Text>
              </View>
              <View style={styles.serviceItem}>
                <Text style={styles.serviceNumber}>{t('intro.step14_service3_title')}</Text>
                <Text style={styles.serviceDescription}>{t('intro.step14_service3_desc')}</Text>
              </View>
              <View style={styles.serviceItem}>
                <Text style={styles.serviceNumber}>{t('intro.step14_service4_title')}</Text>
                <Text style={styles.serviceDescription}>{t('intro.step14_service4_desc')}</Text>
              </View>
              <View style={styles.serviceItem}>
                <Text style={styles.serviceNumber}>{t('intro.step14_service5_title')}</Text>
                <Text style={styles.serviceDescription}>{t('intro.step14_service5_desc')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.checkboxContainer}>
            <Checkbox
              label={t('intro.step14_consent_label')}
              subtitle={t('intro.step14_consent_subtitle')}
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
            <Text style={styles.skipText}>{t('common.skip')}</Text>
          </Pressable>
          <View style={styles.continueButtonWrapper}>
            <Button
              title={isLoading ? t('common.saving') : t('intro.step14_agree')}
              onPress={handleNext}
              disabled={!isConsentChecked || isLoading}
            />
          </View>
        </View>
      </FixedButtonContainer>

      <AccessLocationBottomSheet
        visible={showLocationSheet}
        onClose={() => { setShowLocationSheet(false); onNext?.(); }}
        onAllow={() => {
          setShowLocationSheet(false);
          locationTracker.requestAndStart().catch(() => {});
          onNext?.();
        }}
        onNotNow={() => { setShowLocationSheet(false); onNext?.(); }}
      />
    </SafeAreaView>
  );
};
