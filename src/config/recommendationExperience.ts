import type {
  CapabilityStatus,
  ConfiguredCapabilityStatus,
  RecommendationCapability,
} from '../types/recommendationExperience';
import { DEV_LOCAL_SESSION, DEV_LOCAL_SESSION_RESET_TOKEN } from './dev';

export const RECOMMENDATION_EXPERIENCE_STORAGE_VERSION = 1;
export const RECOMMENDATION_REFERENCE_DATA_ENABLED = true;
// Legacy Daily Tasks remain available for development and rollback analysis,
// but they must not replace the unified Daily Plan in the customer experience.
export const LEGACY_DAILY_TASK_FALLBACK_ENABLED = false;
export const LOCAL_FEELING_CHECK_IN_SUPPLEMENT_ENABLED = false;
export const RISK_IMPACT_DISPLAY_ENABLED = true;
// Keep healthcare service-request screens implemented for the planned backend,
// but do not expose promises or successful submissions before it is connected.
export const HEALTHCARE_SERVICE_REQUESTS_ENABLED = false;
/*
 * Legacy fixed illustrative progress is intentionally disabled. Keep this
 * restore
 * point commented instead of deleting it, but do not use a fixed value in
 * runtime data.
 *
 * export const ILLUSTRATIVE_PROGRESS_ENABLED = false;
 * export const ILLUSTRATIVE_PROGRESS_VALUE = <legacy fixed value>;
 */

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
  dailyPlan: 'available',
  mommySymptoms: 'available',
  wellbeing: 'available',
  dailyCheckIn: 'available',
  dailyTasks: 'available',
  taskCompletion: 'available',
  recommendationSnapshots: 'available',
  recommendationCompletion: 'available',
  unifiedFeelingSupplement: 'notImplemented',
  dailyRecommendations: 'available',
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
  dailyPlan: 'unavailable',
  mommySymptoms: 'unavailable',
  wellbeing: 'unavailable',
  dailyCheckIn: 'unavailable',
  dailyTasks: 'unavailable',
  taskCompletion: 'unavailable',
  recommendationSnapshots: 'unavailable',
  recommendationCompletion: 'unavailable',
  dailyRecommendations: 'unavailable',
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
