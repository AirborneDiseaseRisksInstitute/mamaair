import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { useUserStore } from '../../../store/useUserStore';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RangeSlider, IntroTitleBox } from '../../../components/ui';
import { useTranslation } from 'react-i18next';
import { s, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep08Props { onNext?: () => void; onBack?: () => void; onSkip?: () => void; }

export const IntroStep08: React.FC<IntroStep08Props> = ({ onNext, onBack, onSkip }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeHours, setActiveHours] = useState(2);
  const [sleepHours, setSleepHours] = useState(8);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);
  const { setSleepHours: setStoreSleepHours, setActiveHours: setStoreActiveHours } = useUserStore();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
    contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    questionText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginTop: spacing('md'), marginBottom: spacing('lg'), textAlign: 'left' },
    questionTextSecond: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginBottom: spacing('lg'), textAlign: 'left' },
    sliderContainer: { marginBottom: 0 },
    buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    skipButton: { paddingVertical: spacing('md'), paddingHorizontal: spacing('lg'), marginLeft: spacing('lg') },
    skipText: { fontSize: 18, fontFamily: theme.typography.fontFamily.extraBold, color: theme.colors.orange500 },
    continueButtonWrapper: { width: s(200), marginLeft: spacing('md') },
  }), [theme]);

  const isFormValid = activeHours > 0 && sleepHours > 0;
  const handleNext = () => { setStoreSleepHours(sleepHours); setStoreActiveHours(activeHours); onNext?.(); };

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <BackButton onPress={onBack} />
      <ProgressBar progress={0.643} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title={t('intro.step08_title')} onLayout={setTitleBoxCenterY} />
          <Text style={styles.questionText} allowFontScaling={false}>{t('intro.step08_sleep')}</Text>
          <View style={styles.sliderContainer}><RangeSlider min={1} max={24} value={sleepHours} onChange={setSleepHours} minLabel="1hrs" maxLabel="24hrs" /></View>
          <Text style={styles.questionTextSecond} allowFontScaling={false}>{t('intro.step08_active')}</Text>
          <View style={styles.sliderContainer}><RangeSlider min={1} max={24} value={activeHours} onChange={setActiveHours} minLabel="1hrs" maxLabel="24hrs" /></View>
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}><Text style={styles.skipText} allowFontScaling={false}>{t('common.skip')}</Text></Pressable>
          <View style={styles.continueButtonWrapper}><Button title={t('common.continue')} onPress={handleNext} disabled={!isFormValid} /></View>
        </View>
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
