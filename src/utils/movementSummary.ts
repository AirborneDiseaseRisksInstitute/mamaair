import type { SummaryResponse } from '../services/api/SummaryService';

// A missing reading is different from a recorded distance of zero.
export const recordedDistanceMeters = (
  summary: SummaryResponse | null,
): number | null => {
  const journey = summary?.today_journey;
  const valid = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;

  if (valid(journey?.distance_m)) return journey.distance_m;
  if (valid(journey?.distance_km)) {
    const meters = journey.distance_km * 1000;
    return valid(meters) ? meters : null;
  }
  return null;
};

export const formatMovementDistance = (meters: number, locale: string) => {
  // Use metres below 1 km, avoiding a misleading "0 km" for short journeys.
  const useKilometers = meters >= 1000;
  return {
    value: (useKilometers ? meters / 1000 : meters).toLocaleString(locale, {
      maximumFractionDigits: useKilometers ? 2 : 0,
    }),
    unit: useKilometers ? 'km' : 'm',
  };
};
