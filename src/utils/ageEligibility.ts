import { parseLocalDate } from './dateUtils';

export const MINIMUM_USER_AGE = 18;

const atStartOfLocalDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isValidDate = (date: Date): boolean =>
  Number.isFinite(date.getTime());

export const getLatestEligibleBirthDate = (
  referenceDate: Date = new Date(),
): Date => {
  const referenceDay = atStartOfLocalDay(referenceDate);
  return new Date(
    referenceDay.getFullYear() - MINIMUM_USER_AGE,
    referenceDay.getMonth(),
    referenceDay.getDate(),
  );
};

export const isEligibleAdultBirthDate = (
  value: Date | string | null | undefined,
  referenceDate: Date = new Date(),
): boolean => {
  const birthDate =
    typeof value === 'string'
      ? parseLocalDate(value)
      : value instanceof Date
        ? value
        : null;

  if (!birthDate || !isValidDate(birthDate)) return false;

  return (
    atStartOfLocalDay(birthDate).getTime() <=
    getLatestEligibleBirthDate(referenceDate).getTime()
  );
};
