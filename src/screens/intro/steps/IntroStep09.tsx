import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, IntroTitleBox } from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { useMetaChoices } from '../../../hooks/useMetaChoices';
import { useTranslation } from 'react-i18next';
import { s, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep09Props { onNext?: () => void; onBack?: () => void; onSkip?: () => void; }

export const IntroStep09: React.FC<IntroStep09Props> = ({ onNext, onBack, onSkip }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setWorkType } = useUserStore();
  const { work_types } = useMetaChoices();
  const [selectedWorkType, setSelectedWorkType] = useState<string | null>(null);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);

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

  const handleNext = () => {
    if (selectedWorkType) setWorkType(selectedWorkType);
    onNext?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton onPress={onBack} />
        <ProgressBar progress={0.714} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title={t('intro.step09_title')} onLayout={setTitleBoxCenterY} />
          <Text style={styles.questionText} allowFontScaling={false}>{t('intro.step09_select')}</Text>
          <View style={styles.optionsContainer}>
            {work_types.map((wt) => (
              <RadioOption
                key={wt.value}
                label={wt.label}
                iconEmoji={wt.emoji}
                selected={selectedWorkType === wt.value}
                onPress={() => setSelectedWorkType(wt.value)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}>
            <Text style={styles.skipText} allowFontScaling={false}>{t('common.skip')}</Text>
          </Pressable>
          <View style={styles.continueButtonWrapper}>
            <Button title={t('common.continue')} onPress={handleNext} disabled={!selectedWorkType} />
          </View>
        </View>
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
