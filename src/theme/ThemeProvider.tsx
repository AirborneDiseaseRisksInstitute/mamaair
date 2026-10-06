import React, { createContext, useContext, ReactNode, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, theme, Theme } from './tokens';
import {
  AppearancePreference,
  readAppearancePreference,
  saveAppearancePreference,
} from './appearancePreference';

const ThemeContext = createContext<Theme>(theme);
const AppearanceContext = createContext<{
  preference: AppearancePreference;
  setPreference: (value: AppearancePreference) => void;
}>({ preference: 'system', setPreference: () => {} });

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState(readAppearancePreference);
  const mode = preference === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : preference;
  const appearanceValue = useMemo(() => ({
    preference,
    setPreference: (value: AppearancePreference) => {
      saveAppearancePreference(value);
      setPreference(value);
    },
  }), [preference]);

  return (
    <AppearanceContext.Provider value={appearanceValue}>
      <ThemeContext.Provider value={mode === 'dark' ? darkTheme : theme}>
        {children}
      </ThemeContext.Provider>
    </AppearanceContext.Provider>
  );
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    return theme;
  }
  return context;
};

export const useAppearancePreference = () => useContext(AppearanceContext);



