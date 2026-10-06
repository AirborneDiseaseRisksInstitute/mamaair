const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidAuthEmail = (value: string): boolean =>
  EMAIL_REGEX.test(value.trim());
