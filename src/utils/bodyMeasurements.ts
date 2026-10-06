export const calculateMetricBmi = (
  heightCm: number,
  weightKg: number,
): number | null => {
  if (
    !Number.isFinite(heightCm) ||
    !Number.isFinite(weightKg) ||
    heightCm <= 0 ||
    weightKg <= 0
  ) {
    return null;
  }

  const heightM = heightCm / 100;
  return Math.round((weightKg / heightM ** 2) * 10) / 10;
};
