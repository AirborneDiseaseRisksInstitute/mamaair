import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Pressable, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { useUserStore } from '../../../store/useUserStore';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, Dropdown, BottomSheet, BottomSheetOption, IntroTitleBox } from '../../../components/ui';
import { fs, s, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep07Props { onNext?: () => void; onBack?: () => void; onSkip?: () => void; }
type CookingMethodType = 'gas' | 'charcoal' | 'mixed';
type VentilationType = 'good' | 'moderate' | 'poor';

const COOKING_METHOD_OPTIONS: Array<{ id: CookingMethodType; label: string; iconEmoji?: string }> = [
  { id: 'gas', label: 'Gas or electric stove', iconEmoji: '⛽' }, { id: 'charcoal', label: 'Charcoal or firewood', iconEmoji: '🪵' }, { id: 'mixed', label: 'Mixed / other' },
];
const VENTILATION_OPTIONS: Array<{ id: VentilationType; label: string }> = [
  { id: 'good', label: 'Good — air flows easily, many windows' }, { id: 'moderate', label: 'Moderate — some windows or vents' }, { id: 'poor', label: 'Poor — closed most of the time' },
];

export const IntroStep07: React.FC<IntroStep07Props> = ({ onNext, onBack, onSkip }) => {
  const theme = useTheme();
  const [selectedCookingMethod, setSelectedCookingMethod] = useState<CookingMethodType | null>(null);
  const [selectedVentilation, setSelectedVentilation] = useState<VentilationType | null>(null);
  const [ventilationSheetVisible, setVentilationSheetVisible] = useState(false);
  const { setCookingMethod, setVentilation } = useUserStore();
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
  }), [theme]);

  const isFormValid = selectedCookingMethod !== null && selectedVentilation !== null;
  const handleNext = () => { if (selectedCookingMethod) setCookingMethod(selectedCookingMethod); if (selectedVentilation) setVentilation(selectedVentilation); onNext?.(); };
  const selectedVentilationLabel = selectedVentilation ? VENTILATION_OPTIONS.find(o => o.id === selectedVentilation)?.label || null : null;

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <BackButton onPress={onBack} />
      <ProgressBar progress={0.5} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title="How is your daily cooking condition?" onLayout={setTitleBoxCenterY} />
          <Text style={styles.pickLocationText} allowFontScaling={false}>Pick your main cooking method.</Text>
          <View style={styles.optionsContainer}>
            {COOKING_METHOD_OPTIONS.map((o) => (<RadioOption key={o.id} label={o.label} iconEmoji={o.iconEmoji} selected={selectedCookingMethod === o.id} onPress={() => setSelectedCookingMethod(o.id)} />))}
          </View>
          <Text style={styles.pickAreaText} allowFontScaling={false}>How is the ventilation where you live?</Text>
          <Dropdown label="Select ventilation" value={selectedVentilationLabel} onPress={() => setVentilationSheetVisible(true)} />
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          <Pressable onPress={onSkip || (() => {})} style={styles.skipButton}><Text style={styles.skipText} allowFontScaling={false}>SKIP</Text></Pressable>
          <View style={styles.continueButtonWrapper}><Button title="CONTINUE" onPress={handleNext} disabled={!isFormValid} /></View>
        </View>
      </FixedButtonContainer>
      <BottomSheet visible={ventilationSheetVisible} onClose={() => setVentilationSheetVisible(false)}>
        <View style={{ padding: spacing('md'), paddingBottom: spacing('xl') * 2 }}>
          {VENTILATION_OPTIONS.map((o) => (<BottomSheetOption key={o.id} label={o.label} selected={selectedVentilation === o.id} onPress={() => { setSelectedVentilation(o.id); setVentilationSheetVisible(false); }} />))}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};
