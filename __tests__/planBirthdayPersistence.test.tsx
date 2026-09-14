import React from 'react';
import { Text, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { PlanBirthdayScreen } from '../src/screens/PlanBirthdayScreen';
import { useUserStore } from '../src/store/useUserStore';

jest.mock('../src/store/useUserStore', () => ({
  useUserStore: jest.fn(),
}));

jest.mock('../src/components/ui', () => {
  const ReactModule = require('react');
  const { Text: NativeText, View: NativeView } = require('react-native');

  return {
    BackButton: () => null,
    Button: ({ title, onPress }: { title: string; onPress: () => void }) =>
      ReactModule.createElement(NativeText, { onPress }, title),
    FixedButtonContainer: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement(NativeView, null, children),
  };
});

jest.mock('react-native-calendars', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');

  return {
    Calendar: () =>
      ReactModule.createElement(NativeView, { testID: 'birthday-calendar' }),
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

const mockedUseUserStore = useUserStore as unknown as jest.Mock;

const renderScreen = (expectedDueDate: string | null) => {
  mockedUseUserStore.mockReturnValue({
    profile: {
      expectedDueDate,
      pregnancyWeek: 20,
      pregnancyWeekSetDate: '2026-09-12',
    },
    setExpectedDueDate: jest.fn(),
  });

  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<PlanBirthdayScreen />);
  });
  return renderer!;
};

describe('PlanBirthdayScreen local persistence', () => {
  it('shows the calendar before a due date has been saved', () => {
    const renderer = renderScreen(null);

    expect(
      renderer.root.findAll(
        node => node.type === View && node.props.testID === 'birthday-calendar',
      ),
    ).toHaveLength(1);
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node =>
          node.props.children?.includes?.('date_picker.confirm_birth_date'),
        ),
    ).toBe(true);
  });

  it('reopens on the confirmed card when a local due date exists', () => {
    const renderer = renderScreen('2027-01-24');

    expect(
      renderer.root.findAll(
        node => node.type === View && node.props.testID === 'birthday-calendar',
      ),
    ).toHaveLength(0);
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node =>
          node.props.children?.includes?.('date_picker.selected_date'),
        ),
    ).toBe(true);
  });
});
