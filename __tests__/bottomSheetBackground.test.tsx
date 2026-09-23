import React from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { BottomSheet } from '../src/components/ui/BottomSheet';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 24, left: 0 }),
}));

describe('BottomSheet background', () => {
  it('renders content on an opaque surface', () => {
    const timingSpy = jest
      .spyOn(Animated, 'timing')
      .mockImplementation(((value: Animated.Value, config: { toValue: number }) => ({
        start: (callback?: (result: { finished: boolean }) => void) => {
          value.setValue(config.toValue);
          callback?.({ finished: true });
        },
        stop: jest.fn(),
        reset: jest.fn(),
      })) as typeof Animated.timing);
    const sequenceSpy = jest
      .spyOn(Animated, 'sequence')
      .mockImplementation(((animations: Animated.CompositeAnimation[]) => ({
        start: (callback?: (result: { finished: boolean }) => void) => {
          animations.forEach(animation => animation.start());
          callback?.({ finished: true });
        },
        stop: jest.fn(),
        reset: jest.fn(),
      })) as typeof Animated.sequence);

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <BottomSheet visible onClose={jest.fn()}>
          <Text>Sheet content</Text>
        </BottomSheet>,
      );
    });

    const surface = tree!.root.findByProps({
      testID: 'bottom-sheet-surface',
    });
    const style = StyleSheet.flatten(surface.props.style);

    expect(style.backgroundColor).toBeTruthy();
    expect(style.backgroundColor).not.toBe('transparent');

    act(() => tree!.unmount());
    timingSpy.mockRestore();
    sequenceSpy.mockRestore();
  });
});
