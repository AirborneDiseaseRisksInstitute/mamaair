import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTheme, spacing } from '../theme';
import { BackButton, NotificationTimeSettings } from '../components/ui';
import { useUserStore } from '../store/useUserStore';
import { scheduleReminders } from '../services/NotificationService';
import { responsiveUtils } from '../utils/responsiveUtils';

interface NotificationTimeScreenProps {
  onBack?: () => void;
}

export const NotificationTimeScreen: React.FC<NotificationTimeScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { profile, setNotifTime } = useUserStore();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: '#fff' },
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
        description: {
          fontSize: 16,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textPrimary,
          marginBottom: spacing('xl'),
          textAlign: 'left',
        },
      }),
    [theme]
  );

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>
          Notification Time
        </Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description} allowFontScaling={false}>
          Set when you want to receive notifications.
        </Text>
        <NotificationTimeSettings
          fromHour={profile.notifTimeFromHour ?? 9}
          fromMinute={profile.notifTimeFromMinute ?? 0}
          toHour={profile.notifTimeToHour ?? 21}
          toMinute={profile.notifTimeToMinute ?? 0}
          days={profile.notifDays ?? '1111111'}
          onSave={(from, to, days) => {
            setNotifTime(from, to, days);
            scheduleReminders(from.hour, from.minute, days).catch(() => {});
            onBack?.();
          }}
          showSaveButton={true}
          saveButtonTitle="Save"
        />
      </ScrollView>
    </SafeAreaView>
  );
};
