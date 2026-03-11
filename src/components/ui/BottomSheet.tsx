import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing } from '../../theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showHandle?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const FOLD_SEGMENTS = 3;

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  title,
  showHandle = true,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [contentHeight, setContentHeight] = useState(SCREEN_HEIGHT * 0.9);
  const [showContent, setShowContent] = useState(false);

  // Rotation animations for each segment (only for background)
  const foldAnimations = useRef(
    Array.from({ length: FOLD_SEGMENTS }, () => new Animated.Value(90))
  ).current;
  
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowContent(false);
      contentOpacity.setValue(0);
      
      // Step 1: Open fold sequentially (from bottom to top)
      // Backdrop fades in first
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Then each segment opens in order
      const createSequentialFold = () => {
        let sequence: Animated.CompositeAnimation[] = [];
        
      foldAnimations.forEach((anim, _index) => {
        sequence.push(
          Animated.timing(anim, {
        toValue: 0,
            duration: 200, // Faster speed
        useNativeDriver: true,
          })
        );
      });

        return Animated.sequence(sequence);
      };

      createSequentialFold().start(() => {
        // Step 2: After fold completes, show content
        setShowContent(true);
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Closing: content fades out first
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setShowContent(false);
        
        // Then fold closes sequentially (from top to bottom)
        const createSequentialFoldClose = () => {
          let sequence: Animated.CompositeAnimation[] = [];
          
          // Reverse order to close from top to bottom
          for (let i = FOLD_SEGMENTS - 1; i >= 0; i--) {
            sequence.push(
              Animated.timing(foldAnimations[i], {
                toValue: 90,
                duration: 180, // Faster speed
          useNativeDriver: true,
              })
            );
          }

          return Animated.sequence(sequence);
        };

        createSequentialFoldClose().start(() => {
        Animated.timing(backdropOpacity, {
          toValue: 0,
            duration: 200,
          useNativeDriver: true,
          }).start();
        });
      });
    }
  }, [visible, foldAnimations, backdropOpacity, contentOpacity]);

  const handleBackdropPress = () => {
    onClose();
  };

  const handleContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && Math.abs(height - contentHeight) > 10) {
      setContentHeight(Math.min(height, SCREEN_HEIGHT * 0.9));
    }
  };

  const segmentHeight = contentHeight / FOLD_SEGMENTS;

  // Render each fold segment (background only, no content)
  const renderFoldSegment = (index: number) => {
    const anim = foldAnimations[index];
    
    // Improve folding with better easing
    const rotateX = anim.interpolate({
      inputRange: [0, 90],
      outputRange: ['0deg', '-90deg'],
    });
    
    // Add scale to create more depth
    const scaleY = anim.interpolate({
      inputRange: [0, 90],
      outputRange: [1, 0.95], // Slightly smaller when folded
    });

    // Calculate vertical position - segments are arranged from bottom to top
    // Add 1px overlap for lower segments to prevent sub-pixel gap showing as black line
    const segmentHeightActual = index < FOLD_SEGMENTS - 1 ? segmentHeight + 1 : segmentHeight;
    const bottomPosition = index * segmentHeight;

    // Shadow: when upper segment (index+1) is opening, shadow appears on this segment
    // Use darker color to create more realistic and stronger shadow
    const shadowIntensity = index < FOLD_SEGMENTS - 1 
      ? foldAnimations[index + 1].interpolate({
          inputRange: [0, 15, 40, 70, 90],
          outputRange: [0, 0.8, 1, 0.6, 0], // Stronger and more tangible shadow
        })
      : new Animated.Value(0);

    return (
      <Animated.View
        key={index}
        style={[
          styles.foldSegment,
          {
            height: segmentHeightActual,
            bottom: bottomPosition,
            transform: [
              { perspective: 1000 }, // Add perspective for 3D effect
              { translateY: segmentHeight / 2 },
              { rotateX },
              { scaleY }, // Add scale for more depth
              { translateY: -segmentHeight / 2 },
            ],
          },
        ]}
      >
        {/* Shadow layer - only for lower segments */}
        {index < FOLD_SEGMENTS - 1 && (
          <Animated.View
            style={[
              styles.shadowLayer,
              {
                opacity: shadowIntensity,
              },
            ]}
            pointerEvents="none"
          >
            {/* Shadow gradient - multiple layers for more realistic and stronger effect */}
            <Animated.View
              style={[
                styles.shadowGradient1,
                {
                  opacity: shadowIntensity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.shadowGradient2,
                {
                  opacity: shadowIntensity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.8],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.shadowGradient3,
                {
                  opacity: shadowIntensity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.6],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.shadowGradient4,
                {
                  opacity: shadowIntensity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.4],
                  }),
                },
              ]}
            />
          </Animated.View>
        )}
        
        <View
          style={[
            styles.segmentBackground,
            {
              backgroundColor: theme.colors.background,
              height: segmentHeightActual,
              ...(index === FOLD_SEGMENTS - 1 && {
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              }),
            },
          ]}
        />
      </Animated.View>
    );
  };

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
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <View style={styles.sheetContainer}>
          {/* Fill bottom safe area to prevent black line on devices with home indicator */}
          {insets.bottom > 0 && (
            <View
              style={[
                styles.safeAreaBottomFill,
                { height: insets.bottom, backgroundColor: theme.colors.background },
              ]}
              pointerEvents="none"
            />
          )}
          {/* Container for fold animation */}
          <View style={[styles.foldContainer, { height: contentHeight }]}>
            {Array.from({ length: FOLD_SEGMENTS }, (_, index) =>
              renderFoldSegment(index)
            )}
          </View>

          {/* Internal content shown after fold */}
          {showContent && (
        <Animated.View
          style={[
                styles.contentContainer,
            {
                  height: contentHeight,
                  opacity: contentOpacity,
                },
              ]}
            >
              <View
                style={[
                  styles.content,
                  {
                    backgroundColor: 'transparent',
                  },
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
                    {typeof title === 'string' ? (
                      <Text
                        style={[
                          styles.titleText,
                          { color: theme.colors.textPrimary },
                        ]}
                       allowFontScaling={false}>
                        {title}
                      </Text>
                    ) : (
                      title
                    )}
                  </View>
                )}
                <View style={styles.childrenContainer}>{children}</View>
              </View>
            </Animated.View>
          )}
          
          {/* Hidden view for measuring actual content height */}
          <View
            style={styles.measurementContainer}
            onLayout={handleContentLayout}
            pointerEvents="none"
        >
          <View
            style={[
              styles.content,
              {
                backgroundColor: theme.colors.background,
              },
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
                {typeof title === 'string' ? (
                  <Text
                    style={[
                      styles.titleText,
                      { color: theme.colors.textPrimary },
                    ]}
                   allowFontScaling={false}>
                    {title}
                  </Text>
                ) : (
                  title
                )}
              </View>
            )}
            <View style={styles.childrenContainer}>{children}</View>
            </View>
          </View>
        </View>
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
  foldContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  foldSegment: {
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  shadowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 15,
    overflow: 'visible',
  },
  shadowGradient1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker
  },
  shadowGradient2: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darker
  },
  shadowGradient3: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)', // Darker
  },
  shadowGradient4: {
    position: 'absolute',
    top: 9,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  segmentBackground: {
    width: '100%',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing('sm'),
    width: '100%',
    minHeight: 200,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  measurementContainer: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    bottom: 0,
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
