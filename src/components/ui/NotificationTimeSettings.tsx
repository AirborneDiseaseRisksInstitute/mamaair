import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, spacing, radius } from '../../theme';
import { Button } from './Button';
import { ReminderTimePicker } from './ReminderTimePicker';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toPickerHour = (h: number) => (h === 0 ? 24 : h);
const fromPickerHour = (h: number) => (h === 24 ? 0 : h);
const toPickerMinute = (m: number) => (m === 0 ? 1 : m);
const formatTime = (h: number, m: number) =>
  `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

export interface NotificationTimeSettingsProps {
  fromHour: number;
  fromMinute: number;
  toHour: number;
  toMinute: number;
  days: string;
  onSave: (from: { hour: number; minute: number }, to: { hour: number; minute: number }, days: string) => void;
  onClose?: () => void;
  showSaveButton?: boolean;
  saveButtonTitle?: string;
  variant?: 'default' | 'intro'; // intro = wrap all in white card
}

export const NotificationTimeSettings: React.FC<NotificationTimeSettingsProps> = ({
  fromHour,
  fromMinute,
  toHour,
  toMinute,
  days: initialDays,
  onSave,
  onClose,
  showSaveButton = true,
  saveButtonTitle = 'Save',
  variant = 'default',
}) => {
  const theme = useTheme();
  const [fromH, setFromH] = useState(fromHour);
  const [fromM, setFromM] = useState(fromMinute);
  const [toH, setToH] = useState(toHour);
  const [toM, setToM] = useState(toMinute);
  const [days, setDays] = useState(initialDays);
  const [fromPickerVisible, setFromPickerVisible] = useState(false);
  const [toPickerVisible, setToPickerVisible] = useState(false);

  const toggleDay = (index: number) => {
    const arr = days.split('');
    arr[index] = arr[index] === '1' ? '0' : '1';
    setDays(arr.join(''));
  };

  const handleSave = () => {
    onSave({ hour: fromH, minute: fromM }, { hour: toH, minute: toM }, days);
    onClose?.();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: '#fff',
          borderRadius: radius('lg'),
          padding: spacing('md'),
          marginBottom: spacing('xl'),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 2,
        },
        timeBlock: {
          backgroundColor: variant === 'intro' ? 'transparent' : (theme.colors.neutral100 || '#f5f5f5'),
          borderRadius: variant === 'intro' ? 0 : radius('lg'),
          padding: variant === 'intro' ? 0 : spacing('md'),
          paddingVertical: variant === 'intro' ? spacing('sm') : undefined,
          marginBottom: spacing('lg'),
        },
        timeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing('sm'),
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.neutral200,
        },
        timeRowLast: { borderBottomWidth: 0 },
        timeLabel: {
          fontSize: 16,
          fontFamily: theme.typography.fontFamily.medium,
          color: theme.colors.textPrimary,
        },
        timeValue: {
          fontSize: 16,
          fontFamily: theme.typography.fontFamily.medium,
          color: theme.colors.textPrimary,
          backgroundColor: theme.colors.neutral200,
          paddingHorizontal: spacing('md'),
          paddingVertical: spacing('sm'),
          borderRadius: 20,
        },
        daysLabel: {
          fontSize: 16,
          fontFamily: theme.typography.fontFamily.medium,
          color: theme.colors.textPrimary,
          marginBottom: spacing('md'),
        },
        daysRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing('xs') },
        dayButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        },
        dayButtonOn: { backgroundColor: theme.colors.orange500 },
        dayButtonOff: { backgroundColor: theme.colors.neutral200 },
        dayText: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, color: '#fff' },
        dayTextOff: { color: theme.colors.textSecondary },
        saveButton: { marginTop: spacing('lg') },
      }),
    [theme, variant]
  );

  const content = (
    <>
      <View style={styles.timeBlock}>
        <Pressable style={styles.timeRow} onPress={() => setFromPickerVisible(true)}>
          <Text style={styles.timeLabel} allowFontScaling={false}>From</Text>
          <Text style={styles.timeValue} allowFontScaling={false}>{formatTime(fromH, fromM)}</Text>
        </Pressable>
        <Pressable style={[styles.timeRow, styles.timeRowLast]} onPress={() => setToPickerVisible(true)}>
          <Text style={styles.timeLabel} allowFontScaling={false}>To</Text>
          <Text style={styles.timeValue} allowFontScaling={false}>{formatTime(toH, toM)}</Text>
        </Pressable>
      </View>

      <Text style={styles.daysLabel} allowFontScaling={false}>Notification days</Text>
      <View style={styles.daysRow}>
        {DAY_LABELS.map((label, i) => {
          const on = days[i] === '1';
          return (
            <Pressable
              key={i}
              style={[styles.dayButton, on ? styles.dayButtonOn : styles.dayButtonOff]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[styles.dayText, !on && styles.dayTextOff]} allowFontScaling={false}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {showSaveButton && (
        <View style={styles.saveButton}>
          <Button title={saveButtonTitle} onPress={handleSave} />
        </View>
      )}

      <ReminderTimePicker
        visible={fromPickerVisible}
        onClose={() => setFromPickerVisible(false)}
        onConfirm={(h, m) => {
          setFromH(fromPickerHour(h));
          setFromM(m);
          setFromPickerVisible(false);
        }}
        initialHour={toPickerHour(fromH)}
        initialMinute={toPickerMinute(fromM)}
        taskTitle="From"
      />
      <ReminderTimePicker
        visible={toPickerVisible}
        onClose={() => setToPickerVisible(false)}
        onConfirm={(h, m) => {
          setToH(fromPickerHour(h));
          setToM(m);
          setToPickerVisible(false);
        }}
        initialHour={toPickerHour(toH)}
        initialMinute={toPickerMinute(toM)}
        taskTitle="To"
      />
    </>
  );

  if (variant === 'intro') {
    return <View style={styles.card}>{content}</View>;
  }
  return content;
};
