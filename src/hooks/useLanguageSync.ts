import { useEffect } from 'react';
import i18n, { isSupportedLanguage } from '../i18n';
import { storage } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';

export function useLanguageSync() {
  const language = useUserStore(state => state.profile.language);

  useEffect(() => {
    const lang = language && isSupportedLanguage(language) ? language : 'en';
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    if (storage.getString('user_language') !== lang) {
      storage.set('user_language', lang);
    }
  }, [language]);
}
