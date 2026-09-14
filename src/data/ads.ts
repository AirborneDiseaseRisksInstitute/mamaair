import type { ImageSourcePropType } from 'react-native';

export type AdPlacement =
  | 'home-to-today'
  | 'today-to-baby-status'
  | 'profile-to-baby-twin'
  | 'standalone';

export type AdCreative = 'drug' | 'diaper';

const AD_CREATIVE_BY_PLACEMENT: Record<AdPlacement, AdCreative> = {
  'home-to-today': 'drug',
  'today-to-baby-status': 'diaper',
  'profile-to-baby-twin': 'diaper',
  standalone: 'drug',
};

const AD_IMAGES: Record<AdCreative, ImageSourcePropType> = {
  drug: require('../assets/ads/drug.png'),
  diaper: require('../assets/ads/diaper.png'),
};

export const resolveAdCreative = (placement: AdPlacement): AdCreative =>
  AD_CREATIVE_BY_PLACEMENT[placement];

export const resolveAdImage = (
  placement: AdPlacement,
): ImageSourcePropType => AD_IMAGES[resolveAdCreative(placement)];
