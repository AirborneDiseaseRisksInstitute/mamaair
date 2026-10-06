import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { TodayGreeting } from '../src/components/today/TodayGreeting';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      key === 'today.greeting' ? `Hello, ${options?.name}` : key,
  }),
}));

describe('Today greeting', () => {
  it('greets the user with a normalized name', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<TodayGreeting name="  Mary   A  " />);
    });

    const text = renderer!.root
      .findAllByType(Text)
      .map(node => String(node.props.children));
    expect(text).toContain('Hello, Mary A');
    expect(text).toContain('today.greeting_message');
    act(() => renderer!.unmount());
  });

  it('stays hidden when no usable name is available', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<TodayGreeting name="   " />);
    });

    expect(
      renderer!.root.findAllByProps({ testID: 'today-greeting' }),
    ).toHaveLength(0);
    act(() => renderer!.unmount());
  });
});
