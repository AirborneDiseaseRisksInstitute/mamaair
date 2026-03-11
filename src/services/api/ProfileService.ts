import api from './client';

export const ProfileService = {
  getProfile: async () => {
    const response = await api.get('/profile/');
    return response.data;
  },

  updateProfile: async (data: any) => {
    console.log('updateProfile data', data);
    const response = await api.put('/profile/', data);
    console.log('updateProfile response', response.data);
    return response.data;
  },

  patchProfile: async (data: any) => {
    console.log('patchProfile data', data);
    const response = await api.patch('/profile/', data);
    console.log('patchProfile response', response.data);
    return response.data;
  },
};
