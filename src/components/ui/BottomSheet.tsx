import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '../../theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showHandle?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const OPEN_DURATION = 280;
const CLOSE_DURATION = 220;

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  title,
  showHandle = true,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const activeAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!isMounted) return undefined;

    activeAnimation.current?.stop();
    const opening = visible;
    const duration = opening ? OPEN_DURATION : CLOSE_DURATION;
    const easing = opening
      ? Easing.out(Easing.cubic)
      : Easing.in(Easing.cubic);
    const animation = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: opening ? 1 : 0,
        duration,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: opening ? 0 : SCREEN_HEIGHT,
        duration,
        easing,
        useNativeDriver: true,
      }),
    ]);

    activeAnimation.current = animation;
    animation.start(({ finished }) => {
      if (finished && !visibleRef.current) {
        setIsMounted(false);
      }
    });

    return () => {
      animation.stop();
      if (activeAnimation.current === animation) {
        activeAnimation.current = null;
      }
    };
  }, [backdropOpacity, isMounted, sheetTranslateY, visible]);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={styles.modalContainer}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          {insets.bottom > 0 && (
            <View
              style={[
                styles.safeAreaBottomFill,
                {
                  height: insets.bottom,
                  backgroundColor: theme.colors.background,
                },
              ]}
              pointerEvents="none"
            />
          )}

          <View
            testID="bottom-sheet-surface"
            style={[
              styles.contentContainer,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View
              style={[
                styles.content,
                { backgroundColor: theme.colors.background },
              ]}
            >
              {showHandle && (
                <View style={styles.handleContainer}>
                  <View
                    style={[
                      styles.handle,
                      { backgroundColor: theme.colors.neutral300 },
                    ]}
                  />
                </View>
              )}

              {title && (
                <View style={styles.titleContainer}>
                  <Text
                    style={[
                      styles.titleText,
                      { color: theme.colors.textPrimary },
                    ]}
                    allowFontScaling={false}
                  >
                    {title}
                  </Text>
                </View>
              )}

              <View style={styles.childrenContainer}>{children}</View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  safeAreaBottomFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentContainer: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing('sm'),
    width: '100%',
    minHeight: 200,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing('xs'),
    paddingBottom: spacing('sm'),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  titleContainer: {
    paddingHorizontal: spacing('md'),
    paddingBottom: spacing('md'),
  },
  titleText: {
    fontSize: 20,
    fontFamily: 'MPLUSRounded1c-Bold',
  },
  childrenContainer: {
    width: '100%',
    paddingHorizontal: spacing('md'),
    paddingBottom: spacing('md'),
  },
});
