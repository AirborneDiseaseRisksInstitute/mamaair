import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { ReliableWheelPicker } from './ReliableWheelPicker';
import { useTheme, spacing, radius } from '../../theme';
import { useTranslation } from 'react-i18next';

interface ReminderTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hour: number, minute: number) => void;
  initialHour?: number;
  initialMinute?: number;
  taskTitle?: string;
  onRemove?: () => void;
}

const hourOptions = Array.from({ length: 24 }, (_, i) => i);
const hourLabels = hourOptions.map(h => (h < 10 ? `0${h}` : `${h}`));

export const TIME_PICKER_MINUTE_VALUES = Array.from(
  { length: 60 },
  (_, minute) => minute,
);
export const TIME_PICKER_MINUTE_LABELS = TIME_PICKER_MINUTE_VALUES.map(minute =>
  minute.toString().padStart(2, '0'),
);

const ITEM_HEIGHT = 56;
const VISIBLE_REST = 2;

export const ReminderTimePicker: React.FC<ReminderTimePickerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialHour = 9,
  initialMinute = 0,
  taskTitle,
  onRemove,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const getInitialHourIndex = useCallback(() => {
    const index = hourOptions.indexOf(initialHour);
    return index >= 0 ? index : 8;
  }, [initialHour]);

  const getInitialMinuteIndex = useCallback(() => {
    const index = TIME_PICKER_MINUTE_VALUES.indexOf(initialMinute);
    return index >= 0 ? index : 0;
  }, [initialMinute]);

  const [hourIndex, setHourIndex] = useState(getInitialHourIndex());
  const [minuteIndex, setMinuteIndex] = useState(getInitialMinuteIndex());

  const handleConfirm = () => {
    onConfirm(hourOptions[hourIndex], TIME_PICKER_MINUTE_VALUES[minuteIndex]);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  useEffect(() => {
    if (visible) {
      setHourIndex(getInitialHourIndex());
      setMinuteIndex(getInitialMinuteIndex());
    }
  }, [visible, getInitialHourIndex, getInitialMinuteIndex]);

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
  const title = taskTitle
    ? t('picker.set_reminder_for', { task: taskTitle })
    : t('picker.set_reminder_time');

  return (
    <BottomSheet visible={visible} onClose={onClose} showHandle>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            allowFontScaling={false}
          >
            {title}
          </Text>
        </View>

        <View style={styles.labelsContainer}>
          <View style={styles.labelWrapper}>
            <Text
              style={[styles.label, { color: theme.colors.textPrimary }]}
              allowFontScaling={false}
            >
              {t('common.hour')}
            </Text>
          </View>
          <View style={styles.labelWrapper}>
            <Text
              style={[styles.label, { color: theme.colors.textPrimary }]}
              allowFontScaling={false}
            >
              {t('common.minute')}
            </Text>
          </View>
        </View>

        <View style={[styles.pickersContainer, { height: pickerHeight }]}>
          <View style={styles.pickersAnimatedContainer}>
            <View style={styles.pickerWrapper}>
              <ReliableWheelPicker
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
              <ReliableWheelPicker
                selectedIndex={minuteIndex}
                options={TIME_PICKER_MINUTE_LABELS}
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
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {onRemove ? (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={onRemove}
              activeOpacity={0.7}
            >
              <Text style={styles.removeButtonText} allowFontScaling={false}>
                {t('common.remove')}
              </Text>
            </TouchableOpacity>
          ) : null}
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
              allowFontScaling={false}
            >
              {t('common.cancel')}
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
                    fontFamily: theme.typography.fontFamily.extraBold,
                  },
                ]}
                allowFontScaling={false}
              >
                {t('common.ok')}
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
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing('md'),
    alignItems: 'center',
    gap: spacing('md'),
    paddingTop: spacing('lg'),
  },
  removeButton: {
    flex: 1,
    paddingVertical: spacing('md'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#B93838',
    fontSize: 14,
    fontFamily: 'MPLUSRounded1c-Medium',
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
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
});
