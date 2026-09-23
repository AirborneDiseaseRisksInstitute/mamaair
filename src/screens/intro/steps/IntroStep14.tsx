import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme, spacing, radius } from '../../../theme';
import {
  Button,
  FixedButtonContainer,
  OrangeHalo,
  BackButton,
  ProgressBar,
  AccessLocationBottomSheet,
} from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { locationAccessCoordinator } from '../../../services/tracking/LocationAccessCoordinator';
import { ProfileService } from '../../../services/api/ProfileService';
import { LifestyleService } from '../../../services/api/LifestyleService';
import { LanguageService } from '../../../services/api/LanguageService';
import {
  ms,
  fs,
  FIXED_BUTTON_AREA_HEIGHT,
  HEADER_CLEARANCE,
} from '../../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { getDeviceTimezone } from '../../../utils/timezoneUtils';
import { DEV_LOCAL_SESSION } from '../../../config/dev';
import { HEALTHCARE_SERVICE_REQUESTS_ENABLED } from '../../../config/recommendationExperience';
import {
  buildLifestyleApiPayload,
  buildProfileApiPayload,
} from '../../../utils/profileApiMapping';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const { setProfile, profile } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [saveErrorKey, setSaveErrorKey] = useState<string | null>(null);
  const locationDecisionInFlight = useRef(false);

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
    setSaveErrorKey(null);
    setIsLoading(true);
    try {
      if (DEV_LOCAL_SESSION) {
        locationDecisionInFlight.current = false;
        setShowLocationSheet(true);
        return;
      }

      const locationState = await locationAccessCoordinator
        .getState()
        .catch(() => null);

      const profilePayload = buildProfileApiPayload(profile, {
        trackingEnabled: locationState?.trackingEnabled ?? false,
        timezoneFallback: getDeviceTimezone(),
      });

      const updatedProfile = await ProfileService.patchProfile(profilePayload);
      if (updatedProfile?.id !== undefined && updatedProfile?.id !== null) {
        setProfile({ backendUserId: String(updatedProfile.id) });
      }
      LanguageService.setLanguage(profile.language || 'en').catch(() => {});

      // 2. Update Lifestyle
      await LifestyleService.patchLifestyle(
        buildLifestyleApiPayload(profile),
      );

      locationDecisionInFlight.current = false;
      setShowLocationSheet(true);
    } catch (error: any) {
      console.error('Failed to save profile/lifestyle:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      if (requireSuccessfulSave) {
        const status = error?.response?.status;
        setSaveErrorKey(
          typeof status === 'number' && status >= 400 && status < 500
            ? 'intro.step14_save_invalid'
            : 'intro.step14_save_failed',
        );
        return;
      }
      locationDecisionInFlight.current = false;
      setShowLocationSheet(true);
    } finally {
      setIsLoading(false);
    }
  };

  const completeLocationStep = async (allow: boolean) => {
    if (locationDecisionInFlight.current) return;
    locationDecisionInFlight.current = true;
    setShowLocationSheet(false);

    if (allow) {
      await locationAccessCoordinator.enable().catch(() => 'unavailable');
    } else {
      locationAccessCoordinator.decline();
    }
    onNext?.();
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
        continueButtonWrapper: { width: 200, marginLeft: spacing('md') },
        continueButtonWrapperFull: { flex: 1, width: '100%', marginLeft: 0 },
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
          {saveErrorKey ? (
            <Text accessibilityRole="alert" style={styles.saveError}>
              {t(saveErrorKey)}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <FixedButtonContainer backgroundColor="#fff">
        <View style={styles.buttonRow}>
          {showSkip ? (
            <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}>
              <Text style={styles.skipText}>{t('common.skip')}</Text>
            </Pressable>
          ) : null}
          <View
            style={[
              styles.continueButtonWrapper,
              !showSkip && styles.continueButtonWrapperFull,
            ]}
          >
            <Button
              title={isLoading ? t('common.saving') : t('common.continue')}
              onPress={handleNext}
              disabled={isLoading}
            />
          </View>
        </View>
      </FixedButtonContainer>

      <AccessLocationBottomSheet
        visible={showLocationSheet}
        onClose={() => completeLocationStep(false).catch(() => {})}
        onAllow={() => completeLocationStep(true).catch(() => {})}
        onNotNow={() => completeLocationStep(false).catch(() => {})}
      />
    </SafeAreaView>
  );
};
