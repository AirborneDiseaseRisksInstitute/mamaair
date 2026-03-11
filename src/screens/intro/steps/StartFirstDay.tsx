import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ActivityIndicator, Modal } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing, radius } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo } from '../../../components/ui';
import { CONGRATS_SVG } from '../../../utils/svgIcons';
import { useUserStore } from '../../../store/useUserStore';
import { s, vs, ms, fs, FIXED_BUTTON_AREA_HEIGHT } from '../../../utils/responsive';

const ORDINAL_NUMBERS = [
  '', 'FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH', 'TENTH',
  'ELEVENTH', 'TWELFTH', 'THIRTEENTH', 'FOURTEENTH', 'FIFTEENTH', 'SIXTEENTH', 'SEVENTEENTH', 'EIGHTEENTH', 'NINETEENTH', 'TWENTIETH',
  'TWENTY-FIRST', 'TWENTY-SECOND', 'TWENTY-THIRD', 'TWENTY-FOURTH', 'TWENTY-FIFTH', 'TWENTY-SIXTH', 'TWENTY-SEVENTH', 'TWENTY-EIGHTH', 'TWENTY-NINTH', 'THIRTIETH',
  'THIRTY-FIRST', 'THIRTY-SECOND', 'THIRTY-THIRD', 'THIRTY-FOURTH', 'THIRTY-FIFTH', 'THIRTY-SIXTH', 'THIRTY-SEVENTH', 'THIRTY-EIGHTH', 'THIRTY-NINTH', 'FORTIETH',
  'FORTY-FIRST', 'FORTY-SECOND'
];

interface StartFirstDayProps { onNext?: () => void; }

export const StartFirstDay: React.FC<StartFirstDayProps> = ({ onNext }) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useUserStore();

  const buttonText = useMemo(() => {
    const week = profile.pregnancyWeek;
    if (week && week > 0 && week < ORDINAL_NUMBERS.length) return `START MY ${ORDINAL_NUMBERS[week]} WEEK`;
    return "START MY FIRST DAY";
  }, [profile.pregnancyWeek]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    logoContainer: { alignItems: 'center', paddingTop: spacing('md'), marginTop:24 },
    logo: { width: s(140), height: vs(48), resizeMode: 'contain' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
    centerBox: { justifyContent: 'center', alignItems: 'center' },
    svgContainer: { position: 'absolute' },
    messageBox: { backgroundColor: '#fff', borderRadius: radius('lg'), padding: spacing('lg'), marginHorizontal: spacing('lg'), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    tail: { position: 'absolute', bottom: -12, alignSelf: 'center', width: 0, height: 0, borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#fff' },
    title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary, marginBottom: spacing('sm'), textAlign: 'center' },
    message: { fontSize: 16, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24 },
    loadingOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    loadingContainer: { backgroundColor: '#fff', borderRadius: ms(12), padding: ms(24), alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: ms(16), fontSize: 16, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary },
  }), [theme]);

  const handleNext = useCallback(() => {
    setIsLoading(true);
    requestAnimationFrame(() => {
      setTimeout(() => { onNext?.(); setTimeout(() => setIsLoading(false), 100); }, 100);
    });
  }, [onNext]);

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo position="center" />
      <View style={styles.logoContainer}>
        <Image source={require('../../../assets/images/logoBlack.png')} style={styles.logo} />
      </View>
      <View style={styles.content}>
        <View style={styles.centerBox}>
          <View style={styles.svgContainer}><SvgXml xml={CONGRATS_SVG} width={s(304)} height={s(315)} /></View>
          <View style={styles.messageBox}>
            <Text style={styles.title} allowFontScaling={false}>Congratulations!</Text>
            <Text style={styles.message} allowFontScaling={false}>You've set the stage for a{'\n'}healthy journey ahead.{'\n'}Let's take your first small step{'\n'}today.</Text>
            <View style={styles.tail} />
          </View>
        </View>
      </View>
      <FixedButtonContainer><Button title={buttonText} onPress={handleNext} /></FixedButtonContainer>
      <Modal visible={isLoading} transparent={true} animationType="fade" onRequestClose={() => {}}>
        <View style={styles.loadingOverlay}><View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.orange500} /><Text style={styles.loadingText} allowFontScaling={false}>Loading...</Text></View></View>
      </Modal>
    </SafeAreaView>
  );
};
