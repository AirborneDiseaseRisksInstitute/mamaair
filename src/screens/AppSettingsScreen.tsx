import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  Linking,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { useTheme, spacing, radius } from '../theme';
import { BackButton, UpgradeSubscription, BottomSheet, Button, BottomSheetOption, useToast } from '../components/ui';
import { useUserStore } from '../store/useUserStore';
import { scheduleReminders } from '../services/NotificationService';
import { getDeviceTimezone, getTimezoneList } from '../utils/timezoneUtils';
import { responsiveUtils } from '../utils/responsiveUtils';
import { vs, s } from '../utils/responsive';
import { useTranslation } from 'react-i18next';

const notifThumb = require('../assets/images/notifThumb.png');
const SHADOW_OFFSET_1 = 6;
const SHADOW_OFFSET_2 = 12;

interface AppSettingsScreenProps {
  onBack?: () => void;
  onNavigateToNotificationTime?: () => void;
}

const CARD_HEIGHT = vs(110);

export const AppSettingsScreen: React.FC<AppSettingsScreenProps> = ({ onBack, onNavigateToNotificationTime }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { profile, setTimezone } = useUserStore();
  const [showUpgradeSubscription, setShowUpgradeSubscription] = useState(false);
  const [showNotifSheet, setShowNotifSheet] = useState(false);
  const [showTimezoneSheet, setShowTimezoneSheet] = useState(false);
  const [timezoneList, setTimezoneList] = useState<string[]>([]);
  const currentTimezone = profile.timezone || getDeviceTimezone();

  useEffect(() => {
    setTimezoneList(getTimezoneList());
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
        setShowNotifSheet(false);
        const fh = profile.notifTimeFromHour ?? 9;
        const fm = profile.notifTimeFromMinute ?? 0;
        const days = profile.notifDays ?? '1111111';
        scheduleReminders(fh, fm, days).catch(() => {});
      } else {
        showToast({
          type: 'error',
          title: t('settings.notifications_disabled'),
          message: t('settings.notifications_disabled_message'),
        });
        Linking.openSettings();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const formatNotifTime = () => {
    const fh = profile.notifTimeFromHour ?? 9;
    const fm = profile.notifTimeFromMinute ?? 0;
    const th = profile.notifTimeToHour ?? 21;
    const tm = profile.notifTimeToMinute ?? 0;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(fh)}:${pad(fm)} - ${pad(th)}:${pad(tm)}`;
  };

  const menuItems = [
    'notifications',
    'notification_time',
    'time_zone',
    // 'Appearance',
    'manage_subscription',
    // 'Manage account',
    'delete_account',
  ];

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
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('md'),
      paddingHorizontal: spacing('md'),
    },
    menuText: {
      flex: 1,
      fontSize: responsiveUtils.getFixedFontSize(16),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
    },
    menuChevron: {
      marginLeft: spacing('sm'),
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.colors.neutral200,
      marginLeft: spacing('md'),
    },
    // Allow notifications bottom sheet content
    notifSheetContent: {
      paddingBottom: spacing('xl'),
      paddingTop: spacing('sm'),
    },
    notifDescriptionText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: spacing('xl'),
    },
    notifBoldText: {
      fontFamily: theme.typography.fontFamily.bold,
    },
    notifCardContainer: {
      position: 'relative',
      width: '100%',
      marginTop: spacing('xl'),
      marginBottom: spacing('xl'),
      paddingBottom: SHADOW_OFFSET_2,
    },
    notifCardShadow2: {
      position: 'absolute',
      top: SHADOW_OFFSET_2,
      left: 4,
      right: 4,
      height: CARD_HEIGHT,
      borderRadius: radius('md'),
      backgroundColor: theme.colors.orange300 || '#FFB366',
    },
    notifCardShadow1: {
      position: 'absolute',
      top: SHADOW_OFFSET_1,
      left: 2,
      right: 2,
      height: CARD_HEIGHT,
      borderRadius: radius('md'),
      backgroundColor: theme.colors.orange500,
    },
    notifCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: radius('md'),
      borderWidth: 1,
      borderColor: theme.colors.orange500,
      padding: spacing('md'),
      minHeight: CARD_HEIGHT,
      zIndex: 2,
    },
    notifCardImage: {
      width: s(80),
      height: s(80),
      borderRadius: radius('sm'),
      marginRight: spacing('md'),
    },
    notifCardContent: { flex: 1 },
    notifCardTitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      lineHeight: 20,
      marginBottom: spacing('xs'),
    },
    notifCardSubtitle: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    notifButtonsContainer: { width: '100%', marginTop: spacing('md') },
    notifNotNowButton: {
      alignItems: 'center',
      paddingVertical: spacing('md'),
      marginTop: spacing('lg'),
    },
    notifNotNowText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textSecondary,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>{t('settings.title')}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.settingsCard}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item}>
              <TouchableOpacity 
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (item === 'manage_subscription') {
                    setShowUpgradeSubscription(true);
                  } else if (item === 'notifications') {
                    setShowNotifSheet(true);
                  } else if (item === 'time_zone') {
                    setShowTimezoneSheet(true);
                  } else if (item === 'notification_time') {
                    onNavigateToNotificationTime?.();
                  } else {
                    console.log(`${item} pressed`);
                  }
                }}
              >
                <Text
                  style={[
                    styles.menuText,
                    item === 'delete_account' ? { color: '#FF4444' } : null,
                  ]}
                  allowFontScaling={false}
              >
                {item === 'time_zone'
                  ? `${t(`settings.${item}`)} (${currentTimezone})`
                  : item === 'notification_time'
                    ? `${t(`settings.${item}`)} (${formatNotifTime()})`
                    : t(`settings.${item}`)}
              </Text>
                <FontAwesomeIcon
                  icon={faChevronRight as any}
                  size={14}
                  color={item === 'delete_account' ? '#FF4444' : theme.colors.textSecondary}
                  style={styles.menuChevron}
                />
              </TouchableOpacity>
              {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      <UpgradeSubscription
        visible={showUpgradeSubscription}
        onClose={() => setShowUpgradeSubscription(false)}
        onUpgrade={() => {
          // Handle upgrade action - can navigate to purchase flow later
        }}
      />

      <BottomSheet
        visible={showTimezoneSheet}
        onClose={() => setShowTimezoneSheet(false)}
      >
        <View style={{ padding: spacing('md'), paddingBottom: spacing('xl') * 2 }}>
          <Text style={[styles.notifDescriptionText, { marginBottom: spacing('md') }]} allowFontScaling={false}>
            {t('settings.time_zone_description')}
          </Text>
          <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={true}>
            {timezoneList.map((tz) => (
              <BottomSheetOption
                key={tz}
                label={tz}
                selected={currentTimezone === tz}
                onPress={() => {
                  setTimezone(tz);
                  setShowTimezoneSheet(false);
                }}
              />
            ))}
          </ScrollView>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={showNotifSheet}
        onClose={() => setShowNotifSheet(false)}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.notifSheetContent}>
          <Text style={styles.notifDescriptionText} allowFontScaling={false}>
            <Text style={styles.notifBoldText} allowFontScaling={false}>Mama Air</Text>
            {` ${t('intro.step12_description')}`}
          </Text>
          <View style={styles.notifCardContainer}>
            <View style={styles.notifCardShadow2} />
            <View style={styles.notifCardShadow1} />
            <View style={styles.notifCard}>
              <Image source={notifThumb} style={styles.notifCardImage} resizeMode="cover" />
              <View style={styles.notifCardContent}>
                <Text style={styles.notifCardTitle} allowFontScaling={false}>{t('intro.step12_card_title')}</Text>
                <Text style={styles.notifCardSubtitle} allowFontScaling={false}>{t('intro.step12_card_subtitle')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.notifButtonsContainer}>
            <Button title={t('settings.turn_on_notifications')} onPress={handleEnableNotifications} />
            <Pressable style={styles.notifNotNowButton} onPress={() => setShowNotifSheet(false)}>
              <Text style={styles.notifNotNowText} allowFontScaling={false}>{t('common.not_now')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
};
