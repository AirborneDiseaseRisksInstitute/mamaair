import * as Keychain from 'react-native-keychain';

const AUTH_SESSION_SERVICE = 'com.mamaair.auth.session.v1';
const AUTH_SESSION_USERNAME = 'mamaair-auth-session';
const AUTH_SESSION_VERSION = 1;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string | null;
}

interface StoredAuthSession {
  version: number;
  accessToken: string;
  refreshToken: string | null;
}

const options = {
  service: AUTH_SESSION_SERVICE,
};

const assertAccessToken = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Secure auth session does not contain an access token.');
  }
  return value;
};

const parseStoredSession = (value: string): AuthTokens => {
  const parsed = JSON.parse(value) as Partial<StoredAuthSession>;
  if (parsed.version !== AUTH_SESSION_VERSION) {
    throw new Error('Secure auth session version is not supported.');
  }

  return {
    accessToken: assertAccessToken(parsed.accessToken),
    refreshToken:
      typeof parsed.refreshToken === 'string' && parsed.refreshToken.length > 0
        ? parsed.refreshToken
        : null,
  };
};

const sessionsMatch = (left: AuthTokens, right: AuthTokens): boolean =>
  left.accessToken === right.accessToken &&
  left.refreshToken === right.refreshToken;

export const SecureAuthStorage = {
  read: async (): Promise<AuthTokens | null> => {
    const credentials = await Keychain.getGenericPassword(options);
    if (!credentials) return null;
    if (credentials.username !== AUTH_SESSION_USERNAME) {
      throw new Error('Secure auth session owner is not recognized.');
    }
    return parseStoredSession(credentials.password);
  },

  write: async (tokens: AuthTokens): Promise<void> => {
    const session: StoredAuthSession = {
      version: AUTH_SESSION_VERSION,
      accessToken: assertAccessToken(tokens.accessToken),
      refreshToken:
        typeof tokens.refreshToken === 'string' && tokens.refreshToken.length > 0
          ? tokens.refreshToken
          : null,
    };
    const result = await Keychain.setGenericPassword(
      AUTH_SESSION_USERNAME,
      JSON.stringify(session),
      {
        ...options,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        cloudSync: false,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      },
    );
    if (!result) {
      throw new Error('Secure auth session could not be stored.');
    }

    const verified = await SecureAuthStorage.read();
    if (!verified || !sessionsMatch(verified, session)) {
      await Keychain.resetGenericPassword(options).catch(() => false);
      throw new Error('Secure auth session verification failed.');
    }
  },

  clear: async (): Promise<void> => {
    await Keychain.resetGenericPassword(options);
  },
};
