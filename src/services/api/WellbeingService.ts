import api from './client';

export interface WellbeingCatalogItem {
  id: number;
  name: string;
  emoji?: string;
}

export interface WellbeingCatalog {
  water_goal_ml?: number;
  moods: WellbeingCatalogItem[];
  feelings: WellbeingCatalogItem[];
}

export interface WellbeingLog {
  date: string;
  water_amount: number;
  mood_ids: number[];
  feeling_ids: number[];
}

export const WellbeingService = {
  getCatalog: async (): Promise<WellbeingCatalog> => {
    const response = await api.get('/wellbeing/');
    return response.data;
  },

  getLog: async (date: string): Promise<WellbeingLog | null> => {
    try {
      const response = await api.get('/wellbeing/log/', { params: { date } });
      return response.data;
    } catch {
      return null;
    }
  },

  saveLog: async (data: WellbeingLog): Promise<void> => {
    await api.post('/wellbeing/log/', data);
  },
};
