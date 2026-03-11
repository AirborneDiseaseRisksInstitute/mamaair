import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, Dropdown, BottomSheet, BottomSheetOption, IntroTitleBox } from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { getDeviceTimezone, getTimezoneList } from '../../../utils/timezoneUtils';
import { FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep05TimezoneProps { onNext?: () => void; onBack?: () => void; }

export const IntroStep05Timezone: React.FC<IntroStep05TimezoneProps> = ({ onNext, onBack }) => {
  const theme = useTheme();
  const { setTimezone, profile } = useUserStore();
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(
    profile.timezone || getDeviceTimezone()
  );
  const [timezoneSheetVisible, setTimezoneSheetVisible] = useState(false);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);
  const [timezoneList, setTimezoneList] = useState<string[]>([]);

  useEffect(() => {
    setTimezoneList(getTimezoneList());
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
    contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    questionText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginBottom: spacing('lg'), textAlign: 'left' },
  }), [theme]);

  const handleNext = () => {
    if (selectedTimezone) {
      setTimezone(selectedTimezone);
      onNext?.();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton onPress={onBack} />
        <ProgressBar progress={0.4} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title="Set your time zone" onLayout={setTitleBoxCenterY} />
          <Text style={styles.questionText} allowFontScaling={false}>
            We use your device&apos;s time zone by default. You can change it if needed.
          </Text>
          <Dropdown
            label="Select time zone"
            value={selectedTimezone}
            onPress={() => setTimezoneSheetVisible(true)}
          />
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <Button title="CONTINUE" onPress={handleNext} disabled={!selectedTimezone} />
      </FixedButtonContainer>
      <BottomSheet visible={timezoneSheetVisible} onClose={() => setTimezoneSheetVisible(false)}>
        <ScrollView
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ padding: spacing('md'), paddingBottom: spacing('xl') * 2 }}
        >
          {timezoneList.map((tz) => (
            <BottomSheetOption
              key={tz}
              label={tz}
              selected={selectedTimezone === tz}
              onPress={() => {
                setSelectedTimezone(tz);
                setTimezoneSheetVisible(false);
              }}
            />
          ))}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
};
