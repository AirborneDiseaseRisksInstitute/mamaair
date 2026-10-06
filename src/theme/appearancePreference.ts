import { createMMKV } from 'react-native-mmkv';

export type AppearancePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'appearance_preference';
let appearanceStorage: ReturnType<typeof createMMKV> | undefined;

const getStorage = () => {
  if (!appearanceStorage) appearanceStorage = createMMKV();
  return appearanceStorage;
};

export const readAppearancePreference = (): AppearancePreference => {
  try {
    const value = getStorage().getString(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
};

export const saveAppearancePreference = (value: AppearancePreference): void => {
  getStorage().set(STORAGE_KEY, value);
};
