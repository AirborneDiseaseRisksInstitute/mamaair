import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme, spacing, radius } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, DatePicker, HeightWeightPicker } from '../../../components/ui';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faUser } from '@fortawesome/free-solid-svg-icons';
import { useUserStore } from '../../../store/useUserStore';
import { useTranslation } from 'react-i18next';
import { ms, vs, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const SHADOW_OFFSET = 4;
const INPUT_HEIGHT = vs(54);

interface IntroStep03Props {
  onNext?: () => void;
  onBack?: () => void;
}

export const IntroStep03: React.FC<IntroStep03Props> = ({ onNext, onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setBirthday, setHeight, setWeight, profile } = useUserStore();
  const [birthday, setBirthdayLocal] = useState<Date | null>(profile.birthday ? new Date(profile.birthday) : null);
  const [height, setHeightLocal] = useState<number | null>(profile.height || null);
  const [weight, setWeightLocal] = useState<number | null>(profile.weight || null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [heightWeightPickerVisible, setHeightWeightPickerVisible] = useState(false);

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatHeightWeight = (): string => {
    if (height && weight) return `${height} Cm - ${weight} Kg`;
    return '';
  };

  const isFormValid = birthday !== null && height !== null && weight !== null;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
    contentWrapper: {
      paddingHorizontal: spacing('md'),
      paddingTop: HEADER_CLEARANCE,
    },
    instructionText: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing('xl'),
      lineHeight: 26,
      marginTop: spacing('lg'),
    },
    inputContainer: { width: '100%', marginBottom: spacing('lg') },
    inputTitle: { fontSize: 16, fontFamily: 'MPLUSRounded1c-Bold', color: theme.colors.textPrimary, marginBottom: spacing('sm') },
    pickerInputWrapper: { position: 'relative', width: '100%' },
    pickerShadow: { position: 'absolute', height: INPUT_HEIGHT, borderRadius: radius('md'), backgroundColor: theme.colors.neutral300, top: SHADOW_OFFSET, left: 0, right: 0 },
    pickerInputContainer: { position: 'relative' },
    pickerInput: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing('md'), paddingRight: spacing('md'), height: INPUT_HEIGHT, backgroundColor: theme.colors.background, borderRadius: radius('md'), borderWidth: 1, borderColor: theme.colors.neutral300 },
    pickerInputText: { flex: 1, fontSize: 16, fontFamily: 'MPLUSRounded1c-Regular', color: birthday || (height && weight) ? theme.colors.textPrimary : theme.colors.neutral400, marginLeft: spacing('sm') },
    pickerIconContainer: { justifyContent: 'center', alignItems: 'center' },
    pickerIcon: { color: theme.colors.neutral600 },
  }), [theme, birthday, height, weight]);

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo position="center" />
      <BackButton onPress={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>
          <Text style={styles.instructionText} allowFontScaling={false}>
            {t('intro.step03_instruction')}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputTitle} allowFontScaling={false}>{t('intro.step03_birthday')}</Text>
            <TouchableOpacity style={styles.pickerInputWrapper} onPress={() => setDatePickerVisible(true)} activeOpacity={0.7}>
              <View style={styles.pickerShadow} />
              <View style={styles.pickerInputContainer}>
                <View style={styles.pickerInput}>
                  <View style={styles.pickerIconContainer}><FontAwesomeIcon icon={faCalendar as any} size={ms(18)} style={styles.pickerIcon} /></View>
                  <Text style={styles.pickerInputText} allowFontScaling={false}>{birthday ? formatDate(birthday) : t('intro.step03_birthday_placeholder')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputTitle} allowFontScaling={false}>{t('intro.step03_height_weight')}</Text>
            <TouchableOpacity style={styles.pickerInputWrapper} onPress={() => setHeightWeightPickerVisible(true)} activeOpacity={0.7}>
              <View style={styles.pickerShadow} />
              <View style={styles.pickerInputContainer}>
                <View style={styles.pickerInput}>
                  <View style={styles.pickerIconContainer}><FontAwesomeIcon icon={faUser as any} size={ms(18)} style={styles.pickerIcon} /></View>
                  <Text style={styles.pickerInputText} allowFontScaling={false}>{formatHeightWeight() || t('intro.step03_height_weight_placeholder')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <FixedButtonContainer>
        <Button title={t('common.continue')} onPress={() => { if (isFormValid) { setBirthday(birthday); setHeight(height); setWeight(weight); onNext?.(); } }} disabled={!isFormValid} />
      </FixedButtonContainer>

      <DatePicker visible={datePickerVisible} onClose={() => setDatePickerVisible(false)} onConfirm={(date) => { setBirthdayLocal(date); setDatePickerVisible(false); }} initialDate={birthday || undefined} />
      <HeightWeightPicker visible={heightWeightPickerVisible} onClose={() => setHeightWeightPickerVisible(false)} onConfirm={(selectedHeight, selectedWeight) => { setHeightLocal(selectedHeight); setWeightLocal(selectedWeight); setHeightWeightPickerVisible(false); }} initialHeight={height || 175} initialWeight={weight || 70} />
    </SafeAreaView>
  );
};
