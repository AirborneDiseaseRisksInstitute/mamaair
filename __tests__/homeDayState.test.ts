import {
  HOME_CARE_ICONS,
  resolveHomeActiveWeek,
  resolveHomeCareIcons,
  resolveHomeDayState,
} from '../src/utils/homeDayState';

describe('Home care domains', () => {
  it('shows all four care categories in every day row', () => {
    expect(HOME_CARE_ICONS).toEqual(['heart', 'basket', 'running', 'mental']);
  });

  it('keeps mental wellbeing separate from behaviour completion', () => {
    expect(resolveHomeCareIcons(['behaviour'])).toEqual(['heart']);
    expect(resolveHomeCareIcons(['wellbeing'])).toEqual(['mental']);
    expect(
      resolveHomeCareIcons(['diet', 'activity', 'behaviour', 'wellbeing']),
    ).toEqual(['heart', 'basket', 'running', 'mental']);
  });
});

describe('Home active pregnancy week', () => {
  it('uses an explicitly edited profile week instead of stale API data', () => {
    expect(
      resolveHomeActiveWeek({
        profileWeek: 4,
        profileWeekConfirmed: true,
        apiWeek: 13,
      }),
    ).toBe(4);
  });

  it('uses API data only when the profile week has not been confirmed', () => {
    expect(
      resolveHomeActiveWeek({
        profileWeek: 3,
        profileWeekConfirmed: false,
        apiWeek: 13,
      }),
    ).toBe(13);
  });
});

describe('Home pregnancy day states', () => {
  const activeWeek = 11;
  const todayDayIndex = 2;

  it('marks every unrecorded day in the ten previous weeks as missed', () => {
    for (let weekNumber = 1; weekNumber < activeWeek; weekNumber += 1) {
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        expect(
          resolveHomeDayState({
            weekNumber,
            activeWeek,
            dayIndex,
            todayDayIndex,
            hasRecordedActivity: false,
          }),
        ).toEqual({
          isActive: false,
          isStartDay: false,
          isMissed: true,
        });
      }
    }
  });

  it('shows only today as the start day and keeps later days off', () => {
    for (let dayIndex = 0; dayIndex < todayDayIndex; dayIndex += 1) {
      expect(
        resolveHomeDayState({
          weekNumber: activeWeek,
          activeWeek,
          dayIndex,
          todayDayIndex,
          hasRecordedActivity: false,
        }),
      ).toEqual({
        isActive: false,
        isStartDay: false,
        isMissed: true,
      });
    }

    expect(
      resolveHomeDayState({
        weekNumber: activeWeek,
        activeWeek,
        dayIndex: todayDayIndex,
        todayDayIndex,
        hasRecordedActivity: false,
      }),
    ).toEqual({
      isActive: false,
      isStartDay: true,
      isMissed: false,
    });

    for (let dayIndex = todayDayIndex + 1; dayIndex < 7; dayIndex += 1) {
      expect(
        resolveHomeDayState({
          weekNumber: activeWeek,
          activeWeek,
          dayIndex,
          todayDayIndex,
          hasRecordedActivity: true,
        }),
      ).toEqual({
        isActive: false,
        isStartDay: false,
        isMissed: false,
      });
    }
  });

  it('keeps every day in future weeks off even if stale activity exists', () => {
    for (let weekNumber = activeWeek + 1; weekNumber <= 40; weekNumber += 1) {
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        expect(
          resolveHomeDayState({
            weekNumber,
            activeWeek,
            dayIndex,
            todayDayIndex,
            hasRecordedActivity: true,
          }),
        ).toEqual({
          isActive: false,
          isStartDay: false,
          isMissed: false,
        });
      }
    }
  });

  it('preserves recorded activity on a past day instead of marking it missed', () => {
    expect(
      resolveHomeDayState({
        weekNumber: activeWeek - 1,
        activeWeek,
        dayIndex: 6,
        todayDayIndex,
        hasRecordedActivity: true,
      }),
    ).toEqual({
      isActive: true,
      isStartDay: false,
      isMissed: false,
    });
  });
});
