import api from './client';

export const LifestyleService = {
  getLifestyle: async () => {
    const response = await api.get('/lifestyle/');
    return response.data;
  },

  updateLifestyle: async (data: any) => {
    const response = await api.put('/lifestyle/', data);
    return response.data;
  },

  patchLifestyle: async (data: any) => {
    const response = await api.patch('/lifestyle/', data);
    return response.data;
  },
};
