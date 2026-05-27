import { create } from 'zustand';
import { DailyTasksService } from '../services/api/DailyTasksService';
import { DEFAULT_TASKS, type TaskDefinition } from '../data/taskDefinitions';

interface TasksState {
  tasks: TaskDefinition[];
  loaded: boolean;
  fetchTasks: () => Promise<void>;
}

export const useTasksStore = create<TasksState>((set) => ({
  // Hardcoded list serves as fallback so the UI works before the network call resolves
  // and when offline. The network result, if non-empty, replaces it.
  tasks: DEFAULT_TASKS,
  loaded: false,
  fetchTasks: async () => {
    try {
      const remote = await DailyTasksService.getDailyTasks();
      if (remote.length > 0) {
        set({ tasks: remote, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch (err: any) {
      console.warn('[TasksStore] Failed to load daily tasks:', err?.message);
    }
  },
}));
