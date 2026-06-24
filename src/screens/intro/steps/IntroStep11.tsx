import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, WeekOption, IntroTitleBox } from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { fs, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep11Props { onNext?: () => void; onBack?: () => void; }

const WEEKS = Array.from({ length: 40 }, (_, i) => i + 1);
const WEEKS_PER_ROW = 4;
const TOTAL_ROWS = Math.ceil(WEEKS.length / WEEKS_PER_ROW);

export const IntroStep11: React.FC<IntroStep11Props> = ({ onNext, onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setPregnancyWeek, profile } = useUserStore();
  const [selectedWeek, setSelectedWeekLocal] = useState<number | null>(profile.pregnancyWeek || null);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
    contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    questionText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginBottom: spacing('lg'), textAlign: 'left' },
    weeksGrid: { width: '100%', flexDirection: 'column', marginBottom: spacing('xl') },
    weekRow: { flexDirection: 'row', width: '100%', marginBottom: spacing('xs') },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />
      

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <BackButton onPress={onBack} />
      <ProgressBar progress={0.786} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title={t('intro.step11_title')} onLayout={setTitleBoxCenterY} />
          <Text style={styles.questionText} allowFontScaling={false}>{t('intro.step11_desc')}</Text>
          <View style={styles.weeksGrid}>
            {Array.from({ length: TOTAL_ROWS }, (_, rowIndex) => (
              <View key={rowIndex} style={styles.weekRow}>
                {WEEKS.slice(rowIndex * WEEKS_PER_ROW, (rowIndex + 1) * WEEKS_PER_ROW).map((week) => (
                  <WeekOption key={week} week={week} selected={selectedWeek === week} onPress={() => setSelectedWeekLocal(week)} />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <FixedButtonContainer>
        <Button title={t('common.continue')} onPress={() => { if (selectedWeek) { setPregnancyWeek(selectedWeek); onNext?.(); } }} disabled={!selectedWeek} />
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
