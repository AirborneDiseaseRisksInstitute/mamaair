import api from './client';

export interface TaskCompletionDay {
  date: string;
  tasks: string[];
}

export interface TaskCompletionResponse extends TaskCompletionDay {}

export interface TaskCompletionRangeResponse {
  start_date: string;
  end_date: string;
  days_requested: number;
  items: TaskCompletionDay[];
}

export const TaskCompletionService = {
  getCompletions: async (date: string): Promise<TaskCompletionResponse> => {
    const response = await api.get('/task-completion/', { params: { date } });
    return response.data;
  },

  // No params → backend returns current week (Mon → today)
  getCompletionsRange: async (startDate?: string, endDate?: string): Promise<TaskCompletionRangeResponse> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get('/task-completion/', { params });
    return response.data;
  },

  upsertCompletions: async (date: string, tasks: string[]): Promise<TaskCompletionResponse> => {
    const response = await api.post('/task-completion/', { date, tasks });
    return response.data;
  },
};
