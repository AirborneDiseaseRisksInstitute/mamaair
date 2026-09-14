import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../store/useAuthStore';

import en from './locales/en.json';
import fr from './locales/fr.json';
import sw from './locales/sw.json';

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'sw'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const isSupportedLanguage = (language: string): language is SupportedLanguage =>
  SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);

const storedLanguage = storage.getString('user_language');
const savedLanguage = storedLanguage && isSupportedLanguage(storedLanguage)
  ? storedLanguage
  : 'en';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: { en: { translation: en }, fr: { translation: fr }, sw: { translation: sw } },
  supportedLngs: [...SUPPORTED_LANGUAGES],
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
