import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { useTheme, spacing } from '../theme';
import { BackButton, AccessLocationBottomSheet } from '../components/ui';
import { responsiveUtils } from '../utils/responsiveUtils';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { locationAccessCoordinator } from '../services/tracking/LocationAccessCoordinator';

interface PrivacySettingsScreenProps {
  onBack?: () => void;
  onOpenPrivacyPolicy?: () => void;
}

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({
  onBack,
  onOpenPrivacyPolicy,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [isLocationBusy, setIsLocationBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const init = async () => {
        const [notifSettings, locationState] = await Promise.all([
          notifee.getNotificationSettings().catch(() => null),
          locationAccessCoordinator
            .resume()
            .catch(() => 'unavailable' as const)
            .then(() => locationAccessCoordinator.getState().catch(() => null)),
        ]);
        if (!mounted) return;
        setNotificationEnabled(
          (notifSettings?.authorizationStatus ?? 0) >=
            AuthorizationStatus.AUTHORIZED,
        );
        setTrackingActive(locationState?.trackingActive ?? false);
      };
      const unsubscribe = locationAccessCoordinator.addTrackingStateListener(
        active => {
          if (mounted) setTrackingActive(active);
        },
      );
      init();
      return () => {
        mounted = false;
        unsubscribe();
      };
    }, []),
  );

  // ── Notification ──────────────────────────────────────────────────────────
  const handleNotificationToggle = useCallback(async () => {
    if (!notificationEnabled) {
      const result = await notifee.requestPermission().catch(() => null);
      if (
        (result?.authorizationStatus ?? 0) >= AuthorizationStatus.AUTHORIZED
      ) {
        setNotificationEnabled(true);
      } else {
        // Blocked — must go to OS Settings
        Linking.openSettings();
      }
    } else {
      // Can't revoke programmatically — send user to OS Settings
      Linking.openSettings();
    }
  }, [notificationEnabled]);

  const handleLocationAllow = useCallback(async () => {
    if (isLocationBusy) return;
    setIsLocationBusy(true);
    setShowLocationSheet(false);
    const status = await locationAccessCoordinator
      .enable()
      .catch(() => 'unavailable' as const);
    const state = await locationAccessCoordinator.getState().catch(() => null);
    setTrackingActive(status === 'granted' && state?.trackingActive === true);
    if (status === 'blocked') Linking.openSettings();
    setIsLocationBusy(false);
  }, [isLocationBusy]);

  const handleTrackingToggle = useCallback(async () => {
    if (isLocationBusy) return;
    if (!trackingActive) {
      const current = await locationAccessCoordinator
        .getPermissionStatus()
        .catch(() => 'unavailable' as const);
      if (current === 'blocked') {
        Linking.openSettings();
      } else if (current === 'granted') {
        await handleLocationAllow();
      } else {
        setShowLocationSheet(true);
      }
    } else {
      locationAccessCoordinator.disable();
      setTrackingActive(false);
    }
  }, [handleLocationAllow, isLocationBusy, trackingActive]);

  const handleLocationClose = useCallback(() => {
    setShowLocationSheet(false);
    locationAccessCoordinator.decline();
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#fff',
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing('md'),
          paddingTop: 50,
          paddingBottom: spacing('md'),
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 3,
        },
        headerTitle: {
          fontSize: responsiveUtils.getFixedFontSize(18),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.orange500,
        },
        content: {
          flex: 1,
          paddingHorizontal: spacing('md'),
          paddingTop: spacing('lg'),
        },
        illustrationContainer: {
          alignItems: 'center',
          marginTop: spacing('xl'),
          marginBottom: spacing('xl'),
        },
        illustrationImage: {
          width: 150,
          height: 150,
          resizeMode: 'contain',
        },
        headingText: {
          fontSize: responsiveUtils.getFixedFontSize(24),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          textAlign: 'center',
          marginTop: spacing('xl'),
        },
        settingsCard: {
          backgroundColor: '#FFF',
          borderRadius: 12,
          marginTop: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
          overflow: 'hidden',
          marginBottom: 0,
        },
        settingItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing('md'),
          paddingHorizontal: spacing('md'),
        },
        settingText: {
          flex: 1,
          fontSize: responsiveUtils.getFixedFontSize(16),
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textPrimary,
        },
        settingDivider: {
          height: 1,
          backgroundColor: theme.colors.neutral200,
          marginLeft: spacing('md'),
        },
        policyLink: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing('md'),
          paddingHorizontal: spacing('md'),
          marginTop: spacing('md'),
          marginBottom: 100,
        },
      }),
    [theme],
  );

  const switchProps = {
    trackColor: {
      false: theme.colors.neutral300,
      true: theme.colors.orange500,
    },
    thumbColor: '#fff',
    ios_backgroundColor: theme.colors.neutral300,
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />

      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>
          {t('privacy.title')}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../assets/images/Privacysetting.png')}
            style={styles.illustrationImage}
          />
          <Text style={styles.headingText} allowFontScaling={false}>
            {t('privacy.check')}
          </Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <Text style={styles.settingText} allowFontScaling={false}>
              {t('privacy.sensitive_notification')}
            </Text>
            <Switch
              {...switchProps}
              value={notificationEnabled}
              onValueChange={handleNotificationToggle}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingItem}>
            <Text style={styles.settingText} allowFontScaling={false}>
              {t('privacy.tracking')}
            </Text>
            <Switch
              {...switchProps}
              value={trackingActive}
              disabled={isLocationBusy}
              onValueChange={handleTrackingToggle}
            />
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole="link"
          onPress={onOpenPrivacyPolicy}
          style={styles.policyLink}
        >
          <Text style={styles.settingText}>{t('legal.privacy')}</Text>
          <FontAwesomeIcon icon={faChevronRight} size={14} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>

      <AccessLocationBottomSheet
        visible={showLocationSheet}
        onClose={handleLocationClose}
        onAllow={handleLocationAllow}
        onNotNow={handleLocationClose}
      />
    </SafeAreaView>
  );
};
