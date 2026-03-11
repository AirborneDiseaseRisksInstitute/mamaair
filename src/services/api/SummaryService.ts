import api from './client';

export interface SummaryResponse {
  aq_weather_uv?: any;
  mom_exposure?: {
    id?: number;
    exposure_level?: number;
    risks?: Record<string, any>;
  };
  baby_exposure?: {
    id?: number;
    exposure_level?: number;
    risks?: Record<string, any>;
  };
  recommendations?: any[];
  today_journey?: {
    distance_m?: number;
    distance_km?: number;
  };
  risks_delta?: {
    mom?: number;
    baby?: number;
  };
  week_info?: {
    week?: number;
    text?: string;
  };
  exposure_history?: any;
  pollutant_compliance?: any;
  snapshot_id?: number;
}

export const SummaryService = {
  getSummary: async (): Promise<SummaryResponse> => {
    const response = await api.get('/summary/');
    return response.data;
  },
};

