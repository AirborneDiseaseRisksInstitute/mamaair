import api from './client';

export interface SummaryRecommendation {
  id: string;
  rule_id: string;
  version: number;
  severity: string;
  category: string;
  priority: number;
  title: string;
  alert: string;
  recommendation_diet: string;
  recommendation_activity: string;
  recommendation_behavior: string;
  ttl_hours: number;
  expires_at: string;
  sources: string[];
  engine_version: string;
  message: string;
}

export interface SummaryResponse {
  aq_weather_uv?: any;
  mom_exposure?: {
    id?: number;
    exposure_level?: number;
    risks?: string;
  };
  baby_exposure?: {
    id?: number;
    exposure_level?: number;
    risks?: string;
  };
  recommendations?: SummaryRecommendation[];
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
  daily_exposure_level?: string;
  daily_checkins?: string[];
  water?: string;
  task_completions?: Array<{
    date: string;
    tasks: string[];
  }>;
  exposure_history?: {
    start_date: string;
    end_date: string;
    days_requested: number;
    items: Array<{ date: string; integrated_score: number }>;
  };
  pollutant_compliance?: any;
  snapshot_id?: number;
  snapshot_created_at?: string;
}

export const SummaryService = {
  getSummary: async (): Promise<SummaryResponse> => {
    const response = await api.get('/summary/');
    return response.data;
  },
};

