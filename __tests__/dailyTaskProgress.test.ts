import { countCompletedActionsByDomain } from '../src/utils/dailyTaskProgress';

describe('countCompletedActionsByDomain', () => {
  it('counts only completed tasks in each domain', () => {
    expect(
      countCompletedActionsByDomain({
        water: {
          state: 'completed',
          completed: true,
          domain: 'diet',
          kind: 'primary',
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        fruit: {
          state: 'completed',
          completed: true,
          domain: 'diet',
          kind: 'extra',
          updatedAt: '2026-07-29T08:05:00.000Z',
        },
        walk: {
          state: 'pending',
          completed: false,
          domain: 'activity',
          kind: 'primary',
          updatedAt: '2026-07-29T08:10:00.000Z',
        },
        routine: {
          state: 'completed',
          completed: true,
          domain: 'behaviour',
          kind: 'primary',
          updatedAt: '2026-07-29T08:15:00.000Z',
        },
        breathing: {
          state: 'completed',
          completed: true,
          domain: 'wellbeing',
          kind: 'extra',
          updatedAt: '2026-07-29T08:20:00.000Z',
        },
      }),
    ).toEqual({
      diet: 2,
      activity: 0,
      behaviour: 1,
      wellbeing: 1,
      service: 0,
    });
  });

  it('recovers every legacy local domain saved before domain metadata', () => {
    expect(
      countCompletedActionsByDomain({
        'local:mary-hydration-300': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:mary-shift-midday-work': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:mary-shaded-rest': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:wellbeing-clean-air-breathing': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:wellbeing-gentle-wind-down': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:wellbeing-cool-pause': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:diet-vitamin-c-pairing': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:behaviour-cleaner-cooking-window': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:activity-shaded-route': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:behaviour-ventilate-when-air-clears': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:activity-gentle-mobility-pause': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
        'local:wellbeing-grounding-senses': {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
      }),
    ).toEqual({
      diet: 2,
      activity: 3,
      behaviour: 3,
      wellbeing: 4,
      service: 0,
    });
  });

  it('ignores unknown legacy records that do not have a domain', () => {
    expect(
      countCompletedActionsByDomain({
        legacy: {
          state: 'completed',
          completed: true,
          updatedAt: '2026-07-29T08:00:00.000Z',
        },
      }),
    ).toEqual({
      diet: 0,
      activity: 0,
      behaviour: 0,
      wellbeing: 0,
      service: 0,
    });
  });
});
