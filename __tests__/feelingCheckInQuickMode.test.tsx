import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { FeelingCheckInScreen } from '../src/screens/FeelingCheckInScreen';
import { FeelingCheckInForm } from '../src/components/recommendations/FeelingCheckInForm';
import type { FeelingCheckInExperience } from '../src/types/recommendationExperience';

const mockLoadFeelingCheckInExperience = jest.fn();
const mockSubmitFeelingCheckIn = jest.fn();
const mockShowToast = jest.fn();

jest.mock(
  '../src/services/recommendationExperience/FeelingCheckInRepository',
  () => ({
    loadFeelingCheckInExperience: (...args: unknown[]) =>
      mockLoadFeelingCheckInExperience(...args),
    submitFeelingCheckIn: (...args: unknown[]) =>
      mockSubmitFeelingCheckIn(...args),
  }),
);

jest.mock('../src/services/recommendationExperience/ProductAnalytics', () => ({
  ProductAnalytics: { track: jest.fn() },
}));

jest.mock('../src/store/useUserStore', () => ({
  useUserStore: (selector: (state: object) => unknown) =>
    selector({ profile: { backendUserId: 7, email: 'mary@example.com' } }),
}));

jest.mock('../src/hooks/useCurrentLocalDate', () => ({
  useCurrentLocalDate: () => '2026-09-28',
}));

jest.mock('../src/components/ui', () => {
  const ReactModule = require('react');
  const { Pressable, Text: NativeText, View } = require('react-native');
  return {
    Button: ({ title, onPress, disabled }: any) =>
      ReactModule.createElement(
        Pressable,
        { testID: 'save-check-in', onPress, disabled },
        ReactModule.createElement(NativeText, null, title),
      ),
    FixedButtonContainer: ({ children }: any) =>
      ReactModule.createElement(View, null, children),
    useToast: () => ({ showToast: mockShowToast }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      ReactModule.createElement(View, props, children),
  };
});

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
      neutral50: '#fffaf7',
      neutral200: '#eee',
      neutral300: '#ddd',
      orange100: '#fff0e5',
      orange500: '#f80',
      orange600: '#d60',
      orange700: '#a40',
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

const experience: FeelingCheckInExperience = {
  mommySymptoms: [
    {
      key: 'headache',
      name: 'Headache',
      kind: 'mommySymptom',
      group: 'physical',
      source: 'api',
    },
    {
      key: 'bleeding',
      name: 'Vaginal bleeding',
      kind: 'mommySymptom',
      group: 'warning',
      source: 'api',
    },
  ],
  moods: [
    {
      key: 'calm',
      name: 'Calm',
      kind: 'mood',
      group: 'wellbeing',
      source: 'api',
    },
  ],
  feelings: [
    {
      key: 'tired',
      name: 'Tired',
      kind: 'wellbeingFeeling',
      group: 'wellbeing',
      source: 'api',
    },
  ],
  selection: {
    mommySymptomKeys: [],
    moodKeys: [],
    feelingKeys: [],
    waterIncrementMl: 0,
  },
  waterDailyTotalMl: 500,
  waterGoalMl: 2000,
  recordState: 'recorded',
  capabilities: {
    mommySymptoms: { configuredStatus: 'available', status: 'available' },
    mommySymptomsSelection: {
      configuredStatus: 'available',
      status: 'available',
    },
    wellbeing: { configuredStatus: 'available', status: 'available' },
    wellbeingLog: { configuredStatus: 'available', status: 'available' },
    dailyCheckIn: { configuredStatus: 'available', status: 'available' },
    unifiedFeelingSupplement: {
      configuredStatus: 'notImplemented',
      status: 'notImplemented',
    },
  },
};

describe('FeelingCheckInScreen quick mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadFeelingCheckInExperience.mockResolvedValue(experience);
    mockSubmitFeelingCheckIn.mockResolvedValue({
      symptomsPendingSync: false,
    });
  });

  it('opens only mood initially and makes every other section accessible', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <FeelingCheckInScreen
          source="app"
          mode="quick"
          onComplete={jest.fn()}
          onSkip={jest.fn()}
        />,
      );
    });

    expect(renderer!.root.findAllByType(FeelingCheckInForm)).toHaveLength(1);
    expect(
      renderer!.root.findByType(FeelingCheckInForm).props.wellbeingSection,
    ).toBe('mood');
    for (const section of ['feelings', 'water', 'physical', 'warning']) {
      await act(async () => {
        renderer!.root
          .findByProps({ testID: `quick-checkin-toggle-${section}` })
          .props.onPress();
      });
      expect(
        renderer!.root.findByProps({
          testID: `quick-checkin-toggle-${section}`,
        }).props.accessibilityState.expanded,
      ).toBe(true);
      if (section === 'water') {
        expect(
          renderer!.root.findByProps({ testID: 'hydration-increase' }),
        ).toBeTruthy();
        expect(renderer!.root.findAllByType(FeelingCheckInForm)).toHaveLength(
          0,
        );
      } else {
        expect(renderer!.root.findAllByType(FeelingCheckInForm)).toHaveLength(
          1,
        );
      }
    }
    act(() => renderer!.unmount());
  });

  it('saves the complete check-in instead of symptoms only', async () => {
    const onComplete = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <FeelingCheckInScreen
          source="today"
          mode="quick"
          onComplete={onComplete}
          onSkip={jest.fn()}
        />,
      );
    });

    await act(async () => {
      renderer!.root.findByProps({ testID: 'save-check-in' }).props.onPress();
    });

    expect(mockSubmitFeelingCheckIn).toHaveBeenCalledWith(
      { backendUserId: 7, email: 'mary@example.com' },
      '2026-09-28',
      experience,
      experience.selection,
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => renderer!.unmount());
  });

  it('preserves choices and water across sections, and clears only the current symptom group', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <FeelingCheckInScreen
          source="app"
          mode="quick"
          onComplete={jest.fn()}
          onSkip={jest.fn()}
        />,
      );
    });
    const press = async (props: object) => {
      await act(async () => {
        renderer!.root.findByProps(props).props.onPress();
      });
    };
    await press({ accessibilityLabel: 'Calm', accessibilityRole: 'checkbox' });
    await press({ testID: 'quick-checkin-toggle-feelings' });
    await press({ accessibilityLabel: 'Tired', accessibilityRole: 'checkbox' });
    await press({ testID: 'quick-checkin-toggle-water' });
    await press({ testID: 'hydration-increase' });
    await press({ testID: 'quick-checkin-toggle-physical' });
    await press({
      accessibilityLabel: 'Headache',
      accessibilityRole: 'checkbox',
    });
    await press({ testID: 'quick-checkin-toggle-warning' });
    await press({
      accessibilityLabel: 'Vaginal bleeding',
      accessibilityRole: 'checkbox',
    });
    await press({
      accessibilityLabel: 'feeling_checkin.none_of_these',
      accessibilityRole: 'checkbox',
    });
    await press({ testID: 'quick-checkin-toggle-mood' });
    expect(
      renderer!.root.findByProps({
        accessibilityLabel: 'Calm',
        accessibilityRole: 'checkbox',
      }).props.accessibilityState.checked,
    ).toBe(true);
    await press({ testID: 'save-check-in' });
    expect(mockSubmitFeelingCheckIn).toHaveBeenCalledWith(
      expect.any(Object),
      '2026-09-28',
      experience,
      {
        moodKeys: ['calm'],
        feelingKeys: ['tired'],
        mommySymptomKeys: ['headache'],
        waterIncrementMl: 250,
      },
    );
    act(() => renderer!.unmount());
  });

  it('keeps the introductory check-in on the original guided flow', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <FeelingCheckInScreen
          source="intro"
          mode="full"
          onComplete={jest.fn()}
          onSkip={jest.fn()}
        />,
      );
    });
    expect(renderer!.root.findByType(FeelingCheckInForm).props.step).toBe(
      'wellbeing',
    );
    expect(
      renderer!.root.findAllByType(Text).map(node => node.props.children),
    ).toContain('common.continue');
    expect(
      renderer!.root.findAllByProps({ testID: 'quick-checkin-toggle-mood' }),
    ).toHaveLength(0);
    await act(async () => {
      renderer!.root.findByProps({ testID: 'save-check-in' }).props.onPress();
    });
    expect(renderer!.root.findByType(FeelingCheckInForm).props.step).toBe(
      'physical',
    );
    expect(mockSubmitFeelingCheckIn).not.toHaveBeenCalled();
    act(() => renderer!.unmount());
  });
});
