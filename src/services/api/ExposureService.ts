import api from './client';

export const ExposureService = {
  getAirExposure: async () => {
    const response = await api.get('/air-exposure/');
    return response.data;
  },

  getExposurePerWeeks: async () => {
    const response = await api.get('/exposure-per-weeks/');
    return response.data;
  },

  getExposureHistory: async (days: number = 7) => {
    const response = await api.get('/exposure/history/', { params: { days } });
    return response.data;
  },
};
