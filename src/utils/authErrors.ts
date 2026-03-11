/**
 * Converts technical API/auth errors into user-friendly messages.
 */
export function getAuthErrorMessage(error: any, context: 'login' | 'signup' = 'login'): string {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const rawMessage =
    data?.message ||
    data?.detail ||
    (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null) ||
    data?.error ||
    error?.message ||
    '';

  const rawStr = String(rawMessage).toLowerCase();

  // Status-based mapping
  if (status === 401 || status === 403) {
    return 'Incorrect email or password. Please try again.';
  }
  if (status === 400) {
    if (rawStr.includes('email') || rawStr.includes('invalid')) {
      return 'Please enter a valid email address.';
    }
    if (rawStr.includes('password')) {
      return 'Please check your password and try again.';
    }
    if (rawStr.includes('already') || rawStr.includes('exist')) {
      return 'An account with this email already exists. Try logging in.';
    }
    return 'Please check your details and try again.';
  }
  if (status === 404) {
    return 'Service unavailable. Please try again later.';
  }
  if (status >= 500) {
    return 'Something went wrong on our end. Please try again later.';
  }

  // Message-based mapping (hide technical details)
  if (rawStr.includes('network') || rawStr.includes('timeout') || rawStr.includes('failed to fetch')) {
    return 'Connection problem. Please check your internet and try again.';
  }
  if (rawStr.includes('403') || rawStr.includes('401') || rawStr.includes('unauthorized')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (/^\d{3}\s*error/i.test(rawStr) || rawStr.includes('error') && /\d{3}/.test(rawStr)) {
    return context === 'login'
      ? 'Incorrect email or password. Please try again.'
      : 'Something went wrong. Please try again.';
  }

  // Generic fallback
  return context === 'login'
    ? 'Login failed. Please check your email and password and try again.'
    : 'Sign up failed. Please check your details and try again.';
}
