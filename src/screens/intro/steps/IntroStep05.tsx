import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, Dropdown, BottomSheet, BottomSheetOption, IntroTitleBox } from '../../../components/ui';
import { KENYA_FLAG_SVG, YORUBA_FLAG_SVG, OTHERS_FLAG_SVG } from '../../../utils/svgIcons';
import { useUserStore } from '../../../store/useUserStore';
import { fs, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep05Props { onNext?: () => void; onBack?: () => void; }
type Country = 'kenya' | 'nigeria' | 'others';
type AreaType = 'urban' | 'peri-urban' | 'rural';

const COUNTRIES: Array<{ id: Country; label: string; iconSvg: string }> = [
  { id: 'kenya', label: 'Kenya', iconSvg: KENYA_FLAG_SVG },
  { id: 'nigeria', label: 'Nigeria', iconSvg: YORUBA_FLAG_SVG },
  { id: 'others', label: 'Others', iconSvg: OTHERS_FLAG_SVG },
];
const AREA_TYPES: Array<{ id: AreaType; label: string }> = [
  { id: 'urban', label: 'Urban' }, { id: 'peri-urban', label: 'Peri-Urban' }, { id: 'rural', label: 'Rural' },
];

export const IntroStep05: React.FC<IntroStep05Props> = ({ onNext, onBack }) => {
  const theme = useTheme();
  const { setCountry, setArea, profile } = useUserStore();
  const [selectedCountry, setSelectedCountryLocal] = useState<Country | null>(profile.country as Country || null);
  const [selectedAreaType, setSelectedAreaTypeLocal] = useState<AreaType | null>(profile.area as AreaType || null);
  const [areaTypeSheetVisible, setAreaTypeSheetVisible] = useState(false);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
    contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    pickLocationText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginBottom: spacing('lg'), textAlign: 'left' },
    pickAreaText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginTop: spacing('md'), marginBottom: spacing('lg'), textAlign: 'left' },
    optionsContainer: { width: '100%' },
  }), [theme]);

  const isFormValid = selectedCountry !== null && (selectedCountry !== 'others' || selectedAreaType !== null);
  const selectedAreaTypeLabel = selectedAreaType ? AREA_TYPES.find(t => t.id === selectedAreaType)?.label || null : null;

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />
     
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <BackButton onPress={onBack} />
      <ProgressBar progress={0.357} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title="Let's set your home so we can guide you better." onLayout={setTitleBoxCenterY} />
          <Text style={styles.pickLocationText} allowFontScaling={false}>Where are you?</Text>
          <View style={styles.optionsContainer}>
            {COUNTRIES.map((country) => (
              <RadioOption key={country.id} iconSvg={country.iconSvg} label={country.label} selected={selectedCountry === country.id} onPress={() => { setSelectedCountryLocal(country.id); if (country.id !== 'others') setSelectedAreaTypeLocal(null); }} />
            ))}
          </View>
          {selectedCountry === 'others' && (
            <>
              <Text style={styles.pickAreaText} allowFontScaling={false}>Pick the type of area you live in</Text>
              <Dropdown label="Select area type" value={selectedAreaTypeLabel} onPress={() => setAreaTypeSheetVisible(true)} />
            </>
          )}
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <Button title="CONTINUE" onPress={() => { if (isFormValid) { setCountry(selectedCountry || ''); setArea(selectedAreaType || ''); onNext?.(); } }} disabled={!isFormValid} />
      </FixedButtonContainer>
      <BottomSheet visible={areaTypeSheetVisible} onClose={() => setAreaTypeSheetVisible(false)}>
        <View style={{ padding: spacing('md'), paddingBottom: spacing('xl') * 2 }}>
          {AREA_TYPES.map((areaType) => (
            <BottomSheetOption key={areaType.id} label={areaType.label} selected={selectedAreaType === areaType.id} onPress={() => { setSelectedAreaTypeLocal(areaType.id); setAreaTypeSheetVisible(false); }} />
          ))}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};
