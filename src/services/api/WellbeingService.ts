import api from './client';

export interface WellbeingItem {
  id: number;
  kind: 'mood' | 'feeling';
  code: string;
  title: string;
  emoji?: string;
  sort_order: number;
  number_value: number | null;
  unit: string;
  is_active: boolean;
}

export interface WellbeingCatalog {
  water_goal: { value: number; unit: string };
  moods: WellbeingItem[];
  feelings: WellbeingItem[];
}

export interface WellbeingLogRequest {
  date: string;
  water_amount: number;
  water_unit: string;
  mood_ids?: number[];
  feeling_ids?: number[];
}

export interface WellbeingLogDay {
  date: string;
  water_amount: number;
  water_unit: string;
  moods: WellbeingItem[];
  feelings: WellbeingItem[];
}

export interface WellbeingLogResponse extends WellbeingLogDay {}

export interface WellbeingLogRangeResponse {
  start_date: string;
  end_date: string;
  days_requested: number;
  items: WellbeingLogDay[];
}

export const WellbeingService = {
  getCatalog: async (): Promise<WellbeingCatalog> => {
    const response = await api.get('/wellbeing/');
    return response.data;
  },

  getLog: async (date: string): Promise<WellbeingLogResponse> => {
    const response = await api.get('/wellbeing/log/', { params: { date } });
    return response.data;
  },

  // No params → backend returns current week (Mon → today).
  // Backend returns 400 if pregnancy_start_date is not set on profile —
  // we treat that as "no data" so screens degrade gracefully instead of throwing.
  getLogRange: async (startDate?: string, endDate?: string): Promise<WellbeingLogRangeResponse> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    try {
      const response = await api.get('/wellbeing/log/', { params });
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 400) {
        return {
          start_date: startDate || '',
          end_date: endDate || '',
          days_requested: 0,
          items: [],
        };
      }
      throw err;
    }
  },

  logWellbeing: async (data: WellbeingLogRequest): Promise<WellbeingLogResponse> => {
    const response = await api.post('/wellbeing/log/', data);
    return response.data;
  },
};
