import { useCallback, useEffect, useState } from 'react';

export const DEFAULT_AUTH_REQUEST_COOLDOWN_SECONDS = 60;

export type AuthRequestCooldownScope = 'registration' | 'password-reset';

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const cooldowns = new Map<string, number>();
const getCooldownKey = (scope: AuthRequestCooldownScope, email: string) =>
  `${scope}:${normalizeEmail(email)}`;

export const clearAuthRequestCooldowns = () => cooldowns.clear();

export const getRetryAfterSeconds = (
  error: any,
  fallbackSeconds = DEFAULT_AUTH_REQUEST_COOLDOWN_SECONDS,
): number => {
  const headers = error?.response?.headers;
  const headerValue =
    headers?.['retry-after'] ??
    headers?.['Retry-After'] ??
    (typeof headers?.get === 'function' ? headers.get('retry-after') : undefined);
  const value = headerValue ?? error?.response?.data?.retry_after;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.ceil(value));
  }

  if (typeof value === 'string') {
    const seconds = Number(value);
    if (Number.isFinite(seconds)) {
      return Math.max(1, Math.ceil(seconds));
    }

    const retryAt = Date.parse(value);
    if (Number.isFinite(retryAt)) {
      return Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
    }
  }

  return fallbackSeconds;
};

export const useAuthRequestCooldown = (
  scope: AuthRequestCooldownScope,
  email: string,
) => {
  const [, refresh] = useState(0);
  const normalizedEmail = normalizeEmail(email);

  const getRemainingSeconds = useCallback((targetEmail: string) => {
    const key = getCooldownKey(scope, targetEmail);
    const endsAt = cooldowns.get(key) ?? 0;
    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (remaining === 0) cooldowns.delete(key);
    return remaining;
  }, [scope]);

  const startCooldown = useCallback(
    (
      targetEmail: string,
      seconds = DEFAULT_AUTH_REQUEST_COOLDOWN_SECONDS,
    ) => {
      cooldowns.set(
        getCooldownKey(scope, targetEmail),
        Date.now() + Math.max(1, seconds) * 1000,
      );
      refresh(value => value + 1);
    },
    [scope],
  );

  const secondsRemaining = getRemainingSeconds(normalizedEmail);

  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const timeout = setTimeout(() => {
      refresh(value => value + 1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [secondsRemaining]);

  return {
    secondsRemaining,
    isCoolingDown: secondsRemaining > 0,
    getRemainingSeconds,
    startCooldown,
  };
};
