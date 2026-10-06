import {
  getHomeWeekAlignedOffset,
  getHomeWeekIndex,
  getHomeWeekItemLayout,
  shouldAutoPositionHomeWeek,
} from '../src/utils/homeWeekScroll';

describe('Home active week scrolling', () => {
  const headerHeight = 220;
  const weekItemHeight = 530;

  it('starts week 40 immediately after the measured header', () => {
    expect(getHomeWeekItemLayout(0, headerHeight, weekItemHeight)).toEqual({
      length: 530,
      offset: 220,
      index: 0,
    });
  });

  it('does not accumulate a non-existent gap before an early week', () => {
    const week3Index = 40 - 3;
    expect(
      getHomeWeekItemLayout(week3Index, headerHeight, weekItemHeight),
    ).toEqual({
      length: 530,
      offset: headerHeight + week3Index * weekItemHeight,
      index: week3Index,
    });
  });

  it('maps week 16 to its exact index in the reversed list', () => {
    expect(getHomeWeekIndex(40, 16)).toBe(24);
  });

  it('aligns to the start of the active week instead of revealing week 15', () => {
    const measuredWeek16CellY = 24 * 530;
    const week16Offset = getHomeWeekItemLayout(
      24,
      headerHeight,
      530,
    ).offset;

    expect(
      getHomeWeekAlignedOffset(measuredWeek16CellY, headerHeight),
    ).toBe(week16Offset);
    expect(
      getHomeWeekAlignedOffset(measuredWeek16CellY, headerHeight),
    ).not.toBe(
      week16Offset + 390,
    );
  });

  it('positions once and never takes control after the user starts scrolling', () => {
    expect(
      shouldAutoPositionHomeWeek({
        targetIndex: 24,
        positionedIndex: null,
        userHasInteracted: false,
      }),
    ).toBe(true);
    expect(
      shouldAutoPositionHomeWeek({
        targetIndex: 24,
        positionedIndex: 24,
        userHasInteracted: false,
      }),
    ).toBe(false);
    expect(
      shouldAutoPositionHomeWeek({
        targetIndex: 24,
        positionedIndex: null,
        userHasInteracted: true,
      }),
    ).toBe(false);
  });
});
