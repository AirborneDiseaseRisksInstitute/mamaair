import React from 'react';
import { BackHandler } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { AirQualityPulseToast } from '../src/components/home/AirQualityPulseToast';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('react-native-linear-gradient', () => {
  const ReactNative = require('react-native');

  return ReactNative.View;
});

jest.mock('react-native-reanimated', () => {
  const ReactNative = require('react-native');

  return {
    __esModule: true,
    default: { View: ReactNative.View },
    cancelAnimation: jest.fn(),
    Easing: {
      cubic: (value: number) => value,
      in: (easing: (value: number) => number) => easing,
    },
    interpolate: (
      value: number,
      inputRange: number[],
      outputRange: number[],
    ) => (value <= inputRange[0] ? outputRange[0] : outputRange.at(-1)),
    useAnimatedStyle: (factory: () => object) => factory(),
    useSharedValue: (value: number) => ({ value }),
    withDelay: (_delay: number, value: number) => value,
    withSpring: (value: number) => value,
    withTiming: (value: number) => value,
  };
});

describe('AirQualityPulseToast dismissal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('dismisses through the animated path when the backdrop is pressed', () => {
    const onDismiss = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <AirQualityPulseToast animate onDismiss={onDismiss} />,
      );
    });

    const backdrop = renderer!.root.findByProps({
      testID: 'air-quality-pulse-backdrop',
    });

    act(() => {
      backdrop!.props.onPress();
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(289);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('consumes Android back and dismisses through the animated path', () => {
    const onDismiss = jest.fn();
    const addEventListener = jest.spyOn(BackHandler, 'addEventListener');

    act(() => {
      TestRenderer.create(
        <AirQualityPulseToast animate onDismiss={onDismiss} />,
      );
    });

    const backHandler = addEventListener.mock.calls.find(
      ([eventName]) => eventName === 'hardwareBackPress',
    )?.[1];

    act(() => {
      expect(backHandler?.()).toBe(true);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(290);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
