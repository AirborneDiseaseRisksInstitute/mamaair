import { create } from 'zustand';
import { useUserStore } from './useUserStore';
import { AuthService } from '../services/api/AuthService';
import { resetInitialLanguagePrompt } from '../utils/initialLanguagePrompt';
import {
  SecureAuthStorage,
  type AuthTokens,
} from '../services/auth/SecureAuthStorage';
import type { RecommendationExperienceIdentity } from '../types/recommendationExperience';
import { createEncryptedMMKV } from '../services/storage/EncryptedStorage';

type SessionPrivacyModule =
  typeof import('../services/privacy/SessionPrivacyService');

export const storage = createEncryptedMMKV();

const LEGACY_ACCESS_TOKEN_KEY = 'auth_token';
const LEGACY_REFRESH_TOKEN_KEY = 'auth_refresh_token';
const SECURE_SESSION_REVOKED_KEY = 'auth_secure_session_revoked';
const SECURE_INSTALL_MARKER_KEY = 'auth_secure_install_marker_v1';

let credentialOperation: Promise<void> = Promise.resolve();
let hydrationPromise: Promise<void> | null = null;
let sessionRevision = 0;

const runCredentialOperation = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = credentialOperation.then(operation, operation);
  credentialOperation = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};

const readLegacyTokens = (): AuthTokens | null => {
  const accessToken = storage.getString(LEGACY_ACCESS_TOKEN_KEY);
  if (!accessToken) return null;
  return {
    accessToken,
    refreshToken: storage.getString(LEGACY_REFRESH_TOKEN_KEY) || null,
  };
};

const clearLegacyTokens = (): void => {
  storage.remove(LEGACY_ACCESS_TOKEN_KEY);
  storage.remove(LEGACY_REFRESH_TOKEN_KEY);
};

const clearSignedOutSessionData = async (
  identity: Pick<RecommendationExperienceIdentity, 'backendUserId' | 'email'>,
): Promise<void> => {
  // Loaded lazily to avoid a cycle through NotificationService -> i18n -> auth.
  const { SessionPrivacyService } =
    require('../services/privacy/SessionPrivacyService') as SessionPrivacyModule;
  await SessionPrivacyService.clearForSignedOutSession(identity);
};

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  hydrateSession: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  clearSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  isHydrated: false,
  hydrateSession: () => {
    if (get().isHydrated) return Promise.resolve();
    if (hydrationPromise) return hydrationPromise;
    const expectedRevision = sessionRevision;

    hydrationPromise = runCredentialOperation(async () => {
      const legacyTokens = readLegacyTokens();
      const installMarkerExists =
        storage.getBoolean(SECURE_INSTALL_MARKER_KEY) === true;

      if (storage.getBoolean(SECURE_SESSION_REVOKED_KEY) === true) {
        try {
          await SecureAuthStorage.clear();
          storage.remove(SECURE_SESSION_REVOKED_KEY);
        } catch {
          // Keep the tombstone so a failed secure deletion cannot restore a
          // locally logged-out session on a later launch.
        }
        clearLegacyTokens();
        storage.set(SECURE_INSTALL_MARKER_KEY, true);
        set({ token: null, refreshToken: null, isHydrated: true });
        return;
      }

      try {
        const secureTokens = await SecureAuthStorage.read();
        if (expectedRevision !== sessionRevision) return;

        // iOS Keychain items can survive uninstall. MMKV cannot, so the absent
        // marker identifies a stale credential from a previous installation.
        if (secureTokens && !installMarkerExists && !legacyTokens) {
          await SecureAuthStorage.clear();
          storage.set(SECURE_INSTALL_MARKER_KEY, true);
          set({ token: null, refreshToken: null, isHydrated: true });
          return;
        }

        if (secureTokens) {
          storage.set(SECURE_INSTALL_MARKER_KEY, true);
          clearLegacyTokens();
          set({
            token: secureTokens.accessToken,
            refreshToken: secureTokens.refreshToken,
            isHydrated: true,
          });
          return;
        }

        if (legacyTokens) {
          await SecureAuthStorage.write(legacyTokens);
          if (expectedRevision !== sessionRevision) return;
          storage.set(SECURE_INSTALL_MARKER_KEY, true);
          clearLegacyTokens();
          set({
            token: legacyTokens.accessToken,
            refreshToken: legacyTokens.refreshToken,
            isHydrated: true,
          });
          return;
        }

        storage.set(SECURE_INSTALL_MARKER_KEY, true);
        set({ token: null, refreshToken: null, isHydrated: true });
      } catch (error) {
        if (expectedRevision !== sessionRevision) return;
        // A transient Keychain/Keystore failure must not log out an existing
        // user. Keep legacy credentials for this process and retry migration
        // after the next cold start.
        if (legacyTokens) {
          set({
            token: legacyTokens.accessToken,
            refreshToken: legacyTokens.refreshToken,
            isHydrated: true,
          });
          return;
        }

        set({ isHydrated: false });
        throw error;
      }
    }).finally(() => {
      hydrationPromise = null;
    });

    return hydrationPromise;
  },
  setToken: token => {
    const expectedRevision = sessionRevision;
    const expectedRefreshToken = get().refreshToken;
    return runCredentialOperation(async () => {
      if (
        expectedRevision !== sessionRevision ||
        get().refreshToken !== expectedRefreshToken
      ) {
        throw new Error('Auth session changed while updating the access token.');
      }
      await SecureAuthStorage.write({
        accessToken: token,
        refreshToken: expectedRefreshToken,
      });
      if (
        expectedRevision !== sessionRevision ||
        get().refreshToken !== expectedRefreshToken
      ) {
        throw new Error('Auth session changed while updating the access token.');
      }
      storage.set(SECURE_INSTALL_MARKER_KEY, true);
      clearLegacyTokens();
      storage.remove(SECURE_SESSION_REVOKED_KEY);
      set({ token, isHydrated: true });
    });
  },
  setTokens: (accessToken, refreshToken) => {
    const expectedRevision = sessionRevision;
    return runCredentialOperation(async () => {
      if (expectedRevision !== sessionRevision) {
        throw new Error('Auth session changed while storing new credentials.');
      }
      await SecureAuthStorage.write({ accessToken, refreshToken });
      if (expectedRevision !== sessionRevision) {
        throw new Error('Auth session changed while storing new credentials.');
      }
      sessionRevision += 1;
      storage.set(SECURE_INSTALL_MARKER_KEY, true);
      clearLegacyTokens();
      storage.remove(SECURE_SESSION_REVOKED_KEY);
      set({ token: accessToken, refreshToken, isHydrated: true });
    });
  },
  clearSession: () => {
    const profile = useUserStore.getState().profile;
    const privacyCleanup = clearSignedOutSessionData({
      backendUserId: profile.backendUserId,
      email: profile.email,
    });
    sessionRevision += 1;
    storage.set(SECURE_SESSION_REVOKED_KEY, true);
    clearLegacyTokens();
    resetInitialLanguagePrompt();
    set({ token: null, refreshToken: null, isHydrated: true });
    useUserStore.getState().clearUser();
    return runCredentialOperation(async () => {
      await Promise.all([SecureAuthStorage.clear(), privacyCleanup]);
      storage.remove(SECURE_SESSION_REVOKED_KEY);
      storage.set(SECURE_INSTALL_MARKER_KEY, true);
    });
  },
  logout: () => {
    const refresh = get().refreshToken;
    if (refresh) {
      AuthService.logout(refresh).catch(() => {});
    }
    return get().clearSession();
  },
}));
