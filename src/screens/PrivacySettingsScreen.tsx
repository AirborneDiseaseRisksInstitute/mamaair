import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  Linking,
} from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { useTheme, spacing } from '../theme';
import { BackButton, AccessLocationBottomSheet } from '../components/ui';
import { locationTracker } from '../services/tracking/LocationTracker';
import { responsiveUtils } from '../utils/responsiveUtils';
import { useTranslation } from 'react-i18next';

interface PrivacySettingsScreenProps {
  onBack?: () => void;
}

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  // 'location' = triggered from Precise Location toggle; 'tracking' = from Tracking toggle
  const [locationSheetFor, setLocationSheetFor] = useState<'location' | 'tracking' | null>(null);

  // Read actual permission / service states on mount
  useEffect(() => {
    const init = async () => {
      const [notifSettings, locationStatus] = await Promise.all([
        notifee.getNotificationSettings().catch(() => null),
        locationTracker.getPermissionStatus().catch(() => 'unavailable' as const),
      ]);
      setNotificationEnabled(
        (notifSettings?.authorizationStatus ?? 0) >= AuthorizationStatus.AUTHORIZED,
      );
      setLocationEnabled(locationStatus === 'granted');
      setTrackingEnabled(locationTracker.isTracking());
    };
    init();
  }, []);

  // ── Notification ──────────────────────────────────────────────────────────
  const handleNotificationToggle = useCallback(async () => {
    if (!notificationEnabled) {
      const result = await notifee.requestPermission().catch(() => null);
      if ((result?.authorizationStatus ?? 0) >= AuthorizationStatus.AUTHORIZED) {
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

  // ── Precise Location ──────────────────────────────────────────────────────
  const handleLocationToggle = useCallback(async () => {
    if (!locationEnabled) {
      const current = await locationTracker.getPermissionStatus().catch(() => 'unavailable' as const);
      if (current === 'blocked') {
        Linking.openSettings();
      } else {
        setLocationSheetFor('location');
      }
    } else {
      // Can't revoke location permission programmatically — open Settings
      Linking.openSettings();
    }
  }, [locationEnabled]);

  // ── Tracking ──────────────────────────────────────────────────────────────
  const handleTrackingToggle = useCallback(async () => {
    if (!trackingEnabled) {
      const current = await locationTracker.getPermissionStatus().catch(() => 'unavailable' as const);
      if (current === 'blocked') {
        Linking.openSettings();
      } else {
        setLocationSheetFor('tracking');
      }
    } else {
      locationTracker.stopTracking();
      setTrackingEnabled(false);
    }
  }, [trackingEnabled]);

  // ── LocationBottomSheet callbacks ─────────────────────────────────────────
  const handleLocationAllow = useCallback(async () => {
    if (locationSheetFor === 'tracking') {
      const status = await locationTracker.requestAndStart().catch(() => 'denied' as const);
      if (status === 'granted') {
        setLocationEnabled(true);
        setTrackingEnabled(true);
      } else if (status === 'blocked') {
        Linking.openSettings();
      }
    } else if (locationSheetFor === 'location') {
      const status = await locationTracker.requestPermissionOnly().catch(() => 'denied' as const);
      if (status === 'granted') {
        setLocationEnabled(true);
      } else if (status === 'blocked') {
        Linking.openSettings();
      }
    }
    setLocationSheetFor(null);
  }, [locationSheetFor]);

  const handleLocationClose = useCallback(() => {
    setLocationSheetFor(null);
  }, []);

  const styles = useMemo(() => StyleSheet.create({
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
      marginBottom: 100,
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
  }), [theme]);

  const switchProps = {
    trackColor: { false: theme.colors.neutral300, true: theme.colors.orange500 },
    thumbColor: '#fff',
    ios_backgroundColor: theme.colors.neutral300,
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />

      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>{t('privacy.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../assets/images/Privacysetting.png')}
            style={styles.illustrationImage}
          />
          <Text style={styles.headingText} allowFontScaling={false}>{t('privacy.check')}</Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <Text style={styles.settingText} allowFontScaling={false}>{t('privacy.sensitive_notification')}</Text>
            <Switch
              {...switchProps}
              value={notificationEnabled}
              onValueChange={handleNotificationToggle}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingItem}>
            <Text style={styles.settingText} allowFontScaling={false}>{t('privacy.precise_location')}</Text>
            <Switch
              {...switchProps}
              value={locationEnabled}
              onValueChange={handleLocationToggle}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingItem}>
            <Text style={styles.settingText} allowFontScaling={false}>{t('privacy.tracking')}</Text>
            <Switch
              {...switchProps}
              value={trackingEnabled}
              onValueChange={handleTrackingToggle}
            />
          </View>
        </View>
      </ScrollView>

      <AccessLocationBottomSheet
        visible={locationSheetFor !== null}
        onClose={handleLocationClose}
        onAllow={handleLocationAllow}
        onNotNow={handleLocationClose}
      />
    </SafeAreaView>
  );
};
