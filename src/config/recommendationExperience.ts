import type {
  CapabilityStatus,
  ConfiguredCapabilityStatus,
  RecommendationCapability,
} from '../types/recommendationExperience';
import {
  DEV_LOCAL_SESSION,
  DEV_LOCAL_SESSION_RESET_TOKEN,
} from './dev';

export const RECOMMENDATION_EXPERIENCE_STORAGE_VERSION = 1;
export const RECOMMENDATION_DEMO_FALLBACK_ENABLED = true;
export const ILLUSTRATIVE_PROGRESS_ENABLED = true;
export const ILLUSTRATIVE_PROGRESS_VALUE = 16;

/**
 * Increment this value during development to clear the feature-owned MMKV
 * namespace once on the next app start. Release builds never execute the reset.
 */
export const DEV_RECOMMENDATION_EXPERIENCE_RESET_TOKEN =
  DEV_LOCAL_SESSION_RESET_TOKEN;

/**
 * Capability support is declared here. Runtime responses may make an available
 * capability temporarily unavailable, but they never turn it into
 * "notImplemented".
 */
export const RECOMMENDATION_CAPABILITIES: Record<
  RecommendationCapability,
  ConfiguredCapabilityStatus
> = {
  mommySymptoms: 'available',
  wellbeing: 'available',
  dailyCheckIn: 'available',
  dailyTasks: 'available',
  taskCompletion: 'available',
  recommendationSnapshots: 'available',
  recommendationCompletion: 'available',
  unifiedFeelingSupplement: 'notImplemented',
  dailyRecommendations: 'notImplemented',
  mentalWellbeingContent: 'notImplemented',
  weeklySummary: 'notImplemented',
  exposureHistory: 'available',
  weeklyReportEntitlement: 'notImplemented',
  serviceEscalation: 'notImplemented',
};

/**
 * Explicit capability overrides for the unauthenticated local DEV session.
 * These are configuration decisions, not statuses inferred from API failures.
 */
export const DEV_LOCAL_RECOMMENDATION_CAPABILITY_OVERRIDES: Partial<
  Record<RecommendationCapability, CapabilityStatus>
> = {
  mommySymptoms: 'unavailable',
  wellbeing: 'unavailable',
  dailyCheckIn: 'unavailable',
  dailyTasks: 'unavailable',
  taskCompletion: 'unavailable',
  recommendationSnapshots: 'unavailable',
  recommendationCompletion: 'unavailable',
  exposureHistory: 'unavailable',
};

export const WEEKLY_BADGE_PARTICIPATION_DAYS = 3;
export const FOCUS_BOOST_DURATION_MINUTES = 60;
export const MAX_PRIMARY_DAILY_ACTIONS = 3;

export const resolveRecommendationCapabilityStatus = (
  capability: RecommendationCapability,
  localSession = DEV_LOCAL_SESSION,
): CapabilityStatus =>
  (localSession
    ? DEV_LOCAL_RECOMMENDATION_CAPABILITY_OVERRIDES[capability]
    : undefined) ?? RECOMMENDATION_CAPABILITIES[capability];
