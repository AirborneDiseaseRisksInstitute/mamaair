import type { RecommendationExperienceIdentity } from '../../types/recommendationExperience';
import { normalizeOwnerEmail } from '../recommendationExperience/ownership';

const opaqueOwnerKey = (value: string): string => {
  let first = 2166136261;
  let second = 2246822519;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    // Two independently seeded FNV-style hashes keep raw identifiers out of
    // the location database while remaining stable across app launches.
    // eslint-disable-next-line no-bitwise
    first ^= code;
    first = Math.imul(first, 16777619);
    // eslint-disable-next-line no-bitwise
    second ^= code;
    second = Math.imul(second, 3266489917);
  }

  // eslint-disable-next-line no-bitwise
  return `owner:v1:${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
};

export const resolveLocationOwnerKeys = (
  identity: RecommendationExperienceIdentity,
): string[] => {
  const keys: string[] = [];
  const backendUserId =
    identity.backendUserId === null || identity.backendUserId === undefined
      ? ''
      : String(identity.backendUserId).trim();
  const normalizedEmail = normalizeOwnerEmail(identity.email);

  if (backendUserId) {
    keys.push(opaqueOwnerKey(`backend-user:${backendUserId}`));
  }
  if (normalizedEmail) {
    keys.push(opaqueOwnerKey(`email:${normalizedEmail}`));
  }

  return [...new Set(keys)];
};
