import { getBabyTwinWeekImage } from '../src/utils/babyTwinWeekImage';

describe('Baby Twin week image mapping', () => {
  it.each([
    [1, 1],
    [2, 2],
    [9, 9],
    [10, 9],
    [11, 9],
    [12, 12],
    [16, 12],
    [40, 12],
  ])('uses the WeekCycle image for week %i', (week, expectedImageWeek) => {
    expect(getBabyTwinWeekImage(week)).toEqual(
      getBabyTwinWeekImage(expectedImageWeek),
    );
  });
});
