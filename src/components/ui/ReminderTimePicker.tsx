import React, { useState, useEffect, useRef, useCallback } from 'react';
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

interface ReminderTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hour: number, minute: number) => void;
  initialHour?: number;
  initialMinute?: number;
  taskTitle?: string;
}

const hourOptions = Array.from({ length: 24 }, (_, i) => i);
const hourLabels = hourOptions.map((h) => (h < 10 ? `0${h}` : `${h}`));

const minuteOptions = Array.from({ length: 60 }, (_, i) => i);
const minuteLabels = minuteOptions.map((m) => (m < 10 ? `0${m}` : `${m}`));

const ITEM_HEIGHT = 56;
const VISIBLE_REST = 2;

export const ReminderTimePicker: React.FC<ReminderTimePickerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialHour = 9,
  initialMinute = 0,
  taskTitle,
}) => {
  const theme = useTheme();

  const getInitialHourIndex = useCallback(() => {
    const index = hourOptions.indexOf(initialHour);
    return index >= 0 ? index : 8;
  }, [initialHour]);

  const getInitialMinuteIndex = useCallback(() => {
    const index = minuteOptions.indexOf(initialMinute);
    return index >= 0 ? index : 0;
  }, [initialMinute]);

  const [hourIndex, setHourIndex] = useState(getInitialHourIndex());
  const [minuteIndex, setMinuteIndex] = useState(getInitialMinuteIndex());

  const opacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(false);
  const mountKey = useRef(0);

  const handleConfirm = () => {
    onConfirm(hourOptions[hourIndex], minuteOptions[minuteIndex]);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  useEffect(() => {
    let renderTimer: ReturnType<typeof setTimeout>;
    let fadeTimer: ReturnType<typeof setTimeout>;

    if (visible) {
      opacity.setValue(0);
      setShouldRender(false);
      setHourIndex(getInitialHourIndex());
      setMinuteIndex(getInitialMinuteIndex());
      mountKey.current += 1;

      renderTimer = setTimeout(() => {
        setShouldRender(true);
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
  }, [visible, getInitialHourIndex, getInitialMinuteIndex, opacity]);

  const scaleFunction = useCallback((x: number) => {
    return Math.max(0.45, 1 - x * 0.22);
  }, []);

  const opacityFunction = useCallback((x: number) => {
    return Math.max(0.3, 1 - x * 0.28);
  }, []);

  const itemTextStyle = {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 28,
    color: theme.colors.orange500,
  };

  const pickerHeight = ITEM_HEIGHT * (VISIBLE_REST * 2 + 1);
  const title = taskTitle ? `Set reminder: ${taskTitle}` : 'Set reminder time';

  return (
    <BottomSheet visible={visible} onClose={onClose} showHandle>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
            {title}
          </Text>
        </View>

        <View style={styles.labelsContainer}>
          <View style={styles.labelWrapper}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
              Hour
            </Text>
          </View>
          <View style={styles.labelWrapper}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
              Minute
            </Text>
          </View>
        </View>

        <View style={[styles.pickersContainer, { height: pickerHeight }]}>
          {shouldRender && (
            <Animated.View style={[styles.pickersAnimatedContainer, { opacity }]}>
              <View style={styles.pickerWrapper}>
                <WheelPicker
                  key={`hour-${mountKey.current}`}
                  selectedIndex={hourIndex}
                  options={hourLabels}
                  onChange={setHourIndex}
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
              <View style={styles.pickerWrapper}>
                <WheelPicker
                  key={`minute-${mountKey.current}`}
                  selectedIndex={minuteIndex}
                  options={minuteLabels}
                  onChange={setMinuteIndex}
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

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}
              allowFontScaling={false}
            >
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
                  { color: '#FFFFFF', fontFamily: theme.typography.fontFamily.extraBold },
                ]}
                allowFontScaling={false}
              >
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
    minWidth: 0,
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
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing('md'),
    alignItems: 'center',
    gap: spacing('md'),
    paddingTop: spacing('lg'),
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  okButtonText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
