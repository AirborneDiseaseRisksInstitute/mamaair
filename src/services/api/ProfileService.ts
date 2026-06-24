import api from './client';

export const ProfileService = {
  getProfile: async () => {
    const response = await api.get('/profile/');
    return response.data;
  },

  patchProfile: async (data: any) => {
    const response = await api.patch('/profile/', data);
    return response.data;
  },
};
