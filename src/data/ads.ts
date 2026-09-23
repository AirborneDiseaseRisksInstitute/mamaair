import type { ImageSourcePropType } from 'react-native';

export type AdCreative = 'drug' | 'diaper';

export interface PostPlanAdState {
  totalTasks: number;
  doneTasks: number;
  dailyWinVisible: boolean;
  hasMedicalAlert: boolean;
}

export const shouldShowPostPlanAd = ({
  totalTasks,
  doneTasks,
  dailyWinVisible,
  hasMedicalAlert,
}: PostPlanAdState): boolean =>
  totalTasks > 0 &&
  doneTasks === totalTasks &&
  !dailyWinVisible &&
  !hasMedicalAlert;

const AD_IMAGES: Record<AdCreative, ImageSourcePropType> = {
  drug: require('../assets/ads/drug.png'),
  diaper: require('../assets/ads/diaper.png'),
};

export const getDailyPlanAdCreative = (date: string): AdCreative =>
  Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000) % 2 === 0
    ? 'drug'
    : 'diaper';

export const resolveAdImage = (
  creative: AdCreative,
): ImageSourcePropType => AD_IMAGES[creative];
