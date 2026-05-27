import api from './client';

export interface MommySymptomStatisticItem {
  symptom_name: string;
  symptom_id: number;
  quantity: number;
  risk_name: string;
  risk_id: number;
}

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

  getMommyStatistics: async (
    params: { date?: string; start_date?: string; end_date?: string } = {},
  ): Promise<MommySymptomStatisticItem[]> => {
    const response = await api.get('/symptoms/mommy/statistics/', { params });
    const raw = response.data;
    const flat =
      Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])
        ? raw.flat()
        : Array.isArray(raw)
        ? raw
        : [];
    return flat as MommySymptomStatisticItem[];
  },
};
