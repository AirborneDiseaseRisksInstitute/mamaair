import api from './client';

export const LanguageService = {
  setLanguage: async (language: string) => {
    const response = await api.post('/set-language/', { language });
    return response.data;
  },
};
