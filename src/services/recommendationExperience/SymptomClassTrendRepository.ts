import { DEVELOPMENT_SYMPTOM_CLASS_WEEK_KEYS } from '../../data/recommendations/symptomClassTrendDemo';
import { FEELING_CHECK_IN_SUPPLEMENT } from '../../data/recommendations/feelingCheckInFallback';
import type { FeelingCheckInRecord } from '../../types/recommendationExperience';

export type SymptomClassKey =
  | 'class1'
  | 'class2'
  | 'class3'
  | 'class4';

export interface SymptomClassTrendSeries {
  class1: { value: number }[];
  class2: { value: number }[];
  class3: { value: number }[];
  class4: { value: number }[];
}

interface SymptomClassRule {
  classKey: SymptomClassKey;
  terms: readonly string[];
}

const canonicalName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Exact indicator groups from Rules Engine Technical Specification v4.1.
 * The mapping is kept separate from UI and only creates graph group counts;
 * it does not infer or display a diagnosis.
 */
const SYMPTOM_CLASS_RULES: readonly SymptomClassRule[] = [
  {
    classKey: 'class1',
    terms: [
      'high blood pressure',
      'vaginal bleeding',
      'severe abdominal pain',
      'uterine tenderness',
      'uterine rigidity',
      'frequent contractions',
      'contraction frequency',
      'leaking fluid',
      'chest pain',
      'heart palpitations',
      'severely reduced kicks',
      'prolonged stillness',
    ],
  },
  {
    classKey: 'class2',
    terms: [
      'persistent headache',
      'headache',
      'upper abdominal pain',
      'blurred vision',
      'severe swelling',
      'increased heart rate',
      'fever',
      'increased thirst',
      'increased urination',
      'dry mouth',
      'persistent tiredness',
      'fatigue',
      'weakness',
      'rapid weight gain',
      'pallor',
      'pale skin',
      'inner eyelids',
      'shortness of breath',
      'dizziness',
      'lightheadedness',
      'rapid heartbeat',
      'irregular heartbeat',
      'severe vomiting',
    ],
  },
  {
    classKey: 'class3',
    terms: [
      'reduced fetal movement',
      'reduced kicks',
      'excessive hiccups',
      'belly growth',
      'low maternal weight gain',
      'poor maternal appetite',
      'poor appetite',
      'reduced fetal rolling',
      'reduced kicking patterns',
    ],
  },
  {
    classKey: 'class4',
    terms: [
      'non specific abdominal or back pain',
      'abdominal or back pain',
      'lower back pain',
    ],
  },
];

const symptomNameByKey = new Map(
  FEELING_CHECK_IN_SUPPLEMENT.filter(
    item => item.kind === 'mommySymptom',
  ).map(item => [item.key, item.name]),
);

const emptySeries = (): SymptomClassTrendSeries => ({
  class1: [],
  class2: [],
  class3: [],
  class4: [],
});

export const getSymptomClass = (
  symptomName: string,
): SymptomClassKey | null => {
  const canonicalSymptomName = canonicalName(symptomName);
  const rule = SYMPTOM_CLASS_RULES.find(candidate =>
    candidate.terms.some(term => canonicalSymptomName.includes(term)),
  );
  return rule?.classKey ?? null;
};

const countSelection = (
  selectedKeys: readonly string[],
): Record<SymptomClassKey, number> => {
  const counts: Record<SymptomClassKey, number> = {
    class1: 0,
    class2: 0,
    class3: 0,
    class4: 0,
  };

  selectedKeys.forEach(key => {
    const symptomName = symptomNameByKey.get(key);
    const symptomClass = symptomName
      ? getSymptomClass(symptomName)
      : null;
    if (symptomClass) counts[symptomClass] += 1;
  });

  return counts;
};

/**
 * Produces one point per weekday for the current week. Saved local check-ins
 * always win. The development pattern only fills days with no saved check-in.
 */
export const buildDevelopmentSymptomClassTrend = (
  weekDates: readonly string[],
  checkIns: Record<string, FeelingCheckInRecord>,
): SymptomClassTrendSeries => {
  const series = emptySeries();

  weekDates.forEach((date, index) => {
    const selectedKeys = checkIns[date]
      ? checkIns[date].mommySymptomKeys
      : DEVELOPMENT_SYMPTOM_CLASS_WEEK_KEYS[index] ?? [];
    const counts = countSelection(selectedKeys);

    series.class1.push({ value: counts.class1 });
    series.class2.push({ value: counts.class2 });
    series.class3.push({ value: counts.class3 });
    series.class4.push({ value: counts.class4 });
  });

  return series;
};
