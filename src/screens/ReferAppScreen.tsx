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
} from 'react-native';
import { useTheme, spacing } from '../theme';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faLink, faShare2 } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReferAppScreenProps {
  onBack?: () => void;
}

export const ReferAppScreen: React.FC<ReferAppScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [emailInput, setEmailInput] = React.useState('');

  const referImage = require('../assets/images/referApp.png');

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
      marginTop:32,
      marginRight:24,
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
          <Image
            source={referImage}
            style={styles.image}
          />
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
            placeholder={t('refer.email_or_username')}
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
            onPress={() => {
              // Handle send invite
              console.log('Send invite to:', emailInput);
              setEmailInput('');
            }}
          >
            <Text style={styles.sendButtonText} allowFontScaling={false}>{t('refer.send_invite')}</Text>
          </TouchableOpacity>
        </View>

        {/* Copy Link and Share Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => {
              // Handle copy link
              console.log('Copy link pressed');
            }}
          >
            <FontAwesomeIcon
              icon={faLink}
              size={16}
              style={styles.actionIcon}
            />
            <Text style={styles.actionButtonText} allowFontScaling={false}>{t('refer.copy_link')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={() => {
              // Handle share
              console.log('Share pressed');
            }}
          >
            <FontAwesomeIcon
              icon={faShare2}
              size={16}
              style={styles.actionIcon}
            />
            <Text style={styles.actionButtonText} allowFontScaling={false}>{t('refer.share_on')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
