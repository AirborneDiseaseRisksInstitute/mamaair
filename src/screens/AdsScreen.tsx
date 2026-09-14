import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Text,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { AdPlacement, resolveAdImage } from '../data/ads';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AdsScreenProps {
  onClose?: () => void;
  placement?: AdPlacement;
}

export const AdsScreen: React.FC<AdsScreenProps> = ({
  onClose,
  placement = 'standalone',
}) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(3);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (timeLeft === 0) {
      setCanClose(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onClose]);

  const adImage = resolveAdImage(placement);

  const handleClose = () => {
    if (canClose || timeLeft === 0) {
      onClose?.();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Image - Full Screen */}
      <Image
        source={adImage}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Top Right Close Button with Timer */}
      <TouchableOpacity
        style={[
          styles.topCloseButton,
          !canClose && { opacity: 0.5 },
        ]}
        onPress={handleClose}
        disabled={!canClose}
        activeOpacity={canClose ? 0.7 : 1}
      >
        <View style={styles.timerContainer}>
          <Text style={styles.timerText} allowFontScaling={false}>{timeLeft}{t('common.seconds_short')}</Text>
        </View>
        <View style={styles.closeIcon}>
          <FontAwesomeIcon
            icon={faTimes}
            size={20}
            color="#fff"
          />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  image: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
  },
  topCloseButton: {
    position: 'absolute',
    top: 32,
    right: 32,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  timerContainer: {
    position: 'absolute',
    top: -16,
    right: -12,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
