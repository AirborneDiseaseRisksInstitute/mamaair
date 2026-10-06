import { calculateMetricBmi } from '../src/utils/bodyMeasurements';

describe('body measurements', () => {
  it('calculates metric BMI from centimetres and kilograms', () => {
    expect(calculateMetricBmi(170, 60)).toBe(20.8);
    expect(calculateMetricBmi(175, 70)).toBe(22.9);
  });

  it('keeps one decimal place of precision without changing inputs', () => {
    expect(calculateMetricBmi(168, 64)).toBe(22.7);
  });

  it.each([
    [0, 60],
    [170, 0],
    [-170, 60],
    [170, -60],
    [Number.NaN, 60],
    [170, Number.POSITIVE_INFINITY],
  ])('rejects invalid measurements (%s cm, %s kg)', (height, weight) => {
    expect(calculateMetricBmi(height, weight)).toBeNull();
  });
});
