import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing } from '../../theme';
import { ms } from '../../utils/responsive';

interface ProgressBarProps {
  progress: number; // 0 to 1 (0% to 100%)
}

const PROGRESS_BAR_HEIGHT = ms(20);

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const progressPercentage = Math.min(Math.max(progress, 0), 1) * 100;
  
  // BackButton height: padding (sm*2) + icon (20) 
  const BACK_BUTTON_HEIGHT = spacing('sm') * 2 + ms(20);
  const VERTICAL_OFFSET = (BACK_BUTTON_HEIGHT - PROGRESS_BAR_HEIGHT) / 2;

  return (
    <View
      style={[
        styles.container,
        {
          top: insets.top + spacing('md') + VERTICAL_OFFSET,
          right: spacing('md'),
          height: PROGRESS_BAR_HEIGHT,
        },
      ]}
    >
      <View style={[styles.track, { backgroundColor: theme.colors.neutral200, height: PROGRESS_BAR_HEIGHT, borderRadius: PROGRESS_BAR_HEIGHT / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: theme.colors.orange500,
              borderRadius: PROGRESS_BAR_HEIGHT / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
    left: spacing('md') + ms(40) + spacing('md'), // back button width + spacing
    right: spacing('md'),
    justifyContent: 'center',
  },
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});
