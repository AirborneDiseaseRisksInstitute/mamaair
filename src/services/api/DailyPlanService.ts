import api from './client';

export type DailyPlanApiDomain =
  | 'nutrition'
  | 'activity'
  | 'behavior'
  | 'mental'
  | 'service';

export type DailyPlanCompletionState = 'not_done' | 'completed' | 'skipped';

export interface DailyPlanApiTiming {
  label?: string;
  time?: string;
  start_time?: string;
  end_time?: string;
}

export interface DailyPlanApiContext {
  label?: string;
  name?: string;
  title?: string;
}

export interface DailyPlanApiRiskImpact {
  value?: number | null;
  percent?: number | null;
  risk_delta?: number | null;
  risk_impact?: number | null;
  risk_impact_percent?: number | null;
}

export interface DailyPlanApiAction {
  id?: string | number;
  action_id?: string | number;
  code?: string;
  key?: string;
  slug?: string;
  domain?: DailyPlanApiDomain;
  title?: string;
  name?: string;
  label?: string;
  description?: string;
  purpose?: string;
  message?: string;
  body?: string;
  priority?: number | null;
  completion_state?: DailyPlanCompletionState;
  timing?: string | DailyPlanApiTiming | null;
  time?: string | null;
  scheduled_time?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  duration?: number | string | null;
  context?: string | string[] | DailyPlanApiContext | null;
  context_label?: string | null;
  risk_delta?: number | null;
  risk_impact?: number | null;
  risk_impact_percent?: number | null;
  impact?: number | DailyPlanApiRiskImpact | null;
}

export interface DailyPlanResponse {
  date: string;
  timezone: string;
  primary_actions: DailyPlanApiAction[];
  additional_actions: DailyPlanApiAction[];
  support_actions: DailyPlanApiAction[];
}

export interface DailyPlanActionCompletionResponse {
  id: string;
  completion_state: DailyPlanCompletionState;
}

export const DailyPlanService = {
  getDailyPlan: async (date?: string): Promise<DailyPlanResponse> => {
    const response = await api.get('/daily-plan/', {
      params: date ? { date } : undefined,
    });
    return response.data;
  },

  updateActionCompletion: async (
    actionId: string,
    completionState: DailyPlanCompletionState,
  ): Promise<DailyPlanActionCompletionResponse> => {
    const response = await api.patch(
      `/daily-plan/actions/${actionId}/completion/`,
      {
        completion_state: completionState,
      },
    );
    return response.data;
  },
};
