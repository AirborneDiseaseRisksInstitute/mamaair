import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { DatePicker } from '../src/components/ui/DatePicker';

jest.mock('../src/components/ui/BottomSheet', () => ({
  BottomSheet: ({ visible, children }: any) => {
    const ReactModule = require('react');
    const { View: NativeView } = require('react-native');
    return visible
      ? ReactModule.createElement(NativeView, null, children)
      : null;
  },
}));

jest.mock('react-native-calendars', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');
  return {
    Calendar: (props: any) =>
      ReactModule.createElement(NativeView, {
        ...props,
        testID: 'calendar',
      }),
    LocaleConfig: { locales: {}, defaultLocale: 'en-US' },
  };
});

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en' },
  }),
}));

jest.mock('../src/theme', () => ({
  spacing: () => 8,
  radius: () => 8,
  useTheme: () => ({
    colors: {
      background: '#fff',
      textPrimary: '#111',
      textSecondary: '#666',
      neutral400: '#aaa',
      orange500: '#f80',
      orange900: '#630',
    },
    typography: {
      fontFamily: {
        regular: 'Regular',
        medium: 'Medium',
        extraBold: 'ExtraBold',
      },
    },
  }),
}));

describe('DatePicker bounds', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 10, 12));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('clamps its initial selection and ignores days after the maximum', async () => {
    const onConfirm = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <DatePicker
          visible
          onClose={jest.fn()}
          onConfirm={onConfirm}
          initialDate={new Date(2010, 0, 1)}
          maximumDate={new Date(2008, 9, 10)}
        />,
      );
    });

    const calendar = renderer!.root.findByProps({ testID: 'calendar' });
    expect(calendar.props.maxDate).toBe('2008-10-10');

    act(() => {
      calendar.props.onDayPress({ dateString: '2008-10-11' });
      renderer!.root
        .findByProps({ testID: 'date-picker-confirm' })
        .props.onPress();
    });

    expect(onConfirm).toHaveBeenCalledWith(new Date(2008, 9, 10));
  });

  it('accepts an in-range day and returns that local calendar date', async () => {
    const onConfirm = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <DatePicker
          visible
          onClose={jest.fn()}
          onConfirm={onConfirm}
          minimumDate={new Date(1990, 0, 1)}
          maximumDate={new Date(2008, 9, 10)}
        />,
      );
    });

    act(() => {
      renderer!.root.findByProps({ testID: 'calendar' }).props.onDayPress({
        dateString: '1994-06-20',
      });
    });
    act(() => {
      renderer!.root
        .findByProps({ testID: 'date-picker-confirm' })
        .props.onPress();
    });

    expect(onConfirm).toHaveBeenCalledWith(new Date(1994, 5, 20));
  });
});
