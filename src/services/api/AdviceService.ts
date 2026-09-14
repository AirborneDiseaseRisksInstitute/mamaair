import api from './client';
import type { SummaryRecommendation } from './SummaryService';

export interface AdviceResponse {
  id: number;
  recommendations: SummaryRecommendation[];
  created_at?: string;
  source?: string;
  trigger_event?: string;
  engine_version?: string;
}

export const AdviceService = {
  getAdvice: async (): Promise<AdviceResponse | null> => {
    const response = await api.get('/advice/');
    return response.data ?? null;
  },
};
