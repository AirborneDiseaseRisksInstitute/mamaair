import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SymptomsHistoryScreen } from '../src/screens/SymptomsHistoryScreen';
import type { SymptomHistoryDay } from '../src/services/recommendationExperience/SymptomHistoryRepository';

const mockLoadSymptomHistoryDay = jest.fn();

jest.mock(
  '../src/services/recommendationExperience/SymptomHistoryRepository',
  () => ({
    loadSymptomHistoryDay: (...args: unknown[]) =>
      mockLoadSymptomHistoryDay(...args),
  }),
);

jest.mock('../src/store/useUserStore', () => ({
  useUserStore: (selector: (state: object) => unknown) =>
    selector({ profile: { backendUserId: 7, email: 'mary@example.com' } }),
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      ReactModule.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { amount?: number; defaultValue?: string }) =>
      key === 'symptoms.water_amount'
        ? `water:${options?.amount}`
        : options?.defaultValue ?? key,
    i18n: { resolvedLanguage: 'en' },
  }),
}));

jest.mock('../src/theme', () => ({
  spacing: () => 8,
  radius: () => 12,
  useTheme: () => ({
    mode: 'light',
    surfaceColor: (value: string) => value,
    borderColor: (value: string) => value,
    accentTextColor: (value: string) => value,
    colors: {
      neutral100: '#fafafa',
      neutral200: '#eee',
      neutral300: '#ddd',
      orange50: '#fff8f0',
      orange500: '#f80',
      textPrimary: '#111',
      textSecondary: '#666',
    },
    typography: {
      fontFamily: {
        regular: 'Regular',
        medium: 'Medium',
        bold: 'Bold',
        extraBold: 'ExtraBold',
      },
    },
  }),
}));

const historyDay: SymptomHistoryDay = {
  date: '2026-09-28',
  moods: [
    {
      key: 'api:mood:1',
      kind: 'mood',
      group: 'wellbeing',
      name: 'Calm',
      source: 'api',
    },
  ],
  feelings: [
    {
      key: 'fallback:feeling:poor-sleep',
      kind: 'wellbeingFeeling',
      group: 'wellbeing',
      name: 'Poor sleep',
      source: 'localFallback',
    },
  ],
  physical: [
    {
      key: 'api:mommy:1',
      kind: 'mommySymptom',
      group: 'physical',
      name: 'Headache',
      source: 'api',
    },
  ],
  warning: [
    {
      key: 'api:mommy:2',
      kind: 'mommySymptom',
      group: 'warning',
      name: 'Vaginal bleeding',
      source: 'api',
    },
  ],
  waterTotalMl: 1250,
  classes: [],
  recordState: 'recorded',
  mommyStatus: 'available',
  babyStatus: 'available',
};

describe('SymptomsHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadSymptomHistoryDay.mockResolvedValue(historyDay);
  });

  it('shows the saved check-in details even when no grouped classes exist', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SymptomsHistoryScreen />);
    });

    const labels = renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children);

    expect(labels).toContain('Calm');
    expect(labels).toContain('Poor sleep');
    expect(labels).toContain('water:1250');
    expect(labels).toContain('Headache');
    expect(labels).toContain('Vaginal bleeding');
    expect(labels).not.toContain('symptoms.none_reported');
  });
});
