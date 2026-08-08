import type { ImageSourcePropType } from 'react-native';

const WEEK_1_IMAGE = require('../assets/weeks/week1.png');
const WEEK_2_IMAGE = require('../assets/weeks/week2.png');
const WEEK_3_IMAGE = require('../assets/weeks/week3.png');
const WEEK_4_IMAGE = require('../assets/weeks/week4.png');
const WEEK_5_IMAGE = require('../assets/weeks/week5.png');
const WEEK_6_IMAGE = require('../assets/weeks/week6.png');
const WEEK_7_IMAGE = require('../assets/weeks/week7.png');
const WEEK_8_IMAGE = require('../assets/weeks/week8.png');
const WEEK_9_IMAGE = require('../assets/weeks/week9.png');
const WEEK_10_IMAGE = require('../assets/weeks/week10.png');

/**
 * Mirrors the existing WeekCycle image assignment without coupling Baby Twin
 * to WeekCycleView or HomeScreen's week-card data.
 */
export const getBabyTwinWeekImage = (
  pregnancyWeek: number,
): ImageSourcePropType => {
  const week = Math.min(40, Math.max(1, Math.round(pregnancyWeek)));

  if (week === 1) return WEEK_1_IMAGE;
  if (week === 2) return WEEK_2_IMAGE;
  if (week === 3) return WEEK_3_IMAGE;
  if (week === 4) return WEEK_4_IMAGE;
  if (week === 5) return WEEK_5_IMAGE;
  if (week === 6) return WEEK_6_IMAGE;
  if (week === 7) return WEEK_7_IMAGE;
  if (week === 8) return WEEK_8_IMAGE;
  if (week === 9 || week === 10 || week === 11) return WEEK_9_IMAGE;

  return WEEK_10_IMAGE;
};
