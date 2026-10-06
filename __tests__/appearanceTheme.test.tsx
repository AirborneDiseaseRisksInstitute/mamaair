import React from 'react';
import * as ReactNative from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { createMMKV } from 'react-native-mmkv';
import {
  readAppearancePreference,
  saveAppearancePreference,
} from '../src/theme/appearancePreference';
import { ThemeProvider, useAppearancePreference, useTheme } from '../src/theme';

describe('appearance theme', () => {
  let colorSchemeSpy: jest.SpyInstance;

  beforeAll(() => {
    colorSchemeSpy = jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
  });

  beforeEach(() => {
    createMMKV().clearAll();
    colorSchemeSpy.mockReturnValue('dark');
    jest.clearAllMocks();
  });

  afterAll(() => {
    colorSchemeSpy.mockRestore();
  });

  it('defaults to the device setting and persists explicit preferences', () => {
    expect(readAppearancePreference()).toBe('system');
    saveAppearancePreference('light');
    expect(readAppearancePreference()).toBe('light');
    saveAppearancePreference('dark');
    expect(readAppearancePreference()).toBe('dark');
  });

  it('follows the device and allows a saved light override', () => {
    let currentMode = '';
    let currentPreference = '';
    let selectPreference: (value: 'system' | 'light' | 'dark') => void = () => {};
    const Probe = () => {
      currentMode = useTheme().mode;
      const appearance = useAppearancePreference();
      currentPreference = appearance.preference;
      selectPreference = appearance.setPreference;
      return null;
    };

    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(<ThemeProvider><Probe /></ThemeProvider>);
    });
    expect(currentMode).toBe('dark');
    expect(currentPreference).toBe('system');

    act(() => selectPreference('light'));
    expect(currentMode).toBe('light');
    expect(readAppearancePreference()).toBe('light');

    act(() => selectPreference('system'));
    expect(currentMode).toBe('dark');

    colorSchemeSpy.mockReturnValue('light');
    act(() => tree!.update(<ThemeProvider><Probe /></ThemeProvider>));
    expect(currentMode).toBe('light');

    act(() => selectPreference('dark'));
    expect(currentMode).toBe('dark');
    expect(readAppearancePreference()).toBe('dark');

    act(() => tree!.unmount());
  });
});
