import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, IntroTitleBox } from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { useMetaChoices } from '../../../hooks/useMetaChoices';
import { useTranslation } from 'react-i18next';
import { s, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep10Props { onNext?: () => void; onBack?: () => void; onSkip?: () => void; showSkip?: boolean; }

export const IntroStep10: React.FC<IntroStep10Props> = ({ onNext, onBack, onSkip, showSkip = true }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const profile = useUserStore(state => state.profile);
  const [selectedDiet, setSelectedDiet] = useState<string | null>(profile.diet);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);
  const { setDiet } = useUserStore();
  const { diet_types } = useMetaChoices();

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
  }), [theme]);

  const handleNext = () => { if (selectedDiet) setDiet(selectedDiet); onNext?.(); };

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <BackButton onPress={onBack} />
      <ProgressBar progress={0.75} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title={t('intro.step10_title')} onLayout={setTitleBoxCenterY} />
          <Text style={styles.questionText} allowFontScaling={false}>{t('intro.step10_select')}</Text>
          <View style={styles.optionsContainer}>
            {diet_types.map((d) => (<RadioOption key={d.value} iconEmoji={d.emoji} label={d.label} selected={selectedDiet === d.value} onPress={() => setSelectedDiet(d.value)} />))}
          </View>
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          {showSkip ? <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}><Text style={styles.skipText} allowFontScaling={false}>{t('common.skip')}</Text></Pressable> : null}
          <View style={styles.continueButtonWrapper}><Button title={t('common.continue')} onPress={handleNext} disabled={!selectedDiet} /></View>
        </View>
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
