jest.mock('../../src/store/useRecommendationExperienceStore', () => ({
  useRecommendationExperienceStore: {
    getState: jest.fn(() => ({
      ensureOwner: jest.fn(),
      actionCompletions: {},
      presentationDays: {},
      getStreakFreeze: jest.fn(() => null),
      saveStreakFreeze: jest.fn(),
    })),
  },
}));

jest.mock(
  '../../src/services/recommendationExperience/ProductAnalytics',
  () => ({
    ProductAnalytics: {
      track: jest.fn(),
    },
  }),
);

import {
  getWeeklyBadges,
  resolvePregnancyProgression,
} from '../../src/services/recommendationExperience/ProgressionRepository';
import {
  loadWeeklySummaryExperience,
  selectWeekPathDay,
} from '../../src/services/recommendationExperience/PresentationJourneyRepository';
import { buildWeeklyReport } from '../../src/services/recommendationExperience/WeeklyReportRepository';
import {
  resolveHomeCareIcons,
  resolveHomeDayState,
} from '../../src/utils/homeDayState';
import type {
  DailyActionCompletionRecord,
  DailyActionDomain,
  WeeklySummaryExperience,
} from '../../src/types/recommendationExperience';

const summary: WeeklySummaryExperience = {
  dataMode: 'recorded',
  week: 19,
  startDate: '2026-07-20',
  endDate: '2026-07-26',
  days: [],
  activeDays: 5,
  primaryCompleted: 10,
  primaryTotal: 21,
  adherencePercent: 48,
  extraCompleted: 2,
  hydrationDays: 4,
  restSessions: 3,
  sleepNights: 4,
  streakDays: 3,
  domainParticipation: {
    diet: 4,
    activity: 3,
    behaviour: 2,
    wellbeing: 5,
    service: 0,
  },
  actionSummary: {
    diet: { domain: 'diet', recommended: 5, completed: 4 },
    activity: { domain: 'activity', recommended: 4, completed: 3 },
    behaviour: { domain: 'behaviour', recommended: 3, completed: 2 },
    wellbeing: { domain: 'wellbeing', recommended: 5, completed: 5 },
  },
  symptomLevels: [{ level: 2, mommyCount: 1, babyCount: 0, total: 1 }],
  riskSummary: {
    identifiedRisks: ['Mother: preeclampsia'],
    completedActionImpact: -6,
    motherRiskDelta: -6,
  },
  symptomTrend: 'Level 2: 1',
  motherProgress:
    'Identified risks: Mother: preeclampsia. Risk change: mother -6%. Completed action impact: -6%.',
  babyProgress: '',
  milestone: 'Week 19 milestone',
  fetalSystems: [],
  nextWeek: null,
};

describe('progression and privacy-safe reports', () => {
  it('maps all pregnancy weeks into calm trimester chapters', () => {
    expect(resolvePregnancyProgression(1).trimester).toBe(1);
    expect(resolvePregnancyProgression(14).trimester).toBe(2);
    expect(resolvePregnancyProgression(28).trimester).toBe(3);
    expect(resolvePregnancyProgression(40)).toMatchObject({
      journeyPercent: 100,
      completed: true,
    });
  });

  it('keeps completed days in history and badges after the next week starts', () => {
    const completed = (
      domain: DailyActionDomain,
      updatedAt: string,
    ): DailyActionCompletionRecord => ({
      state: 'completed',
      completed: true,
      domain,
      kind: 'primary',
      updatedAt,
    });
    const actionCompletions = {
      '2026-09-25': {
        breakfast: completed('diet', '2026-09-25T08:00:00.000Z'),
      },
      '2026-09-26': {
        lunch: completed('diet', '2026-09-26T12:00:00.000Z'),
      },
      '2026-09-27': {
        dinner: completed('diet', '2026-09-27T18:00:00.000Z'),
        walk: completed('activity', '2026-09-27T19:00:00.000Z'),
      },
    };

    const sundayPath = selectWeekPathDay({
      pregnancyWeek: 19,
      date: '2026-09-27',
      actionRecords: actionCompletions['2026-09-27'],
      usePresentation: false,
    });
    expect(sundayPath.active).toBe(true);
    expect(resolveHomeCareIcons(sundayPath.domains)).toEqual([
      'basket',
      'running',
    ]);
    expect(
      resolveHomeDayState({
        weekNumber: 19,
        activeWeek: 20,
        dayIndex: 6,
        todayDayIndex: 0,
        hasRecordedActivity: sundayPath.active,
      }),
    ).toEqual({
      isActive: true,
      isStartDay: false,
      isMissed: false,
    });

    const mondayPath = selectWeekPathDay({
      pregnancyWeek: 20,
      date: '2026-09-28',
      actionRecords: {},
      usePresentation: false,
    });
    expect(mondayPath).toEqual({ active: false, domains: [] });
    expect(
      resolveHomeDayState({
        weekNumber: 20,
        activeWeek: 20,
        dayIndex: 0,
        todayDayIndex: 0,
        hasRecordedActivity: mondayPath.active,
      }),
    ).toEqual({
      isActive: false,
      isStartDay: true,
      isMissed: false,
    });

    const historicalSummary = loadWeeklySummaryExperience({
      identity: { backendUserId: 42 },
      pregnancyWeek: 19,
      endDate: '2026-09-27',
      milestone: 'Week 19 milestone',
      localData: {
        checkIns: {},
        actionCompletions,
        restTimers: {},
        dailyMoments: {},
      },
    });

    expect(historicalSummary.activeDays).toBe(3);
    expect(historicalSummary.primaryCompleted).toBe(4);
    expect(historicalSummary.domainParticipation).toMatchObject({
      diet: 3,
      activity: 1,
    });
    expect(
      getWeeklyBadges(historicalSummary)
        .filter(badge => badge.earned)
        .map(badge => badge.domain),
    ).toEqual(['diet']);
  });

  it('earns only the documented Diet, Activity and Behaviour badges', () => {
    const badges = getWeeklyBadges(summary);
    expect(badges.map(badge => badge.domain)).toEqual([
      'diet',
      'activity',
      'behaviour',
    ]);
    expect(
      badges.filter(badge => badge.earned).map(badge => badge.domain),
    ).toEqual(['diet', 'activity']);
  });

  it('builds a human-readable report without location or internal metadata', () => {
    const report = buildWeeklyReport(summary);
    expect(report.shareText).toContain('pregnancy week 19');
    expect(report.shareText).toContain('Active care days: 5 of 7');
    expect(report.shareText).toContain(
      'Mother estimate: 6% lower',
    );
    expect(report.shareText).toContain(
      'Completed care actions were linked to an estimated 6% reduction.',
    );
    expect(report.shareText).not.toContain('preeclampsia');
    expect(report.motherRecap).not.toContain('preeclampsia');
    expect(report.shareText).not.toMatch(
      /latitude|longitude|GPS|H3|route|snapshot|rule_id|database/i,
    );
    expect(report.earnedBadges).toEqual(['diet', 'activity']);
  });
});
