import {
  shouldCarryForwardPreAuthLanguage,
  shouldReplaceLocalProfileForAuthenticatedUser,
} from '../../src/services/auth/AuthSessionIdentity';
import {
  DEV_LOCAL_SESSION,
  DEV_MODE,
} from '../../src/config/dev';

describe('release authentication guards', () => {
  it('keeps all development-only authentication paths disabled', () => {
    expect(DEV_MODE).toBe(false);
    expect(DEV_LOCAL_SESSION).toBe(false);
  });

  it('keeps persisted data only for the same authenticated backend user', () => {
    expect(shouldReplaceLocalProfileForAuthenticatedUser('42', 42)).toBe(false);
    expect(shouldReplaceLocalProfileForAuthenticatedUser(null, 42)).toBe(true);
    expect(shouldReplaceLocalProfileForAuthenticatedUser('41', 42)).toBe(true);
  });

  it('does not clear a profile when the server response has no stable ID', () => {
    expect(shouldReplaceLocalProfileForAuthenticatedUser('42', undefined)).toBe(
      false,
    );
  });

  it('carries forward only a language chosen before the profile is bound to a backend user', () => {
    expect(shouldCarryForwardPreAuthLanguage(null, 'en')).toBe(true);
    expect(shouldCarryForwardPreAuthLanguage(undefined, 'fr')).toBe(true);
    expect(shouldCarryForwardPreAuthLanguage('42', 'en')).toBe(false);
    expect(shouldCarryForwardPreAuthLanguage(null, null)).toBe(false);
  });
});
