jest.mock('../../src/services/api/AuthService', () => ({
  AuthService: { logout: jest.fn(async () => undefined) },
}));

const mockClearForSignedOutSession = jest.fn(
  async (_identity: unknown) => undefined,
);
jest.mock('../../src/services/privacy/SessionPrivacyService', () => ({
  SessionPrivacyService: {
    clearForSignedOutSession: (identity: unknown) =>
      mockClearForSignedOutSession(identity),
  },
}));

import * as Keychain from 'react-native-keychain';
import { SecureAuthStorage } from '../../src/services/auth/SecureAuthStorage';
import { storage, useAuthStore } from '../../src/store/useAuthStore';
import { useUserStore } from '../../src/store/useUserStore';

const keychainMock = Keychain as jest.Mocked<typeof Keychain> & {
  __credentials: Map<
    string,
    { username: string; password: string; service: string }
  >;
};

const resetAuthState = () => {
  useAuthStore.setState({
    token: null,
    refreshToken: null,
    isHydrated: false,
  });
};

describe('secure auth session', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    storage.clearAll();
    keychainMock.__credentials.clear();
    resetAuthState();
  });

  it('migrates existing MMKV tokens only after writing and verifying Keychain', async () => {
    storage.set('auth_token', 'legacy-access');
    storage.set('auth_refresh_token', 'legacy-refresh');

    await useAuthStore.getState().hydrateSession();

    expect(useAuthStore.getState()).toMatchObject({
      token: 'legacy-access',
      refreshToken: 'legacy-refresh',
      isHydrated: true,
    });
    expect(storage.contains('auth_token')).toBe(false);
    expect(storage.contains('auth_refresh_token')).toBe(false);
    await expect(SecureAuthStorage.read()).resolves.toEqual({
      accessToken: 'legacy-access',
      refreshToken: 'legacy-refresh',
    });
    expect(keychainMock.setGenericPassword).toHaveBeenCalledWith(
      'mamaair-auth-session',
      expect.any(String),
      expect.objectContaining({
        service: 'com.mamaair.auth.session.v1',
        accessible: 'AccessibleAfterFirstUnlockThisDeviceOnly',
        cloudSync: false,
        securityLevel: 'SECURE_SOFTWARE',
        storage: 'KeystoreAESGCM_NoAuth',
      }),
    );
  });

  it('keeps legacy tokens and the current session when secure migration fails', async () => {
    storage.set('auth_token', 'legacy-access');
    storage.set('auth_refresh_token', 'legacy-refresh');
    keychainMock.setGenericPassword.mockRejectedValueOnce(
      new Error('Keystore unavailable'),
    );

    await useAuthStore.getState().hydrateSession();

    expect(useAuthStore.getState()).toMatchObject({
      token: 'legacy-access',
      refreshToken: 'legacy-refresh',
      isHydrated: true,
    });
    expect(storage.getString('auth_token')).toBe('legacy-access');
    expect(storage.getString('auth_refresh_token')).toBe('legacy-refresh');
  });

  it('does not interpret a secure-storage read failure as a signed-out user', async () => {
    keychainMock.getGenericPassword.mockRejectedValueOnce(
      new Error('Keystore temporarily unavailable'),
    );

    await expect(useAuthStore.getState().hydrateSession()).rejects.toThrow(
      'Keystore temporarily unavailable',
    );

    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      refreshToken: null,
      isHydrated: false,
    });
  });

  it('does not expose a newly signed-in session when secure storage fails', async () => {
    keychainMock.setGenericPassword.mockRejectedValueOnce(
      new Error('Keystore unavailable'),
    );

    await expect(
      useAuthStore.getState().setTokens('new-access', 'new-refresh'),
    ).rejects.toThrow('Keystore unavailable');

    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      refreshToken: null,
    });
    expect(storage.contains('auth_token')).toBe(false);
    expect(storage.contains('auth_refresh_token')).toBe(false);
  });

  it('prevents a failed secure deletion from restoring a logged-out session', async () => {
    await useAuthStore.getState().setTokens('access', 'refresh');
    keychainMock.resetGenericPassword.mockRejectedValueOnce(
      new Error('Keychain temporarily unavailable'),
    );

    await expect(useAuthStore.getState().clearSession()).rejects.toThrow(
      'Keychain temporarily unavailable',
    );
    expect(useAuthStore.getState().token).toBeNull();
    expect(storage.getBoolean('auth_secure_session_revoked')).toBe(true);

    resetAuthState();
    await useAuthStore.getState().hydrateSession();

    expect(useAuthStore.getState().token).toBeNull();
    expect(storage.contains('auth_secure_session_revoked')).toBe(false);
    await expect(SecureAuthStorage.read()).resolves.toBeNull();
  });

  it('cleans privacy-sensitive data for the identity that is signing out', async () => {
    useUserStore.getState().setProfile({
      backendUserId: '42',
      email: 'person@example.com',
    });

    await useAuthStore.getState().clearSession();

    expect(mockClearForSignedOutSession).toHaveBeenCalledWith({
      backendUserId: '42',
      email: 'person@example.com',
    });
    expect(useUserStore.getState().profile.backendUserId).toBeNull();
    expect(useUserStore.getState().profile.email).toBeNull();
  });

  it('does not restore an access token after logout wins a refresh race', async () => {
    await useAuthStore.getState().setTokens('access', 'refresh');

    const accessUpdate = useAuthStore.getState().setToken('refreshed-access');
    const clearing = useAuthStore.getState().clearSession();

    await expect(accessUpdate).rejects.toThrow('Auth session changed');
    await expect(clearing).resolves.toBeUndefined();
    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      refreshToken: null,
    });
    await expect(SecureAuthStorage.read()).resolves.toBeNull();
  });

  it('does not complete sign-in when logout happens during the secure write', async () => {
    let releaseWrite!: () => void;
    const writeGate = new Promise<void>(resolve => {
      releaseWrite = resolve;
    });
    keychainMock.setGenericPassword.mockImplementationOnce(
      async (username, password, options) => {
        await writeGate;
        const service = options?.service || 'default';
        keychainMock.__credentials.set(service, {
          username,
          password,
          service,
        });
        return { service, storage: 'KeystoreAESGCM_NoAuth' } as any;
      },
    );

    const signIn = useAuthStore.getState().setTokens('access', 'refresh');
    await Promise.resolve();
    expect(keychainMock.setGenericPassword).toHaveBeenCalledTimes(1);

    const clearing = useAuthStore.getState().clearSession();
    releaseWrite();

    await expect(signIn).rejects.toThrow('Auth session changed');
    await expect(clearing).resolves.toBeUndefined();
    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      refreshToken: null,
    });
    await expect(SecureAuthStorage.read()).resolves.toBeNull();
  });

  it('does not restore a session when logout happens during hydration', async () => {
    await SecureAuthStorage.write({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    storage.set('auth_secure_install_marker_v1', true);
    resetAuthState();
    keychainMock.getGenericPassword.mockClear();

    let releaseRead!: () => void;
    const readGate = new Promise<void>(resolve => {
      releaseRead = resolve;
    });
    const storedCredentials = [...keychainMock.__credentials.values()][0];
    keychainMock.getGenericPassword.mockImplementationOnce(async () => {
      await readGate;
      return storedCredentials as any;
    });

    const hydration = useAuthStore.getState().hydrateSession();
    await Promise.resolve();
    expect(keychainMock.getGenericPassword).toHaveBeenCalledTimes(1);

    const clearing = useAuthStore.getState().clearSession();
    releaseRead();

    await expect(hydration).resolves.toBeUndefined();
    await expect(clearing).resolves.toBeUndefined();
    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      refreshToken: null,
      isHydrated: true,
    });
    await expect(SecureAuthStorage.read()).resolves.toBeNull();
  });

  it('rejects a stale iOS Keychain credential from a previous installation', async () => {
    await SecureAuthStorage.write({
      accessToken: 'stale-access',
      refreshToken: 'stale-refresh',
    });
    storage.clearAll();
    resetAuthState();

    await useAuthStore.getState().hydrateSession();

    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      refreshToken: null,
      isHydrated: true,
    });
    await expect(SecureAuthStorage.read()).resolves.toBeNull();
  });
});
