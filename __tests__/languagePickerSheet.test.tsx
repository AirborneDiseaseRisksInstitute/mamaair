import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { LanguagePickerSheet } from '../src/components/ui/LanguagePickerSheet';

jest.mock('../src/components/ui/BottomSheet', () => ({
  BottomSheet: ({ visible, children }: any) => {
    const ReactModule = require('react');
    const { View } = require('react-native');

    return visible ? ReactModule.createElement(View, null, children) : null;
  },
}));

jest.mock('react-native-svg', () => ({
  SvgXml: () => null,
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
      neutral300: '#ddd',
      orange50: '#fff3e8',
      orange500: '#f80',
      textPrimary: '#111',
    },
    typography: {
      fontFamily: { bold: 'Bold', medium: 'Medium' },
    },
  }),
}));

describe('LanguagePickerSheet', () => {
  it('selects a language immediately and closes without a confirm button', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <LanguagePickerSheet
          visible
          selectedLanguage="en"
          onConfirm={onConfirm}
          onClose={onClose}
        />,
      );
    });

    expect(
      renderer!.root.findAll(
        node => node.props.children === 'lang_picker.confirm',
      ),
    ).toHaveLength(0);

    await act(async () => {
      renderer!.root.findByProps({ testID: 'language-picker-fr' }).props.onPress();
    });

    expect(onConfirm).toHaveBeenCalledWith('fr');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
