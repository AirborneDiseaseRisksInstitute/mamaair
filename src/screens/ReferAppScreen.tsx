import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
  Share,
} from 'react-native';
import { useTheme, spacing } from '../theme';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faLink, faShare } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAMAAIR_WEBSITE_URL = 'https://mamaair.africa/';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ReferAppScreenProps {
  onBack?: () => void;
}

export const ReferAppScreen: React.FC<ReferAppScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [emailInput, setEmailInput] = React.useState('');

  const referImage = require('../assets/images/referApp.png');

  const showShareError = () => {
    showToast({
      type: 'error',
      title: t('refer.share_failed_title'),
      message: t('refer.share_failed_message'),
    });
  };

  const handleEmailInvite = async () => {
    const email = emailInput.trim();
    if (!EMAIL_PATTERN.test(email)) {
      showToast({
        type: 'error',
        title: t('refer.invalid_email_title'),
        message: t('validation.invalid_email'),
      });
      return;
    }

    const subject = encodeURIComponent(t('refer.email_subject'));
    const body = encodeURIComponent(
      t('refer.email_body', { url: MAMAAIR_WEBSITE_URL }),
    );

    try {
      await Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
      setEmailInput('');
    } catch {
      showShareError();
    }
  };

  const handleOpenWebsite = async () => {
    try {
      await Linking.openURL(MAMAAIR_WEBSITE_URL);
    } catch {
      showShareError();
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('refer.share_message', { url: MAMAAIR_WEBSITE_URL }),
      });
    } catch {
      showShareError();
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFF8F3',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing('md'),
      paddingTop: spacing('md'),
      paddingBottom: spacing('md'),
    },
    headerPlaceholder: {
      width: 24,
      height: 24,
    },
    closeButton: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 32,
      marginRight: 24,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing('md'),
      paddingTop: spacing('xl'),
      paddingBottom: spacing('xl'),
    },
    imageContainer: {
      alignItems: 'center',
      marginBottom: spacing('xl'),
    },
    image: {
      width: SCREEN_WIDTH - spacing('md') * 2,
      height: 280,
      resizeMode: 'contain',
    },
    titleText: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
      textAlign: 'center',
      marginBottom: spacing('lg'),
      lineHeight: 32,
    },
    descriptionText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing('xl'),
      lineHeight: 20,
    },
    emailInputContainer: {
      flexDirection: 'row',
      marginBottom: spacing('xl'),
      gap: spacing('sm'),
    },
    emailInput: {
      flex: 1,
      paddingHorizontal: spacing('md'),
      height: 48,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.neutral300,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
    },
    sendButton: {
      paddingHorizontal: spacing('lg'),
      height: 48,
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.neutral300,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: spacing('md'),
    },
    actionButton: {
      flex: 1,
      height: 48,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.neutral300,
      backgroundColor: '#fff',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing('sm'),
    },
    actionButtonText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
    },
    actionIcon: {
      color: theme.colors.textPrimary,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPlaceholder} />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <FontAwesomeIcon
            icon={faTimes}
            size={24}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration Image */}
        <View style={styles.imageContainer}>
          <Image source={referImage} style={styles.image} />
        </View>

        {/* Title */}
        <Text style={styles.titleText} allowFontScaling={false}>
          {t('refer.title')}
        </Text>

        {/* Description */}
        <Text style={styles.descriptionText} allowFontScaling={false}>
          {t('refer.description')}
        </Text>

        {/* Email Input with Send Button */}
        <View style={styles.emailInputContainer}>
          <TextInput
            style={styles.emailInput}
            placeholder={t('refer.email')}
            placeholderTextColor={theme.colors.neutral400}
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            allowFontScaling={false}
            maxFontSizeMultiplier={1}
          />
          <TouchableOpacity
            style={styles.sendButton}
            activeOpacity={0.7}
            onPress={handleEmailInvite}
          >
            <Text style={styles.sendButtonText} allowFontScaling={false}>
              {t('refer.send_invite')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Copy Link and Share Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={handleOpenWebsite}
          >
            <FontAwesomeIcon
              icon={faLink}
              size={16}
              style={styles.actionIcon}
            />
            <Text style={styles.actionButtonText} allowFontScaling={false}>
              {t('refer.open_website')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={handleShare}
          >
            <FontAwesomeIcon
              icon={faShare}
              size={16}
              style={styles.actionIcon}
            />
            <Text style={styles.actionButtonText} allowFontScaling={false}>
              {t('refer.share')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
