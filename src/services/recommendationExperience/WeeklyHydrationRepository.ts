import { WellbeingService } from '../api/WellbeingService';

export interface WeeklyHydrationReading {
  amountMl: number;
  goalMl: number;
}

export type WeeklyHydrationReadings = Record<string, WeeklyHydrationReading>;

const validGoal = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const validAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export const loadWeeklyHydrationReadings = async (
  dates: string[],
): Promise<WeeklyHydrationReadings | null> => {
  try {
    const catalog = await WellbeingService.getCatalog();
    if (!validGoal(catalog.water_goal_ml)) return null;
    const goalMl = catalog.water_goal_ml;

    const logs = await Promise.all(
      dates.map(date => WellbeingService.getLogStrict(date)),
    );
    if (logs.some(log => !validAmount(log.water_amount))) return null;

    return dates.reduce<WeeklyHydrationReadings>((readings, date, index) => {
      readings[date] = {
        amountMl: logs[index].water_amount,
        goalMl,
      };
      return readings;
    }, {});
  } catch {
    return null;
  }
};
