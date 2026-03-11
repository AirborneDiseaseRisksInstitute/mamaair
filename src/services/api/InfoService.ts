import api from './client';

export const InfoService = {
  getCurrentInfo: async () => {
    const response = await api.get('/info/current/');
    return response.data;
  },
};
