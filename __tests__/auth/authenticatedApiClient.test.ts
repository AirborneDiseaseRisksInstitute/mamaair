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
  __instance: {
    post: jest.Mock;
    interceptors: {
      request: { use: jest.Mock };
    };
  };
};
const authStoreMock = jest.requireMock('../../src/store/useAuthStore') as {
  __storage: { getString: jest.Mock };
};
const requestInterceptor =
  axiosMock.__instance.interceptors.request.use.mock.calls[0][0];

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
});
