import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, Dropdown, BottomSheet, BottomSheetOption, IntroTitleBox } from '../../../components/ui';
import { KENYA_FLAG_SVG, YORUBA_FLAG_SVG, OTHERS_FLAG_SVG } from '../../../utils/svgIcons';
import { useUserStore } from '../../../store/useUserStore';
import { useMetaChoices } from '../../../hooks/useMetaChoices';
import { useTranslation } from 'react-i18next';
import { fs, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep05Props { onNext?: () => void; onBack?: () => void; }

type AreaType = 'urban' | 'peri-urban' | 'rural';

const COUNTRY_FLAG_MAP: Record<string, string | undefined> = {
  NG: YORUBA_FLAG_SVG,
  KE: KENYA_FLAG_SVG,
  GH: OTHERS_FLAG_SVG,
  other: OTHERS_FLAG_SVG,
};

export const IntroStep05: React.FC<IntroStep05Props> = ({ onNext, onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setCountry, setArea, profile } = useUserStore();
  const { countries } = useMetaChoices();

  const AREA_TYPES: Array<{ id: AreaType; label: string }> = [
    { id: 'urban', label: t('profile.urban') },
    { id: 'peri-urban', label: t('profile.peri_urban') },
    { id: 'rural', label: t('profile.rural') },
  ];
  const [selectedCountry, setSelectedCountryLocal] = useState<string | null>(profile.country || null);
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

  const isOther = selectedCountry === 'other';
  const isFormValid = selectedCountry !== null && (!isOther || selectedAreaType !== null);
  const selectedAreaTypeLabel = selectedAreaType ? AREA_TYPES.find(t => t.id === selectedAreaType)?.label ?? null : null;

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton onPress={onBack} />
        <ProgressBar progress={0.357} />
        <View style={styles.contentWrapper}>
          <IntroTitleBox title={t('intro.step05_title')} onLayout={setTitleBoxCenterY} />
          <Text style={styles.pickLocationText} allowFontScaling={false}>{t('intro.step05_pick')}</Text>
          <View style={styles.optionsContainer}>
            {countries.map((country) => (
              <RadioOption
                key={country.value}
                iconSvg={COUNTRY_FLAG_MAP[country.value]}
                label={country.label}
                selected={selectedCountry === country.value}
                onPress={() => {
                  setSelectedCountryLocal(country.value);
                  if (country.value !== 'other') setSelectedAreaTypeLocal(null);
                }}
              />
            ))}
          </View>
          {isOther && (
            <>
              <Text style={styles.pickAreaText} allowFontScaling={false}>{t('intro.step05_area')}</Text>
              <Dropdown label={t('intro.step05_select_area')} value={selectedAreaTypeLabel} onPress={() => setAreaTypeSheetVisible(true)} />
            </>
          )}
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <Button
          title={t('common.continue')}
          onPress={() => {
            if (isFormValid) {
              setCountry(selectedCountry || '');
              setArea(selectedAreaType || '');
              onNext?.();
            }
          }}
          disabled={!isFormValid}
        />
      </FixedButtonContainer>
      <BottomSheet visible={areaTypeSheetVisible} onClose={() => setAreaTypeSheetVisible(false)}>
        <View style={{ padding: spacing('md'), paddingBottom: spacing('xl') * 2 }}>
          {AREA_TYPES.map((areaType) => (
            <BottomSheetOption
              key={areaType.id}
              label={areaType.label}
              selected={selectedAreaType === areaType.id}
              onPress={() => { setSelectedAreaTypeLocal(areaType.id); setAreaTypeSheetVisible(false); }}
            />
          ))}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};
