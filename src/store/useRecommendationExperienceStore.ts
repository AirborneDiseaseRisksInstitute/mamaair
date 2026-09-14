import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import {
  DEV_RECOMMENDATION_EXPERIENCE_RESET_TOKEN,
  RECOMMENDATION_EXPERIENCE_STORAGE_VERSION,
} from '../config/recommendationExperience';
import type {
  ActionReminderRecord,
  DailyActionCompletionRecord,
  DailyActionState,
  DailyMomentRecord,
  EnvironmentalRiskObservation,
  FeelingCheckInRecord,
  FocusBoostRecord,
  PendingMommySymptomSelection,
  PresentationDayRecord,
  PresentedDailyActionsRecord,
  RecommendationExperienceIdentity,
  RestTimerRecord,
  StreakFreezeRecord,
  WeeklyCheckpointRecord,
  WeeklyShareRecord,
} from '../types/recommendationExperience';
import { useUserStore } from './useUserStore';
import {
  resolveOwnerNamespace,
  shouldMigrateOwnerState,
  type OwnerNamespace,
} from '../services/recommendationExperience/ownership';

interface PersistedRecommendationExperienceState {
  version: number;
  checkIns: Record<string, FeelingCheckInRecord>;
  actionCompletions: Record<
    string,
    Record<string, DailyActionCompletionRecord>
  >;
  reminders: Record<string, Record<string, ActionReminderRecord>>;
  restTimers: Record<string, Record<string, RestTimerRecord>>;
  dailyMoments: Record<string, Record<string, DailyMomentRecord>>;
  celebratedDates: Record<string, string>;
  presentationDays: Record<string, PresentationDayRecord>;
  presentedActions: Record<string, PresentedDailyActionsRecord>;
  focusBoosts: Record<string, FocusBoostRecord>;
  streakFreezes: Record<string, StreakFreezeRecord>;
  weeklyCheckpoints: Record<string, WeeklyCheckpointRecord>;
  shareHistory: WeeklyShareRecord[];
  pendingMommySymptomSelections: Record<string, PendingMommySymptomSelection>;
  environmentalRiskObservations: Record<string, EnvironmentalRiskObservation>;
}

interface RecommendationExperienceStore {
  owner: OwnerNamespace;
  checkIns: Record<string, FeelingCheckInRecord>;
  actionCompletions: Record<
    string,
    Record<string, DailyActionCompletionRecord>
  >;
  reminders: Record<string, Record<string, ActionReminderRecord>>;
  restTimers: Record<string, Record<string, RestTimerRecord>>;
  dailyMoments: Record<string, Record<string, DailyMomentRecord>>;
  celebratedDates: Record<string, string>;
  presentationDays: Record<string, PresentationDayRecord>;
  presentedActions: Record<string, PresentedDailyActionsRecord>;
  focusBoosts: Record<string, FocusBoostRecord>;
  streakFreezes: Record<string, StreakFreezeRecord>;
  weeklyCheckpoints: Record<string, WeeklyCheckpointRecord>;
  shareHistory: WeeklyShareRecord[];
  pendingMommySymptomSelections: Record<string, PendingMommySymptomSelection>;
  environmentalRiskObservations: Record<string, EnvironmentalRiskObservation>;
  ensureOwner: (identity: RecommendationExperienceIdentity) => void;
  getCheckIn: (date: string) => FeelingCheckInRecord | null;
  saveCheckIn: (record: FeelingCheckInRecord) => void;
  getActionCompletion: (
    date: string,
    actionKey: string,
  ) => DailyActionCompletionRecord | null;
  setActionState: (
    date: string,
    actionKey: string,
    state: DailyActionState,
    details?: Pick<
      DailyActionCompletionRecord,
      'domain' | 'kind' | 'riskImpactValue'
    >,
  ) => void;
  setActionCompleted: (
    date: string,
    actionKey: string,
    completed: boolean,
  ) => void;
  getReminder: (date: string, actionKey: string) => ActionReminderRecord | null;
  saveReminder: (record: ActionReminderRecord) => void;
  removeReminder: (date: string, actionKey: string) => void;
  getRestTimer: (date: string, actionKey: string) => RestTimerRecord | null;
  saveRestTimer: (record: RestTimerRecord) => void;
  removeRestTimer: (date: string, actionKey: string) => void;
  getDailyMoment: (date: string, key: string) => DailyMomentRecord | null;
  saveDailyMoment: (record: DailyMomentRecord) => void;
  removeDailyMoment: (date: string, key: string) => void;
  hasCelebratedDailyWin: (date: string) => boolean;
  markDailyWinCelebrated: (date: string) => void;
  getPresentationDay: (date: string) => PresentationDayRecord | null;
  savePresentationDay: (record: PresentationDayRecord) => void;
  savePresentedActions: (record: PresentedDailyActionsRecord) => void;
  getFocusBoost: (date: string) => FocusBoostRecord | null;
  saveFocusBoost: (record: FocusBoostRecord) => void;
  getStreakFreeze: (weekKey: string) => StreakFreezeRecord | null;
  saveStreakFreeze: (record: StreakFreezeRecord) => void;
  getWeeklyCheckpoint: (weekKey: string) => WeeklyCheckpointRecord | null;
  saveWeeklyCheckpoint: (record: WeeklyCheckpointRecord) => void;
  markWeeklyCeremonySeen: (weekKey: string) => void;
  saveShareRecord: (record: WeeklyShareRecord) => void;
  savePendingMommySymptomSelection: (
    record: PendingMommySymptomSelection,
  ) => void;
  removePendingMommySymptomSelection: (
    date: string,
    expectedUpdatedAt?: string,
  ) => void;
  saveEnvironmentalRiskObservation: (
    record: EnvironmentalRiskObservation,
  ) => void;
}

export const recommendationExperienceStorage = createMMKV({
  id: 'mamaair-recommendation-experience',
});

const DATA_KEY_PREFIX = `state:v${RECOMMENDATION_EXPERIENCE_STORAGE_VERSION}:`;
const DEV_RESET_APPLIED_KEY = 'dev-reset-token-applied';

const dataKey = (owner: OwnerNamespace): string =>
  `${DATA_KEY_PREFIX}${owner.key}`;

const emptyPersistedState = (): PersistedRecommendationExperienceState => ({
  version: RECOMMENDATION_EXPERIENCE_STORAGE_VERSION,
  checkIns: {},
  actionCompletions: {},
  reminders: {},
  restTimers: {},
  dailyMoments: {},
  celebratedDates: {},
  presentationDays: {},
  presentedActions: {},
  focusBoosts: {},
  streakFreezes: {},
  weeklyCheckpoints: {},
  shareHistory: [],
  pendingMommySymptomSelections: {},
  environmentalRiskObservations: {},
});

const readPersistedState = (
  owner: OwnerNamespace,
): PersistedRecommendationExperienceState => {
  const raw = recommendationExperienceStorage.getString(dataKey(owner));
  if (!raw) return emptyPersistedState();

  try {
    const parsed = JSON.parse(raw) as PersistedRecommendationExperienceState;
    if (
      parsed.version !== RECOMMENDATION_EXPERIENCE_STORAGE_VERSION ||
      !parsed.checkIns
    ) {
      return emptyPersistedState();
    }
    const actionCompletions = Object.fromEntries(
      Object.entries(parsed.actionCompletions ?? {}).map(([date, records]) => [
        date,
        Object.fromEntries(
          Object.entries(records).map(([actionKey, record]) => [
            actionKey,
            {
              ...record,
              state:
                record.state ?? (record.completed ? 'completed' : 'pending'),
            },
          ]),
        ),
      ]),
    );
    return {
      ...parsed,
      actionCompletions,
      reminders: parsed.reminders ?? {},
      restTimers: parsed.restTimers ?? {},
      dailyMoments: parsed.dailyMoments ?? {},
      celebratedDates: parsed.celebratedDates ?? {},
      presentationDays: parsed.presentationDays ?? {},
      presentedActions: parsed.presentedActions ?? {},
      focusBoosts: parsed.focusBoosts ?? {},
      streakFreezes: parsed.streakFreezes ?? {},
      weeklyCheckpoints: parsed.weeklyCheckpoints ?? {},
      shareHistory: parsed.shareHistory ?? [],
      pendingMommySymptomSelections: parsed.pendingMommySymptomSelections ?? {},
      environmentalRiskObservations: parsed.environmentalRiskObservations ?? {},
    };
  } catch {
    return emptyPersistedState();
  }
};

const writePersistedState = (
  owner: OwnerNamespace,
  state: PersistedRecommendationExperienceState,
): void => {
  recommendationExperienceStorage.set(dataKey(owner), JSON.stringify(state));
};

const mergeCheckIns = (
  previous: Record<string, FeelingCheckInRecord>,
  next: Record<string, FeelingCheckInRecord>,
): Record<string, FeelingCheckInRecord> => {
  const merged = { ...previous };

  Object.entries(next).forEach(([date, record]) => {
    const existing = merged[date];
    if (!existing || record.updatedAt >= existing.updatedAt) {
      merged[date] = record;
    }
  });

  return merged;
};

const mergeActionCompletions = (
  previous: PersistedRecommendationExperienceState['actionCompletions'],
  next: PersistedRecommendationExperienceState['actionCompletions'],
): PersistedRecommendationExperienceState['actionCompletions'] => {
  const merged = { ...previous };

  Object.entries(next).forEach(([date, records]) => {
    const dateRecords = { ...(merged[date] ?? {}) };
    Object.entries(records).forEach(([actionKey, record]) => {
      const existing = dateRecords[actionKey];
      if (!existing || record.updatedAt >= existing.updatedAt) {
        dateRecords[actionKey] = record;
      }
    });
    merged[date] = dateRecords;
  });

  return merged;
};

const mergeDatedRecords = <T extends { updatedAt: string }>(
  previous: Record<string, Record<string, T>>,
  next: Record<string, Record<string, T>>,
): Record<string, Record<string, T>> => {
  const merged = { ...previous };
  Object.entries(next).forEach(([date, records]) => {
    const dateRecords = { ...(merged[date] ?? {}) };
    Object.entries(records).forEach(([key, record]) => {
      const existing = dateRecords[key];
      if (!existing || record.updatedAt >= existing.updatedAt) {
        dateRecords[key] = record;
      }
    });
    merged[date] = dateRecords;
  });
  return merged;
};

const mergePresentationDays = <T extends { updatedAt: string }>(
  previous: Record<string, T>,
  next: Record<string, T>,
): Record<string, T> => {
  const merged = { ...previous };
  Object.entries(next).forEach(([date, record]) => {
    const existing = merged[date];
    if (!existing || record.updatedAt >= existing.updatedAt) {
      merged[date] = record;
    }
  });
  return merged;
};

const stateFromStore = (
  state: RecommendationExperienceStore,
): PersistedRecommendationExperienceState => ({
  version: RECOMMENDATION_EXPERIENCE_STORAGE_VERSION,
  checkIns: state.checkIns,
  actionCompletions: state.actionCompletions,
  reminders: state.reminders,
  restTimers: state.restTimers,
  dailyMoments: state.dailyMoments,
  celebratedDates: state.celebratedDates,
  presentationDays: state.presentationDays,
  presentedActions: state.presentedActions,
  focusBoosts: state.focusBoosts,
  streakFreezes: state.streakFreezes,
  weeklyCheckpoints: state.weeklyCheckpoints,
  shareHistory: state.shareHistory,
  pendingMommySymptomSelections: state.pendingMommySymptomSelections,
  environmentalRiskObservations: state.environmentalRiskObservations,
});

const applyDevelopmentReset = (): void => {
  if (!__DEV__) return;

  const appliedToken = recommendationExperienceStorage.getNumber(
    DEV_RESET_APPLIED_KEY,
  );
  if (appliedToken === DEV_RECOMMENDATION_EXPERIENCE_RESET_TOKEN) return;

  recommendationExperienceStorage.clearAll();
  recommendationExperienceStorage.set(
    DEV_RESET_APPLIED_KEY,
    DEV_RECOMMENDATION_EXPERIENCE_RESET_TOKEN,
  );
};

applyDevelopmentReset();

const initialProfile = useUserStore.getState().profile;
const initialOwner = resolveOwnerNamespace({
  backendUserId: initialProfile.backendUserId,
  email: initialProfile.email,
});
const initialPersistedState = readPersistedState(initialOwner);

export const useRecommendationExperienceStore =
  create<RecommendationExperienceStore>((set, get) => ({
    owner: initialOwner,
    checkIns: initialPersistedState.checkIns,
    actionCompletions: initialPersistedState.actionCompletions,
    reminders: initialPersistedState.reminders,
    restTimers: initialPersistedState.restTimers,
    dailyMoments: initialPersistedState.dailyMoments,
    celebratedDates: initialPersistedState.celebratedDates,
    presentationDays: initialPersistedState.presentationDays,
    presentedActions: initialPersistedState.presentedActions,
    focusBoosts: initialPersistedState.focusBoosts,
    streakFreezes: initialPersistedState.streakFreezes,
    weeklyCheckpoints: initialPersistedState.weeklyCheckpoints,
    shareHistory: initialPersistedState.shareHistory,
    pendingMommySymptomSelections:
      initialPersistedState.pendingMommySymptomSelections,
    environmentalRiskObservations:
      initialPersistedState.environmentalRiskObservations,
    ensureOwner: identity => {
      const nextOwner = resolveOwnerNamespace(identity);
      const previousOwner = get().owner;
      if (previousOwner.key === nextOwner.key) return;

      const previousState: PersistedRecommendationExperienceState = {
        ...stateFromStore(get()),
      };
      const nextState = readPersistedState(nextOwner);

      if (shouldMigrateOwnerState(previousOwner, nextOwner)) {
        const migratedState: PersistedRecommendationExperienceState = {
          version: RECOMMENDATION_EXPERIENCE_STORAGE_VERSION,
          checkIns: mergeCheckIns(nextState.checkIns, previousState.checkIns),
          actionCompletions: mergeActionCompletions(
            nextState.actionCompletions,
            previousState.actionCompletions,
          ),
          reminders: mergeDatedRecords(
            nextState.reminders,
            previousState.reminders,
          ),
          restTimers: mergeDatedRecords(
            nextState.restTimers,
            previousState.restTimers,
          ),
          dailyMoments: mergeDatedRecords(
            nextState.dailyMoments,
            previousState.dailyMoments,
          ),
          celebratedDates: {
            ...previousState.celebratedDates,
            ...nextState.celebratedDates,
          },
          presentationDays: mergePresentationDays(
            nextState.presentationDays,
            previousState.presentationDays,
          ),
          presentedActions: mergePresentationDays(
            nextState.presentedActions,
            previousState.presentedActions,
          ),
          focusBoosts: {
            ...previousState.focusBoosts,
            ...nextState.focusBoosts,
          },
          streakFreezes: {
            ...previousState.streakFreezes,
            ...nextState.streakFreezes,
          },
          weeklyCheckpoints: {
            ...previousState.weeklyCheckpoints,
            ...nextState.weeklyCheckpoints,
          },
          shareHistory: [
            ...previousState.shareHistory,
            ...nextState.shareHistory,
          ].filter(
            (record, index, all) =>
              all.findIndex(
                item =>
                  item.weekKey === record.weekKey &&
                  item.initiatedAt === record.initiatedAt,
              ) === index,
          ),
          pendingMommySymptomSelections: mergePresentationDays(
            nextState.pendingMommySymptomSelections,
            previousState.pendingMommySymptomSelections,
          ),
          environmentalRiskObservations: mergePresentationDays(
            nextState.environmentalRiskObservations,
            previousState.environmentalRiskObservations,
          ),
        };
        writePersistedState(nextOwner, migratedState);
        recommendationExperienceStorage.remove(dataKey(previousOwner));
        set({
          owner: nextOwner,
          checkIns: migratedState.checkIns,
          actionCompletions: migratedState.actionCompletions,
          reminders: migratedState.reminders,
          restTimers: migratedState.restTimers,
          dailyMoments: migratedState.dailyMoments,
          celebratedDates: migratedState.celebratedDates,
          presentationDays: migratedState.presentationDays,
          presentedActions: migratedState.presentedActions,
          focusBoosts: migratedState.focusBoosts,
          streakFreezes: migratedState.streakFreezes,
          weeklyCheckpoints: migratedState.weeklyCheckpoints,
          shareHistory: migratedState.shareHistory,
          pendingMommySymptomSelections:
            migratedState.pendingMommySymptomSelections,
          environmentalRiskObservations:
            migratedState.environmentalRiskObservations,
        });
        return;
      }

      set({
        owner: nextOwner,
        checkIns: nextState.checkIns,
        actionCompletions: nextState.actionCompletions,
        reminders: nextState.reminders,
        restTimers: nextState.restTimers,
        dailyMoments: nextState.dailyMoments,
        celebratedDates: nextState.celebratedDates,
        presentationDays: nextState.presentationDays,
        presentedActions: nextState.presentedActions,
        focusBoosts: nextState.focusBoosts,
        streakFreezes: nextState.streakFreezes,
        weeklyCheckpoints: nextState.weeklyCheckpoints,
        shareHistory: nextState.shareHistory,
        pendingMommySymptomSelections: nextState.pendingMommySymptomSelections,
        environmentalRiskObservations: nextState.environmentalRiskObservations,
      });
    },
    getCheckIn: date => get().checkIns[date] ?? null,
    saveCheckIn: record => {
      const nextCheckIns = {
        ...get().checkIns,
        [record.date]: record,
      };
      const persistedState = {
        ...stateFromStore(get()),
        checkIns: nextCheckIns,
      };
      writePersistedState(get().owner, persistedState);
      set({ checkIns: nextCheckIns });
    },
    getActionCompletion: (date, actionKey) =>
      get().actionCompletions[date]?.[actionKey] ?? null,
    setActionState: (date, actionKey, actionState, details) => {
      const nextActionCompletions = {
        ...get().actionCompletions,
        [date]: {
          ...(get().actionCompletions[date] ?? {}),
          [actionKey]: {
            ...(get().actionCompletions[date]?.[actionKey] ?? {}),
            ...details,
            state: actionState,
            completed: actionState === 'completed',
            updatedAt: new Date().toISOString(),
          },
        },
      };
      const persistedState = {
        ...stateFromStore(get()),
        actionCompletions: nextActionCompletions,
      };
      writePersistedState(get().owner, persistedState);
      set({ actionCompletions: nextActionCompletions });
    },
    setActionCompleted: (date, actionKey, completed) =>
      get().setActionState(
        date,
        actionKey,
        completed ? 'completed' : 'pending',
      ),
    getReminder: (date, actionKey) =>
      get().reminders[date]?.[actionKey] ?? null,
    saveReminder: record => {
      const reminders = {
        ...get().reminders,
        [record.date]: {
          ...(get().reminders[record.date] ?? {}),
          [record.actionKey]: record,
        },
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        reminders,
      });
      set({ reminders });
    },
    removeReminder: (date, actionKey) => {
      const dateRecords = { ...(get().reminders[date] ?? {}) };
      delete dateRecords[actionKey];
      const reminders = {
        ...get().reminders,
        [date]: dateRecords,
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        reminders,
      });
      set({ reminders });
    },
    getRestTimer: (date, actionKey) =>
      get().restTimers[date]?.[actionKey] ?? null,
    saveRestTimer: record => {
      const restTimers = {
        ...get().restTimers,
        [record.date]: {
          ...(get().restTimers[record.date] ?? {}),
          [record.actionKey]: record,
        },
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        restTimers,
      });
      set({ restTimers });
    },
    removeRestTimer: (date, actionKey) => {
      const dateRecords = { ...(get().restTimers[date] ?? {}) };
      delete dateRecords[actionKey];
      const restTimers = {
        ...get().restTimers,
        [date]: dateRecords,
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        restTimers,
      });
      set({ restTimers });
    },
    getDailyMoment: (date, key) => get().dailyMoments[date]?.[key] ?? null,
    saveDailyMoment: record => {
      const dailyMoments = {
        ...get().dailyMoments,
        [record.date]: {
          ...(get().dailyMoments[record.date] ?? {}),
          [record.key]: record,
        },
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        dailyMoments,
      });
      set({ dailyMoments });
    },
    removeDailyMoment: (date, key) => {
      const dateRecords = { ...(get().dailyMoments[date] ?? {}) };
      delete dateRecords[key];
      const dailyMoments = {
        ...get().dailyMoments,
        [date]: dateRecords,
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        dailyMoments,
      });
      set({ dailyMoments });
    },
    hasCelebratedDailyWin: date => Boolean(get().celebratedDates[date]),
    markDailyWinCelebrated: date => {
      const celebratedDates = {
        ...get().celebratedDates,
        [date]: new Date().toISOString(),
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        celebratedDates,
      });
      set({ celebratedDates });
    },
    getPresentationDay: date => get().presentationDays[date] ?? null,
    savePresentationDay: record => {
      const presentationDays = {
        ...get().presentationDays,
        [record.date]: record,
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        presentationDays,
      });
      set({ presentationDays });
    },
    savePresentedActions: record => {
      const presentedActions = {
        ...get().presentedActions,
        [record.date]: record,
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        presentedActions,
      });
      set({ presentedActions });
    },
    getFocusBoost: date => get().focusBoosts[date] ?? null,
    saveFocusBoost: record => {
      const focusBoosts = {
        ...get().focusBoosts,
        [record.date]: record,
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        focusBoosts,
      });
      set({ focusBoosts });
    },
    getStreakFreeze: weekKey => get().streakFreezes[weekKey] ?? null,
    saveStreakFreeze: record => {
      const streakFreezes = {
        ...get().streakFreezes,
        [record.weekKey]: record,
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        streakFreezes,
      });
      set({ streakFreezes });
    },
    getWeeklyCheckpoint: weekKey => get().weeklyCheckpoints[weekKey] ?? null,
    saveWeeklyCheckpoint: record => {
      const weeklyCheckpoints = {
        ...get().weeklyCheckpoints,
        [record.weekKey]: record,
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        weeklyCheckpoints,
      });
      set({ weeklyCheckpoints });
    },
    markWeeklyCeremonySeen: weekKey => {
      const existing = get().weeklyCheckpoints[weekKey];
      if (!existing?.reachedAt || existing.ceremonySeenAt) return;
      get().saveWeeklyCheckpoint({
        ...existing,
        ceremonySeenAt: new Date().toISOString(),
      });
    },
    saveShareRecord: record => {
      const shareHistory = [...get().shareHistory, record];
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        shareHistory,
      });
      set({ shareHistory });
    },
    savePendingMommySymptomSelection: record => {
      const pendingMommySymptomSelections = {
        ...get().pendingMommySymptomSelections,
        [record.date]: record,
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        pendingMommySymptomSelections,
      });
      set({ pendingMommySymptomSelections });
    },
    removePendingMommySymptomSelection: (date, expectedUpdatedAt) => {
      const current = get().pendingMommySymptomSelections[date];
      if (
        !current ||
        (expectedUpdatedAt && current.updatedAt !== expectedUpdatedAt)
      ) {
        return;
      }
      const pendingMommySymptomSelections = {
        ...get().pendingMommySymptomSelections,
      };
      delete pendingMommySymptomSelections[date];
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        pendingMommySymptomSelections,
      });
      set({ pendingMommySymptomSelections });
    },
    saveEnvironmentalRiskObservation: record => {
      const existing = get().environmentalRiskObservations[record.date];
      const environmentalRiskObservations = {
        ...get().environmentalRiskObservations,
        [record.date]: {
          ...existing,
          ...record,
          mother: record.mother ?? existing?.mother,
          baby: record.baby ?? existing?.baby,
        },
      };
      writePersistedState(get().owner, {
        ...stateFromStore(get()),
        environmentalRiskObservations,
      });
      set({ environmentalRiskObservations });
    },
  }));
