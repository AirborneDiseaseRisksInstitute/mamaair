import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Image, Pressable, Animated, ScrollView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useTheme, spacing, radius } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, BottomSheet, BottomSheetOption } from '../../../components/ui';
import { useUserStore } from '../../../store/useUserStore';
import { ms, fs, s, vs, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const addPhotoPlaceholder = require('../../../assets/images/addPhoto.png');

interface IntroStep13Props { onNext?: () => void; onBack?: () => void; onSkip?: () => void; }
const SHADOW_OFFSET = 4;

export const IntroStep13: React.FC<IntroStep13Props> = ({ onNext, onBack, onSkip }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setPhoto, profile } = useUserStore();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(profile.photo || null);
  const [isPhotoSheetVisible, setPhotoSheetVisible] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const shadowOpacity = useRef(new Animated.Value(1)).current;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
    contentWrapper: { alignItems: 'center', paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    titleText: { fontSize: 20, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, textAlign: 'center', lineHeight: 28, marginBottom: spacing('xl'), marginTop:32 },
    photoContainer: { alignItems: 'center', marginBottom: spacing('lg') },
    photoImage: { width: vs(200), height: vs(200), borderRadius: vs(100) },
    buttonContainer: { position: 'relative', marginTop: spacing('md') },
    buttonShadow: { position: 'absolute', top: SHADOW_OFFSET, left: 0, right: 0, height: vs(50), borderRadius: radius('md') },
    addPhotoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: vs(50), paddingHorizontal: spacing('xl'), borderRadius: radius('md'), borderWidth: 1, backgroundColor: '#fff' },
    buttonIcon: { marginRight: spacing('sm') },
    buttonText: { fontSize: 16, fontFamily: theme.typography.fontFamily.bold },
    buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    skipButton: { paddingVertical: spacing('md'), paddingHorizontal: spacing('lg'), marginLeft: spacing('lg') },
    skipText: { fontSize: 18, fontFamily: theme.typography.fontFamily.extraBold, color: theme.colors.orange500 },
    continueButtonWrapper: { width: s(200), marginLeft: spacing('md') },
  }), [theme]);

  const handlePressIn = () => { Animated.parallel([Animated.timing(translateY, { toValue: SHADOW_OFFSET, duration: 100, useNativeDriver: true }), Animated.timing(shadowOpacity, { toValue: 0, duration: 100, useNativeDriver: true })]).start(); };
  const handlePressOut = () => { Animated.parallel([Animated.timing(translateY, { toValue: 0, duration: 100, useNativeDriver: true }), Animated.timing(shadowOpacity, { toValue: 1, duration: 100, useNativeDriver: true })]).start(); };

  const handleLaunchCamera = () => {
    setPhotoSheetVisible(false);
    launchCamera({ mediaType: 'photo', quality: 0.8, cameraType: 'front', presentationStyle: 'fullScreen' }, (r) => { if (!r.didCancel && !r.errorCode && r.assets?.[0]?.uri) setSelectedPhoto(r.assets[0].uri); });
  };
  const handleLaunchLibrary = () => {
    setPhotoSheetVisible(false);
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1, presentationStyle: 'fullScreen' }, (r) => { if (!r.didCancel && !r.errorCode && r.assets?.[0]?.uri) setSelectedPhoto(r.assets[0].uri); });
  };

  const handleApply = () => { if (selectedPhoto) setPhoto(selectedPhoto); onNext?.(); };
  const handleSkip = () => { setPhoto(null); onSkip?.(); };
  const buttonBorderColor = selectedPhoto ? '#FB2C36' : theme.colors.orange500;
  const buttonTextColor = selectedPhoto ? '#FB2C36' : theme.colors.orange500;

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={SCREEN_HEIGHT * 0.4} radius={SCREEN_WIDTH * 0.6} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <BackButton onPress={onBack} />
      <ProgressBar progress={0.929} />
        <View style={styles.contentWrapper}>
          <Text style={styles.titleText} allowFontScaling={false}>{t('intro.step13_photo_hint')}</Text>
          <View style={styles.photoContainer}><Image source={selectedPhoto ? { uri: selectedPhoto } : addPhotoPlaceholder} style={styles.photoImage} resizeMode="cover" /></View>
          <View style={styles.buttonContainer}>
            <Animated.View style={[styles.buttonShadow, { backgroundColor: buttonBorderColor, opacity: shadowOpacity }]} />
            <Pressable onPress={selectedPhoto ? () => setSelectedPhoto(null) : () => setPhotoSheetVisible(true)} onPressIn={handlePressIn} onPressOut={handlePressOut}>
              <Animated.View style={[styles.addPhotoButton, { borderColor: buttonBorderColor, transform: [{ translateY }] }]}>
                {selectedPhoto && <View style={styles.buttonIcon}><FontAwesomeIcon icon={faTimes as any} size={ms(16)} color={buttonTextColor} /></View>}
                <Text style={[styles.buttonText, { color: buttonTextColor }]} allowFontScaling={false}>{selectedPhoto ? t('intro.step13_remove_photo') : t('intro.step13_add_photo')}</Text>
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <View style={styles.buttonRow}>
          <Pressable onPress={handleSkip} style={styles.skipButton}><Text style={styles.skipText} allowFontScaling={false}>{t('common.skip')}</Text></Pressable>
          <View style={styles.continueButtonWrapper}><Button title={t('intro.step13_apply')} onPress={handleApply} /></View>
        </View>
      </FixedButtonContainer>
      <BottomSheet visible={isPhotoSheetVisible} onClose={() => setPhotoSheetVisible(false)} title={t('profile.select_photo')}>
        <View style={{ padding: spacing('md'), paddingBottom: spacing('xl') * 2 }}>
          <BottomSheetOption label="Take Photo" selected={false} onPress={handleLaunchCamera} />
          <BottomSheetOption label="Choose from Library" selected={false} onPress={handleLaunchLibrary} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};
