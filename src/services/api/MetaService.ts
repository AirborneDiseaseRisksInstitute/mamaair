import api from './client';

export const MetaService = {
  getChoices: async () => {
    const response = await api.get('/meta/choices/');
    return response.data;
  },
};
