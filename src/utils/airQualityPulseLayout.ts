export interface AirQualityPulseLayout {
  circleTop: number;
  contentTopPadding: number;
  contentWidth: number;
  diameter: number;
}

export const resolveAirQualityPulseLayout = (
  screenWidth: number,
): AirQualityPulseLayout => {
  const safeWidth = Math.max(screenWidth, 1);
  const diameter = Math.max(safeWidth * 1.18, 480);
  const circleTop = -diameter * 0.25;

  return {
    circleTop,
    contentTopPadding: -circleTop + 18,
    contentWidth: Math.max(
      1,
      Math.min(safeWidth - 40, 340),
    ),
    diameter,
  };
};
