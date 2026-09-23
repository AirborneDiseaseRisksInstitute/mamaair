import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { useUserStore } from '../../../store/useUserStore';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, Dropdown, BottomSheet, BottomSheetOption, IntroTitleBox } from '../../../components/ui';
import { useMetaChoices } from '../../../hooks/useMetaChoices';
import { useTranslation } from 'react-i18next';
import { s, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep07Props { onNext?: () => void; onBack?: () => void; onSkip?: () => void; showSkip?: boolean; }

type VentilationType = 'good' | 'moderate' | 'poor';

export const IntroStep07: React.FC<IntroStep07Props> = ({ onNext, onBack, onSkip, showSkip = true }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setCookingMethod, setVentilation, profile } = useUserStore();
  const { cooking_methods } = useMetaChoices();

  const VENTILATION_OPTIONS: Array<{ id: VentilationType; label: string }> = [
    { id: 'good', label: t('profile.ventilation_good') },
    { id: 'moderate', label: t('profile.ventilation_moderate') },
    { id: 'poor', label: t('profile.ventilation_poor') },
  ];
  const [selectedCookingMethod, setSelectedCookingMethod] = useState<string | null>(profile.cookingMethod);
  const [selectedVentilation, setSelectedVentilation] = useState<VentilationType | null>(profile.ventilation as VentilationType | null);
  const [ventilationSheetVisible, setVentilationSheetVisible] = useState(false);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT + 32 },
    contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    pickLocationText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginBottom: spacing('lg'), textAlign: 'left' },
    pickAreaText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginTop: spacing('md'), marginBottom: spacing('lg'), textAlign: 'left' },
    optionsContainer: { width: '100%' },
    buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    skipButton: { paddingVertical: spacing('md'), paddingHorizontal: spacing('lg'), marginLeft: spacing('lg') },
    skipText: { fontSize: 18, fontFamily: theme.typography.fontFamily.extraBold, color: theme.colors.orange500 },
    continueButtonWrapper: { width: s(200), marginLeft: spacing('md') },
    continueButtonWrapperFull: { flex: 1, width: '100%', marginLeft: 0 },
  }), [theme]);

  const isFormValid = selectedCookingMethod !== null && selectedVentilation !== null;
  const selectedVentilationLabel = selectedVentilation ? VENTILATION_OPTIONS.find(o => o.id === selectedVentilation)?.label ?? null : null;

  const handleNext = () => {
    if (selectedCookingMethod) setCookingMethod(selectedCookingMethod);
    if (selectedVentilation) setVentilation(selectedVentilation);
    onNext?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton onPress={onBack} />
        <ProgressBar progress={0.571} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title={t('intro.step07_title')} onLayout={setTitleBoxCenterY} />
          <Text style={styles.pickLocationText} allowFontScaling={false}>{t('intro.step07_cooking')}</Text>
          <View style={styles.optionsContainer}>
            {cooking_methods.map((method) => (
              <RadioOption
                key={method.value}
                label={method.label}
                iconEmoji={method.emoji}
                selected={selectedCookingMethod === method.value}
                onPress={() => setSelectedCookingMethod(method.value)}
              />
            ))}
          </View>
          <Text style={styles.pickAreaText} allowFontScaling={false}>{t('intro.step07_ventilation')}</Text>
          <Dropdown label={t('intro.step07_select_ventilation')} value={selectedVentilationLabel} onPress={() => setVentilationSheetVisible(true)} />
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          {showSkip ? <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}>
            <Text style={styles.skipText} allowFontScaling={false}>{t('common.skip')}</Text>
          </Pressable> : null}
          <View style={[styles.continueButtonWrapper, !showSkip && styles.continueButtonWrapperFull]}>
            <Button title={t('common.continue')} onPress={handleNext} disabled={!isFormValid} />
          </View>
        </View>
      </FixedButtonContainer>
      <BottomSheet visible={ventilationSheetVisible} onClose={() => setVentilationSheetVisible(false)}>
        <View style={{ padding: spacing('md'), paddingBottom: spacing('xl') * 2 }}>
          {VENTILATION_OPTIONS.map((o) => (
            <BottomSheetOption
              key={o.id}
              label={o.label}
              selected={selectedVentilation === o.id}
              onPress={() => { setSelectedVentilation(o.id); setVentilationSheetVisible(false); }}
            />
          ))}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};
