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
  water_unit?: string;
  mood_ids: number[];
  feeling_ids: number[];
}

export const WellbeingService = {
  getCatalog: async (): Promise<WellbeingCatalog> => {
    const response = await api.get('/wellbeing/');
    const data = response.data;
    return {
      water_goal_ml: data.water_goal?.value,
      moods: (data.moods || []).map((m: any) => ({ id: m.id, name: m.title, emoji: m.emoji })),
      feelings: (data.feelings || []).map((f: any) => ({ id: f.id, name: f.title, emoji: f.emoji })),
    };
  },

  getLog: async (date: string): Promise<WellbeingLog | null> => {
    try {
      const response = await api.get('/wellbeing/log/', { params: { date } });
      const data = response.data;
      return {
        date: data.date,
        water_amount: data.water_amount ?? 0,
        mood_ids: (data.moods || []).map((m: any) => (typeof m === 'number' ? m : m.id)),
        feeling_ids: (data.feelings || []).map((f: any) => (typeof f === 'number' ? f : f.id)),
      };
    } catch {
      return null;
    }
  },

  saveLog: async (data: WellbeingLog): Promise<void> => {
    await api.post('/wellbeing/log/', { ...data, water_unit: 'ml' });
  },
};
