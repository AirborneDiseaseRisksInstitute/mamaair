import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme, spacing } from '../../theme';
import { ms, fs } from '../../utils/responsive';

interface RangeSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
  formatValue?: (value: number) => string;
}

const THUMB_SIZE = ms(44);
const BAR_HEIGHT = ms(12);
const CONNECTOR_HEIGHT = ms(30);

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  minLabel,
  maxLabel,
  formatValue = (v) => v.toString(),
}) => {
  const theme = useTheme();
  const [sliderWidth, setSliderWidth] = useState(0);
  const pan = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  const valueRef = useRef(value);
  const sliderWidthRef = useRef(sliderWidth);
  const onChangeRef = useRef(onChange);
  
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  
  useEffect(() => {
    sliderWidthRef.current = sliderWidth;
  }, [sliderWidth]);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  const valueToPosition = useCallback((val: number) => {
    const width = sliderWidthRef.current;
    if (width === 0) return 0;
    const percentage = (val - min) / (max - min);
    return percentage * width;
  }, [min, max]);

  const positionToValue = useCallback((pos: number) => {
    const width = sliderWidthRef.current;
    if (width === 0) return min;
    const percentage = Math.max(0, Math.min(1, pos / width));
    return Math.round(percentage * (max - min) + min);
  }, [min, max]);

  useEffect(() => {
    if (sliderWidth > 0) {
      pan.setValue(valueToPosition(value));
    }
  }, [value, sliderWidth, valueToPosition, pan]);

  const startPositionRef = useRef(0);

  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPositionRef.current = valueToPosition(valueRef.current);
        
        Animated.spring(scale, {
          toValue: 1.15,
          friction: 5,
          tension: 300,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        const width = sliderWidthRef.current;
        if (width === 0) return;
        
        let newPosition = startPositionRef.current + gestureState.dx;
        newPosition = Math.max(0, Math.min(width, newPosition));
        pan.setValue(newPosition);
        
        const newValue = positionToValue(newPosition);
        if (newValue !== valueRef.current) {
          onChangeRef.current(newValue);
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 300,
          useNativeDriver: false,
        }).start();
        
        Animated.spring(pan, {
          toValue: valueToPosition(valueRef.current),
          friction: 7,
          tension: 100,
          useNativeDriver: false,
        }).start();
      },
    }),
  [valueToPosition, positionToValue, pan, scale]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setSliderWidth(width);
  };

  const fillWidth = pan.interpolate({
    inputRange: [0, sliderWidth || 1],
    outputRange: [0, sliderWidth || 1],
    extrapolate: 'clamp',
  });

  const thumbTranslateX = pan.interpolate({
    inputRange: [0, sliderWidth || 1],
    outputRange: [-THUMB_SIZE / 2, (sliderWidth || 1) - THUMB_SIZE / 2],
    extrapolate: 'clamp',
  });

  const connectorTranslateX = pan.interpolate({
    inputRange: [0, sliderWidth || 1],
    outputRange: [0, sliderWidth || 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Thumb */}
      <Animated.View
        style={[
          styles.thumbContainer,
          {
            transform: [
              { translateX: thumbTranslateX },
              { scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.thumb, { backgroundColor: theme.colors.neutral800 }]}>
          <Text style={[styles.thumbText, { color: '#FFFFFF' }]} allowFontScaling={false}>
            {formatValue(value)}
          </Text>
        </View>
      </Animated.View>

      {/* Connector Line */}
      <Animated.View
        style={[
          styles.connectorContainer,
          {
            transform: [{ translateX: connectorTranslateX }],
          },
        ]}
      >
        <View style={[styles.connector, { backgroundColor: theme.colors.orange400 }]} />
      </Animated.View>

      {/* Slider Bar */}
      <View style={styles.barContainer} onLayout={handleLayout}>
        <View style={[styles.bar, { backgroundColor: theme.colors.orange200 }]} />
        <Animated.View
          style={[
            styles.filledBar,
            {
              backgroundColor: theme.colors.orange500,
              width: fillWidth,
            },
          ]}
        />
      </View>

      {/* Labels */}
      <View style={styles.labelsContainer}>
        <Text style={[styles.label, { color: theme.colors.orange500 }]} allowFontScaling={false}>
          {minLabel || `${min}hrs`}
        </Text>
        <Text style={[styles.label, { color: theme.colors.orange500 }]} allowFontScaling={false}>
          {maxLabel || `${max}hrs`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: THUMB_SIZE + CONNECTOR_HEIGHT,
    paddingHorizontal: spacing('md'),
    marginBottom: spacing('xl'),
  },
  thumbContainer: {
    position: 'absolute',
    top: 0,
    left: spacing('md'),
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    zIndex: 10,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbText: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Bold',
  },
  connectorContainer: {
    position: 'absolute',
    top: THUMB_SIZE,
    left: spacing('md'),
    width: 2,
    height: CONNECTOR_HEIGHT,
    alignItems: 'center',
  },
  connector: {
    width: 2,
    height: CONNECTOR_HEIGHT,
    borderRadius: 1,
  },
  barContainer: {
    width: '100%',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    width: '100%',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
  },
  filledBar: {
    position: 'absolute',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing('sm'),
  },
  label: {
    fontSize: 14,
    fontFamily: 'MPLUSRounded1c-Medium',
  },
});
