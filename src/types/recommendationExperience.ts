export type RecommendationCapability =
  | 'mommySymptoms'
  | 'wellbeing'
  | 'dailyCheckIn'
  | 'dailyTasks'
  | 'taskCompletion'
  | 'recommendationSnapshots'
  | 'recommendationCompletion'
  | 'unifiedFeelingSupplement'
  | 'dailyRecommendations'
  | 'mentalWellbeingContent'
  | 'weeklySummary'
  | 'exposureHistory'
  | 'weeklyReportEntitlement'
  | 'serviceEscalation';

export type ConfiguredCapabilityStatus = 'available' | 'notImplemented';
export type CapabilityStatus = ConfiguredCapabilityStatus | 'unavailable';

export interface CapabilityState {
  configuredStatus: ConfiguredCapabilityStatus;
  status: CapabilityStatus;
}

export type CheckInItemKind = 'mommySymptom' | 'mood' | 'wellbeingFeeling';

export type CheckInItemGroup = 'wellbeing' | 'physical' | 'warning';

export interface FeelingCheckInItem {
  key: string;
  kind: CheckInItemKind;
  group: CheckInItemGroup;
  name: string;
  emoji?: string;
  apiId?: number;
  displayPriority?: number;
  source: 'api' | 'localFallback';
}

export interface FeelingCheckInSelection {
  mommySymptomKeys: string[];
  moodKeys: string[];
  feelingKeys: string[];
  waterIncrementMl: number;
}

export type BackendWriteStatus =
  | 'notAttempted'
  | 'saved'
  | 'failed'
  | 'skipped';

export interface FeelingCheckInWriteStatus {
  mommySymptoms: BackendWriteStatus;
  wellbeing: BackendWriteStatus;
  dailyCheckIn: BackendWriteStatus;
}

export interface FeelingCheckInRecord extends FeelingCheckInSelection {
  date: string;
  recordedAt: string;
  updatedAt: string;
  waterDailyTotalMl?: number;
  writeStatus: FeelingCheckInWriteStatus;
}

export interface FeelingCheckInCapabilities {
  mommySymptoms: CapabilityState;
  mommySymptomsSelection: CapabilityState;
  wellbeing: CapabilityState;
  wellbeingLog: CapabilityState;
  dailyCheckIn: CapabilityState;
  unifiedFeelingSupplement: CapabilityState;
}

export interface FeelingCheckInExperience {
  mommySymptoms: FeelingCheckInItem[];
  moods: FeelingCheckInItem[];
  feelings: FeelingCheckInItem[];
  selection: FeelingCheckInSelection;
  waterDailyTotalMl: number;
  waterGoalMl?: number;
  recordState: 'recorded' | 'unknown';
  capabilities: FeelingCheckInCapabilities;
}

export interface RecommendationExperienceIdentity {
  backendUserId?: string | number | null;
  email?: string | null;
}

export interface FeelingCheckInSubmitResult {
  record: FeelingCheckInRecord;
  savedRemotely: boolean;
  partiallySaved: boolean;
}

export type DailyActionDomain = 'diet' | 'activity' | 'behaviour' | 'wellbeing';

export type DailyActionSource =
  | 'apiDailyTask'
  | 'apiRecommendation'
  | 'localFallback'
  | 'sample';

export type DailyActionState = 'pending' | 'planned' | 'completed';

export type DailyActionBackendReference =
  | {
      kind: 'dailyTask';
      code: string;
    }
  | {
      kind: 'recommendation';
      snapshotId: number;
      ruleId: string;
      ruleVersion: number;
      dimension: string;
    };

export interface DailyPlanAction {
  key: string;
  domain: DailyActionDomain;
  title: string;
  purpose: string;
  priority: number;
  source: DailyActionSource;
  state: DailyActionState;
  completed: boolean;
  backendReference?: DailyActionBackendReference;
}

export type DailyPlanAdditionalActions = Record<
  DailyActionDomain,
  DailyPlanAction[]
>;

export interface DailyPlanExperience {
  date: string;
  primaryActions: DailyPlanAction[];
  additionalActions: DailyPlanAdditionalActions;
  backendCompletedTaskCodes: string[];
}

export interface DailyActionCompletionRecord {
  state: DailyActionState;
  completed: boolean;
  domain?: DailyActionDomain;
  kind?: 'primary' | 'extra';
  updatedAt: string;
}

export interface PresentedDailyActionsRecord {
  date: string;
  actionKeys: string[];
  updatedAt: string;
}

export type ActionReminderStatus = 'scheduled' | 'planned';

export interface ActionReminderRecord {
  actionKey: string;
  date: string;
  notificationId: string;
  hour: number;
  minute: number;
  scheduledFor: string;
  status: ActionReminderStatus;
  updatedAt: string;
}

export type RestTimerStatus = 'running' | 'ready' | 'completed';

export interface RestTimerRecord {
  actionKey: string;
  date: string;
  durationSeconds: number;
  startedAt: string;
  endsAt: string;
  status: RestTimerStatus;
  updatedAt: string;
}

export type DailyMomentKind =
  | 'rest'
  | 'stretch'
  | 'ventilation'
  | 'sleep'
  | 'review';

export interface DailyMomentRecord {
  key: string;
  date: string;
  kind: DailyMomentKind;
  completed: boolean;
  durationMinutes?: number;
  recordedAt: string;
  updatedAt: string;
}

export interface PresentationDayRecord {
  scenarioVersion: number;
  date: string;
  pregnancyWeek: number;
  hydrationMl: number;
  hydrationGoalMl: number;
  moodLabel: string;
  feelingLabel: string;
  symptomLabel: string;
  active: boolean;
  primaryCompleted: number;
  primaryTotal: number;
  extraCompleted: number;
  restSessions: number;
  sleepLogged: boolean;
  domains: Record<DailyActionDomain, boolean>;
  updatedAt: string;
}

export interface WeeklySummaryDay {
  date: string;
  label: string;
  active: boolean;
  primaryCompleted: number;
  primaryTotal: number;
  extraCompleted: number;
  hydrationMl: number;
  hydrationGoalMl: number;
  restSessions: number;
  sleepLogged: boolean;
  moodLabel: string;
  feelingLabel: string;
  symptomLabel: string;
  domains: Record<DailyActionDomain, boolean>;
}

export interface WeeklySummaryExperience {
  dataMode: 'recorded' | 'careContext';
  week: number;
  startDate: string;
  endDate: string;
  days: WeeklySummaryDay[];
  activeDays: number;
  primaryCompleted: number;
  primaryTotal: number;
  adherencePercent: number;
  extraCompleted: number;
  hydrationDays: number;
  restSessions: number;
  sleepNights: number;
  streakDays: number;
  domainParticipation: Record<DailyActionDomain, number>;
  symptomTrend: string;
  motherProgress: string;
  babyProgress: string;
  milestone: string;
  fetalSystems: FetalSystemProgress[];
  nextWeek: WeeklySummaryNextWeek | null;
}

export type WeeklyBadgeDomain = Exclude<DailyActionDomain, 'wellbeing'>;

export interface WeeklyBadge {
  domain: WeeklyBadgeDomain;
  participationDays: number;
  earned: boolean;
}

export interface StreakFreezeRecord {
  weekKey: string;
  protectedDate: string;
  usedAt: string;
}

export interface FocusBoostRecord {
  date: string;
  startedAt: string;
  endsAt: string;
  completedAt?: string;
}

export interface WeeklyCheckpointRecord {
  weekKey: string;
  pregnancyWeek: number;
  reachedAt: string;
  ceremonySeenAt?: string;
}

export interface WeeklyShareRecord {
  weekKey: string;
  pregnancyWeek: number;
  initiatedAt: string;
  completedAt?: string;
}

export interface PregnancyProgression {
  pregnancyWeek: number;
  trimester: 1 | 2 | 3;
  chapterLabel: string;
  journeyPercent: number;
  completed: boolean;
}

export interface StreakProgress {
  days: number;
  freezeAvailable: boolean;
  freezeUsed: boolean;
  protectedDate?: string;
}

export interface WeeklyReportModel {
  weekKey: string;
  pregnancyWeek: number;
  trimesterLabel: string;
  dateRange: string;
  motherRecap: string;
  babyRecap: string;
  symptomTrend: string;
  participation: {
    activeDays: number;
    primaryCompleted: number;
    hydrationDays: number;
    restSessions: number;
    sleepNights: number;
  };
  earnedBadges: WeeklyBadgeDomain[];
  exposureTimeBand?: 'morning' | 'afternoon' | 'evening';
  shareText: string;
}

export type AnalyticsEventName =
  | 'application_session_start'
  | 'daily_flow_start'
  | 'daily_flow_complete'
  | 'session_duration'
  | 'feeling_checkin_complete'
  | 'task_complete'
  | 'domain_participation'
  | 'streak_progress'
  | 'streak_freeze_used'
  | 'focus_boost_start'
  | 'focus_boost_complete'
  | 'week_checkpoint_reached'
  | 'weekly_report_opened'
  | 'share_preview_opened'
  | 'share_initiated'
  | 'share_completed'
  | 'review_mode_opened'
  | 'pregnancy_chapter_progression';

export interface ProductAnalyticsEvent {
  id: string;
  name: AnalyticsEventName;
  occurredAt: string;
  properties: Record<string, string | number | boolean | null>;
}

export type ServiceEscalationUrgency =
  | 'routine'
  | 'prompt'
  | 'urgent'
  | 'emergency';

export interface ServiceEscalationSignal {
  sourceId: string;
  urgency: ServiceEscalationUrgency;
  title: string;
  guidance: string;
  acknowledgementRequired: boolean;
  acknowledgedAt?: string;
}

export interface ExposureTrendPoint {
  date: string;
  integratedScore?: number;
  aqi?: number;
  pm25?: number;
  temperature?: number;
  humidity?: number;
  uvi?: number;
}

export interface FetalSystemProgress {
  iconPath: string;
  percentage: number;
  startsInWeeks?: number;
}

export interface WeeklySummaryNextWeek {
  week: number;
  preview: string;
  systems: FetalSystemProgress[];
}

export type LongitudinalJourneyStep =
  | {
      kind: 'checkIn';
    }
  | {
      kind: 'action';
      actionKey: string;
      reason: 'unfinished' | 'reminder' | 'timer';
    }
  | {
      kind: 'dailyProgress';
    }
  | {
      kind: 'weeklySummary';
    };
