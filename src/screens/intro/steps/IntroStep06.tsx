import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, Dropdown, BottomSheet, BottomSheetOption, IntroTitleBox } from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { useTranslation } from 'react-i18next';
import { s, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep06Props { onNext?: () => void; onBack?: () => void; onSkip?: () => void; }
type TimeSpentType = 'indoors' | 'outdoors' | 'both';
type TimeOfDayType = 'mornings' | 'afternoon' | 'evening' | 'change';

export const IntroStep06: React.FC<IntroStep06Props> = ({ onNext, onBack, onSkip }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setTimeSpent, setTimeOfDay, profile } = useUserStore();

  const TIME_SPENT_OPTIONS: Array<{ id: TimeSpentType; label: string }> = [
    { id: 'indoors', label: t('profile.mostly_indoors') },
    { id: 'outdoors', label: t('profile.mostly_outdoors') },
    { id: 'both', label: t('profile.both_equally') },
  ];
  const TIME_OF_DAY_OPTIONS: Array<{ id: TimeOfDayType; label: string }> = [
    { id: 'mornings', label: t('profile.morning_hours') },
    { id: 'afternoon', label: t('profile.midday_afternoon') },
    { id: 'evening', label: t('profile.evening') },
    { id: 'change', label: t('profile.changes_daily') },
  ];
  const [selectedTimeSpent, setSelectedTimeSpent] = useState<TimeSpentType | null>(profile.timeSpent as TimeSpentType || null);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<TimeOfDayType | null>(profile.timeOfDay as TimeOfDayType || null);
  const [timeOfDaySheetVisible, setTimeOfDaySheetVisible] = useState(false);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT + 32},
    contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    pickLocationText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginBottom: spacing('lg'), textAlign: 'left' },
    pickAreaText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginTop: spacing('md'), marginBottom: spacing('lg'), textAlign: 'left' },
    optionsContainer: { width: '100%' },
    buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    skipButton: { paddingVertical: spacing('md'), paddingHorizontal: spacing('lg'), marginLeft: spacing('lg') },
    skipText: { fontSize: 18, fontFamily: theme.typography.fontFamily.extraBold, color: theme.colors.orange500 },
    continueButtonWrapper: { width: s(200), marginLeft: spacing('md') },
  }), [theme]);

  const isFormValid = selectedTimeSpent !== null && selectedTimeOfDay !== null;
  const selectedTimeOfDayLabel = selectedTimeOfDay ? TIME_OF_DAY_OPTIONS.find(o => o.id === selectedTimeOfDay)?.label || null : null;

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />
      <BackButton onPress={onBack} />
      <ProgressBar progress={0.5} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          <IntroTitleBox title={t('intro.step06_title')} onLayout={setTitleBoxCenterY} />
          <Text style={styles.pickLocationText} allowFontScaling={false}>{t('intro.step06_time_spent')}</Text>
          <View style={styles.optionsContainer}>
            {TIME_SPENT_OPTIONS.map((o) => (<RadioOption key={o.id} label={o.label} selected={selectedTimeSpent === o.id} onPress={() => setSelectedTimeSpent(o.id)} />))}
          </View>
          <Text style={styles.pickAreaText} allowFontScaling={false}>{t('intro.step06_time_of_day')}</Text>
          <Dropdown label={t('intro.step06_select_time')} value={selectedTimeOfDayLabel} onPress={() => setTimeOfDaySheetVisible(true)} />
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}><Text style={styles.skipText} allowFontScaling={false}>{t('common.skip')}</Text></Pressable>
          <View style={styles.continueButtonWrapper}><Button title={t('common.continue')} onPress={() => { if (isFormValid) { setTimeSpent(selectedTimeSpent); setTimeOfDay(selectedTimeOfDay); onNext?.(); } }} disabled={!isFormValid} /></View>
        </View>
      </FixedButtonContainer>
      <BottomSheet visible={timeOfDaySheetVisible} onClose={() => setTimeOfDaySheetVisible(false)}>
        <View style={{ padding: spacing('md'), paddingBottom: spacing('xl') * 2 }}>
          {TIME_OF_DAY_OPTIONS.map((o) => (<BottomSheetOption key={o.id} label={o.label} selected={selectedTimeOfDay === o.id} onPress={() => { setSelectedTimeOfDay(o.id); setTimeOfDaySheetVisible(false); }} />))}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};
