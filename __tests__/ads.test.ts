import { getDailyPlanAdCreative, resolveAdImage, shouldShowPostPlanAd } from '../src/data/ads';

describe('daily plan ad creative', () => {
  it('uses both unchanged assets on alternating dates', () => {
    expect(getDailyPlanAdCreative('2026-09-18')).not.toBe(getDailyPlanAdCreative('2026-09-19'));
    expect(resolveAdImage('drug')).toBeDefined();
    expect(resolveAdImage('diaper')).toBeDefined();
  });

  it('shows only after all primary tasks and never over a daily win or medical alert', () => {
    const completed = {
      totalTasks: 3,
      doneTasks: 3,
      dailyWinVisible: false,
      hasMedicalAlert: false,
    };
    expect(shouldShowPostPlanAd(completed)).toBe(true);
    expect(shouldShowPostPlanAd({ ...completed, doneTasks: 2 })).toBe(false);
    expect(shouldShowPostPlanAd({ ...completed, totalTasks: 0, doneTasks: 0 })).toBe(false);
    expect(shouldShowPostPlanAd({ ...completed, dailyWinVisible: true })).toBe(false);
    expect(shouldShowPostPlanAd({ ...completed, hasMedicalAlert: true })).toBe(false);
  });
});
