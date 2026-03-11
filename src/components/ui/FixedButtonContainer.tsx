import React, { useEffect } from 'react';
import { StyleSheet, Keyboard, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme';

interface FixedButtonContainerProps {
  children: React.ReactNode;
  paddingTop?: number;
  paddingBottom?: number;
}

export const FixedButtonContainer: React.FC<FixedButtonContainerProps> = ({ 
  children,
  paddingTop = spacing('md'),
  paddingBottom,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const height = event.endCoordinates.height;
        // Move container up by keyboard height minus a small spacing
        Animated.timing(translateY, {
          toValue: -height + spacing('sm'),
          duration: event.duration || 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        // Move container back to original position
        Animated.timing(translateY, {
          toValue: 0,
          duration: event.duration || 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [translateY]);

  const defaultPaddingBottom = paddingBottom !== undefined 
    ? paddingBottom 
    : spacing('lg') + insets.bottom;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop,
          paddingBottom: defaultPaddingBottom,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing('md'),
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
