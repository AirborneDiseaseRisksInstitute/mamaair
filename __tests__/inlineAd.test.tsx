import React from 'react';
import { Image, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { InlineAd } from '../src/components/ads/InlineAd';

const mockDismissals = new Map<string, boolean>();

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getBoolean: (key: string) => mockDismissals.get(key),
    set: (key: string, value: boolean) => mockDismissals.set(key, value),
  }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('InlineAd', () => {
  beforeEach(() => mockDismissals.clear());

  it('is labelled and dismissible for the day and account', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <InlineAd date="2026-09-18" identity={{ backendUserId: 1 }} />,
      );
    });
    expect(renderer!.root.findAllByType(Text).some(node => node.props.children === 'ads.label')).toBe(true);
    expect(renderer!.root.findAllByType(Image)).toHaveLength(1);

    act(() => {
      renderer!.root.findByProps({ accessibilityLabel: 'ads.dismiss' }).props.onPress();
    });
    expect(renderer!.root.findAllByType(Image)).toHaveLength(0);

    act(() => {
      renderer!.unmount();
      renderer = TestRenderer.create(
        <InlineAd date="2026-09-18" identity={{ backendUserId: 1 }} />,
      );
    });
    expect(renderer!.root.findAllByType(Image)).toHaveLength(0);

    act(() => {
      renderer!.update(
        <InlineAd key="next-day" date="2026-09-19" identity={{ backendUserId: 1 }} />,
      );
    });
    expect(renderer!.root.findAllByType(Image)).toHaveLength(1);
  });
});
