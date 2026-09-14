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
import { DEV_LOCAL_SESSION } from '../../../config/dev';
import { HEALTHCARE_SERVICE_REQUESTS_ENABLED } from '../../../config/recommendationExperience';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const consentCheckImage = require('../../../assets/images/consentCheck.png');

interface IntroStep14Props {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  requireSuccessfulSave?: boolean;
}

export const IntroStep14: React.FC<IntroStep14Props> = ({
  onNext,
  onBack,
  onSkip,
  showSkip = true,
  requireSuccessfulSave = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setAgreementAccepted, setProfile, profile } = useUserStore();
  const [isConsentChecked, setIsConsentChecked] = useState(
    profile.agreementAccepted,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const dataUseItems = [
    {
      title: t('intro.step14_data_item1_title'),
      description: t('intro.step14_data_item1_desc'),
    },
    {
      title: t('intro.step14_data_item2_title'),
      description: t('intro.step14_data_item2_desc'),
    },
    {
      title: t('intro.step14_data_item3_title'),
      description: t('intro.step14_data_item3_desc'),
    },
  ];

  const handleNext = async () => {
    setSaveError(false);
    setIsLoading(true);
    try {
      if (DEV_LOCAL_SESSION) {
        setAgreementAccepted(true);
        setShowLocationSheet(true);
        return;
      }

      // 1. Update Profile
      // Ensure we don't send local file URIs for avatar_url
      const avatarUrl =
        profile.photo && profile.photo.startsWith('http')
          ? profile.photo
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              profile.name || 'Mama Air',
            )}&background=FF8C00&color=fff`;

      const VENTILATION_LEVEL: Record<string, string> = {
        good: 'high',
        moderate: 'medium',
        poor: 'low',
      };

      const profilePayload = {
        name: profile.name || '',
        avatar_url: avatarUrl,
        date_of_birth: profile.birthday || null,
        height: profile.height || 0,
        weight_pre_pregnancy: profile.weight || 0,
        language: profile.language || 'en',
        country: profile.country || 'other',
        week_of_pregnancy: profile.pregnancyWeek || 1,
        timezone: profile.timezone || getDeviceTimezone(),
        is_first_pregnancy: profile.pregnancyNumber === 'first',
        consent: true,
        tracking_enabled: true,
        notifications_enabled: true,
      };

      const updatedProfile = await ProfileService.patchProfile(profilePayload);
      if (updatedProfile?.id !== undefined && updatedProfile?.id !== null) {
        setProfile({ backendUserId: String(updatedProfile.id) });
      }
      LanguageService.setLanguage(profile.language || 'en').catch(() => {});

      // 2. Update Lifestyle
      const lifestylePayload = {
        user: updatedProfile.id,
        average_sleep_hours: profile.sleepHours || 0,
        work_type: profile.workType || null,
        diet_type: profile.diet || null,
        cooking_method: profile.cookingMethod || null,
        activity_duration_minutes: Math.round((profile.activeHours || 0) * 60),
        area: profile.area || '',
        ventilation: profile.ventilation || null,
        ventilation_level:
          VENTILATION_LEVEL[profile.ventilation || ''] || 'medium',
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
      if (requireSuccessfulSave) {
        setSaveError(true);
        return;
      }
      setAgreementAccepted(true);
      setShowLocationSheet(true);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: '#fff' },
        scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
        contentWrapper: {
          alignItems: 'stretch',
          paddingHorizontal: spacing('md'),
          paddingTop: HEADER_CLEARANCE,
        },
        illustrationImage: {
          alignSelf: 'center',
          width: vs(132),
          height: vs(132),
          marginBottom: spacing('md'),
          marginTop: spacing('sm'),
          resizeMode: 'contain',
        },
        servicesBox: {
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: radius('md'),
          borderWidth: 1,
          borderColor: theme.colors.neutral200,
          marginBottom: spacing('md'),
          overflow: 'hidden',
        },
        servicesTitle: {
          fontSize: fs(16),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          lineHeight: fs(24),
          paddingHorizontal: spacing('md'),
          paddingTop: spacing('md'),
          paddingBottom: spacing('sm'),
        },
        servicesContent: {
          paddingHorizontal: spacing('md'),
          paddingBottom: spacing('md'),
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
        dataIntro: {
          fontSize: fs(14),
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
          lineHeight: fs(22),
          marginBottom: spacing('md'),
        },
        dataItem: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: spacing('md'),
        },
        dataItemLast: { marginBottom: 0 },
        dataItemNumber: {
          width: ms(24),
          height: ms(24),
          borderRadius: ms(12),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.orange100,
          marginRight: spacing('sm'),
          marginTop: ms(1),
          flexShrink: 0,
        },
        dataItemNumberText: {
          fontSize: fs(12),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.orange700,
          lineHeight: fs(16),
        },
        dataItemCopy: { flex: 1 },
        dataItemTitle: {
          fontSize: fs(14),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          lineHeight: fs(20),
          marginBottom: spacing('xs'),
        },
        dataItemDescription: {
          fontSize: fs(13),
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
          lineHeight: fs(20),
        },
        dataChoiceNote: {
          fontSize: fs(12),
          fontFamily: theme.typography.fontFamily.medium,
          color: theme.colors.neutral600,
          lineHeight: fs(18),
          backgroundColor: theme.colors.neutral50,
          borderTopWidth: 1,
          borderTopColor: theme.colors.neutral200,
          paddingHorizontal: spacing('md'),
          paddingVertical: spacing('sm'),
        },
        checkboxContainer: {
          width: '100%',
          marginBottom: spacing('xl'),
        },
        saveError: {
          marginTop: spacing('sm'),
          color: '#B93838',
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: fs(12),
          lineHeight: fs(18),
        },
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
              {t(
                HEALTHCARE_SERVICE_REQUESTS_ENABLED
                  ? 'intro.step14_services_title'
                  : 'intro.step14_data_title',
              )}
            </Text>
            {HEALTHCARE_SERVICE_REQUESTS_ENABLED ? (
              <View style={styles.servicesContent}>
                <View style={styles.serviceItem}>
                  <Text style={styles.serviceNumber}>
                    {t('intro.step14_service1_title')}
                  </Text>
                  <Text style={styles.serviceDescription}>
                    {t('intro.step14_service1_desc')}
                  </Text>
                </View>
                <View style={styles.serviceItem}>
                  <Text style={styles.serviceNumber}>
                    {t('intro.step14_service2_title')}
                  </Text>
                  <Text style={styles.serviceDescription}>
                    {t('intro.step14_service2_desc')}
                  </Text>
                </View>
                <View style={styles.serviceItem}>
                  <Text style={styles.serviceNumber}>
                    {t('intro.step14_service3_title')}
                  </Text>
                  <Text style={styles.serviceDescription}>
                    {t('intro.step14_service3_desc')}
                  </Text>
                </View>
                <View style={styles.serviceItem}>
                  <Text style={styles.serviceNumber}>
                    {t('intro.step14_service4_title')}
                  </Text>
                  <Text style={styles.serviceDescription}>
                    {t('intro.step14_service4_desc')}
                  </Text>
                </View>
                <View style={styles.serviceItem}>
                  <Text style={styles.serviceNumber}>
                    {t('intro.step14_service5_title')}
                  </Text>
                  <Text style={styles.serviceDescription}>
                    {t('intro.step14_service5_desc')}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.servicesContent}>
                  <Text style={styles.dataIntro}>
                    {t('intro.step14_data_description')}
                  </Text>
                  {dataUseItems.map((item, index) => (
                    <View
                      key={item.title}
                      style={[
                        styles.dataItem,
                        index === dataUseItems.length - 1 &&
                          styles.dataItemLast,
                      ]}
                    >
                      <View style={styles.dataItemNumber}>
                        <Text style={styles.dataItemNumberText}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.dataItemCopy}>
                        <Text style={styles.dataItemTitle}>{item.title}</Text>
                        <Text style={styles.dataItemDescription}>
                          {item.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
                <Text style={styles.dataChoiceNote}>
                  {t('intro.step14_data_choice_note')}
                </Text>
              </>
            )}
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
            {saveError ? (
              <Text accessibilityRole="alert" style={styles.saveError}>
                {t('intro.step14_save_failed')}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <FixedButtonContainer backgroundColor="#fff">
        <View style={styles.buttonRow}>
          {showSkip ? (
            <Pressable
              onPress={onSkip || (() => {})}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>{t('common.skip')}</Text>
            </Pressable>
          ) : null}
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
        onClose={() => {
          setShowLocationSheet(false);
          onNext?.();
        }}
        onAllow={() => {
          setShowLocationSheet(false);
          locationTracker.requestAndStart().catch(() => {});
          onNext?.();
        }}
        onNotNow={() => {
          setShowLocationSheet(false);
          onNext?.();
        }}
      />
    </SafeAreaView>
  );
};
