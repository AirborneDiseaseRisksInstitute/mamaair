import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../store/useAuthStore';

import en from './locales/en.json';
import fr from './locales/fr.json';
import sw from './locales/sw.json';

const savedLanguage = storage.getString('user_language') || 'en';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: { en: { translation: en }, fr: { translation: fr }, sw: { translation: sw } },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
