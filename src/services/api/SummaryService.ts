import api from './client';

export interface SummaryRecommendation {
  id: string;
  rule_id: string;
  version: number;
  severity: string;
  category: string;
  priority: number;
  title: string;
  alert?: string;
  recommendation_diet?: string;
  recommendation_activity?: string;
  recommendation_behavior?: string;
  recommendation_mental?: string;
  ttl_hours: number;
  expires_at: string;
  sources: string[];
  engine_version: string;
  message?: string;
}

export interface SummaryWater {
  date?: string;
  amount?: number;
  unit?: string;
}

export interface SummarySymptomClassStatistic {
  symptom_class?: number | string;
  class?: number | string;
  level?: number | string;
  quantity?: number;
  count?: number;
  total?: number;
}

export interface SummarySymptomClassStatistics {
  classes?: SummarySymptomClassStatistic[];
}

export interface SummaryResponse {
  aq_weather_uv?: any;
  mom_exposure?: {
    id?: number;
    timestamp?: string;
    exposure_level?: number;
    risks?: Record<string, unknown>;
  };
  baby_exposure?: {
    id?: number;
    timestamp?: string;
    exposure_level?: number;
    risks?: Record<string, unknown>;
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
  water?: SummaryWater;
  mommy_symptom_classes?:
    | SummarySymptomClassStatistics
    | SummarySymptomClassStatistic[];
  mommy_symptom_statistics_classes?:
    | SummarySymptomClassStatistics
    | SummarySymptomClassStatistic[];
  baby_symptom_classes?:
    | SummarySymptomClassStatistics
    | SummarySymptomClassStatistic[];
  baby_symptom_statistics_classes?:
    | SummarySymptomClassStatistics
    | SummarySymptomClassStatistic[];
  symptom_classes?: {
    mommy?: SummarySymptomClassStatistics | SummarySymptomClassStatistic[];
    mother?: SummarySymptomClassStatistics | SummarySymptomClassStatistic[];
    baby?: SummarySymptomClassStatistics | SummarySymptomClassStatistic[];
  };
  symptom_statistics?: {
    mommy?: SummarySymptomClassStatistics | SummarySymptomClassStatistic[];
    mother?: SummarySymptomClassStatistics | SummarySymptomClassStatistic[];
    baby?: SummarySymptomClassStatistics | SummarySymptomClassStatistic[];
  };
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
