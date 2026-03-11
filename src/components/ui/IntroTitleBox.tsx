import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useTheme, spacing } from '../../theme';
import { ms, fs, vs } from '../../utils/responsive';

interface IntroTitleBoxProps {
  title: string;
  onLayout?: (centerY: number) => void;
}

export const IntroTitleBox: React.FC<IntroTitleBoxProps> = ({
  title,
  onLayout,
}) => {
  const theme = useTheme();

  const handleLayout = (event: LayoutChangeEvent) => {
    if (onLayout) {
      const { y, height } = event.nativeEvent.layout;
      const centerY = y + height / 2;
      onLayout(centerY);
    }
  };

  const styles = StyleSheet.create({
    titleBox: {
      backgroundColor: theme.colors.background,
      borderRadius: ms(12),
      padding: spacing('lg'),
      marginTop: vs(32), // Extra margin top to ensure clear separation from ProgressBar
      marginBottom: spacing('xl'),
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.titleBox} onLayout={handleLayout}>
      <Text style={styles.title} allowFontScaling={false}>{title}</Text>
    </View>
  );
};
