import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { BottomSheet } from './BottomSheet';
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

const createTimeValue = (hour: number, minute: number): Date => {
  const value = new Date();
  value.setHours(
    Math.min(23, Math.max(0, Math.trunc(hour))),
    Math.min(59, Math.max(0, Math.trunc(minute))),
    0,
    0,
  );
  return value;
};

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
  const [selectedTime, setSelectedTime] = useState(() =>
    createTimeValue(initialHour, initialMinute),
  );
  const androidPickerOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onConfirmRef = useRef(onConfirm);
  const onRemoveRef = useRef(onRemove);

  useEffect(() => {
    onCloseRef.current = onClose;
    onConfirmRef.current = onConfirm;
    onRemoveRef.current = onRemove;
  }, [onClose, onConfirm, onRemove]);

  useEffect(() => {
    if (visible) {
      setSelectedTime(createTimeValue(initialHour, initialMinute));
    }
  }, [initialHour, initialMinute, visible]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    if (!visible) {
      if (androidPickerOpenRef.current) {
        DateTimePickerAndroid.dismiss('time').catch(() => {});
        androidPickerOpenRef.current = false;
      }
      return;
    }

    if (androidPickerOpenRef.current) return;
    androidPickerOpenRef.current = true;

    const closePicker = () => {
      androidPickerOpenRef.current = false;
      onCloseRef.current();
    };

    DateTimePickerAndroid.open({
      value: createTimeValue(initialHour, initialMinute),
      mode: 'time',
      display: 'clock',
      positiveButton: {
        label: t('common.ok'),
        textColor: theme.colors.orange500,
      },
      negativeButton: {
        label: t('common.cancel'),
        textColor: theme.colors.textSecondary,
      },
      ...(onRemoveRef.current
        ? {
            neutralButton: {
              label: t('common.remove'),
              textColor: '#B93838',
            },
            onNeutralButtonPress: () => {
              androidPickerOpenRef.current = false;
              onRemoveRef.current?.();
              onCloseRef.current();
            },
          }
        : {}),
      onValueChange: (_, value) => {
        androidPickerOpenRef.current = false;
        onConfirmRef.current(value.getHours(), value.getMinutes());
        onCloseRef.current();
      },
      onDismiss: closePicker,
      onError: closePicker,
    });
  }, [initialHour, initialMinute, t, theme, visible]);

  if (Platform.OS === 'android') return null;

  const handleConfirm = () => {
    onConfirm(selectedTime.getHours(), selectedTime.getMinutes());
    onClose();
  };

  const title = taskTitle
    ? t('picker.set_reminder_for', { task: taskTitle })
    : t('picker.set_reminder_time');

  return (
    <BottomSheet visible={visible} onClose={onClose} showHandle>
      <View style={styles.container}>
        <Text
          style={[styles.title, { color: theme.colors.textPrimary }]}
          allowFontScaling={false}
        >
          {title}
        </Text>

        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="spinner"
          minuteInterval={5}
          onValueChange={(_, value) => setSelectedTime(value)}
          textColor={theme.colors.textPrimary}
          themeVariant="light"
          style={styles.iosPicker}
        />

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
            onPress={onClose}
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
                  { fontFamily: theme.typography.fontFamily.extraBold },
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
    paddingHorizontal: spacing('md'),
    paddingBottom: spacing('lg'),
  },
  title: {
    paddingTop: spacing('sm'),
    paddingBottom: spacing('md'),
    fontSize: 20,
    fontFamily: 'MPLUSRounded1c-Bold',
  },
  iosPicker: {
    alignSelf: 'stretch',
    height: 216,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('md'),
    paddingTop: spacing('md'),
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
