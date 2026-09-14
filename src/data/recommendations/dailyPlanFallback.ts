import type { DailyActionDomain } from '../../types/recommendationExperience';

export interface DailyPlanSampleAction {
  id: string;
  translationKey: string;
  domain: DailyActionDomain;
  title: string;
  purpose: string;
  priority: number;
  defaultPrimary?: boolean;
  distressPrimary?: boolean;
  minWeek?: number;
  maxWeek?: number;
  contexts?: Array<'exposure' | 'distress' | 'sleep' | 'householdSmoke'>;
}

/**
 * Typed sample content derived from the Mary Week 19 scenario and the Level 3
 * Nutrition, Behaviour, Activity and Mental Wellbeing documents.
 *
 * This is the source of truth for the demo task list. Tasks are intentionally
 * not loaded from the Daily Tasks or Recommendation APIs.
 */
export const DAILY_PLAN_SAMPLE_ACTIONS: DailyPlanSampleAction[] = [
  {
    id: 'mary-hydration-300',
    translationKey: 'mary_hydration_300',
    domain: 'diet',
    title: 'Drink 300 ml of water now',
    purpose:
      'Have another 300 ml before noon, and add a vitamin-C fruit such as an orange with your next meal.',
    priority: 10,
    defaultPrimary: true,
  },
  {
    id: 'mary-shift-midday-work',
    translationKey: 'mary_shift_midday_work',
    domain: 'behaviour',
    title: 'Move demanding tasks away from midday',
    purpose:
      'Aim for 09:00–11:00 or 16:00–18:00 and avoid the hottest, busiest 12:30–14:30 window when you can.',
    priority: 20,
    defaultPrimary: true,
  },
  {
    id: 'mary-shaded-rest',
    translationKey: 'mary_shaded_rest',
    domain: 'activity',
    title: 'Take a 10-minute seated rest in shade',
    purpose:
      'Cool down around 13:00 and again near 17:00; a damp cloth can help you feel more comfortable.',
    priority: 30,
    defaultPrimary: true,
  },
  {
    id: 'wellbeing-clean-air-breathing',
    translationKey: 'wellbeing_clean_air_breathing',
    domain: 'wellbeing',
    title: 'Take one quiet minute in clean air',
    purpose:
      'Try slow, rhythmic abdominal breathing in a smoke-free indoor space.',
    priority: 15,
    distressPrimary: true,
    contexts: ['distress'],
  },
  {
    id: 'wellbeing-gentle-wind-down',
    translationKey: 'wellbeing_gentle_wind_down',
    domain: 'wellbeing',
    title: 'Make tonight’s wind-down gentler',
    purpose:
      'Choose a screen-free routine and give yourself a quiet space to decompress before sleep.',
    priority: 50,
  },
  {
    id: 'wellbeing-cool-pause',
    translationKey: 'wellbeing_cool_pause',
    domain: 'wellbeing',
    title: 'Cool down and pause when stress rises',
    purpose:
      'Move to a cooler shaded space, sip water and place a damp cloth on your neck or forehead.',
    priority: 60,
    contexts: ['exposure', 'distress'],
  },
  {
    id: 'diet-vitamin-c-pairing',
    translationKey: 'diet_vitamin_c_pairing',
    domain: 'diet',
    title: 'Pair an iron-rich food with vitamin C',
    purpose:
      'Add a locally available fruit or vegetable rich in vitamin C alongside an iron-rich meal.',
    priority: 70,
  },
  {
    id: 'behaviour-cleaner-cooking-window',
    translationKey: 'behaviour_cleaner_cooking_window',
    domain: 'behaviour',
    title: 'Create a cleaner cooking space',
    purpose:
      'Cook outdoors or under an open-sided shelter when possible, and fully extinguish coals after cooking.',
    priority: 80,
    contexts: ['householdSmoke'],
  },
  {
    id: 'activity-shaded-route',
    translationKey: 'activity_shaded_route',
    domain: 'activity',
    title: 'Choose the shaded, lower-traffic route',
    purpose:
      'Prefer a short route with shade and fewer dusty or congested roads.',
    priority: 90,
    contexts: ['exposure'],
  },
  {
    id: 'behaviour-ventilate-when-air-clears',
    translationKey: 'behaviour_ventilate_when_air_clears',
    domain: 'behaviour',
    title: 'Refresh indoor air at a cleaner time',
    purpose:
      'When outdoor air feels clearer, open opposite windows or doors briefly to improve airflow.',
    priority: 82,
    contexts: ['householdSmoke'],
  },
  {
    id: 'activity-gentle-mobility-pause',
    translationKey: 'activity_gentle_mobility_pause',
    domain: 'activity',
    title: 'Take a gentle mobility pause',
    purpose:
      'Relax your shoulders and ankles with slow, comfortable movements, then sit if you need to.',
    priority: 92,
  },
  {
    id: 'wellbeing-grounding-senses',
    translationKey: 'wellbeing_grounding_senses',
    domain: 'wellbeing',
    title: 'Try a one-minute grounding pause',
    purpose:
      'Notice what you can see, hear and feel around you, without judging how the moment is going.',
    priority: 55,
    contexts: ['distress'],
  },
];

export const DAILY_PLAN_DOMAIN_PURPOSE: Record<DailyActionDomain, string> = {
  diet: 'A practical nutrition step selected for today.',
  activity: 'A manageable movement or rest step for today.',
  behaviour: 'A small routine change that can make today feel safer.',
  wellbeing: 'A supportive step for rest and emotional wellbeing.',
  service: 'A care-service step for today.',
};
