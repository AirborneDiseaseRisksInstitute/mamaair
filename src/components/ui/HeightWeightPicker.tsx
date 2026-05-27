import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import WheelPicker from 'react-native-wheely';
import { BottomSheet } from './BottomSheet';
import { useTheme, spacing, radius } from '../../theme';
import { fs, ms } from '../../utils/responsive';

interface HeightWeightPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (height: number, weight: number) => void;
  initialHeight?: number;
  initialWeight?: number;
  title?: string;
}

// Generate height options (100cm - 220cm)
const heightOptions = Array.from({ length: 121 }, (_, i) => 100 + i);
const heightLabels = heightOptions.map((h) => `${h}cm`);

// Generate weight options (30kg - 200kg)
const weightOptions = Array.from({ length: 171 }, (_, i) => 30 + i);
const weightLabels = weightOptions.map((w) => `${w}kg`);

const ITEM_HEIGHT = 56;
const VISIBLE_REST = 2;

export const HeightWeightPicker: React.FC<HeightWeightPickerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialHeight = 170,
  initialWeight = 60,
  title = 'Select Height and Weight',
}) => {
  const theme = useTheme();

  const getInitialHeightIndex = useCallback(() => {
    const index = heightOptions.indexOf(initialHeight);
    return index >= 0 ? index : 70;
  }, [initialHeight]);

  const getInitialWeightIndex = useCallback(() => {
    const index = weightOptions.indexOf(initialWeight);
    return index >= 0 ? index : 30;
  }, [initialWeight]);

  const [heightIndex, setHeightIndex] = useState(getInitialHeightIndex());
  const [weightIndex, setWeightIndex] = useState(getInitialWeightIndex());
  
  // Animated opacity for fade in
  const opacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const mountKey = useRef(0);

  // Calculate BMI
  const calculateBMI = (height: number, weight: number): number => {
    const heightInMeters = height / 100;
    return Math.round(weight / (heightInMeters * heightInMeters));
  };

  const handleConfirm = () => {
    onConfirm(heightOptions[heightIndex], weightOptions[weightIndex]);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  useEffect(() => {
    let renderTimer: ReturnType<typeof setTimeout>;
    let fadeTimer: ReturnType<typeof setTimeout>;
    
    if (visible) {
      // Reset immediately
      opacity.setValue(0);
      setShouldRender(false);
      setHeightIndex(getInitialHeightIndex());
      setWeightIndex(getInitialWeightIndex());
      mountKey.current += 1;
      
      // Step 1: Wait for BottomSheet to fully open and layout to settle
      renderTimer = setTimeout(() => {
        setShouldRender(true);
        
        // Step 2: Wait a bit more for WheelPicker to calculate layout
        fadeTimer = setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }, 200);
      }, 500);
    } else {
      opacity.setValue(0);
      setShouldRender(false);
    }
    
    return () => {
      if (renderTimer) clearTimeout(renderTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [visible, getInitialHeightIndex, getInitialWeightIndex, opacity]);

  const selectedHeight = heightOptions[heightIndex];
  const selectedWeight = weightOptions[weightIndex];

  // Scale function: center is largest
  const scaleFunction = useCallback((x: number) => {
    return Math.max(0.45, 1 - x * 0.22);
  }, []);

  // Opacity function: center is fully visible
  const opacityFunction = useCallback((x: number) => {
    return Math.max(0.3, 1 - x * 0.28);
  }, []);

  // Items style - responsive and smaller to ensure full text display
  const itemTextStyle = {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 28,
    color: theme.colors.orange500,
  };

  const pickerHeight = ITEM_HEIGHT * (VISIBLE_REST * 2 + 1);

  return (
    <BottomSheet visible={visible} onClose={onClose} showHandle={true}>
      <View style={styles.container}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            {title}
          </Text>
        </View>

        {/* Labels */}
        <View style={styles.labelsContainer}>
          <View style={styles.labelWrapper}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
              Height
            </Text>
          </View>
          <View style={styles.labelWrapper}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
              Weight
            </Text>
          </View>
        </View>

        {/* Pickers Container */}
        <View style={[styles.pickersContainer, { height: pickerHeight }]}>
          {shouldRender && (
            <Animated.View style={[styles.pickersAnimatedContainer, { opacity }]}>
              {/* Height Picker */}
              <View style={styles.pickerWrapper}>
                <WheelPicker
                  key={`height-${mountKey.current}`}
                  selectedIndex={heightIndex}
                  options={heightLabels}
                  onChange={setHeightIndex}
                  visibleRest={VISIBLE_REST}
                  itemHeight={ITEM_HEIGHT}
                  itemTextStyle={itemTextStyle}
                  selectedIndicatorStyle={styles.selectedIndicator}
                  containerStyle={styles.wheelContainer}
                  scaleFunction={scaleFunction}
                  opacityFunction={opacityFunction}
                  decelerationRate="fast"
                />
              </View>

              {/* Weight Picker */}
              <View style={styles.pickerWrapper}>
                <WheelPicker
                  key={`weight-${mountKey.current}`}
                  selectedIndex={weightIndex}
                  options={weightLabels}
                  onChange={setWeightIndex}
                  visibleRest={VISIBLE_REST}
                  itemHeight={ITEM_HEIGHT}
                  itemTextStyle={itemTextStyle}
                  selectedIndicatorStyle={styles.selectedIndicator}
                  containerStyle={styles.wheelContainer}
                  scaleFunction={scaleFunction}
                  opacityFunction={opacityFunction}
                  decelerationRate="fast"
                />
              </View>
            </Animated.View>
          )}
        </View>

        {/* BMI Display */}
        <View style={styles.bmiContainer}>
          <Text style={[styles.bmiText, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
            Your BMI is{' '}
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily.bold,
              }}
             allowFontScaling={false}>
              {calculateBMI(selectedHeight, selectedWeight)}
            </Text>
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.cancelButtonText,
                { color: theme.colors.textSecondary },
              ]}
             allowFontScaling={false}>
              Cancel
            </Text>
          </TouchableOpacity>

          <View style={styles.okButtonContainer}>
            <TouchableOpacity
              style={[
                styles.okButton,
                {
                  backgroundColor: theme.colors.orange500,
                  borderRadius: radius('md'),
                  shadowColor: theme.colors.orange900,
                },
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.okButtonText,
                  {
                    color: '#FFFFFF',
                    fontFamily: theme.typography.fontFamily.extraBold,
                  },
                ]}
               allowFontScaling={false}>
                Ok
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: spacing('lg'),
  },
  titleContainer: {
    paddingHorizontal: spacing('md'),
    paddingTop: spacing('sm'),
    paddingBottom: spacing('md'),
  },
  title: {
    fontSize: 20,
    fontFamily: 'MPLUSRounded1c-Bold',
  },
  labelsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing('md'),
    marginBottom: spacing('sm'),
  },
  labelWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Bold',
  },
  pickersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing('md'),
    overflow: 'hidden',
  },
  pickersAnimatedContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  pickerWrapper: {
    flex: 1,
    paddingHorizontal: spacing('xs'),
    minWidth: 0, // Allow flex to shrink if needed
  },
  wheelContainer: {
    width: '100%',
  },
  selectedIndicator: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
  },
  bmiContainer: {
    paddingVertical: spacing('lg'),
    alignItems: 'center',
  },
  bmiText: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Medium',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing('md'),
    alignItems: 'center',
    gap: spacing('md'),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing('md'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Medium',
  },
  okButtonContainer: {
    flex: 1,
  },
  okButton: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  okButtonText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
