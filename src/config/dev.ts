/**
 * Development Mode Configuration
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  BEFORE PRODUCTION / APK BUILD:                         │
 * │  Set DEV_ENABLED = false  ← this is the ONLY change     │
 * │  needed to disable all dev features at once.            │
 * └─────────────────────────────────────────────────────────┘
 */

const DEV_ENABLED = false;

// DEV features must never be available in a release bundle, even if this
// source flag is accidentally left enabled.
export const DEV_MODE: boolean = __DEV__ && DEV_ENABLED;

/**
 * Runs the app as a local, unauthenticated development session.
 *
 * Authenticated API reads/writes are skipped or allowed to fail locally
 * without redirecting the app to Sign In. The normal API-first session is
 * unchanged when this flag is false.
 */
export const DEV_LOCAL_SESSION: boolean = DEV_MODE;

/**
 * Increment to clear the local DEV profile and feature-owned demo state once
 * on the next launch. This reset is ignored outside a development bundle.
 */
export const DEV_LOCAL_SESSION_RESET_TOKEN = 0;
