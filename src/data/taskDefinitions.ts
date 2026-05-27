export type TaskCategory = 'diet' | 'activity' | 'behaviour';

export interface TaskDefinition {
  id: string;
  type: TaskCategory;
  title: string;
  description: string;
}

// Hardcoded fallback used by useTasksStore until the backend list arrives.
// Direct imports of this list should be avoided — read tasks via useTasksStore instead.
export const DEFAULT_TASKS: TaskDefinition[] = [
  {
    id: 'cooking_smoke',
    type: 'behaviour',
    title: 'Cooking Smoke Period',
    description: 'Charcoal smoke peaks between 18:00–19:00.\nImprove airflow or take a break outdoors.',
  },
  {
    id: 'drink_water',
    type: 'diet',
    title: 'Drink Water',
    description: 'Stay hydrated to help your body flush pollutants.\nAim for 2 litres spread across the day.',
  },
  {
    id: 'morning_walk',
    type: 'activity',
    title: 'Morning Walk Shift',
    description: '06:30–07:15 walk: 15 high-risk minutes (dust pockets along road).',
  },
];

// Maps Mother Twin stat tabs to internal task categories
export const STAT_TAB_TO_CATEGORY: Record<string, TaskCategory> = {
  Nutrition: 'diet',
  Activity: 'activity',
  Protection: 'behaviour',
};

export const getTaskById = (tasks: TaskDefinition[], id: string): TaskDefinition | undefined =>
  tasks.find(t => t.id === id);

export const getTasksByCategory = (tasks: TaskDefinition[], category: TaskCategory): TaskDefinition[] =>
  tasks.filter(t => t.type === category);
