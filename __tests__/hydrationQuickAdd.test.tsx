import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { HydrationQuickAdd } from '../src/components/recommendations/HydrationQuickAdd';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { amount?: number; count?: number }) => {
      const value = values?.amount ?? values?.count;
      return value === undefined ? key : `${key} ${value}`;
    },
  }),
}));

const TestPicker = ({ currentTotalMl = 0, goalMl = 2000 }) => {
  const [selectedIncrementMl, setSelectedIncrementMl] = useState(0);
  return (
    <HydrationQuickAdd
      currentTotalMl={currentTotalMl}
      goalMl={goalMl}
      selectedIncrementMl={selectedIncrementMl}
      onSelect={setSelectedIncrementMl}
    />
  );
};

describe('HydrationQuickAdd', () => {
  it('adds and removes one 250 ml glass at a time', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<TestPicker />);
    });

    const progress = () =>
      renderer!.root.findByProps({
        accessibilityRole: 'progressbar',
      });
    const press = (testID: string) => {
      act(() => {
        renderer!.root.findByProps({ testID }).props.onPress();
      });
    };

    const decrease = renderer!.root.findByProps({
      testID: 'hydration-decrease',
    });
    expect(decrease.props.disabled).toBe(true);

    press('hydration-increase');
    press('hydration-increase');
    press('hydration-increase');
    expect(progress().props.accessibilityValue).toMatchObject({
      max: 2000,
      now: 750,
    });
    expect(
      renderer!.root.findByProps({ testID: 'hydration-selected-amount' }).props
        .children,
    ).toEqual([750, ' ml']);
    expect(
      renderer!.root.findByProps({ testID: 'hydration-glass-count' }).props
        .children,
    ).toBe('feeling_checkin.water_glass_count 3');

    press('hydration-decrease');
    expect(progress().props.accessibilityValue.now).toBe(500);
    expect(
      renderer!.root.findByProps({ testID: 'hydration-glass-count' }).props
        .children,
    ).toBe('feeling_checkin.water_glass_count 2');
  });

  it('uses the API goal as the maximum number of selectable glasses', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<TestPicker />);
    });

    const increase = () =>
      renderer!.root.findByProps({
        testID: 'hydration-increase',
      });

    for (let count = 0; count < 8; count += 1) {
      act(() => increase().props.onPress());
    }

    expect(increase().props.disabled).toBe(true);
    expect(
      renderer!.root.findByProps({ testID: 'hydration-selected-amount' }).props
        .children,
    ).toEqual([2000, ' ml']);
  });

  it('keeps the visible progress at 100% when the total exceeds the goal', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<TestPicker currentTotalMl={1900} />);
    });

    act(() => {
      renderer!.root
        .findByProps({
          testID: 'hydration-increase',
        })
        .props.onPress();
    });

    const progress = renderer!.root.findByProps({
      accessibilityRole: 'progressbar',
    });
    expect(progress.props.accessibilityValue.now).toBe(2000);
    expect(
      progress
        .findAllByType(View)
        .some(node => StyleSheet.flatten(node.props.style).width === '100%'),
    ).toBe(true);
  });
});
