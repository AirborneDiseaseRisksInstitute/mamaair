import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { OrangeHalo, BackButton, ProgressBar, IntroTitleBox, NotificationTimeSettings } from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';
import { rescheduleNotifications } from '../../../services/notifications/NotificationScheduler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep12NotificationTimeProps {
  onNext?: () => void;
  onBack?: () => void;
}

export const IntroStep12NotificationTime: React.FC<IntroStep12NotificationTimeProps> = ({ onNext, onBack }) => {
  const theme = useTheme();
  const [titleBoxCenterY, setTitleBoxCenterY] = useState(SCREEN_HEIGHT * 0.35);
  const { profile, setNotifTime } = useUserStore();
  const fromHour = profile.notifTimeFromHour ?? 9;
  const fromMin = profile.notifTimeFromMinute ?? 0;
  const toHour = profile.notifTimeToHour ?? 21;
  const toMin = profile.notifTimeToMinute ?? 0;
  const daysStr = profile.notifDays ?? '1111111';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: '#fff' },
        scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
        contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
        questionText: {
          fontSize: 18,
          fontFamily: theme.typography.fontFamily.medium,
          color: theme.colors.textPrimary,
          marginBottom: spacing('lg'),
          textAlign: 'left',
        },
      }),
    [theme]
  );

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton onPress={onBack} />
        <ProgressBar progress={0.9} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title="When do you want to receive notifications?" onLayout={setTitleBoxCenterY} />
          <Text style={styles.questionText} allowFontScaling={false}>
            Choose the time window and days for your alerts.
          </Text>
          <NotificationTimeSettings
            fromHour={fromHour}
            fromMinute={fromMin}
            toHour={toHour}
            toMinute={toMin}
            days={daysStr}
            onSave={(from, to, days) => {
              setNotifTime(from, to, days);
              rescheduleNotifications();
              onNext?.();
            }}
            showSaveButton={true}
            saveButtonTitle="CONTINUE"
            variant="intro"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
