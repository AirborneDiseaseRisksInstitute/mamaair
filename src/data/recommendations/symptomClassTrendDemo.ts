/**
 * Development-only selections used to make the current-week symptom-class
 * graph inspectable before the statistics/classes endpoint is available.
 *
 * These keys are resolved through the reviewed Feeling Check-in supplement;
 * they do not diagnose a condition or trigger any care recommendation.
 */
export const DEVELOPMENT_SYMPTOM_CLASS_WEEK_KEYS: readonly (
  readonly string[]
)[] = [
  [
    'fallback:mommy:back-pain',
    'fallback:mommy:poor-appetite',
  ],
  ['fallback:mommy:headache'],
  [
    'fallback:mommy:dizziness',
    'fallback:mommy:dry-mouth',
  ],
  [
    'fallback:warning:reduced-fetal-movement',
    'fallback:mommy:increased-thirst',
  ],
  ['fallback:warning:vaginal-bleeding'],
  ['fallback:mommy:fatigue-weakness'],
  [
    'fallback:mommy:back-pain',
    'fallback:mommy:poor-appetite',
  ],
];
