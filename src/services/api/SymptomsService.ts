import api from './client';

export const SymptomsService = {
  getBabyChecklist: async () => {
    const response = await api.get('/symptoms/baby/checklist/');
    return response.data;
  },

  getBabySelection: async (date?: string, recorded_at?: string) => {
    const response = await api.get('/symptoms/baby/selection/', { 
      params: { date, recorded_at } 
    });
    return response.data;
  },

  saveBabySelection: async (data: any) => {
    const response = await api.post('/symptoms/baby/selection/', data);
    return response.data;
  },

  getMommyChecklist: async () => {
    const response = await api.get('/symptoms/mommy/checklist/');
    return response.data;
  },

  getMommySelection: async (date?: string, recorded_at?: string) => {
    const response = await api.get('/symptoms/mommy/selection/', { 
      params: { date, recorded_at } 
    });
    return response.data;
  },

  saveMommySelection: async (data: any) => {
    const response = await api.post('/symptoms/mommy/selection/', data);
    return response.data;
  },

  getMommyStatistics: async (params: { date?: string; start_date?: string; end_date?: string }) => {
    const response = await api.get('/symptoms/mommy/statistics/', { params });
    return response.data;
  },

  getMommyStatisticsClasses: async (params: { date?: string; start_date?: string; end_date?: string }) => {
    const response = await api.get('/symptoms/mommy/statistics/classes/', { params });
    return response.data;
  },

  getBabyStatisticsClasses: async (params: { date?: string; start_date?: string; end_date?: string }) => {
    const response = await api.get('/symptoms/baby/statistics/classes/', { params });
    return response.data;
  },
};
