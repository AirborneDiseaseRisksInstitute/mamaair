import api from './client';

export interface DailyTask {
  code: string;
  title: string;
  category?: 'diet' | 'activity' | 'behavior' | 'behaviour' | 'wellbeing';
  sort_order: number;
}

export const DailyTasksService = {
  getDailyTasks: async (): Promise<DailyTask[]> => {
    const response = await api.get('/daily-tasks/');
    return response.data;
  },
};
