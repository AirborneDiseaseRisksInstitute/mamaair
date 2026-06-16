/**
 * Development Mode Configuration
 *
 * IMPORTANT: Set all flags to false before production builds!
 */

// Skip sign in and go directly to IntroStep01
export const DEV_MODE = true;

// Auto-login with credentials below and go directly to the app (bypasses login UI entirely)
// Useful for Genymotion emulator where manual sign-in is problematic
export const DEV_BYPASS_AUTH = false;
export const DEV_EMAIL = 'alireza@gmail.com'; // your test account email
export const DEV_PASSWORD = '12345678'; // your test account password
