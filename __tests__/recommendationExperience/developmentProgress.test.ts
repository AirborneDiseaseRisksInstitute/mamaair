import {
  getFetalSystemTimeline,
  getNextWeekPreview,
  getRelevantFetalSystems,
} from '../../src/services/recommendationExperience/DevelopmentProgressRepository';

const weeks = [
  {
    description: 'First',
    circleIcons: [
      { iconPath: 'heart.svg', percentage: 10 },
    ],
  },
  {
    description: 'Second',
    circleIcons: [
      { iconPath: 'heart.svg', percentage: 20 },
      { iconPath: 'brain.svg', percentage: 5 },
    ],
  },
  {
    description: 'Third',
    circleIcons: [
      { iconPath: 'brain.svg', percentage: 12 },
      { iconPath: 'lungs.svg', percentage: 3 },
    ],
  },
];

describe('development progress selectors', () => {
  it('uses the current week as the relevant system source', () => {
    expect(getRelevantFetalSystems(weeks, 2)).toEqual([
      { iconPath: 'heart.svg', percentage: 20 },
      { iconPath: 'brain.svg', percentage: 5 },
    ]);
  });

  it('keeps latest canonical progress and marks future systems', () => {
    expect(getFetalSystemTimeline(weeks, 2)).toEqual([
      { iconPath: 'heart.svg', percentage: 20 },
      { iconPath: 'brain.svg', percentage: 5 },
      {
        iconPath: 'lungs.svg',
        percentage: 0,
        startsInWeeks: 1,
      },
    ]);
  });

  it('builds a next-week preview without mutating current progress', () => {
    expect(getNextWeekPreview(weeks, 2)).toEqual({
      week: 3,
      preview: 'Third',
      systems: [
        { iconPath: 'brain.svg', percentage: 12 },
        { iconPath: 'lungs.svg', percentage: 3 },
      ],
    });
    expect(getRelevantFetalSystems(weeks, 2)[0].percentage).toBe(20);
  });
});

