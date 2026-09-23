import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../../theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { responsiveUtils } from '../../utils/responsiveUtils';
import { useTranslation } from 'react-i18next';

interface AccessLocationBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onAllow: () => void;
  onNotNow?: () => void;
}

export const AccessLocationBottomSheet: React.FC<AccessLocationBottomSheetProps> = ({
  visible,
  onClose,
  onAllow,
  onNotNow,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        contentWrapper: {
          paddingTop: spacing('md'),
          paddingBottom: spacing('xl'),
        },
        closeButton: {
          position: 'absolute',
          top: 0,
          right: 0,
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        },
        imageContainer: {
          alignItems: 'center',
          marginBottom: spacing('lg'),
        },
        image: {
          width: 150,
          height: 150,
          resizeMode: 'contain',
        },
        title: {
          fontSize: responsiveUtils.getFixedFontSize(20),
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          textAlign: 'center',
          marginBottom: spacing('sm'),
          paddingHorizontal: spacing('md'),
        },
        description: {
          fontSize: responsiveUtils.getFixedFontSize(15),
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          lineHeight: responsiveUtils.getFixedLineHeight(15, 22),
          marginBottom: spacing('xl'),
          paddingHorizontal: spacing('md'),
        },
        buttonContainer: {
          width: '100%',
          marginBottom: spacing('md'),
        },
        notNowButton: {
          alignItems: 'center',
          paddingVertical: spacing('sm'),
          paddingHorizontal: spacing('md'),
        },
        notNowText: {
          fontSize: responsiveUtils.getFixedFontSize(15),
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textPrimary,
        },
      }),
    [theme]
  );

  const handleNotNow = () => {
    (onNotNow ?? onClose)();
  };

  const handleAllow = () => {
    onAllow();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      showHandle={false}
    >
      <ScrollView
        style={{ maxHeight: height * 0.8 }}
        contentContainerStyle={styles.contentWrapper}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FontAwesomeIcon
            icon={faTimes as any}
            size={20}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>

        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/accessLocation.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title} allowFontScaling={false}>
          {t('location.sheet_title')}
        </Text>

        <Text style={styles.description} allowFontScaling={false}>
          {t('location.sheet_desc')}
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title={t('location.allow')}
            onPress={handleAllow}
          />
        </View>

        <TouchableOpacity
          style={styles.notNowButton}
          onPress={handleNotNow}
          activeOpacity={0.7}
        >
          <Text style={styles.notNowText} allowFontScaling={false}>
            {t('location.not_now')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
};
