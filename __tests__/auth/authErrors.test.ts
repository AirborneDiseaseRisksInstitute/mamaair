import {
  getAuthErrorMessage,
  isPasswordValidationError,
} from '../../src/utils/authErrors';

const translate = (key: string) => key;

describe('auth validation errors', () => {
  it.each([
    ['This password is too short.', 'auth.error_password_too_short'],
    ['This password is too common.', 'auth.error_password_too_common'],
    ['This password is entirely numeric.', 'auth.error_password_numeric'],
    [
      'The password is too similar to the email address.',
      'auth.error_password_too_similar',
    ],
    [
      'Password does not meet complexity requirements.',
      'auth.error_password_weak',
    ],
  ])('maps password error "%s" to %s', (message, expected) => {
    const error = {
      response: { status: 400, data: { password: [message] } },
    };

    expect(isPasswordValidationError(error)).toBe(true);
    expect(getAuthErrorMessage(error, 'signup', translate)).toBe(expected);
  });

  it('recognizes nested password error objects returned by validation APIs', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errors: {
            password: ['Too short. Use at least 8 characters.'],
          },
        },
      },
    };

    expect(isPasswordValidationError(error)).toBe(true);
    expect(getAuthErrorMessage(error, 'signup', translate)).toBe(
      'auth.error_password_too_short',
    );
  });

  it('keeps non-password validation errors out of the password field', () => {
    const error = {
      response: {
        status: 400,
        data: { email: ['Enter a valid email address.'] },
      },
    };

    expect(isPasswordValidationError(error)).toBe(false);
    expect(getAuthErrorMessage(error, 'signup', translate)).toBe(
      'auth.error_invalid_email',
    );
  });
});
