import { resolveAirQualityPulseLayout } from '../src/utils/airQualityPulseLayout';

describe('air quality pulse layout', () => {
  it.each([320, 360, 432, 768])(
    'covers the top corners and keeps enough vertical room at %ipx',
    screenWidth => {
      const layout = resolveAirQualityPulseLayout(screenWidth);
      const radius = layout.diameter / 2;
      const cropDepth = -layout.circleTop;
      const distanceFromCenter = radius - cropDepth;
      const topChordWidth =
        2 *
        Math.sqrt(
          radius ** 2 - distanceFromCenter ** 2,
        );

      expect(topChordWidth).toBeGreaterThanOrEqual(
        screenWidth,
      );
      expect(
        layout.diameter + layout.circleTop,
      ).toBeGreaterThanOrEqual(360);
      expect(layout.contentWidth).toBeLessThanOrEqual(
        screenWidth - 40,
      );
    },
  );
});
