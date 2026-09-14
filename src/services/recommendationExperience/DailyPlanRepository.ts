import {
  LEGACY_DAILY_TASK_FALLBACK_ENABLED,
  RISK_IMPACT_PRESENTATION_ENABLED,
  RECOMMENDATION_CAPABILITIES,
  resolveRecommendationCapabilityStatus,
} from '../../config/recommendationExperience';
import {
  DAILY_TASK_DOMAIN_PURPOSE,
  DAILY_TASK_ENRICHMENT,
} from '../../data/recommendations/dailyTaskEnrichment';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import type {
  BackendDailyPlanCompletionState,
  BackendDailyPlanDomain,
  CapabilityStatus,
  ConfiguredCapabilityStatus,
  DailyActionCompletionRecord,
  DailyActionDomain,
  DailyActionRiskImpact,
  DailyActionState,
  DailyPlanAction,
  DailyPlanAdditionalActions,
  DailyPlanExperience,
  RecommendationCapability,
  RecommendationExperienceIdentity,
  PlanInputReadiness,
  TodayRecommendationItem,
  TodayRecommendationText,
} from '../../types/recommendationExperience';
import {
  DailyPlanService,
  type DailyPlanApiAction,
  type DailyPlanCompletionState,
  type DailyPlanResponse,
} from '../api/DailyPlanService';
import { AdviceService, type AdviceResponse } from '../api/AdviceService';
import { DailyTasksService, type DailyTask } from '../api/DailyTasksService';
import {
  RecommendationCompletionService,
  type RecommendationCompletion,
} from '../api/RecommendationCompletionService';
import {
  SummaryService,
  type SummaryRecommendation,
  type SummaryResponse,
} from '../api/SummaryService';
import { TaskCompletionService } from '../api/TaskCompletionService';

interface CapabilityLoad<T> {
  configuredStatus: ConfiguredCapabilityStatus;
  status: CapabilityStatus;
  data: T | null;
}

interface ComposeDailyPlanInput {
  date: string;
  backendDailyTasks: DailyTask[];
  backendCompletedTaskCodes: string[];
  localActionCompletions: Record<string, DailyActionCompletionRecord>;
  recommendations: SummaryRecommendation[];
  totalRiskImpact?: number;
  translate?: (key: string, fallback: string) => string;
}

interface ComposeBackendDailyPlanInput {
  plan: DailyPlanResponse;
  localActionCompletions: Record<string, DailyActionCompletionRecord>;
  recommendations?: SummaryRecommendation[];
  recommendationSnapshotId?: number;
  recommendationCompletions?: RecommendationCompletion[];
  dailyPlanAvailable?: boolean;
  totalRiskImpact?: number;
}

export interface DailyPlanLoadResult {
  status: 'available' | 'unavailable' | 'needsInput';
  experience: DailyPlanExperience;
  summary: SummaryResponse | null;
  advice: AdviceResponse | null;
}

interface DailyPlanLoadOptions {
  inputReadiness: PlanInputReadiness;
  translate?: ComposeDailyPlanInput['translate'];
}

export interface DailyPlanCompletionUpdate {
  experience: DailyPlanExperience;
}

const MEDICAL_CATEGORY_MARKERS = [
  'medical',
  'clinical',
  'maternal',
  'pregnancy',
  'obstetric',
  'fetal',
  'symptom',
  'risk',
];

const MEDICAL_RULE_MARKERS = [
  'placental_abruption',
  'preeclampsia',
  'preterm_labor',
  'prom',
  'fetal_hypoxia',
  'gdm',
  'hyperemesis',
  'low_birth_weight',
  'lbw',
  'anemia',
  'cardiovascular',
];

const emptyAdditionalActions = (): DailyPlanAdditionalActions => ({
  diet: [],
  activity: [],
  behaviour: [],
  wellbeing: [],
  service: [],
});

const loadConfiguredCapability = async <T>(
  capability: RecommendationCapability,
  loader: () => Promise<T>,
): Promise<CapabilityLoad<T>> => {
  const configuredStatus = RECOMMENDATION_CAPABILITIES[capability];
  const explicitStatus = resolveRecommendationCapabilityStatus(capability);

  if (explicitStatus !== 'available') {
    return {
      configuredStatus,
      status: explicitStatus,
      data: null,
    };
  }

  try {
    return {
      configuredStatus,
      status: 'available',
      data: await loader(),
    };
  } catch {
    return {
      configuredStatus,
      status: 'unavailable',
      data: null,
    };
  }
};

const normalizeMetadata = (value?: string): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s.-]+/g, '_');

const includesAnyMarker = (value: string, markers: string[]): boolean =>
  markers.some(marker => value.includes(marker));

const isHighUrgency = (recommendation: SummaryRecommendation): boolean =>
  Number.isFinite(recommendation.priority) && recommendation.priority <= 29;

const SEVERITY_PRIORITY: Record<string, number> = {
  critical: 0,
  urgent: 1,
  high: 2,
  moderate: 3,
  medium: 4,
  low: 5,
  info: 6,
  informational: 6,
};

const severityPriority = (recommendation: SummaryRecommendation): number => {
  const severity = normalizeMetadata(recommendation.severity);
  return SEVERITY_PRIORITY[severity] ?? Number.MAX_SAFE_INTEGER;
};

const recommendationPriority = (
  recommendation: SummaryRecommendation,
): number =>
  Number.isFinite(recommendation.priority)
    ? recommendation.priority
    : Number.MAX_SAFE_INTEGER;

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const compareRecommendations = (
  left: SummaryRecommendation,
  right: SummaryRecommendation,
): number =>
  recommendationPriority(left) - recommendationPriority(right) ||
  severityPriority(left) - severityPriority(right) ||
  compareText(
    normalizeMetadata(left.category),
    normalizeMetadata(right.category),
  ) ||
  compareText(
    normalizeMetadata(left.rule_id),
    normalizeMetadata(right.rule_id),
  ) ||
  compareText(left.id, right.id);

const isImportantGuidanceRecommendation = (
  recommendation: SummaryRecommendation,
): boolean => {
  const severity = normalizeMetadata(recommendation.severity);
  return (
    isHighUrgency(recommendation) ||
    severity === 'critical' ||
    severity === 'urgent' ||
    severity === 'high'
  );
};

export const isMedicalAttentionRecommendation = (
  recommendation: SummaryRecommendation,
): boolean => {
  const severity = normalizeMetadata(recommendation.severity);
  if (severity !== 'critical' && severity !== 'urgent') return false;

  const category = normalizeMetadata(recommendation.category);
  const ruleId = normalizeMetadata(recommendation.rule_id);

  return (
    includesAnyMarker(category, MEDICAL_CATEGORY_MARKERS) ||
    includesAnyMarker(ruleId, MEDICAL_RULE_MARKERS)
  );
};

const recommendationText = (
  recommendation: SummaryRecommendation,
): TodayRecommendationText[] => {
  const text: TodayRecommendationText[] = [];
  if (recommendation.recommendation_diet?.trim()) {
    text.push({
      dimension: 'diet',
      text: recommendation.recommendation_diet.trim(),
    });
  }
  if (recommendation.recommendation_activity?.trim()) {
    text.push({
      dimension: 'activity',
      text: recommendation.recommendation_activity.trim(),
    });
  }
  if (recommendation.recommendation_behavior?.trim()) {
    text.push({
      dimension: 'behaviour',
      text: recommendation.recommendation_behavior.trim(),
    });
  }
  if (recommendation.recommendation_mental?.trim()) {
    text.push({
      dimension: 'wellbeing',
      text: recommendation.recommendation_mental.trim(),
    });
  }
  return text;
};

const normalizeRecommendation = (
  recommendation: SummaryRecommendation,
  placement: TodayRecommendationItem['placement'],
): TodayRecommendationItem => ({
  key: `recommendation:${recommendation.id || recommendation.rule_id}`,
  placement,
  id: recommendation.id,
  ruleId: recommendation.rule_id,
  ruleVersion: recommendation.version,
  severity: recommendation.severity,
  category: recommendation.category,
  priority: recommendation.priority,
  title:
    recommendation.title ||
    recommendation.alert ||
    recommendation.message ||
    recommendation.rule_id,
  alert: recommendation.alert || undefined,
  message: recommendation.message || undefined,
  expiresAt: recommendation.expires_at || undefined,
  engineVersion: recommendation.engine_version || undefined,
  sources: recommendation.sources ?? [],
  recommendationText: recommendationText(recommendation),
});

const normalizeRecommendationBuckets = (
  recommendations: SummaryRecommendation[],
): Pick<
  DailyPlanExperience,
  | 'medicalAttention'
  | 'importantGuidanceRecommendations'
  | 'guidanceRecommendations'
  | 'optionalSupportRecommendations'
> => {
  const medicalAttention: TodayRecommendationItem[] = [];
  const importantGuidanceRecommendations: TodayRecommendationItem[] = [];
  const guidanceRecommendations: TodayRecommendationItem[] = [];
  const optionalSupportRecommendations: TodayRecommendationItem[] = [];

  [...recommendations].sort(compareRecommendations).forEach(recommendation => {
    if (isMedicalAttentionRecommendation(recommendation)) {
      medicalAttention.push(
        normalizeRecommendation(recommendation, 'medicalAttention'),
      );
      return;
    }

    if (isImportantGuidanceRecommendation(recommendation)) {
      importantGuidanceRecommendations.push(
        normalizeRecommendation(recommendation, 'importantGuidance'),
      );
      return;
    }

    if (recommendation.priority >= 70) {
      optionalSupportRecommendations.push(
        normalizeRecommendation(recommendation, 'optionalSupport'),
      );
      return;
    }

    guidanceRecommendations.push(
      normalizeRecommendation(recommendation, 'guidance'),
    );
  });

  return {
    medicalAttention,
    importantGuidanceRecommendations,
    guidanceRecommendations,
    optionalSupportRecommendations,
  };
};

const medicalSafetyAlerts = (
  recommendations: SummaryRecommendation[] = [],
): TodayRecommendationItem[] =>
  normalizeRecommendationBuckets(recommendations).medicalAttention;

const normalizeDomain = (
  category: DailyTask['category'],
  code: string,
): DailyActionDomain => {
  if (category === 'behavior') return 'behaviour';
  if (
    category === 'diet' ||
    category === 'activity' ||
    category === 'behaviour' ||
    category === 'wellbeing'
  ) {
    return category;
  }
  return DAILY_TASK_ENRICHMENT[code]?.domain ?? 'wellbeing';
};

const stateForBackendTask = (
  code: string,
  actionKey: string,
  completedTaskCodes: Set<string>,
  localActionCompletions: ComposeDailyPlanInput['localActionCompletions'],
): DailyActionState => {
  if (completedTaskCodes.has(code)) return 'completed';
  const local = localActionCompletions[actionKey];
  return local?.state === 'planned' ? 'planned' : 'pending';
};

const normalizeBackendDailyPlanDomain = (
  domain: DailyPlanApiAction['domain'],
): DailyActionDomain | null => {
  if (domain === 'nutrition') return 'diet';
  if (domain === 'behavior') return 'behaviour';
  if (domain === 'mental') return 'wellbeing';
  if (domain === 'activity' || domain === 'service') return domain;
  return null;
};

const textValue = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const numberValue = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
};

const roundImpact = (value: number): number => Math.round(value * 100) / 100;

const riskImpactFromSummary = (
  summary: SummaryResponse | null,
): number | undefined => {
  const values = [summary?.risks_delta?.mom, summary?.risks_delta?.baby].filter(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value),
  );
  const totalDecrease = values
    .filter(value => value < 0)
    .reduce((total, value) => total + value, 0);
  return totalDecrease < 0 ? roundImpact(totalDecrease) : undefined;
};

const activeRiskImpactActions = (
  experience: DailyPlanExperience,
): DailyPlanAction[] =>
  experience.primaryActions.filter(action => action.domain !== 'service');

const distributedImpacts = (total: number, count: number): number[] => {
  if (count <= 0) return [];
  const totalHundredths = Math.round(total * 100);
  const sign = totalHundredths < 0 ? -1 : 1;
  const absoluteTotal = Math.abs(totalHundredths);
  const base = Math.floor(absoluteTotal / count);
  const remainder = absoluteTotal % count;

  return Array.from({ length: count }, (_, index) => {
    const receivesRemainder = index >= count - remainder;
    return (sign * (base + (receivesRemainder ? 1 : 0))) / 100;
  });
};

const backendActionRiskImpact = (
  action: DailyPlanApiAction,
): DailyActionRiskImpact | undefined => {
  const impactObject =
    action.impact &&
    typeof action.impact === 'object' &&
    !Array.isArray(action.impact)
      ? action.impact
      : null;
  const value = numberValue(
    action.risk_impact_percent,
    action.risk_impact,
    action.risk_delta,
    typeof action.impact === 'number' ? action.impact : undefined,
    impactObject?.risk_impact_percent,
    impactObject?.risk_impact,
    impactObject?.risk_delta,
    impactObject?.percent,
    impactObject?.value,
  );

  return value === undefined
    ? undefined
    : {
        value: roundImpact(value),
        source: 'backendAction',
      };
};

const withRiskImpactPresentation = (
  experience: DailyPlanExperience,
  totalRiskImpact: number | undefined,
): DailyPlanExperience => {
  if (!RISK_IMPACT_PRESENTATION_ENABLED) return experience;

  const actionKeys = new Set(
    activeRiskImpactActions(experience).map(action => action.key),
  );
  const existingBackendImpactTotal = activeRiskImpactActions(experience)
    .filter(action => action.riskImpact?.source === 'backendAction')
    .reduce((total, action) => total + (action.riskImpact?.value ?? 0), 0);
  const totalValue =
    totalRiskImpact !== undefined
      ? totalRiskImpact
      : existingBackendImpactTotal !== 0
      ? roundImpact(existingBackendImpactTotal)
      : undefined;

  if (totalValue === undefined || actionKeys.size === 0) {
    return experience;
  }

  const missingActionKeys = activeRiskImpactActions(experience)
    .filter(action => !action.riskImpact)
    .map(action => action.key);
  const allocatedValues = distributedImpacts(
    roundImpact(totalValue - existingBackendImpactTotal),
    missingActionKeys.length,
  );
  const allocatedByKey = new Map(
    missingActionKeys.map((key, index) => [key, allocatedValues[index]]),
  );

  const applyImpact = (action: DailyPlanAction): DailyPlanAction => {
    if (!actionKeys.has(action.key) || action.riskImpact) return action;
    const value = allocatedByKey.get(action.key);
    if (value === undefined) return action;
    return {
      ...action,
      riskImpact: {
        value,
        source: 'allocatedSummary',
      },
    };
  };
  const additionalActions = emptyAdditionalActions();
  (Object.keys(experience.additionalActions) as DailyActionDomain[]).forEach(
    domain => {
      additionalActions[domain] =
        experience.additionalActions[domain].map(applyImpact);
    },
  );

  return {
    ...experience,
    riskImpact: {
      totalValue: roundImpact(totalValue),
      source:
        totalRiskImpact !== undefined ? 'summaryRisksDelta' : 'backendAction',
      missingBackendActionValues: missingActionKeys.length > 0,
    },
    primaryActions: experience.primaryActions.map(applyImpact),
    additionalActions,
  };
};

export const completedRiskImpactValue = (
  experience: DailyPlanExperience,
): number =>
  roundImpact(
    activeRiskImpactActions(experience)
      .filter(action => action.completed)
      .reduce((total, action) => total + (action.riskImpact?.value ?? 0), 0),
  );

export const riskImpactCompletionPercent = (
  experience: DailyPlanExperience,
): number => {
  const totalValue = experience.riskImpact?.totalValue;
  if (!totalValue) return 0;
  return Math.min(
    100,
    Math.round(
      (Math.abs(completedRiskImpactValue(experience)) / Math.abs(totalValue)) *
        100,
    ),
  );
};

const timingLabel = (action: DailyPlanApiAction): string | undefined => {
  if (typeof action.timing === 'string') return textValue(action.timing);
  const timing =
    action.timing &&
    typeof action.timing === 'object' &&
    !Array.isArray(action.timing)
      ? action.timing
      : null;
  const direct = textValue(
    timing?.label,
    timing?.time,
    action.time,
    action.scheduled_time,
  );
  if (direct) return direct;
  const start = textValue(timing?.start_time, action.start_time);
  const end = textValue(timing?.end_time, action.end_time);
  if (start && end) return `${start}-${end}`;
  return start ?? end;
};

const durationMinutes = (action: DailyPlanApiAction): number | undefined => {
  const direct = numberValue(action.duration_minutes);
  if (direct !== undefined) return direct;
  if (typeof action.duration === 'number' && Number.isFinite(action.duration)) {
    return action.duration;
  }
  return undefined;
};

const durationLabel = (action: DailyPlanApiAction): string | undefined =>
  typeof action.duration === 'string' ? textValue(action.duration) : undefined;

const contextLabel = (action: DailyPlanApiAction): string | undefined => {
  const direct = textValue(action.context_label);
  if (direct) return direct;
  if (typeof action.context === 'string') return textValue(action.context);
  if (Array.isArray(action.context)) {
    const values = action.context.filter(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    );
    return values.length ? values.join(', ') : undefined;
  }
  if (
    action.context &&
    typeof action.context === 'object' &&
    !Array.isArray(action.context)
  ) {
    return textValue(
      action.context.label,
      action.context.name,
      action.context.title,
    );
  }
  return undefined;
};

const dailyPlanActionId = (
  action: DailyPlanApiAction,
  bucket: 'primary' | 'additional' | 'support',
  index: number,
): string =>
  String(
    action.id ??
      action.action_id ??
      action.code ??
      action.key ??
      action.slug ??
      `${bucket}:${index}`,
  );

const normalizeBackendCompletionState = (
  value: DailyPlanCompletionState | undefined,
  localState: DailyActionCompletionRecord | undefined,
): DailyActionState => {
  if (value === 'completed') return 'completed';
  if (value === 'skipped') return 'skipped';
  if (localState?.state === 'planned') return 'planned';
  return 'pending';
};

const apiCompletionStateForActionState = (
  state: DailyActionState,
): DailyPlanCompletionState | null => {
  if (state === 'completed') return 'completed';
  if (state === 'skipped') return 'skipped';
  if (state === 'pending') return 'not_done';
  return null;
};

const normalizeDailyPlanApiAction = (
  action: DailyPlanApiAction,
  bucket: 'primary' | 'additional' | 'support',
  index: number,
  localActionCompletions: ComposeBackendDailyPlanInput['localActionCompletions'],
): DailyPlanAction | null => {
  const domain = normalizeBackendDailyPlanDomain(action.domain);
  const title = textValue(action.title, action.name, action.label);
  if (!domain || !title) return null;

  const actionId = dailyPlanActionId(action, bucket, index);
  const key = `daily-plan:${bucket}:${actionId}`;
  const localState = localActionCompletions[key];
  const backendCompletionState = action.completion_state ?? 'not_done';
  const state = normalizeBackendCompletionState(
    backendCompletionState,
    localState,
  );
  const priority = numberValue(action.priority);

  return {
    key,
    domain,
    backendDomain: action.domain as BackendDailyPlanDomain,
    backendCompletionState:
      backendCompletionState as BackendDailyPlanCompletionState,
    title,
    purpose: textValue(
      action.purpose,
      action.description,
      action.message,
      action.body,
    ),
    priority,
    timingLabel: timingLabel(action),
    durationMinutes: durationMinutes(action),
    durationLabel: durationLabel(action),
    contextLabel: contextLabel(action),
    source: 'apiDailyPlan',
    state,
    completed: state === 'completed',
    riskImpact: backendActionRiskImpact(action),
    backendReference: {
      kind: 'dailyPlanAction',
      actionId,
      bucket,
    },
  };
};

const recommendationBackendDimension = (
  dimension: TodayRecommendationText['dimension'],
): string =>
  dimension === 'behaviour'
    ? 'behavior'
    : dimension === 'wellbeing'
    ? 'mental'
    : dimension;

const recommendationActionState = (
  completion: RecommendationCompletion | undefined,
  localState: DailyActionCompletionRecord | undefined,
): DailyActionState => {
  if (completion?.status === 'done') return 'completed';
  if (completion?.status === 'skipped' || completion?.status === 'dismissed') {
    return 'skipped';
  }
  return localState?.state ?? 'pending';
};

const normalizeRecommendationActions = (
  recommendations: SummaryRecommendation[],
  snapshotId: number | undefined,
  completions: RecommendationCompletion[],
  localActionCompletions: Record<string, DailyActionCompletionRecord>,
): DailyPlanAction[] => {
  if (snapshotId === undefined) return [];

  const seen = new Set<string>();
  const actions: DailyPlanAction[] = [];
  [...recommendations].sort(compareRecommendations).forEach(recommendation => {
    if (isMedicalAttentionRecommendation(recommendation)) return;

    recommendationText(recommendation).forEach(item => {
      const backendDimension = recommendationBackendDimension(item.dimension);
      const key = `advice:${snapshotId}:${recommendation.rule_id}:${recommendation.version}:${backendDimension}`;
      const fingerprint = [
        item.dimension,
        normalizeMetadata(recommendation.title),
        normalizeMetadata(item.text),
      ].join('|');
      if (seen.has(fingerprint)) return;
      seen.add(fingerprint);

      const completion = completions.find(
        record =>
          record.snapshot_id === snapshotId &&
          record.rule_id === recommendation.rule_id &&
          record.rule_version === recommendation.version &&
          record.dimension === backendDimension,
      );
      const state = recommendationActionState(
        completion,
        localActionCompletions[key],
      );
      actions.push({
        key,
        domain: item.dimension,
        title:
          recommendation.title ||
          recommendation.message ||
          recommendation.rule_id,
        purpose: item.text,
        contextLabel: textValue(recommendation.alert, recommendation.message),
        priority: recommendation.priority,
        source: 'apiRecommendation',
        state,
        completed: state === 'completed',
        backendReference: {
          kind: 'recommendation',
          snapshotId,
          ruleId: recommendation.rule_id,
          ruleVersion: recommendation.version,
          dimension: backendDimension,
        },
      });
    });
  });

  return actions;
};

const LEGACY_DAILY_PLAN_TITLES = new Set([
  'drink_water',
  'cooking_smoke',
  'morning_walk',
]);
const MAX_PRIMARY_DAILY_ACTIONS = 4;

const isLegacyDailyPlanSeed = (action: DailyPlanAction): boolean =>
  action.source === 'apiDailyPlan' &&
  LEGACY_DAILY_PLAN_TITLES.has(normalizeMetadata(action.title));

const actionFingerprint = (action: DailyPlanAction): string =>
  [
    action.domain,
    normalizeMetadata(action.title),
    normalizeMetadata(action.purpose),
  ].join('|');

const deduplicateActions = (
  actions: DailyPlanAction[],
  existingActions: DailyPlanAction[] = [],
): DailyPlanAction[] => {
  const seen = new Set(existingActions.map(actionFingerprint));
  return actions.filter(action => {
    const fingerprint = actionFingerprint(action);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
};

const groupAdditionalActions = (
  actions: DailyPlanAction[],
): DailyPlanAdditionalActions => {
  const grouped = emptyAdditionalActions();
  actions.forEach(action => grouped[action.domain].push(action));
  return grouped;
};

const sortByActionPriority = (actions: DailyPlanAction[]): DailyPlanAction[] =>
  actions
    .map((action, index) => ({ action, index }))
    .sort(
      (left, right) =>
        (left.action.priority ?? Number.MAX_SAFE_INTEGER) -
          (right.action.priority ?? Number.MAX_SAFE_INTEGER) ||
        left.index - right.index,
    )
    .map(item => item.action);

const actionPresentationFromPurpose = (
  purpose: string,
): Pick<DailyPlanAction, 'title' | 'purpose'> => {
  const firstClause = purpose.split(';')[0].trim();
  const withoutExample = firstClause
    .replace(/\s*\((?:e\.g\.,?|for example)[\s\S]*\)\s*$/i, '')
    .trim();
  const candidate = withoutExample || firstClause;
  const title =
    candidate.length <= 64
      ? candidate
      : candidate
          .slice(0, 64)
          .replace(/\s+\S*$/, '')
          .trim() || candidate.slice(0, 64).trim();
  const remainingPurpose = purpose.slice(title.length).trim();

  return {
    title,
    purpose:
      remainingPurpose
        .replace(/^;\s*/, '')
        .replace(/^([a-z])/, first => first.toUpperCase()) || undefined,
  };
};

const disambiguateRepeatedActionTitles = (
  actions: DailyPlanAction[],
): DailyPlanAction[] => {
  const titleCounts = actions.reduce<Record<string, number>>(
    (counts, action) => {
      const title = normalizeMetadata(action.title);
      counts[title] = (counts[title] ?? 0) + 1;
      return counts;
    },
    {},
  );

  return actions.map(action => {
    if (
      titleCounts[normalizeMetadata(action.title)] < 2 ||
      !action.purpose?.trim()
    ) {
      return action;
    }

    return {
      ...action,
      ...actionPresentationFromPurpose(action.purpose),
      contextLabel: [action.title, action.contextLabel]
        .filter(
          (label, index, labels): label is string =>
            Boolean(label) && labels.indexOf(label) === index,
        )
        .join(' · '),
    };
  });
};

export const composeBackendDailyPlan = (
  input: ComposeBackendDailyPlanInput,
): DailyPlanExperience => {
  const normalizeBucket = (
    bucket: 'primary' | 'additional' | 'support',
    actions: DailyPlanApiAction[],
  ): DailyPlanAction[] =>
    actions
      .map((action, index) =>
        normalizeDailyPlanApiAction(
          action,
          bucket,
          index,
          input.localActionCompletions,
        ),
      )
      .filter((action): action is DailyPlanAction => action !== null);

  const dailyPlanPrimaryActions = normalizeBucket(
    'primary',
    input.plan.primary_actions ?? [],
  );
  const dailyPlanAdditionalActions = normalizeBucket(
    'additional',
    input.plan.additional_actions ?? [],
  );
  const supportActions = normalizeBucket(
    'support',
    input.plan.support_actions ?? [],
  );
  const recommendationActions = disambiguateRepeatedActionTitles(
    normalizeRecommendationActions(
      input.recommendations ?? [],
      input.recommendationSnapshotId,
      input.recommendationCompletions ?? [],
      input.localActionCompletions,
    ),
  );
  const hasAdviceActions = recommendationActions.length > 0;
  const hasLegacySeeds = dailyPlanPrimaryActions.some(isLegacyDailyPlanSeed);
  const dailyPlanPersonalizedActions = disambiguateRepeatedActionTitles(
    deduplicateActions([
      ...dailyPlanPrimaryActions.filter(
        action => !isLegacyDailyPlanSeed(action) && action.domain !== 'service',
      ),
      ...dailyPlanAdditionalActions.filter(
        action => action.domain !== 'service',
      ),
    ]),
  );
  const hasDailyPlanPersonalizedActions =
    hasLegacySeeds && dailyPlanPersonalizedActions.length > 0;
  const dailyPlanBasicActions = dailyPlanPrimaryActions.filter(
    action => isLegacyDailyPlanSeed(action) && action.domain !== 'service',
  );

  // Daily Plan rows can persist after engine inputs change. Advice is the
  // authoritative live set whenever it contains actionable recommendations.
  const primaryCandidates = hasAdviceActions
    ? sortByActionPriority(
        deduplicateActions([
          ...recommendationActions,
          ...dailyPlanPersonalizedActions,
        ]),
      )
    : hasDailyPlanPersonalizedActions
    ? dailyPlanPersonalizedActions
    : dailyPlanPrimaryActions.filter(action => action.domain !== 'service');
  const primaryActions = primaryCandidates.slice(0, MAX_PRIMARY_DAILY_ACTIONS);
  const overflowActions = primaryCandidates.slice(MAX_PRIMARY_DAILY_ACTIONS);
  const additionalPersonalizedActions = hasAdviceActions
    ? []
    : hasDailyPlanPersonalizedActions
    ? []
    : dailyPlanAdditionalActions.filter(action => action.domain !== 'service');
  const basicActionsForMore =
    hasAdviceActions || hasDailyPlanPersonalizedActions
      ? dailyPlanBasicActions
      : [];
  const visibleAdditionalActions = groupAdditionalActions(
    deduplicateActions(
      [
        ...overflowActions,
        ...additionalPersonalizedActions,
        ...basicActionsForMore,
      ],
      primaryActions,
    ),
  );
  const nonActionableRecommendations = (input.recommendations ?? []).filter(
    recommendation =>
      !isMedicalAttentionRecommendation(recommendation) &&
      recommendationText(recommendation).length === 0,
  );
  const guidanceBuckets = normalizeRecommendationBuckets(
    nonActionableRecommendations,
  );

  return withRiskImpactPresentation(
    {
      date: input.plan.date,
      timezone: input.plan.timezone || undefined,
      source: hasAdviceActions
        ? input.dailyPlanAvailable === false
          ? 'adviceApi'
          : 'unifiedApi'
        : 'dailyPlanApi',
      primaryActions,
      additionalActions: visibleAdditionalActions,
      supportActions,
      backendCompletedTaskCodes: dailyPlanPrimaryActions
        .filter(action => action.completed)
        .map(action =>
          action.backendReference?.kind === 'dailyPlanAction'
            ? action.backendReference.actionId
            : action.key,
        ),
      medicalAttention: medicalSafetyAlerts(input.recommendations),
      importantGuidanceRecommendations:
        guidanceBuckets.importantGuidanceRecommendations,
      guidanceRecommendations: guidanceBuckets.guidanceRecommendations,
      optionalSupportRecommendations:
        guidanceBuckets.optionalSupportRecommendations,
    },
    hasAdviceActions ? undefined : input.totalRiskImpact,
  );
};

export const composeDailyPlan = (
  input: ComposeDailyPlanInput,
): DailyPlanExperience => {
  const completedTaskCodes = new Set(input.backendCompletedTaskCodes);
  const primaryActions = [...input.backendDailyTasks]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map<DailyPlanAction>(task => {
      const domain = normalizeDomain(task.category, task.code);
      const enrichment = DAILY_TASK_ENRICHMENT[task.code];
      const key = `daily-task:${task.code}`;
      const state = stateForBackendTask(
        task.code,
        key,
        completedTaskCodes,
        input.localActionCompletions,
      );
      const purpose =
        input.translate?.(
          `daily_task_enrichment.${task.code}.purpose`,
          enrichment?.purpose ?? DAILY_TASK_DOMAIN_PURPOSE[domain],
        ) ??
        enrichment?.purpose ??
        DAILY_TASK_DOMAIN_PURPOSE[domain];

      return {
        key,
        domain,
        title: task.title,
        purpose,
        priority: enrichment?.priority ?? task.sort_order,
        source: 'apiDailyTask',
        state,
        completed: state === 'completed',
        backendReference: {
          kind: 'dailyTask',
          code: task.code,
        },
      };
    });
  const recommendationBuckets = normalizeRecommendationBuckets(
    input.recommendations,
  );

  return withRiskImpactPresentation(
    {
      date: input.date,
      source: 'legacy',
      primaryActions,
      additionalActions: emptyAdditionalActions(),
      supportActions: [],
      backendCompletedTaskCodes: input.backendCompletedTaskCodes,
      ...recommendationBuckets,
    },
    input.totalRiskImpact,
  );
};

export const loadDailyPlanExperience = async (
  identity: RecommendationExperienceIdentity,
  date: string,
  options: DailyPlanLoadOptions,
): Promise<DailyPlanLoadResult> => {
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);

  if (!options.inputReadiness.ready) {
    return {
      status: 'needsInput',
      summary: null,
      advice: null,
      experience: {
        date,
        primaryActions: [],
        additionalActions: emptyAdditionalActions(),
        supportActions: [],
        backendCompletedTaskCodes: [],
        medicalAttention: [],
        importantGuidanceRecommendations: [],
        guidanceRecommendations: [],
        optionalSupportRecommendations: [],
      },
    };
  }

  const [summaryLoad, adviceLoad, dailyPlanLoad] = await Promise.all([
    loadConfiguredCapability(
      'recommendationSnapshots',
      SummaryService.getSummary,
    ),
    loadConfiguredCapability('dailyRecommendations', AdviceService.getAdvice),
    loadConfiguredCapability('dailyPlan', () =>
      DailyPlanService.getDailyPlan(date),
    ),
  ]);

  const summary = summaryLoad.data as SummaryResponse | null;
  const advice = adviceLoad.data as AdviceResponse | null;
  const recommendationCompletionLoad = advice
    ? await loadConfiguredCapability('recommendationCompletion', () =>
        RecommendationCompletionService.getCompletions(advice.id),
      )
    : null;
  const currentStore = useRecommendationExperienceStore.getState();

  if ((dailyPlanLoad.status === 'available' && dailyPlanLoad.data) || advice) {
    const dailyPlanAvailable =
      dailyPlanLoad.status === 'available' && dailyPlanLoad.data !== null;
    const plan = dailyPlanAvailable
      ? (dailyPlanLoad.data as DailyPlanResponse)
      : {
          date,
          timezone: '',
          primary_actions: [],
          additional_actions: [],
          support_actions: [],
        };
    const experience = composeBackendDailyPlan({
      plan,
      localActionCompletions: currentStore.actionCompletions[plan.date] ?? {},
      recommendations: advice?.recommendations ?? [],
      recommendationSnapshotId: advice?.id,
      recommendationCompletions: recommendationCompletionLoad?.data ?? [],
      dailyPlanAvailable,
      totalRiskImpact: riskImpactFromSummary(summary),
    });

    if (dailyPlanAvailable || experience.primaryActions.length > 0) {
      currentStore.savePresentedActions({
        date: experience.date,
        actionKeys: experience.primaryActions.map(action => action.key),
        updatedAt: new Date().toISOString(),
      });

      return {
        status: 'available',
        summary,
        advice,
        experience,
      };
    }
  }

  if (!LEGACY_DAILY_TASK_FALLBACK_ENABLED) {
    const recommendationBuckets = normalizeRecommendationBuckets(
      advice?.recommendations ?? [],
    );
    return {
      status: 'unavailable',
      summary,
      advice,
      experience: {
        date,
        primaryActions: [],
        additionalActions: emptyAdditionalActions(),
        supportActions: [],
        backendCompletedTaskCodes: [],
        ...recommendationBuckets,
      },
    };
  }

  // Retained as an explicit rollback path. Production keeps the flag disabled
  // so legacy Daily Tasks cannot silently replace a failed Daily Plan request.
  const [dailyTasksLoad, completedTasksLoad] = await Promise.all([
    loadConfiguredCapability('dailyTasks', DailyTasksService.getDailyTasks),
    loadConfiguredCapability('taskCompletion', () =>
      TaskCompletionService.getCompleted(date),
    ),
  ]);

  const experience = composeDailyPlan({
    date,
    backendDailyTasks: dailyTasksLoad.data ?? [],
    backendCompletedTaskCodes: completedTasksLoad.data ?? [],
    localActionCompletions: currentStore.actionCompletions[date] ?? {},
    recommendations: advice?.recommendations ?? [],
    totalRiskImpact: riskImpactFromSummary(summary),
    translate: options.translate,
  });

  currentStore.savePresentedActions({
    date,
    actionKeys: experience.primaryActions.map(action => action.key),
    updatedAt: new Date().toISOString(),
  });

  return {
    status: 'available',
    summary,
    advice,
    experience,
  };
};

const updateActionInExperience = (
  experience: DailyPlanExperience,
  actionKey: string,
  state: DailyActionState,
  backendCompletedTaskCodes = experience.backendCompletedTaskCodes,
  backendCompletionState?: BackendDailyPlanCompletionState,
): DailyPlanExperience => {
  const update = (action: DailyPlanAction): DailyPlanAction =>
    action.key === actionKey
      ? {
          ...action,
          state,
          completed: state === 'completed',
          backendCompletionState:
            backendCompletionState ?? action.backendCompletionState,
        }
      : action;
  const additionalActions = emptyAdditionalActions();

  (Object.keys(experience.additionalActions) as DailyActionDomain[]).forEach(
    domain => {
      additionalActions[domain] =
        experience.additionalActions[domain].map(update);
    },
  );

  return {
    ...experience,
    backendCompletedTaskCodes,
    primaryActions: experience.primaryActions.map(update),
    additionalActions,
  };
};

const findAction = (
  experience: DailyPlanExperience,
  actionKey: string,
): DailyPlanAction | null => {
  const primary = experience.primaryActions.find(
    action => action.key === actionKey,
  );
  if (primary) return primary;

  for (const actions of Object.values(experience.additionalActions)) {
    const action = actions.find(item => item.key === actionKey);
    if (action) return action;
  }
  return null;
};

const nextCompletedTaskCodes = (
  experience: DailyPlanExperience,
  code: string,
  state: DailyActionState,
): string[] => {
  const completedCodes = new Set(experience.backendCompletedTaskCodes);
  if (state === 'completed') {
    completedCodes.add(code);
  } else if (state === 'pending') {
    completedCodes.delete(code);
  }

  const orderedCodes = experience.primaryActions
    .map(action =>
      action.backendReference?.kind === 'dailyTask'
        ? action.backendReference.code
        : null,
    )
    .filter((item): item is string => Boolean(item));
  return [
    ...orderedCodes.filter(item => completedCodes.has(item)),
    ...[...completedCodes].filter(item => !orderedCodes.includes(item)),
  ];
};

export const updateDailyPlanActionState = async (
  identity: RecommendationExperienceIdentity,
  experience: DailyPlanExperience,
  actionKey: string,
  state: DailyActionState,
): Promise<DailyPlanCompletionUpdate> => {
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);
  const action = findAction(experience, actionKey);

  if (
    action?.backendReference?.kind === 'dailyTask' &&
    (state === 'completed' || state === 'pending')
  ) {
    const completedTaskCodes = nextCompletedTaskCodes(
      experience,
      action.backendReference.code,
      state,
    );
    await TaskCompletionService.saveCompleted(
      experience.date,
      completedTaskCodes,
    );
    store.setActionState(experience.date, actionKey, state, {
      domain: action.domain,
      kind: 'primary',
      riskImpactValue: action.riskImpact?.value,
    });
    return {
      experience: updateActionInExperience(
        experience,
        actionKey,
        state,
        completedTaskCodes,
      ),
    };
  }

  if (action?.backendReference?.kind === 'recommendation') {
    if (state === 'completed' || state === 'skipped') {
      const completion = await RecommendationCompletionService.markDone({
        snapshot_id: action.backendReference.snapshotId,
        rule_id: action.backendReference.ruleId,
        rule_version: action.backendReference.ruleVersion,
        dimension: action.backendReference.dimension,
        status: state === 'completed' ? 'done' : 'skipped',
      });
      const nextState = recommendationActionState(completion, undefined);
      store.setActionState(experience.date, actionKey, nextState, {
        domain: action.domain,
        kind: experience.primaryActions.some(item => item.key === actionKey)
          ? 'primary'
          : 'extra',
        riskImpactValue: action.riskImpact?.value,
      });
      return {
        experience: updateActionInExperience(experience, actionKey, nextState),
      };
    }

    if (state === 'pending' && action.state !== 'planned') {
      throw new Error(
        'The recommendation completion API does not support resetting a completion.',
      );
    }
  }

  const dailyPlanCompletionState = apiCompletionStateForActionState(state);
  if (
    action?.backendReference?.kind === 'dailyPlanAction' &&
    action.backendReference.bucket !== 'support' &&
    dailyPlanCompletionState
  ) {
    const response = await DailyPlanService.updateActionCompletion(
      action.backendReference.actionId,
      dailyPlanCompletionState,
    );
    const nextState = normalizeBackendCompletionState(
      response.completion_state,
      undefined,
    );
    store.setActionState(experience.date, actionKey, nextState, {
      domain: action.domain,
      kind: experience.primaryActions.some(item => item.key === actionKey)
        ? 'primary'
        : 'extra',
      riskImpactValue: action.riskImpact?.value,
    });
    return {
      experience: updateActionInExperience(
        experience,
        actionKey,
        nextState,
        undefined,
        response.completion_state as BackendDailyPlanCompletionState,
      ),
    };
  }

  store.setActionState(experience.date, actionKey, state, {
    domain: action?.domain,
    kind: experience.primaryActions.some(item => item.key === actionKey)
      ? 'primary'
      : 'extra',
    riskImpactValue: action?.riskImpact?.value,
  });

  return {
    experience: updateActionInExperience(experience, actionKey, state),
  };
};

export const updateDailyPlanActionCompletion = (
  identity: RecommendationExperienceIdentity,
  experience: DailyPlanExperience,
  actionKey: string,
  completed: boolean,
): Promise<DailyPlanCompletionUpdate> =>
  updateDailyPlanActionState(
    identity,
    experience,
    actionKey,
    completed ? 'completed' : 'pending',
  );
