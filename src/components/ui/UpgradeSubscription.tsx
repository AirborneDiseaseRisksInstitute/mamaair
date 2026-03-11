import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../../theme';
import { Button } from './Button';
import { responsiveUtils } from '../../utils/responsiveUtils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UpgradeSubscriptionProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export const UpgradeSubscription: React.FC<UpgradeSubscriptionProps> = ({
  visible,
  onClose,
  onUpgrade,
}) => {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      backdropAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  const backdropOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.dialog,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FontAwesomeIcon
              icon={faTimes as any}
              size={22}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>

          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/premium.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.title, { color: theme.colors.orange500 }]} allowFontScaling={false}>
            Upgrade to premium
          </Text>

          <Text style={[styles.description, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
            Unlock premium tools and resources for your pregnancy journey
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              title="Upgrade"
              onPress={() => {
                onUpgrade?.();
                onClose();
              }}
            />
          </View>

          <TouchableOpacity
            style={styles.noThanksButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.noThanksText, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
              No thanks
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    flex: 1,
    backgroundColor: '#fff',
  
    paddingHorizontal: spacing('lg'),
    paddingTop: spacing('xl'),
    paddingBottom: spacing('xl') + 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 32,
    right: spacing('lg'),
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageContainer: {
    marginTop: spacing('xl'),
    marginBottom: spacing('lg'),
  },
  image: {
    width: 250,
    height: 250,
  },
  title: {
    fontSize: responsiveUtils.getFixedFontSize(24),
    fontFamily: 'MPLUSRounded1c-Bold',
    textAlign: 'center',
    marginBottom: spacing('sm'),
  },
  description: {
    fontSize: responsiveUtils.getFixedFontSize(15),
    fontFamily: 'MPLUSRounded1c-Regular',
    textAlign: 'center',
    lineHeight: responsiveUtils.getFixedLineHeight(15, 22),
    marginBottom: spacing('xl'),
    paddingHorizontal: spacing('md'),
  },
  buttonContainer: {
    width: '100%',
    marginBottom: spacing('md'),
  },
  noThanksButton: {
    paddingVertical: spacing('sm'),
    paddingHorizontal: spacing('md'),
  },
  noThanksText: {
    fontSize: responsiveUtils.getFixedFontSize(14),
    fontFamily: 'MPLUSRounded1c-Regular',
  },
});
