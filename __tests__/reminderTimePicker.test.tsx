import React from 'react';
import { Platform } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ReminderTimePicker } from '../src/components/ui/ReminderTimePicker';

const mockOpen = jest.fn();
const mockDismiss = jest.fn(() => Promise.resolve(true));

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: {
    open: (...args: unknown[]) => mockOpen(...args),
    dismiss: () => mockDismiss(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ReminderTimePicker', () => {
  const platformDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
  });

  afterAll(() => {
    if (platformDescriptor) {
      Object.defineProperty(Platform, 'OS', platformDescriptor);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the native Android clock and preserves the 24-hour callback', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();

    act(() => {
      TestRenderer.create(
        <ReminderTimePicker
          visible
          initialHour={9}
          initialMinute={0}
          onClose={onClose}
          onConfirm={onConfirm}
        />,
      );
    });

    expect(mockOpen).toHaveBeenCalledTimes(1);
    const pickerOptions = mockOpen.mock.calls[0][0];
    expect(pickerOptions).toMatchObject({
      mode: 'time',
      display: 'clock',
    });

    const selectedTime = new Date();
    selectedTime.setHours(21, 35, 0, 0);
    act(() => pickerOptions.onValueChange({}, selectedTime));

    expect(onConfirm).toHaveBeenCalledWith(21, 35);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('maps the native neutral action to removing a reminder', () => {
    const onClose = jest.fn();
    const onRemove = jest.fn();

    act(() => {
      TestRenderer.create(
        <ReminderTimePicker
          visible
          onClose={onClose}
          onConfirm={jest.fn()}
          onRemove={onRemove}
        />,
      );
    });

    const pickerOptions = mockOpen.mock.calls[0][0];
    act(() => pickerOptions.onNeutralButtonPress());

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
