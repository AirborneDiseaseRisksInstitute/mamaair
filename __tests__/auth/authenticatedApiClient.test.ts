jest.mock('axios', () => {
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

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
  const storage = {
    getString: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  };

  return { storage, __storage: storage };
});
jest.mock('../../src/App/navigationRef', () => ({
  resetToAuthLoading: jest.fn(),
}));

import { AuthService } from '../../src/services/api/AuthService';

const axiosMock = jest.requireMock('axios') as {
  default: {
    post: jest.Mock;
  };
  __instance: {
    get: jest.Mock;
    post: jest.Mock;
    interceptors: {
      request: { use: jest.Mock };
      response: { use: jest.Mock };
    };
  };
};
const authStoreMock = jest.requireMock('../../src/store/useAuthStore') as {
  __storage: { getString: jest.Mock; remove: jest.Mock; set: jest.Mock };
};
const navigationMock = jest.requireMock('../../src/App/navigationRef') as {
  resetToAuthLoading: jest.Mock;
};
const requestInterceptor =
  axiosMock.__instance.interceptors.request.use.mock.calls[0][0];
const responseErrorInterceptor =
  axiosMock.__instance.interceptors.response.use.mock.calls[0][1];

describe('authenticated API client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStoreMock.__storage.getString.mockImplementation(key =>
      key === 'auth_token' ? 'access-token' : null,
    );
  });

  it('sends the stored access token when development local sessions are disabled', async () => {
    const config = await requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer access-token');
  });

  it('does not attach a stale access token to auth endpoints', async () => {
    const authUrls = [
      '/auth/google/',
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
    expect(authStoreMock.__storage.remove).not.toHaveBeenCalled();
    expect(navigationMock.resetToAuthLoading).not.toHaveBeenCalled();
  });

  it('uses the password login endpoint and returns its tokens', async () => {
    axiosMock.__instance.post.mockResolvedValue({
      data: { access: 'new-access', refresh: 'new-refresh' },
    });

    await expect(
      AuthService.login('user@example.com', 'safe-password'),
    ).resolves.toEqual({ access: 'new-access', refresh: 'new-refresh' });

    expect(axiosMock.__instance.post).toHaveBeenCalledWith('/auth/token/', {
      email: 'user@example.com',
      password: 'safe-password',
    });
  });

  it('uses the email registration endpoints', async () => {
    axiosMock.__instance.post.mockResolvedValue({ data: { detail: 'ok' } });

    await AuthService.registerWithEmail('user@example.com', 'safe-password');
    await AuthService.resendEmailVerification('user@example.com');
    await AuthService.verifyEmailRegistration('user@example.com', '1234');

    expect(axiosMock.__instance.post).toHaveBeenCalledWith(
      '/auth/email/register/',
      {
        email: 'user@example.com',
        password: 'safe-password',
      },
    );
    expect(axiosMock.__instance.post).toHaveBeenCalledWith(
      '/auth/email/resend/',
      { email: 'user@example.com' },
    );
    expect(axiosMock.__instance.post).toHaveBeenCalledWith(
      '/auth/email/verify/',
      {
        email: 'user@example.com',
        code: '1234',
        uid: 'user@example.com',
        token: '1234',
      },
    );
  });

  it('uses the password reset endpoints', async () => {
    axiosMock.__instance.post.mockResolvedValue({ data: { detail: 'ok' } });

    await AuthService.requestPasswordReset('user@example.com');
    await AuthService.confirmPasswordReset(
      'user@example.com',
      '1234',
      'new-password',
    );

    expect(axiosMock.__instance.post).toHaveBeenCalledWith(
      '/auth/password-reset/request/',
      { email: 'user@example.com' },
    );
    expect(axiosMock.__instance.post).toHaveBeenCalledWith(
      '/auth/password-reset/confirm/',
      {
        email: 'user@example.com',
        code: '1234',
        uid: 'user@example.com',
        token: '1234',
        new_password: 'new-password',
        password_confirm: 'new-password',
      },
    );
  });
});
