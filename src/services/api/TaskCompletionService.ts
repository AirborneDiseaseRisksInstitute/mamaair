import api from './client';

export const TaskCompletionService = {
  getCompleted: async (date: string): Promise<string[]> => {
    try {
      return await TaskCompletionService.getCompletedStrict(date);
    } catch {
      return [];
    }
  },

  getCompletedStrict: async (date: string): Promise<string[]> => {
    const response = await api.get('/task-completion/', { params: { date } });
    return response.data?.tasks ?? [];
  },

  saveCompleted: async (date: string, tasks: string[]): Promise<void> => {
    await api.post('/task-completion/', { date, tasks });
  },
};
