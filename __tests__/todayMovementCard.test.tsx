import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { TodayMovementCard } from '../src/components/today/TodayMovementCard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en' },
  }),
}));

const baseProps = {
  distanceMeters: null,
  fetchedAt: null,
  loading: false,
  failure: null,
  onRefresh: jest.fn(),
  onEnableTracking: jest.fn(),
};

describe('Today movement card location access', () => {
  beforeEach(() => jest.clearAllMocks());

  it('explains the inactive state and opens the access flow', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <TodayMovementCard {...baseProps} trackingActive={false} />,
      );
    });

    expect(
      renderer!
        .root.findAllByType(Text)
        .filter(node => node.props.children === 'movement.access_needed'),
    ).toHaveLength(1);
    const accessButton = renderer!.root.findByProps({
      testID: 'today-movement-allow-access',
    });
    act(() => accessButton.props.onPress());
    expect(baseProps.onEnableTracking).toHaveBeenCalledTimes(1);
    act(() => renderer!.unmount());
  });

  it('does not show the access action while tracking is active', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <TodayMovementCard {...baseProps} trackingActive />,
      );
    });

    expect(
      renderer!.root.findAllByProps({ testID: 'today-movement-allow-access' }),
    ).toHaveLength(0);
    act(() => renderer!.unmount());
  });
});
