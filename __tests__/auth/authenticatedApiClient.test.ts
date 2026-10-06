jest.mock('axios', () => {
  const instance = Object.assign(jest.fn(), {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  });

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => instance),
      post: jest.fn(),
    },
    __instance: instance,
  };
});

jest.mock('../../src/store/useAuthStore', () => {
  const state: {
    token: string | null;
    refreshToken: string | null;
  } = {
    token: null,
    refreshToken: null,
  };
  const setToken = jest.fn(async (token: string) => {
    state.token = token;
  });
  const clearSession = jest.fn(async () => {
    state.token = null;
    state.refreshToken = null;
  });

  return {
    useAuthStore: {
      getState: () => ({ ...state, setToken, clearSession }),
    },
    __state: state,
    __setToken: setToken,
    __clearSession: clearSession,
  };
});
jest.mock('../../src/App/navigationRef', () => ({
  resetToAuthLoading: jest.fn(),
}));

import { AuthService } from '../../src/services/api/AuthService';

const axiosMock = jest.requireMock('axios') as {
  default: {
    create: jest.Mock;
    post: jest.Mock;
  };
  __instance: {
    mockResolvedValue: (value: unknown) => void;
    get: jest.Mock;
    post: jest.Mock;
    delete: jest.Mock;
    interceptors: {
      request: { use: jest.Mock };
      response: { use: jest.Mock };
    };
  };
};
const authStoreMock = jest.requireMock('../../src/store/useAuthStore') as {
  __state: { token: string | null; refreshToken: string | null };
  __setToken: jest.Mock;
  __clearSession: jest.Mock;
};
const navigationMock = jest.requireMock('../../src/App/navigationRef') as {
  resetToAuthLoading: jest.Mock;
};
const requestInterceptor =
  axiosMock.__instance.interceptors.request.use.mock.calls[0][0];
const responseErrorInterceptor =
  axiosMock.__instance.interceptors.response.use.mock.calls[0][1];
const createdClientConfig = axiosMock.default.create.mock.calls[0][0];

describe('authenticated API client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStoreMock.__state.token = 'access-token';
    authStoreMock.__state.refreshToken = 'refresh-token';
  });

  it('does not ship the retired shared mobile API key', () => {
    expect(createdClientConfig.headers).toEqual({
      'Content-Type': 'application/json',
    });
    expect(JSON.stringify(createdClientConfig)).not.toContain('X-API-Key');
  });

  it('sends the stored access token when development local sessions are disabled', async () => {
    const config = await requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer access-token');
  });

  it('does not attach a stale access token to auth endpoints', async () => {
    const authUrls = [
      '/auth/google/',
      '/auth/email/login/',
      '/auth/email/register/',
      '/auth/email/resend/',
      '/auth/email/verify/',
      '/auth/password-reset/request/',
      '/auth/password-reset/confirm/',
    ];

    for (const url of authUrls) {
      const config = await requestInterceptor({
        url,
        headers: {},
      });

      expect(config.headers.Authorization).toBeUndefined();
    }
  });

  it('does not refresh or navigate on Google auth validation errors', async () => {
    const error = {
      config: { url: '/auth/google/', headers: {} },
      response: { status: 401 },
    };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);

    expect(axiosMock.default.post).not.toHaveBeenCalled();
    expect(authStoreMock.__clearSession).not.toHaveBeenCalled();
    expect(navigationMock.resetToAuthLoading).not.toHaveBeenCalled();
  });

  it('updates the auth store when a token refresh succeeds', async () => {
    axiosMock.default.post.mockResolvedValue({ data: { access: 'new-access' } });
    (axiosMock.__instance as unknown as jest.Mock).mockResolvedValue({ data: 'retried' });

    await expect(responseErrorInterceptor({
      config: { url: '/profile/', headers: {} },
      response: { status: 401 },
    })).resolves.toEqual({ data: 'retried' });

    expect(authStoreMock.__setToken).toHaveBeenCalledWith('new-access');
    expect(authStoreMock.__state.token).toBe('new-access');
    expect(axiosMock.default.post.mock.calls[0][2]).toEqual({
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('keeps the session after a network error during token refresh', async () => {
    axiosMock.default.post.mockRejectedValue({ code: 'ERR_NETWORK' });

    await expect(responseErrorInterceptor({
      config: { url: '/profile/', headers: {} },
      response: { status: 401 },
    })).rejects.toMatchObject({ code: 'ERR_NETWORK' });

    expect(authStoreMock.__clearSession).not.toHaveBeenCalled();
    expect(navigationMock.resetToAuthLoading).not.toHaveBeenCalled();
    expect(authStoreMock.__state.refreshToken).toBe('refresh-token');
  });

  it('clears the session after an invalid refresh token', async () => {
    axiosMock.default.post.mockRejectedValue({ response: { status: 401 } });

    await expect(responseErrorInterceptor({
      config: { url: '/profile/', headers: {} },
      response: { status: 401 },
    })).rejects.toMatchObject({ response: { status: 401 } });

    expect(authStoreMock.__clearSession).toHaveBeenCalledTimes(1);
    expect(navigationMock.resetToAuthLoading).toHaveBeenCalledTimes(1);
  });

  it('does not restore a token after the session changes during refresh', async () => {
    let finishRefresh!: (value: object) => void;
    axiosMock.default.post.mockImplementation(
      () => new Promise(resolve => { finishRefresh = resolve; }),
    );
    const request = responseErrorInterceptor({
      config: { url: '/profile/', headers: {} },
      response: { status: 401 },
    });

    authStoreMock.__state.refreshToken = null;
    finishRefresh({ data: { access: 'old-session-token' } });

    await expect(request).rejects.toThrow('Auth session changed');
    expect(authStoreMock.__setToken).not.toHaveBeenCalled();
    expect(authStoreMock.__clearSession).not.toHaveBeenCalled();
  });

  it('does not replay a request from an old session with a new account token', async () => {
    authStoreMock.__state.token = 'new-session-token';
    const error = {
      config: {
        url: '/profile/',
        headers: { Authorization: 'Bearer access-token' },
      },
      response: { status: 401 },
    };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    expect(axiosMock.default.post).not.toHaveBeenCalled();
    expect(authStoreMock.__clearSession).not.toHaveBeenCalled();
  });

  it('uses the password login endpoint and returns its tokens', async () => {
    axiosMock.__instance.post.mockResolvedValue({
      data: { access: 'new-access', refresh: 'new-refresh' },
    });

    await expect(
      AuthService.login('user@example.com', 'safe-password'),
    ).resolves.toEqual({ access: 'new-access', refresh: 'new-refresh' });

    expect(axiosMock.__instance.post).toHaveBeenCalledWith('/auth/email/login/', {
      email: 'user@example.com',
      password: 'safe-password',
    });
  });

  it('uses the email registration endpoints', async () => {
    axiosMock.__instance.post.mockResolvedValue({ data: { detail: 'ok' } });

    await AuthService.registerWithEmail('user@example.com', 'safe-password');
    await AuthService.resendEmailVerification('user@example.com');
    await AuthService.verifyEmailRegistration('encoded-uid', 'token-value', 'safe-password');

    expect(axiosMock.__instance.post).toHaveBeenCalledWith(
      '/auth/email/register/',
      {
        email: 'user@example.com',
        password: 'safe-password',
        password_confirm: 'safe-password',
      },
    );
    expect(axiosMock.__instance.post).toHaveBeenCalledWith(
      '/auth/email/resend/',
      { email: 'user@example.com' },
    );
    expect(axiosMock.__instance.post).toHaveBeenCalledWith(
      '/auth/email/verify/',
      {
        uid: 'encoded-uid',
        token: 'token-value',
        new_password: 'safe-password',
        password_confirm: 'safe-password',
      },
    );
  });

  it('uses the password reset endpoints', async () => {
    axiosMock.__instance.post.mockResolvedValue({ data: { detail: 'ok' } });

    await AuthService.requestPasswordReset('user@example.com');
    await AuthService.confirmPasswordReset(
      'encoded-uid',
      'token-value',
      'new-password',
    );

    expect(axiosMock.__instance.post).toHaveBeenCalledWith(
      '/auth/password-reset/request/',
      { email: 'user@example.com' },
    );
    expect(axiosMock.__instance.post).toHaveBeenCalledWith(
      '/auth/password-reset/confirm/',
      {
        uid: 'encoded-uid',
        token: 'token-value',
        new_password: 'new-password',
        password_confirm: 'new-password',
      },
    );
  });

  it('sends the required confirmation when deleting an account', async () => {
    axiosMock.__instance.delete.mockResolvedValue({
      data: null,
      status: 204,
    });

    await expect(AuthService.deleteAccount()).resolves.toBeUndefined();

    expect(axiosMock.__instance.delete).toHaveBeenCalledWith(
      '/auth/delete-account/',
      { data: { confirmation: 'DELETE' } },
    );
  });
});
