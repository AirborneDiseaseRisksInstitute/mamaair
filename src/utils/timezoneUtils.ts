/**
 * Get device timezone (e.g. "America/New_York", "Africa/Nairobi")
 */
export const getDeviceTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/**
 * Get list of timezone identifiers for selection.
 * Uses Intl.supportedValuesOf when available, otherwise fallback to common list.
 */
export const getTimezoneList = (): string[] => {
  try {
    const supportedValuesOf = (
      Intl as typeof Intl & {
        supportedValuesOf?: (key: 'timeZone') => string[];
      }
    ).supportedValuesOf;
    if (typeof supportedValuesOf === 'function') {
      return supportedValuesOf('timeZone').sort();
    }
  } catch {
    // Fallback
  }
  return COMMON_TIMEZONES;
};

// Fallback: common IANA timezone identifiers
const COMMON_TIMEZONES = [
  'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Cairo', 'Africa/Johannesburg',
  'Africa/Lagos', 'Africa/Nairobi', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/New_York', 'America/Sao_Paulo', 'America/Toronto', 'Asia/Bangkok', 'Asia/Dubai',
  'Asia/Hong_Kong', 'Asia/Jakarta', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Melbourne', 'Australia/Sydney', 'Europe/Amsterdam', 'Europe/Berlin',
  'Europe/Istanbul', 'Europe/London', 'Europe/Paris', 'Europe/Rome', 'Pacific/Auckland',
  'Pacific/Fiji', 'UTC',
].sort();
