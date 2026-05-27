import api from './client';
import type { TaskDefinition, TaskCategory } from '../../data/taskDefinitions';

export const DailyTasksService = {
  getDailyTasks: async (): Promise<TaskDefinition[]> => {
    const response = await api.get('/daily-tasks/');
    const raw = Array.isArray(response.data)
      ? response.data
      : response.data?.items || response.data?.tasks || [];
    return raw
      .map((t: any): TaskDefinition | null => {
        const id = t.id ?? t.code ?? t.slug;
        const type = (t.type ?? t.category) as TaskCategory | undefined;
        const title = t.title ?? t.name;
        const description = t.description ?? t.text ?? '';
        if (!id || !type || !title) return null;
        return { id: String(id), type, title: String(title), description: String(description) };
      })
      .filter((t: TaskDefinition | null): t is TaskDefinition => t !== null);
  },
};
