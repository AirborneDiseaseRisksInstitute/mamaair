import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, IntroTitleBox } from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { fs, s, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep09Props { onNext?: () => void; onBack?: () => void; onSkip?: () => void; }
type WorkType = 'desk' | 'standing' | 'night' | 'physical' | 'home';

const WORK_TYPE_OPTIONS: Array<{ id: WorkType; label: string; iconEmoji?: string }> = [
  { id: 'desk', label: 'Desk work', iconEmoji: '🪑' }, { id: 'standing', label: 'Standing work', iconEmoji: '🧍🏿‍♀️' },
  { id: 'night', label: 'Night shifts', iconEmoji: '🌙' }, { id: 'physical', label: 'Physical labor', iconEmoji: '💪🏿' },
  { id: 'home', label: 'Stay-at-home mom', iconEmoji: '👩🏿‍🦱' },
];

export const IntroStep09: React.FC<IntroStep09Props> = ({ onNext, onBack, onSkip }) => {
  const theme = useTheme();
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);
  const { setWorkType } = useUserStore();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT + 32 },
    contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    questionText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginBottom: spacing('lg'), textAlign: 'left' },
    optionsContainer: { width: '100%' },
    buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    skipButton: { paddingVertical: spacing('md'), paddingHorizontal: spacing('lg'), marginLeft: spacing('lg') },
    skipText: { fontSize: 18, fontFamily: theme.typography.fontFamily.extraBold, color: theme.colors.orange500 },
    continueButtonWrapper: { width: s(200), marginLeft: spacing('md') },
  }), [theme]);

  const handleNext = () => { if (selectedWorkType) setWorkType(selectedWorkType); onNext?.(); };

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />
     
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <BackButton onPress={onBack} />
      <ProgressBar progress={0.643} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title="What type of work do you have?" onLayout={setTitleBoxCenterY} />
          <Text style={styles.questionText} allowFontScaling={false}>Select the option that best describes your work:</Text>
          <View style={styles.optionsContainer}>
            {WORK_TYPE_OPTIONS.map((o) => (<RadioOption key={o.id} label={o.label} iconEmoji={o.iconEmoji} selected={selectedWorkType === o.id} onPress={() => setSelectedWorkType(o.id)} />))}
          </View>
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}><Text style={styles.skipText} allowFontScaling={false}>SKIP</Text></Pressable>
          <View style={styles.continueButtonWrapper}><Button title="CONTINUE" onPress={handleNext} disabled={!selectedWorkType} /></View>
        </View>
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
