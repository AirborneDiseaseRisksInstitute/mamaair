import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../../theme';
import { ms } from '../../utils/responsive';
import { BottomSheet } from './BottomSheet';
import { Symptoms } from './Symptoms';

interface FloatingActionButtonProps {
  onApply?: (data: {
    mood_ids: number[];
    feeling_ids: number[];
    water_amount: number;
  }) => void;
  initialMoodIds?: number[];
  initialFeelingIds?: number[];
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onApply,
  initialMoodIds = [],
  initialFeelingIds = [],
}) => {
  const theme = useTheme();
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  const FAB_SIZE = ms(64);

  const styles = useMemo(() => StyleSheet.create({
    fab: {
      position: 'absolute',
      bottom: spacing('xl'),
      right: spacing('lg'),
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      backgroundColor: theme.colors.orange500,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      zIndex: 99999,
      elevation: 99999,
    },
  }), [theme, FAB_SIZE]);

  const handleClose = () => setIsBottomSheetVisible(false);

  const handleApply = (data: {
    mood_ids: number[];
    feeling_ids: number[];
    water_amount: number;
  }) => {
    onApply?.(data);
    setIsBottomSheetVisible(false);
  };

  return (
    <>
      <View
        style={[StyleSheet.absoluteFill, { zIndex: 99999, elevation: 99999 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.7}
          onPress={() => setIsBottomSheetVisible(true)}
        >
          <FontAwesomeIcon
            icon={faPlus as any}
            size={ms(20)}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      <BottomSheet
        visible={isBottomSheetVisible}
        onClose={handleClose}
        showHandle={false}
      >
        <Symptoms
          onClose={handleClose}
          onApply={handleApply}
          initialMoodIds={initialMoodIds}
          initialFeelingIds={initialFeelingIds}
        />
      </BottomSheet>
    </>
  );
};
