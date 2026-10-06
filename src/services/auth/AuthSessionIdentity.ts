/**
 * Decides whether persisted profile data belongs to the authenticated user
 * returned by the profile endpoint. A stable backend ID is required before
 * clearing anything, so an incomplete or ambiguous response cannot discard
 * locally saved onboarding work.
 */
export const shouldReplaceLocalProfileForAuthenticatedUser = (
  localBackendUserId: string | number | null | undefined,
  authenticatedBackendUserId: string | number | null | undefined,
): boolean => {
  const authenticatedId = String(authenticatedBackendUserId ?? '').trim();

  if (!authenticatedId) return false;

  const localId = String(localBackendUserId ?? '').trim();
  return localId !== authenticatedId;
};

export const shouldCarryForwardPreAuthLanguage = (
  localBackendUserId: string | number | null | undefined,
  localLanguage: string | null | undefined,
): boolean => {
  const localId = String(localBackendUserId ?? '').trim();
  const language = String(localLanguage ?? '').trim();

  return !localId && Boolean(language);
};
