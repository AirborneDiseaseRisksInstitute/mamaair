import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, IntroTitleBox } from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { s, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep10PregnancyProps { onNext?: () => void; onBack?: () => void; onSkip?: () => void; }
type PregnancyNumber = 'first' | 'second' | 'third' | 'moreThan3';

const PREGNANCY_OPTIONS: Array<{ id: PregnancyNumber; label: string; iconEmoji: string }> = [
  { id: 'first', label: 'First', iconEmoji: '1️⃣' },
  { id: 'second', label: 'Second', iconEmoji: '2️⃣' },
  { id: 'third', label: 'Third', iconEmoji: '3️⃣' },
  { id: 'moreThan3', label: 'More than 3', iconEmoji: '👶' },
];

export const IntroStep10Pregnancy: React.FC<IntroStep10PregnancyProps> = ({ onNext, onBack, onSkip }) => {
  const theme = useTheme();
  const [selected, setSelected] = useState<PregnancyNumber | null>(null);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);
  const { setPregnancyNumber } = useUserStore();

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

  const handleNext = () => { if (selected) setPregnancyNumber(selected); onNext?.(); };

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton onPress={onBack} />
        <ProgressBar progress={0.75} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title="Which pregnancy is this for you?" onLayout={setTitleBoxCenterY} />
          <Text style={styles.questionText} allowFontScaling={false}>Select your current pregnancy number:</Text>
          <View style={styles.optionsContainer}>
            {PREGNANCY_OPTIONS.map((o) => (
              <RadioOption key={o.id} iconEmoji={o.iconEmoji} label={o.label} selected={selected === o.id} onPress={() => setSelected(o.id)} />
            ))}
          </View>
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}><Text style={styles.skipText} allowFontScaling={false}>SKIP</Text></Pressable>
          <View style={styles.continueButtonWrapper}><Button title="CONTINUE" onPress={handleNext} disabled={!selected} /></View>
        </View>
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
