export type RecommendationCapability =
  | 'dailyPlan'
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
  | 'pending'
  | 'failed'
  | 'skipped';

export interface PendingMommySymptomSelection {
  date: string;
  symptomIds: number[];
  recordedAt: string;
  updatedAt: string;
}

export interface FeelingCheckInWriteStatus {
  mommySymptoms: BackendWriteStatus;
  wellbeing: BackendWriteStatus;
  dailyCheckIn: BackendWriteStatus;
}

export interface FeelingCheckInRecord extends FeelingCheckInSelection {
  date: string;
  recordedAt: string;
  updatedAt: string;
  scope?: 'full' | 'symptoms';
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

export type PlanProfileStep =
  | 'IntroStep03'
  | 'IntroStep05'
  | 'IntroStep05Timezone'
  | 'IntroStep11'
  | 'IntroStep06'
  | 'IntroStep07'
  | 'IntroStep08'
  | 'IntroStep09'
  | 'IntroStep10'
  | 'IntroStep10Pregnancy';

export interface PlanInputReadiness {
  ready: boolean;
  profileReady: boolean;
  checkInReady: boolean;
  missingProfileSteps: PlanProfileStep[];
}

export interface FeelingCheckInSubmitResult {
  record: FeelingCheckInRecord;
  savedRemotely: boolean;
  partiallySaved: boolean;
  symptomsPendingSync: boolean;
}

export type BackendDailyPlanDomain =
  | 'nutrition'
  | 'activity'
  | 'behavior'
  | 'mental'
  | 'service';

export type BackendDailyPlanCompletionState =
  | 'not_done'
  | 'completed'
  | 'skipped';

export type DailyActionDomain =
  | 'diet'
  | 'activity'
  | 'behaviour'
  | 'wellbeing'
  | 'service';

export type DailyActionSource =
  | 'apiDailyPlan'
  | 'apiDailyTask'
  | 'apiRecommendation'
  | 'localFallback'
  | 'sample';

export type DailyActionState = 'pending' | 'planned' | 'completed' | 'skipped';

export type DailyActionRiskImpactSource = 'backendAction' | 'allocatedSummary';

export interface DailyActionRiskImpact {
  value: number;
  source: DailyActionRiskImpactSource;
}

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
    }
  | {
      kind: 'dailyPlanAction';
      actionId: string;
      bucket: 'primary' | 'additional' | 'support';
    };

export interface DailyPlanAction {
  key: string;
  domain: DailyActionDomain;
  backendDomain?: BackendDailyPlanDomain;
  backendCompletionState?: BackendDailyPlanCompletionState;
  title: string;
  purpose?: string;
  priority?: number;
  timingLabel?: string;
  durationMinutes?: number;
  durationLabel?: string;
  contextLabel?: string;
  source: DailyActionSource;
  state: DailyActionState;
  completed: boolean;
  riskImpact?: DailyActionRiskImpact;
  backendReference?: DailyActionBackendReference;
}

export type TodayRecommendationPlacement =
  | 'medicalAttention'
  | 'importantGuidance'
  | 'guidance'
  | 'optionalSupport';

export type TodayRecommendationDimension =
  | 'diet'
  | 'activity'
  | 'behaviour'
  | 'wellbeing';

export interface TodayRecommendationText {
  dimension: TodayRecommendationDimension;
  text: string;
}

export interface TodayRecommendationItem {
  key: string;
  placement: TodayRecommendationPlacement;
  id: string;
  ruleId: string;
  ruleVersion: number;
  severity: string;
  category: string;
  priority: number;
  title: string;
  alert?: string;
  message?: string;
  expiresAt?: string;
  engineVersion?: string;
  sources: string[];
  recommendationText: TodayRecommendationText[];
}

export type DailyPlanAdditionalActions = Record<
  DailyActionDomain,
  DailyPlanAction[]
>;

export type DailyPlanRiskImpactSource = 'summaryRisksDelta' | 'backendAction';

export interface DailyPlanRiskImpact {
  totalValue: number;
  source: DailyPlanRiskImpactSource;
  missingBackendActionValues: boolean;
}

export interface DailyPlanExperience {
  date: string;
  timezone?: string;
  source?: 'dailyPlanApi' | 'adviceApi' | 'unifiedApi' | 'legacy';
  riskImpact?: DailyPlanRiskImpact;
  primaryActions: DailyPlanAction[];
  additionalActions: DailyPlanAdditionalActions;
  supportActions: DailyPlanAction[];
  backendCompletedTaskCodes: string[];
  medicalAttention: TodayRecommendationItem[];
  importantGuidanceRecommendations: TodayRecommendationItem[];
  guidanceRecommendations: TodayRecommendationItem[];
  optionalSupportRecommendations: TodayRecommendationItem[];
}

export interface DailyActionCompletionRecord {
  state: DailyActionState;
  completed: boolean;
  domain?: DailyActionDomain;
  kind?: 'primary' | 'extra' | 'support';
  riskImpactValue?: number;
  updatedAt: string;
}

export interface EnvironmentalRiskReading {
  predicted: number;
  afterSelfCare: number;
}

export interface EnvironmentalRiskObservation {
  date: string;
  mother?: EnvironmentalRiskReading;
  baby?: EnvironmentalRiskReading;
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

export type WeeklyActionSummaryDomain = Exclude<DailyActionDomain, 'service'>;

export interface WeeklyDomainActionSummary {
  domain: WeeklyActionSummaryDomain;
  recommended: number;
  completed: number;
}

export interface WeeklySymptomLevelSummary {
  level: 1 | 2 | 3 | 4;
  total: number;
  mommyCount: number;
  babyCount: number;
}

export interface WeeklyRiskSummary {
  identifiedRisks: string[];
  completedActionImpact: number;
  motherRiskDelta?: number;
  babyRiskDelta?: number;
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
  actionSummary: Record<WeeklyActionSummaryDomain, WeeklyDomainActionSummary>;
  symptomLevels: WeeklySymptomLevelSummary[];
  riskSummary: WeeklyRiskSummary | null;
  symptomTrend: string;
  motherProgress: string;
  babyProgress: string;
  milestone: string;
  fetalSystems: FetalSystemProgress[];
  nextWeek: WeeklySummaryNextWeek | null;
}

export type WeeklyBadgeDomain = Exclude<
  DailyActionDomain,
  'wellbeing' | 'service'
>;

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
