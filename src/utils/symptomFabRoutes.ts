export const SYMPTOM_FAB_ROUTES = [
  'Home',
  'Today',
  'WeeklySummary',
  'SymptomsHistory',
  'BabyStatus',
  'BabyTwin',
  'MotherTwin',
  'UserProfile',
] as const;

export type SymptomFabRouteName =
  (typeof SYMPTOM_FAB_ROUTES)[number];

export type QuickSymptomSource = 'home' | 'today' | 'app';

const symptomFabRouteSet = new Set<string>(SYMPTOM_FAB_ROUTES);

export const shouldShowSymptomFab = (
  routeName: string,
): routeName is SymptomFabRouteName =>
  symptomFabRouteSet.has(routeName);

export const resolveQuickSymptomSource = (
  routeName: string,
): QuickSymptomSource =>
  routeName === 'Home'
    ? 'home'
    : routeName === 'Today'
    ? 'today'
    : 'app';
