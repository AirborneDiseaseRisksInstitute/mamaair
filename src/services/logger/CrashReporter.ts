import { storage } from '../../store/useAuthStore';

// Persists uncaught JS errors so the NEXT app launch can surface them.
// This is the minimum-effort substitute for Sentry/Crashlytics — enough to
// diagnose customer crashes when the user can't run adb logcat themselves.

const LAST_CRASH_KEY = 'last_crash';
const LAST_CRASH_TIME_KEY = 'last_crash_at';
const PREVIOUS_RUN_CRASH_KEY = 'previous_run_crash';

interface CrashRecord {
  message: string;
  stack: string;
  isFatal: boolean;
  at: string;
  build: string;
}

let installed = false;

export function installCrashReporter(buildId: string) {
  if (installed) return;
  installed = true;

  // Promote any prior-run crash so the app can show it on next launch
  // without racing the new run's own crashes.
  const prior = storage.getString(LAST_CRASH_KEY);
  if (prior) {
    storage.set(PREVIOUS_RUN_CRASH_KEY, prior);
    storage.remove(LAST_CRASH_KEY);
    storage.remove(LAST_CRASH_TIME_KEY);
  }

  const ErrorUtils = (globalThis as any).ErrorUtils;
  if (!ErrorUtils || typeof ErrorUtils.setGlobalHandler !== 'function') {
    console.warn('[CrashReporter] ErrorUtils unavailable — global handler not installed');
    return;
  }

  const original = ErrorUtils.getGlobalHandler?.();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    try {
      const record: CrashRecord = {
        message: String(error?.message || error),
        stack: String(error?.stack || ''),
        isFatal: !!isFatal,
        at: new Date().toISOString(),
        build: buildId,
      };
      storage.set(LAST_CRASH_KEY, JSON.stringify(record));
      storage.set(LAST_CRASH_TIME_KEY, record.at);
    } catch {
      // Storage failure — nothing to do, don't compound the crash.
    }
    // Re-throw to RN's default handler so red-box / native crash dialog still appear in dev.
    if (typeof original === 'function') {
      try { original(error, isFatal); } catch {}
    }
  });

  // Catch unhandled Promise rejections too — Android 14+ SIGABRTs on these.
  const tracking = require('promise/setimmediate/rejection-tracking');
  if (tracking && typeof tracking.enable === 'function') {
    tracking.enable({
      allRejections: true,
      onUnhandled: (id: number, error: any) => {
        try {
          const record: CrashRecord = {
            message: `Unhandled promise rejection: ${error?.message || error}`,
            stack: String(error?.stack || ''),
            isFatal: false,
            at: new Date().toISOString(),
            build: buildId,
          };
          storage.set(LAST_CRASH_KEY, JSON.stringify(record));
          storage.set(LAST_CRASH_TIME_KEY, record.at);
        } catch {}
        console.warn(`[CrashReporter] Unhandled rejection #${id}:`, error);
      },
      onHandled: () => {},
    });
  }
}

export function getPreviousRunCrash(): CrashRecord | null {
  const raw = storage.getString(PREVIOUS_RUN_CRASH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CrashRecord;
  } catch {
    return null;
  }
}

export function clearPreviousRunCrash() {
  storage.remove(PREVIOUS_RUN_CRASH_KEY);
}

export function getLastCrash(): CrashRecord | null {
  const raw = storage.getString(LAST_CRASH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CrashRecord;
  } catch {
    return null;
  }
}
