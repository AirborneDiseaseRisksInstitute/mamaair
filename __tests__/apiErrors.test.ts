import { isApiConnectionError } from '../src/utils/apiErrors';

describe('API connection errors', () => {
  it('recognizes offline, timeout, and server failures', () => {
    expect(isApiConnectionError({ isAxiosError: true })).toBe(true);
    expect(isApiConnectionError({ code: 'ETIMEDOUT' })).toBe(true);
    expect(
      isApiConnectionError({ response: { status: 503 } }),
    ).toBe(true);
  });

  it('does not present validation or authentication failures as offline', () => {
    expect(
      isApiConnectionError({ response: { status: 400 } }),
    ).toBe(false);
    expect(
      isApiConnectionError({ response: { status: 401 } }),
    ).toBe(false);
  });
});
