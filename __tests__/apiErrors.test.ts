import {
  classifyApiFailure,
  describeApiError,
  isApiConnectionError,
} from '../src/utils/apiErrors';

describe('API connection errors', () => {
  it('recognizes only transport failures as connection errors', () => {
    expect(isApiConnectionError({ isAxiosError: true })).toBe(true);
    expect(isApiConnectionError({ code: 'ETIMEDOUT' })).toBe(true);
    expect(isApiConnectionError({ response: { status: 503 } })).toBe(false);
  });

  it('classifies HTTP and transport failures separately', () => {
    expect(
      classifyApiFailure({ isAxiosError: true, code: 'ERR_NETWORK' }),
    ).toEqual({ kind: 'network' });
    expect(classifyApiFailure({ code: 'ETIMEDOUT' })).toEqual({
      kind: 'timeout',
      status: undefined,
    });
    expect(classifyApiFailure({ response: { status: 401 } })).toEqual({
      kind: 'authentication',
      status: 401,
    });
    expect(classifyApiFailure({ response: { status: 429 } })).toEqual({
      kind: 'rateLimit',
      status: 429,
    });
    expect(classifyApiFailure({ response: { status: 503 } })).toEqual({
      kind: 'server',
      status: 503,
    });
  });

  it('does not present validation or authentication failures as offline', () => {
    expect(
      isApiConnectionError({ response: { status: 400 } }),
    ).toBe(false);
    expect(
      isApiConnectionError({ response: { status: 401 } }),
    ).toBe(false);
  });

  it('formats API diagnostics without exposing response bodies', () => {
    expect(
      describeApiError({
        code: 'ERR_NETWORK',
        message: 'Network Error',
        config: { method: 'get', url: '/summary/' },
      }),
    ).toBe('GET /summary/ code=ERR_NETWORK message=Network Error');
    expect(
      describeApiError({
        response: { status: 503 },
        config: { method: 'post', url: '/daily-plan/' },
      }),
    ).toBe('POST /daily-plan/ status=503');
  });
});
