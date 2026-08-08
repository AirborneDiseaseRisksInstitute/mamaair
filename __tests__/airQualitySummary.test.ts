import {
  formatAirReading,
  isAirExposureFresh,
  resolveAirQualityLevel,
} from '../src/utils/airQualitySummary';

describe('resolveAirQualityLevel', () => {
  it.each([
    [50, 'good'],
    [51, 'moderate'],
    [100, 'moderate'],
    [101, 'unhealthy_sensitive'],
    [150, 'unhealthy_sensitive'],
    [151, 'unhealthy'],
    [200, 'unhealthy'],
    [201, 'very_unhealthy'],
    [300, 'very_unhealthy'],
    [301, 'hazardous'],
  ])('maps AQI %s to %s', (aqi, expected) => {
    expect(
      resolveAirQualityLevel({ timestamp: '2026-07-29T08:00:00Z', aqi }),
    ).toBe(expected);
  });

  it.each([
    [15, 'good'],
    [15.1, 'moderate'],
    [35, 'moderate'],
    [35.1, 'unhealthy_sensitive'],
    [55, 'unhealthy_sensitive'],
    [55.1, 'unhealthy'],
  ])('uses the existing PM2.5 bands when AQI is absent', (pm25, expected) => {
    expect(
      resolveAirQualityLevel({ timestamp: '2026-07-29T08:00:00Z', pm25 }),
    ).toBe(expected);
  });

  it('prefers AQI when both readings are present', () => {
    expect(
      resolveAirQualityLevel({
        timestamp: '2026-07-29T08:00:00Z',
        aqi: 40,
        pm25: 80,
      }),
    ).toBe('good');
  });

  it('returns unavailable for missing or invalid readings', () => {
    expect(resolveAirQualityLevel(null)).toBe('unavailable');
    expect(
      resolveAirQualityLevel({
        timestamp: '2026-07-29T08:00:00Z',
        aqi: Number.NaN,
      }),
    ).toBe('unavailable');
  });
});

describe('isAirExposureFresh', () => {
  const now = new Date('2026-08-01T12:00:00Z').getTime();

  it('accepts a recent API reading as live', () => {
    expect(
      isAirExposureFresh({ timestamp: '2026-08-01T10:30:00Z', aqi: 80 }, now),
    ).toBe(true);
  });

  it('rejects stale or invalid readings instead of presenting them as live', () => {
    expect(
      isAirExposureFresh({ timestamp: '2026-08-01T08:00:00Z', aqi: 80 }, now),
    ).toBe(false);
    expect(isAirExposureFresh({ timestamp: 'invalid', aqi: 80 }, now)).toBe(
      false,
    );
  });
});

describe('formatAirReading', () => {
  it('keeps useful precision without noisy trailing zeroes', () => {
    expect(formatAirReading(12)).toBe('12');
    expect(formatAirReading(12.34)).toBe('12.3');
    expect(formatAirReading(undefined)).toBeNull();
  });
});
