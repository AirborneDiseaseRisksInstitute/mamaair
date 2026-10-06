import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { IntroStep04 } from '../src/screens/intro/steps/IntroStep04';

const mockConfirmIntroLanguage = jest.fn();
let mockProfile = { language: 'en' as string | null };

jest.mock('../src/store/useUserStore', () => ({
  useUserStore: () => ({
    profile: mockProfile,
    confirmIntroLanguage: mockConfirmIntroLanguage,
  }),
}));

jest.mock('../src/hooks/useMetaChoices', () => ({
  useMetaChoices: () => ({
    languages: [
      { value: 'en', label: 'English' },
      { value: 'fr', label: 'Français' },
      { value: 'sw', label: 'Kiswahili' },
    ],
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../src/theme', () => ({
  spacing: () => 8,
  useTheme: () => ({
    mode: 'light',
    surfaceColor: (value: string) => value,
    borderColor: (value: string) => value,
    accentTextColor: (value: string) => value,
    colors: {
      textPrimary: '#111',
      orange500: '#f80',
    },
    typography: {
      fontFamily: { medium: 'Medium' },
    },
  }),
}));

jest.mock('../src/utils/responsive', () => ({
  FIXED_BUTTON_AREA_HEIGHT: 80,
  HEADER_CLEARANCE: 32,
}));

jest.mock('../src/components/ui', () => {
  const ReactModule = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    BackButton: () => null,
    Button: ({ title, onPress, disabled }: any) =>
      ReactModule.createElement(
        Pressable,
        { testID: `button-${title}`, onPress, disabled },
        ReactModule.createElement(Text, null, title),
      ),
    FixedButtonContainer: ({ children }: any) =>
      ReactModule.createElement(View, null, children),
    IntroTitleBox: ({ title }: any) =>
      ReactModule.createElement(Text, null, title),
    OrangeHalo: () => null,
    ProgressBar: () => null,
    RadioOption: ({ label, selected, onPress }: any) =>
      ReactModule.createElement(
        Pressable,
        { testID: `language-${label}`, selected, onPress },
        ReactModule.createElement(Text, null, label),
      ),
  };
});

describe('IntroStep04 language selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfile = { language: 'en' };
  });

  it('preselects the language chosen before intro', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<IntroStep04 />);
    });

    expect(
      renderer!.root.findByProps({ testID: 'language-English' }).props
        .selected,
    ).toBe(true);
    expect(
      renderer!.root.findByProps({ testID: 'language-Français' }).props
        .selected,
    ).toBe(false);
  });

  it('updates the selected option when the profile language changes', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<IntroStep04 />);
    });

    mockProfile = { language: 'fr' };
    await act(async () => {
      renderer!.update(<IntroStep04 />);
    });

    expect(
      renderer!.root.findByProps({ testID: 'language-English' }).props
        .selected,
    ).toBe(false);
    expect(
      renderer!.root.findByProps({ testID: 'language-Français' }).props
        .selected,
    ).toBe(true);
  });

  it('confirms the preselected language when the user continues', async () => {
    const onNext = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<IntroStep04 onNext={onNext} />);
    });

    await act(async () => {
      renderer!.root.findByProps({ testID: 'button-common.continue' }).props
        .onPress();
    });

    expect(mockConfirmIntroLanguage).toHaveBeenCalledWith('en');
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('confirms a different language when the user changes the default', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<IntroStep04 />);
    });

    await act(async () => {
      renderer!.root.findByProps({ testID: 'language-Français' }).props
        .onPress();
    });
    expect(
      renderer!.root.findByProps({ testID: 'language-Français' }).props
        .selected,
    ).toBe(true);

    await act(async () => {
      renderer!.root.findByProps({ testID: 'button-common.continue' }).props
        .onPress();
    });

    expect(mockConfirmIntroLanguage).toHaveBeenCalledWith('fr');
  });
});
