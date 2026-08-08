import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Image, Pressable, Linking, ScrollView } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { useTheme, spacing, radius } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, useToast } from '../../../components/ui';
import { useTranslation } from 'react-i18next';
import { ms, fs, s, vs, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const notifThumb = require('../../../assets/images/notifThumb.png');

interface IntroStep12Props { onEnableNotifications?: () => void; onSkip?: () => void; onBack?: () => void; }

const SHADOW_OFFSET_1 = 6;
const SHADOW_OFFSET_2 = 12;

export const IntroStep12: React.FC<IntroStep12Props> = ({ onEnableNotifications, onSkip, onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [_checking, setChecking] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        const settings = await notifee.getNotificationSettings();
        // Just check the status, don't auto-navigate
        // User should manually press the button to proceed
        setChecking(false);
      } catch (error) { 
        console.error('Error checking notification status:', error); 
        setChecking(false);
      }
    };
    checkNotificationStatus();
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
        if (onEnableNotifications) onEnableNotifications();
      } else {
        showToast({
          type: 'error',
          title: t('settings.notifications_disabled'),
          message: t('settings.notifications_disabled_message'),
        });
        // Open system settings directly so user can fix it
        Linking.openSettings();
      }
    } catch (error) { console.error('Error requesting notification permission:', error); }
  };

  const CARD_HEIGHT = vs(110);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
    contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    descriptionText: { fontSize: 16, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textPrimary, textAlign: 'center', lineHeight: 24, marginBottom: spacing('xl'), marginTop:32 },
    boldText: { fontFamily: theme.typography.fontFamily.bold},
    cardContainer: { position: 'relative', width: '100%', marginTop: spacing('lg'), paddingBottom: SHADOW_OFFSET_2 },
    cardShadow2: { position: 'absolute', top: SHADOW_OFFSET_2, left: 4, right: 4, height: CARD_HEIGHT, borderRadius: radius('md'), backgroundColor: theme.colors.orange300 || '#FFB366' },
    cardShadow1: { position: 'absolute', top: SHADOW_OFFSET_1, left: 2, right: 2, height: CARD_HEIGHT, borderRadius: radius('md'), backgroundColor: theme.colors.orange500 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius('md'), borderWidth: 1, borderColor: theme.colors.orange500, padding: spacing('md'), minHeight: CARD_HEIGHT, zIndex: 2 },
    cardImage: { width: s(80), height: s(80), borderRadius: radius('sm'), marginRight: spacing('md') },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary, lineHeight: 20, marginBottom: spacing('xs') },
    cardSubtitle: { fontSize: 13, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, lineHeight: 18 },
    buttonsContainer: { width: '100%' },
    notNowButton: { alignItems: 'center', paddingVertical: spacing('md'), marginTop: spacing('sm') },
    notNowText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textSecondary },
  }), [theme, CARD_HEIGHT]);

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={SCREEN_HEIGHT * 0.45} radius={SCREEN_WIDTH * 0.6} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <BackButton onPress={onBack} />
      <ProgressBar progress={0.857} />
        <View style={styles.contentWrapper}>
          <Text style={styles.descriptionText} allowFontScaling={false}>
            <Text style={styles.boldText} allowFontScaling={false}>Mama Air</Text>
            {' '}{t('intro.step12_description')}
          </Text>
          <View style={styles.cardContainer}>
            <View style={styles.cardShadow2} />
            <View style={styles.cardShadow1} />
            <View style={styles.card}>
              <Image source={notifThumb} style={styles.cardImage} resizeMode="cover" />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} allowFontScaling={false}>{t('intro.step12_card_title')}</Text>
                <Text style={styles.cardSubtitle} allowFontScaling={false}>{t('intro.step12_card_subtitle')}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonsContainer}>
          <Button title={t('intro.step12_enable')} onPress={handleEnableNotifications} />
          <Pressable style={styles.notNowButton} onPress={onSkip || (() => {})}><Text style={styles.notNowText} allowFontScaling={false}>{t('intro.step12_not_now')}</Text></Pressable>
        </View>
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
