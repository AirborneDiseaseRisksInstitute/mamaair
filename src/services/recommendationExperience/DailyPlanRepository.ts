import {
  MAX_PRIMARY_DAILY_ACTIONS,
  RECOMMENDATION_CAPABILITIES,
  resolveRecommendationCapabilityStatus,
} from '../../config/recommendationExperience';
import { DAILY_PLAN_SAMPLE_ACTIONS } from '../../data/recommendations/dailyPlanFallback';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import { useUserStore } from '../../store/useUserStore';
import type {
  CapabilityStatus,
  ConfiguredCapabilityStatus,
  DailyActionCompletionRecord,
  DailyActionDomain,
  DailyActionState,
  DailyPlanAction,
  DailyPlanAdditionalActions,
  DailyPlanExperience,
  FeelingCheckInRecord,
  RecommendationCapability,
  RecommendationExperienceIdentity,
} from '../../types/recommendationExperience';
import { SummaryService, type SummaryResponse } from '../api/SummaryService';

interface CapabilityLoad<T> {
  configuredStatus: ConfiguredCapabilityStatus;
  status: CapabilityStatus;
  data: T | null;
}

interface ComposeDailyPlanInput {
  date: string;
  localActionCompletions: Record<string, DailyActionCompletionRecord>;
  checkIn: FeelingCheckInRecord | null;
  pregnancyWeek?: number;
  contextKeys?: Array<'exposure' | 'distress' | 'sleep' | 'householdSmoke'>;
  recentPresentedActionKeys?: string[];
  translate?: (key: string, fallback: string) => string;
}

export interface DailyPlanLoadResult {
  experience: DailyPlanExperience;
  summary: SummaryResponse | null;
}

export interface DailyPlanCompletionUpdate {
  experience: DailyPlanExperience;
  sync: Promise<void>;
}

const emptyAdditionalActions = (): DailyPlanAdditionalActions => ({
  diet: [],
  activity: [],
  behaviour: [],
  wellbeing: [],
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

const stateForAction = (
  action: DailyPlanAction,
  localActionCompletions: ComposeDailyPlanInput['localActionCompletions'],
): DailyActionState => {
  const local = localActionCompletions[action.key];
  return local?.state ?? (local?.completed ? 'completed' : 'pending');
};

const DISTRESS_SELECTION_KEY_PARTS = [
  'anxious-worried',
  'unusually-stressed',
  'overwhelmed',
  'irritable-restless',
];

const hasElevatedEverydayDistress = (
  checkIn: FeelingCheckInRecord | null,
): boolean => {
  const selectedKeys = [
    ...(checkIn?.moodKeys ?? []),
    ...(checkIn?.feelingKeys ?? []),
  ];
  return selectedKeys.some(key =>
    DISTRESS_SELECTION_KEY_PARTS.some(part => key.includes(part)),
  );
};

const sampleActions = (
  checkIn: FeelingCheckInRecord | null,
  pregnancyWeek = 19,
  contextKeys: ComposeDailyPlanInput['contextKeys'] = [],
  translate?: ComposeDailyPlanInput['translate'],
): {
  primaryEligible: DailyPlanAction[];
  all: DailyPlanAction[];
} => {
  const elevatedDistress = hasElevatedEverydayDistress(checkIn);
  const templates = DAILY_PLAN_SAMPLE_ACTIONS.filter(action => {
    if (
      (action.minWeek && pregnancyWeek < action.minWeek) ||
      (action.maxWeek && pregnancyWeek > action.maxWeek)
    ) {
      return false;
    }
    if (
      action.contexts?.length &&
      !(elevatedDistress && action.distressPrimary) &&
      !action.contexts.some(context => contextKeys.includes(context))
    ) {
      return false;
    }
    return true;
  });

  const all = templates.map<DailyPlanAction>(action => ({
    key: `local:${action.id}`,
    domain: action.domain,
    title:
      translate?.(
        `daily_plan_samples.${action.translationKey}.title`,
        action.title,
      ) ?? action.title,
    purpose:
      translate?.(
        `daily_plan_samples.${action.translationKey}.purpose`,
        action.purpose,
      ) ?? action.purpose,
    priority: elevatedDistress && action.distressPrimary ? 5 : action.priority,
    source: 'sample',
    state: 'pending',
    completed: false,
  }));

  return {
    all,
    // Every reviewed action may become one of the three priorities.
    // Default/context priorities and recent presentation history decide
    // which three surface; the rest remain optional.
    primaryEligible: all,
  };
};

const sortActions = (
  actions: DailyPlanAction[],
  recentKeys: Set<string> = new Set(),
): DailyPlanAction[] =>
  [...actions].sort(
    (a, b) =>
      Number(recentKeys.has(a.key)) - Number(recentKeys.has(b.key)) ||
      a.priority - b.priority,
  );

const uniqueActions = (actions: DailyPlanAction[]): DailyPlanAction[] => {
  const seen = new Set<string>();
  return actions.filter(action => {
    if (seen.has(action.key)) return false;
    seen.add(action.key);
    return true;
  });
};

const selectPrimaryActions = (
  actions: DailyPlanAction[],
): DailyPlanAction[] => {
  const selected: DailyPlanAction[] = [];
  const selectedDomains = new Set<DailyActionDomain>();

  actions.forEach(action => {
    if (
      selected.length >= MAX_PRIMARY_DAILY_ACTIONS ||
      selectedDomains.has(action.domain)
    ) {
      return;
    }
    selected.push(action);
    selectedDomains.add(action.domain);
  });

  if (selected.length < MAX_PRIMARY_DAILY_ACTIONS) {
    actions.forEach(action => {
      if (
        selected.length < MAX_PRIMARY_DAILY_ACTIONS &&
        !selected.some(item => item.key === action.key)
      ) {
        selected.push(action);
      }
    });
  }
  return selected;
};

export const composeDailyPlan = (
  input: ComposeDailyPlanInput,
): DailyPlanExperience => {
  const samples = sampleActions(
    input.checkIn,
    input.pregnancyWeek,
    input.contextKeys,
    input.translate,
  );
  const recentKeys = new Set(input.recentPresentedActionKeys ?? []);

  const primaryPool = uniqueActions(
    sortActions(samples.primaryEligible, recentKeys),
  );
  const selectedPrimary = selectPrimaryActions(primaryPool);
  const primaryKeys = new Set(selectedPrimary.map(action => action.key));
  const allActions = uniqueActions(sortActions(samples.all, recentKeys)).map(
    action => {
      const state = stateForAction(action, input.localActionCompletions);
      return {
        ...action,
        state,
        completed: state === 'completed',
      };
    },
  );
  const actionByKey = new Map(allActions.map(action => [action.key, action]));
  const primaryActions = selectedPrimary
    .map(action => actionByKey.get(action.key))
    .filter((action): action is DailyPlanAction => !!action)
    .slice(0, MAX_PRIMARY_DAILY_ACTIONS);
  const additionalActions = emptyAdditionalActions();

  allActions.forEach(action => {
    if (!primaryKeys.has(action.key)) {
      additionalActions[action.domain].push(action);
    }
  });

  return {
    date: input.date,
    primaryActions,
    additionalActions,
    backendCompletedTaskCodes: [],
  };
};

export const loadDailyPlanExperience = async (
  identity: RecommendationExperienceIdentity,
  date: string,
  translate?: ComposeDailyPlanInput['translate'],
): Promise<DailyPlanLoadResult> => {
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);

  const summaryLoad = await loadConfiguredCapability(
    'recommendationSnapshots',
    SummaryService.getSummary,
  );

  const summary = summaryLoad.data as SummaryResponse | null;
  const currentStore = useRecommendationExperienceStore.getState();
  const profile = useUserStore.getState().profile;
  const previousDates = [1, 2].map(daysBefore => {
    const previous = new Date(`${date}T00:00:00`);
    previous.setDate(previous.getDate() - daysBefore);
    return previous.toISOString().slice(0, 10);
  });
  const selectedCheckIn = currentStore.getCheckIn(date);
  const exposureText = [
    summary?.daily_exposure_level,
    ...(summary?.recommendations ?? []).flatMap(item => [
      item.title,
      item.alert,
      item.message,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const checkInKeys = [
    ...(selectedCheckIn?.moodKeys ?? []),
    ...(selectedCheckIn?.feelingKeys ?? []),
  ].join(' ');
  const contextKeys: NonNullable<ComposeDailyPlanInput['contextKeys']> = [];
  if (/(exposure|heat|hot|air|pollution|smoke|uv)/.test(exposureText)) {
    contextKeys.push('exposure');
  }
  if (hasElevatedEverydayDistress(selectedCheckIn)) {
    contextKeys.push('distress');
  }
  if (/(tired|exhausted|sleep)/.test(checkInKeys)) {
    contextKeys.push('sleep');
  }
  if (
    /(wood|charcoal|coal|fire|smoke)/i.test(
      `${profile.cookingMethod ?? ''} ${profile.ventilation ?? ''}`,
    )
  ) {
    contextKeys.push('householdSmoke');
  }

  const experience = composeDailyPlan({
    date,
    localActionCompletions: currentStore.actionCompletions[date] ?? {},
    checkIn: selectedCheckIn,
    pregnancyWeek: profile.pregnancyWeek ?? 19,
    contextKeys,
    recentPresentedActionKeys: previousDates.flatMap(
      previousDate =>
        currentStore.presentedActions[previousDate]?.actionKeys ?? [],
    ),
    translate,
  });
  currentStore.savePresentedActions({
    date,
    actionKeys: experience.primaryActions.map(action => action.key),
    updatedAt: new Date().toISOString(),
  });

  return {
    summary,
    experience,
  };
};

const updateActionInExperience = (
  experience: DailyPlanExperience,
  actionKey: string,
  state: DailyActionState,
): DailyPlanExperience => {
  const update = (action: DailyPlanAction): DailyPlanAction =>
    action.key === actionKey
      ? {
          ...action,
          state,
          completed: state === 'completed',
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

export const updateDailyPlanActionState = (
  identity: RecommendationExperienceIdentity,
  experience: DailyPlanExperience,
  actionKey: string,
  state: DailyActionState,
): DailyPlanCompletionUpdate => {
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);
  const action = findAction(experience, actionKey);
  store.setActionState(experience.date, actionKey, state, {
    domain: action?.domain,
    kind: experience.primaryActions.some(item => item.key === actionKey)
      ? 'primary'
      : 'extra',
  });
  const nextExperience = updateActionInExperience(experience, actionKey, state);

  return {
    experience: nextExperience,
    sync: Promise.resolve(),
  };
};

export const updateDailyPlanActionCompletion = (
  identity: RecommendationExperienceIdentity,
  experience: DailyPlanExperience,
  actionKey: string,
  completed: boolean,
): DailyPlanCompletionUpdate =>
  updateDailyPlanActionState(
    identity,
    experience,
    actionKey,
    completed ? 'completed' : 'pending',
  );
