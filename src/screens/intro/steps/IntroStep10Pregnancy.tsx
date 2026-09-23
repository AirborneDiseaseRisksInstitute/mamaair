import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, IntroTitleBox } from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { s, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep10PregnancyProps { onNext?: () => void; onBack?: () => void; onSkip?: () => void; showSkip?: boolean; }
type PregnancyNumber = 'first' | 'second' | 'third' | 'moreThan3';

export const IntroStep10Pregnancy: React.FC<IntroStep10PregnancyProps> = ({ onNext, onBack, onSkip, showSkip = true }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useUserStore(state => state.profile);
  const [selected, setSelected] = useState<PregnancyNumber | null>(profile.pregnancyNumber as PregnancyNumber | null);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);
  const { setPregnancyNumber } = useUserStore();

  const PREGNANCY_OPTIONS: Array<{ id: PregnancyNumber; label: string; iconEmoji: string }> = [
    { id: 'first', label: t('intro.step10pregnancy_first'), iconEmoji: '1️⃣' },
    { id: 'second', label: t('intro.step10pregnancy_second'), iconEmoji: '2️⃣' },
    { id: 'third', label: t('intro.step10pregnancy_third'), iconEmoji: '3️⃣' },
    { id: 'moreThan3', label: t('intro.step10pregnancy_more'), iconEmoji: '👶' },
  ];

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
    contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    questionText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginBottom: spacing('lg'), textAlign: 'left' },
    optionsContainer: { width: '100%' },
    buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    skipButton: { paddingVertical: spacing('md'), paddingHorizontal: spacing('lg'), marginLeft: spacing('lg') },
    skipText: { fontSize: 18, fontFamily: theme.typography.fontFamily.extraBold, color: theme.colors.orange500 },
    continueButtonWrapper: { width: s(200), marginLeft: spacing('md') },
    continueButtonWrapperFull: { flex: 1, width: '100%', marginLeft: 0 },
  }), [theme]);

  const handleNext = () => { if (selected) setPregnancyNumber(selected); onNext?.(); };

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton onPress={onBack} />
        <ProgressBar progress={0.786} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title={t('intro.step10pregnancy_title')} onLayout={setTitleBoxCenterY} />
          <Text style={styles.questionText} allowFontScaling={false}>{t('intro.step10pregnancy_desc')}</Text>
          <View style={styles.optionsContainer}>
            {PREGNANCY_OPTIONS.map((o) => (
              <RadioOption key={o.id} iconEmoji={o.iconEmoji} label={o.label} selected={selected === o.id} onPress={() => setSelected(o.id)} />
            ))}
          </View>
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          {showSkip ? <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}><Text style={styles.skipText} allowFontScaling={false}>{t('common.skip')}</Text></Pressable> : null}
          <View style={[styles.continueButtonWrapper, !showSkip && styles.continueButtonWrapperFull]}><Button title={t('common.continue')} onPress={handleNext} disabled={!selected} /></View>
        </View>
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
