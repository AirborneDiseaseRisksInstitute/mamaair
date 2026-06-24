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

// Skip sign in and go directly to IntroStep01
export const DEV_MODE = DEV_ENABLED;

// Auto-login with credentials below and bypass login UI entirely
// (useful for Genymotion/emulator where manual sign-in is problematic)
export const DEV_BYPASS_AUTH = DEV_ENABLED;
export const DEV_EMAIL = 'alireza@gmail.com';
export const DEV_PASSWORD = '12345678';
