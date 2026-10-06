export const getHomeWeekItemLayout = (
  index: number,
  headerHeight: number,
  weekItemHeight: number,
) => ({
  length: weekItemHeight,
  offset: headerHeight + weekItemHeight * index,
  index,
});

export const getHomeWeekIndex = (
  totalWeeks: number,
  weekNumber: number,
): number => Math.max(0, totalWeeks - weekNumber);

export const getHomeWeekAlignedOffset = (
  itemOffset: number,
  precedingContentHeight = 0,
): number => Math.max(0, itemOffset + precedingContentHeight);

interface ShouldAutoPositionHomeWeekParams {
  targetIndex: number;
  positionedIndex: number | null;
  userHasInteracted: boolean;
}

export const shouldAutoPositionHomeWeek = ({
  targetIndex,
  positionedIndex,
  userHasInteracted,
}: ShouldAutoPositionHomeWeekParams): boolean =>
  !userHasInteracted && positionedIndex !== targetIndex;
