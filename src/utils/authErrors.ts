/**
 * Converts technical API/auth errors into user-friendly messages.
 */
type AuthErrorContext = 'login' | 'signup' | 'google' | 'verification' | 'passwordReset';

export type AuthErrorCode =
  | 'account_exists'
  | 'email_verification_required'
  | string;

export function getAuthErrorCode(error: any): AuthErrorCode | null {
  const code = error?.response?.data?.code;
  return typeof code === 'string' && code.length > 0 ? code : null;
}

const PASSWORD_FIELDS = ['password', 'password_confirm', 'new_password'];

const collectErrorStrings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectErrorStrings);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectErrorStrings);
  }
  return [];
};

const collectFieldErrorStrings = (
  value: unknown,
  fields: string[],
): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(item => collectFieldErrorStrings(item, fields));
  }
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    fields.includes(key)
      ? collectErrorStrings(nestedValue)
      : collectFieldErrorStrings(nestedValue, fields),
  );
};

const getPasswordErrorText = (data: unknown): string => {
  return collectFieldErrorStrings(data, PASSWORD_FIELDS).join(' ');
};

export const isPasswordValidationError = (error: any): boolean => {
  if (error?.response?.status !== 400) return false;
  const data = error?.response?.data;
  const passwordErrorText = getPasswordErrorText(data);
  if (passwordErrorText) return true;

  const allErrorText = collectErrorStrings(data).join(' ').toLowerCase();
  return allErrorText.includes('password');
};

export function getAuthErrorMessage(
  error: any,
  context: AuthErrorContext = 'login',
  translate?: (key: string) => string,
): string {
  const authError = (key: string, fallback: string): string =>
    translate?.(`auth.${key}`) ?? fallback;
  const status = error?.response?.status;
  const data = error?.response?.data;
  const passwordErrorText = getPasswordErrorText(data);
  const structuredErrorText = collectErrorStrings(data).join(' ');
  const rawMessage =
    data?.message ||
    data?.detail ||
    (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null) ||
    data?.error ||
    structuredErrorText ||
    error?.message ||
    '';

  const rawStr = String(rawMessage).toLowerCase();
  const passwordRawStr = passwordErrorText.toLowerCase() || rawStr;

  // Status-based mapping
  if (status === 401 || status === 403) {
    if (context === 'google') {
      return authError('error_google_verification', 'Google sign-in could not be verified. Please try again.');
    }
    if (context === 'verification') {
      return authError('error_verification_code', 'That code could not be verified. Please check it and try again.');
    }
    if (context === 'passwordReset') {
      return authError('error_password_reset_code', 'We could not reset your password. Please check your code and try again.');
    }
    return authError('error_invalid_credentials', 'Incorrect email or password. Please try again.');
  }
  if (status === 400) {
    if (context === 'google') {
      return authError('error_google_verification', 'Google sign-in could not be verified. Please try again.');
    }
    if (context === 'verification') {
      return authError('error_verification_code', 'That code could not be verified. Please check it and try again.');
    }
    if (context === 'passwordReset' && rawStr.includes('code')) {
      return authError('error_check_reset_code', 'Please check your reset code and try again.');
    }
    if (isPasswordValidationError(error)) {
      if (
        /too[_ -]?short|at least \d+ characters|min(?:imum)?[_ -]?length/.test(
          passwordRawStr,
        )
      ) {
        return authError('error_password_too_short', 'That password is too short. Use a longer password.');
      }
      if (/too[_ -]?common|\bcommon\b/.test(passwordRawStr)) {
        return authError('error_password_too_common', 'That password is too common. Choose a less predictable password.');
      }
      if (
        /entirely[_ -]?numeric|only (?:numbers|digits)|numeric password/.test(
          passwordRawStr,
        )
      ) {
        return authError('error_password_numeric', 'Your password cannot contain only numbers.');
      }
      if (/too[_ -]?similar|similar to/.test(passwordRawStr)) {
        return authError('error_password_too_similar', 'Your password is too similar to your personal information.');
      }
      return authError('error_password_weak', 'That password does not meet the security requirements. Choose a stronger password.');
    }
    if (rawStr.includes('already') || rawStr.includes('exist')) {
      return authError('error_account_exists', 'An account with this email already exists. Try logging in.');
    }
    if (rawStr.includes('email') || rawStr.includes('invalid')) {
      return authError('error_invalid_email', 'Please enter a valid email address.');
    }
    if (rawStr.includes('password')) {
      return authError('error_check_password', 'Please check your password and try again.');
    }
    return authError('error_check_details', 'Please check your details and try again.');
  }
  if (status === 409) {
    const code = getAuthErrorCode(error);
    if (code === 'email_verification_required') {
      return authError('error_email_unverified', 'This email is already registered but has not been verified.');
    }
    if (code === 'account_exists') {
      return authError('error_account_exists', 'An account with this email already exists. Try logging in.');
    }
    return authError('error_account_exists', 'An account with this email already exists. Try logging in.');
  }
  if (status === 404) {
    return authError('error_service_unavailable', 'Service unavailable. Please try again later.');
  }
  if (status === 429) {
    return authError('error_too_many_requests', 'Too many requests. Please wait before trying again.');
  }
  if (status >= 500) {
    return authError('error_server', 'Something went wrong on our end. Please try again later.');
  }

  // Message-based mapping (hide technical details)
  if (rawStr.includes('network') || rawStr.includes('timeout') || rawStr.includes('failed to fetch')) {
    return authError('error_connection', 'Connection problem. Please check your internet and try again.');
  }
  if (rawStr.includes('403') || rawStr.includes('401') || rawStr.includes('unauthorized')) {
    if (context === 'google') {
      return authError('error_google_verification', 'Google sign-in could not be verified. Please try again.');
    }
    if (context === 'verification') {
      return authError('error_verification_code', 'That code could not be verified. Please check it and try again.');
    }
    if (context === 'passwordReset') {
      return authError('error_password_reset_code', 'We could not reset your password. Please check your code and try again.');
    }
    return authError('error_invalid_credentials', 'Incorrect email or password. Please try again.');
  }
  if (/^\d{3}\s*error/i.test(rawStr) || rawStr.includes('error') && /\d{3}/.test(rawStr)) {
    if (context === 'signup') {
      return authError('error_generic', 'Something went wrong. Please try again.');
    }
    if (context === 'google') {
      return authError('google_sign_in_failed', 'Could not sign in with Google. Please try again.');
    }
    return authError('error_invalid_credentials', 'Incorrect email or password. Please try again.');
  }

  // Generic fallback
  if (context === 'signup') {
    return authError('error_signup', 'Sign up failed. Please check your details and try again.');
  }
  if (context === 'google') {
    return authError('google_sign_in_failed', 'Could not sign in with Google. Please try again.');
  }
  if (context === 'verification') {
    return authError('error_verification', 'Verification failed. Please check your code and try again.');
  }
  if (context === 'passwordReset') {
    return authError('error_password_reset', 'Password reset failed. Please check your details and try again.');
  }
  return authError('error_login', 'Login failed. Please check your email and password and try again.');
}
