import {
  getLatestEligibleBirthDate,
  isEligibleAdultBirthDate,
  MINIMUM_USER_AGE,
} from '../src/utils/ageEligibility';

describe('adult age eligibility', () => {
  const referenceDate = new Date(2026, 9, 10, 23, 45);

  it('uses the local calendar day for the exact 18th-birthday boundary', () => {
    expect(MINIMUM_USER_AGE).toBe(18);
    expect(getLatestEligibleBirthDate(referenceDate)).toEqual(
      new Date(2008, 9, 10),
    );
    expect(
      isEligibleAdultBirthDate('2008-10-10', referenceDate),
    ).toBe(true);
    expect(
      isEligibleAdultBirthDate('2008-10-11', referenceDate),
    ).toBe(false);
  });

  it('rejects missing, malformed, impossible and future dates', () => {
    expect(isEligibleAdultBirthDate(null, referenceDate)).toBe(false);
    expect(isEligibleAdultBirthDate('10/10/2000', referenceDate)).toBe(false);
    expect(isEligibleAdultBirthDate('2008-02-30', referenceDate)).toBe(false);
    expect(isEligibleAdultBirthDate('2030-01-01', referenceDate)).toBe(false);
    expect(isEligibleAdultBirthDate(new Date('invalid'), referenceDate)).toBe(
      false,
    );
  });
});
