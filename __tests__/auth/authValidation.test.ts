import { isValidAuthEmail } from '../../src/utils/authValidation';

describe('auth email validation', () => {
  it('accepts a trimmed address and rejects incomplete addresses', () => {
    expect(isValidAuthEmail(' user@example.com ')).toBe(true);
    expect(isValidAuthEmail('user@localhost')).toBe(false);
    expect(isValidAuthEmail('userexample.com')).toBe(false);
    expect(isValidAuthEmail('')).toBe(false);
  });
});
