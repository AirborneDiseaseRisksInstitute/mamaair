import api from './client';

export const AdviceService = {
  getAdvice: async () => {
    const response = await api.get('/advice/');
    return response.data;
  },
};
