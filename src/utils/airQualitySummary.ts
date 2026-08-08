import type { AirExposure } from '../services/api/ExposureService';

export type AirQualityLevel =
  | 'good'
  | 'moderate'
  | 'unhealthy_sensitive'
  | 'unhealthy'
  | 'very_unhealthy'
  | 'hazardous'
  | 'unavailable';

export const LIVE_AIR_MAX_AGE_MS = 3 * 60 * 60 * 1000;
const MAX_FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000;

const AQI_LEVELS: Array<{ max: number; level: AirQualityLevel }> = [
  { max: 50, level: 'good' },
  { max: 100, level: 'moderate' },
  { max: 150, level: 'unhealthy_sensitive' },
  { max: 200, level: 'unhealthy' },
  { max: 300, level: 'very_unhealthy' },
  { max: Number.POSITIVE_INFINITY, level: 'hazardous' },
];

const PM25_LEVELS: Array<{ max: number; level: AirQualityLevel }> = [
  { max: 15, level: 'good' },
  { max: 35, level: 'moderate' },
  { max: 55, level: 'unhealthy_sensitive' },
  { max: Number.POSITIVE_INFINITY, level: 'unhealthy' },
];

const isReading = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const findLevel = (
  value: number,
  levels: Array<{ max: number; level: AirQualityLevel }>,
): AirQualityLevel =>
  levels.find(item => value <= item.max)?.level ?? 'unavailable';

/**
 * Keeps Home's air status aligned with the exact AQI and PM2.5 bands already
 * used by ExposureAccordion on TodayScreen. AQI remains the primary reading;
 * PM2.5 is only used when the API does not return AQI.
 */
export const resolveAirQualityLevel = (
  exposure: AirExposure | null | undefined,
): AirQualityLevel => {
  if (isReading(exposure?.aqi)) {
    return findLevel(exposure.aqi, AQI_LEVELS);
  }

  if (isReading(exposure?.pm25)) {
    return findLevel(exposure.pm25, PM25_LEVELS);
  }

  return 'unavailable';
};

/**
 * Home labels this reading as live, so an old or invalid exposure must not be
 * presented as the user's current air conditions.
 */
export const isAirExposureFresh = (
  exposure: AirExposure | null | undefined,
  now = Date.now(),
  maxAge = LIVE_AIR_MAX_AGE_MS,
): boolean => {
  if (!exposure?.timestamp) return false;

  const observedAt = new Date(exposure.timestamp).getTime();
  if (!Number.isFinite(observedAt)) return false;

  const age = now - observedAt;
  return age >= -MAX_FUTURE_CLOCK_SKEW_MS && age <= maxAge;
};

export const formatAirReading = (
  value: number | undefined,
  maximumFractionDigits = 1,
  locale = 'en-US',
): string | null => {
  if (!isReading(value)) {
    return null;
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
  }).format(value);
};
