import type { RecommendationExperienceIdentity } from '../../types/recommendationExperience';

export type OwnerNamespaceKind = 'backendUser' | 'email' | 'temporary';

export interface OwnerNamespace {
  key: string;
  kind: OwnerNamespaceKind;
  normalizedEmail: string | null;
}

export const normalizeOwnerEmail = (
  email?: string | null,
): string | null => {
  const normalized = email?.trim().toLowerCase();
  return normalized || null;
};

export const resolveOwnerNamespace = (
  identity: RecommendationExperienceIdentity,
): OwnerNamespace => {
  const backendUserId =
    identity.backendUserId === null || identity.backendUserId === undefined
      ? ''
      : String(identity.backendUserId).trim();
  const normalizedEmail = normalizeOwnerEmail(identity.email);

  if (backendUserId) {
    return {
      key: `backend-user:${backendUserId}`,
      kind: 'backendUser',
      normalizedEmail,
    };
  }

  if (normalizedEmail) {
    return {
      key: `email:${normalizedEmail}`,
      kind: 'email',
      normalizedEmail,
    };
  }

  return {
    key: 'temporary:current',
    kind: 'temporary',
    normalizedEmail: null,
  };
};

export const shouldMigrateOwnerState = (
  previous: OwnerNamespace,
  next: OwnerNamespace,
): boolean => {
  if (previous.key === next.key) return false;

  if (previous.kind === 'temporary') {
    return next.kind !== 'temporary';
  }

  return (
    previous.kind === 'email' &&
    next.kind === 'backendUser' &&
    previous.normalizedEmail !== null &&
    previous.normalizedEmail === next.normalizedEmail
  );
};
