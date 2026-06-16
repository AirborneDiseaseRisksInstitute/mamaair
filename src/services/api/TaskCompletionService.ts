import api from './client';

export const TaskCompletionService = {
  getCompleted: async (date: string): Promise<string[]> => {
    try {
      const response = await api.get('/task-completion/', { params: { date } });
      return response.data?.tasks ?? [];
    } catch {
      return [];
    }
  },

  saveCompleted: async (date: string, tasks: string[]): Promise<void> => {
    await api.post('/task-completion/', { date, tasks });
  },
};
