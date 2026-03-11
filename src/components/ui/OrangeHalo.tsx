import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type HaloPosition = 'center' | 'topLeft' | 'bottomRight';

interface OrangeHaloProps {
  position?: HaloPosition;
  cx?: number;
  cy?: number;
  radius?: number;
  gradientId?: string;
}

interface HaloConfig {
  cx: number;
  cy: number;
  radius: number;
  gradientId: string;
  stops: Array<{ offset: string; stopColor: string; stopOpacity: number }>;
}

const getHaloConfig = (
  position?: HaloPosition,
  cx?: number,
  cy?: number,
  radius?: number,
  gradientId?: string
): HaloConfig => {
         // If custom position provided, use it
         if (cx !== undefined && cy !== undefined) {
           return {
             cx,
             cy,
             radius: radius ?? SCREEN_WIDTH * 0.6,
             gradientId: gradientId ?? 'halo_custom',
             stops: [
               { offset: '0%', stopColor: '#FFB86A', stopOpacity: 0.28 },
               { offset: '80%', stopColor: '#FFD6A8', stopOpacity: 0.08 },
               { offset: '100%', stopColor: '#FFD6A8', stopOpacity: 0 },
             ],
           };
         }

  // Default positions
         switch (position) {
           case 'topLeft':
             return {
               cx: SCREEN_WIDTH * 0.15,
               cy: SCREEN_HEIGHT * 0.12,
               radius: SCREEN_WIDTH * 0.6,
               gradientId: gradientId ?? 'halo_topLeft',
               stops: [
                 { offset: '0%', stopColor: '#FFB86A', stopOpacity: 0.28 },
                 { offset: '80%', stopColor: '#FFD6A8', stopOpacity: 0.08 },
                 { offset: '100%', stopColor: '#FFD6A8', stopOpacity: 0 },
               ],
             };
           case 'bottomRight':
             return {
               cx: SCREEN_WIDTH * 0.82,
               cy: SCREEN_HEIGHT * 0.80,
               radius: SCREEN_WIDTH * 0.5,
               gradientId: gradientId ?? 'halo_bottomRight',
               stops: [
                 { offset: '0%', stopColor: '#FFB86A', stopOpacity: 0.24 },
                 { offset: '80%', stopColor: '#FFD6A8', stopOpacity: 0.07 },
                 { offset: '100%', stopColor: '#FFD6A8', stopOpacity: 0 },
               ],
             };
           case 'center':
           default:
             return {
               cx: SCREEN_WIDTH * 0.5,
               cy: SCREEN_HEIGHT * 0.5,
               radius: SCREEN_WIDTH * 0.6,
               gradientId: gradientId ?? 'halo_center',
               stops: [
                 { offset: '0%', stopColor: '#FFB86A', stopOpacity: 0.28 },
                 { offset: '80%', stopColor: '#FFD6A8', stopOpacity: 0.08 },
                 { offset: '100%', stopColor: '#FFD6A8', stopOpacity: 0 },
               ],
             };
         }
};

export const OrangeHalo: React.FC<OrangeHaloProps> = ({
  position = 'center',
  cx,
  cy,
  radius,
  gradientId,
}) => {
  const config = getHaloConfig(position, cx, cy, radius, gradientId);

  return (
    <Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH} style={styles.container}>
      <Defs>
        <RadialGradient id={config.gradientId} cx="50%" cy="50%" r="50%">
          {config.stops.map((stop, index) => (
            <Stop
              key={index}
              offset={stop.offset}
              stopColor={stop.stopColor}
              stopOpacity={stop.stopOpacity}
            />
          ))}
        </RadialGradient>
      </Defs>
      <Circle
        cx={config.cx}
        cy={config.cy}
        r={config.radius}
        fill={`url(#${config.gradientId})`}
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
