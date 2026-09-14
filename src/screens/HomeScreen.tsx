import React, {
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  Modal,
  Image,
  AppState,
  Linking,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useTheme, spacing } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { SUN_SVG, CLOUD_SVG } from '../utils/svgIcons';
import {
  WeekCycleView,
  MainHeader,
  AccessLocationBottomSheet,
  TransitionLoader,
} from '../components/ui';
import {
  locationTracker,
  type LocationPermissionStatus,
} from '../services/tracking/LocationTracker';
import { SummaryService } from '../services/api/SummaryService';
import { ProfileService } from '../services/api/ProfileService';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import { formatLocalDate } from '../utils/dateUtils';
import { resolveBirthdayCardPresentation } from '../utils/birthdayCard';
import { countCompletedActionsByDomain } from '../utils/dailyTaskProgress';
import {
  resolveHomeActiveWeek,
  resolveHomeDayState,
} from '../utils/homeDayState';
import { AdsScreen } from './AdsScreen';
import { useTranslation } from 'react-i18next';
import { DEV_LOCAL_SESSION } from '../config/dev';
import { useRecommendationExperienceStore } from '../store/useRecommendationExperienceStore';
import { selectWeekPathDay } from '../services/recommendationExperience/PresentationJourneyRepository';
import { selectPresentationDay } from '../services/recommendationExperience/PresentationDataProvider';
import { ExposureService } from '../services/api/ExposureService';
import type { AirExposure } from '../services/api/ExposureService';
import { AirQualityPulseToast } from '../components/home/AirQualityPulseToast';
import {
  isAirExposureFresh,
  resolveAirQualityLevel,
} from '../utils/airQualitySummary';
import { ms } from '../utils/responsive';

const SUN_SIZE = 52;
const CLOUD_SIZE = 32;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_PADDING = 16 * 2;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING;
const CARD_HEIGHT = CARD_WIDTH * 0.55;
const ICON_SIZE = CARD_WIDTH * 0.2; // icon circle
const NOTCH_DEPTH = ICON_SIZE * 0.7; // notch depth - creates gap

const HEADER_MARGIN_TOP = ICON_SIZE / 2;
const HEADER_MARGIN_BOTTOM = spacing('lg');
const HEADER_CARD_MARGIN_TOP = 24;
const HEADER_BUTTON_MARGIN_BOTTOM = 32;
const WEEK_ITEM_MARGIN_BOTTOM = spacing('lg');
// Extra scroll offset so the active week card sits a bit higher (circle + days clearly in view).
const WEEK_CARD_TEXT_SECTION_HEIGHT = 390;
// Keep the final week's copy clear of the global symptoms FAB.
const HOME_LIST_BOTTOM_CLEARANCE =
  WEEK_CARD_TEXT_SECTION_HEIGHT / 2 + ms(64) + spacing('xl') + spacing('lg');

interface HomeScreenProps {
  onNavigateToToday?: () => void;
  onPrepareNavigateToToday?: () => Promise<(() => void) | null>;
  onNavigateToProfile?: () => void;
  onNavigateToBabyStatus?: () => void;
  onNavigateToPlanBirthday?: () => void;
  onNavigateToHistoricalWeek?: (pregnancyWeek: number, endDate: string) => void;
}

interface WeekData {
  id: string;
  title: string;
  description: string;
  isApiText?: boolean;
  centerImage?: any;
  circleIcons?: Array<{
    index: number;
    iconPath?: string;
    percentage?: number;
  }>;
  weekDays: Array<{
    day: string;
    icons: Array<'heart' | 'basket' | 'running'>;
    isActive?: boolean;
    activeIcons?: Array<'heart' | 'basket' | 'running'>;
    isMissed?: boolean;
    isStartDay?: boolean;
  }>;
}

// Week data array - extracted for better performance
export const WEEKS_DATA: WeekData[] = [
  {
    id: '1',
    title: '1st Week',
    description:
      'The seed of life is now part of you, growing, dividing, and quietly preparing for everything to come.',
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '2',
    title: '2nd Week',
    description:
      "Your body begins to open and align, quietly preparing the ground for what's about to arrive.",
    centerImage: require('../assets/weeks/week2.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '3',
    title: '3rd Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 5 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 5 },
    ],
    description:
      'A spark of life awakens, the first signs of the nervous system appear.',
    centerImage: require('../assets/weeks/week3.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '4',
    title: '4th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 10 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 10 },
    ],
    description:
      'The heart awakens and beats for the first time, life finds its rhythm.',
    centerImage: require('../assets/weeks/week4.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '5',
    title: '5th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 15 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 15 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 5 },
    ],
    description:
      'The heart grows stronger as the nervous system gently expands, life quietly strengthens within.',
    centerImage: require('../assets/weeks/week5.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '6',
    title: '6th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 20 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 20 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 10 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 5 },
    ],
    description:
      'New senses begin to awaken, the first gentle sparks of touch and awareness emerge within.',
    centerImage: require('../assets/weeks/week6.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '7',
    title: '7th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 25 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 25 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 15 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 10 },
    ],
    description:
      'Awareness deepens, tiny signals of sound and light begin to reach the growing life within.',
    centerImage: require('../assets/weeks/week7.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '8',
    title: '8th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 30 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 30 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 20 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 15 },
      { index: 4, iconPath: 'urinary.svg', percentage: 5 },
    ],
    description:
      'Connections grow stronger, the tiny being starts to sense and respond, quietly learning the rhythm of life.',
    centerImage: require('../assets/weeks/week8.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '9',
    title: '9th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 32 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 33 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 23 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 18 },
      { index: 4, iconPath: 'urinary.svg', percentage: 10 },
    ],
    description:
      'Deep inside, life begins to nourish itself, the first pathways for digestion quietly take shape.',
    centerImage: require('../assets/weeks/week9.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '10',
    title: '10th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 35 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 36 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 26 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 22 },
      { index: 4, iconPath: 'urinary.svg', percentage: 15 },
    ],
    description:
      'Deep inside, life begins to nourish itself, the first pathways for digestion quietly take shape.',
    centerImage: require('../assets/weeks/week9.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '11',
    title: '11th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 37 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 39 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 29 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 26 },
      { index: 4, iconPath: 'urinary.svg', percentage: 20 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 10 },
    ],
    description:
      'Movements grow more coordinated, each tiny motion guided by the expanding web of nerves and muscles.',
    centerImage: require('../assets/weeks/week9.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '12',
    title: '12th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 38 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 42 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 32 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 29 },
      { index: 4, iconPath: 'urinary.svg', percentage: 23 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 15 },
    ],
    description:
      'The soft form begins to strengthen, the first delicate bones take shape, giving structure to life within.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '13',
    title: '13th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 39 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 45 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 34 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 31 },
      { index: 4, iconPath: 'urinary.svg', percentage: 26 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 20 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 10 },
    ],
    description:
      "Strength and balance awaken, tiny muscles begin to move, guided by the body's first inner signals of harmony.",
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '14',
    title: '14th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 39 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 47 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 36 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 33 },
      { index: 4, iconPath: 'urinary.svg', percentage: 28 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 25 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 15 },
    ],
    description:
      'Movements grow smoother, the tiny body starts to stretch and flex with gentle strength.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '15',
    title: '15th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 40 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 48 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 38 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 34 },
      { index: 4, iconPath: 'urinary.svg', percentage: 29 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 30 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 20 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '16',
    title: '16th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 40 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 50 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 35 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 35 },
      { index: 4, iconPath: 'urinary.svg', percentage: 30 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 35 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 30 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 25 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '17',
    title: '17th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 45 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 60 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 45 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 45 },
      { index: 4, iconPath: 'urinary.svg', percentage: 40 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 45 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 40 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '18',
    title: '18th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 45 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 60 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 45 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 45 },
      { index: 4, iconPath: 'urinary.svg', percentage: 40 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 45 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 40 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '19',
    title: '19th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 45 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 60 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 45 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 45 },
      { index: 4, iconPath: 'urinary.svg', percentage: 40 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 45 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 40 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '20',
    title: '20th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 45 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 60 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 45 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 45 },
      { index: 4, iconPath: 'urinary.svg', percentage: 40 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 45 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 40 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '21',
    title: '21st Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 45 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 60 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 45 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 45 },
      { index: 4, iconPath: 'urinary.svg', percentage: 40 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 45 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 40 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '22',
    title: '22nd Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 45 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 60 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 45 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 45 },
      { index: 4, iconPath: 'urinary.svg', percentage: 40 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 45 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 40 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '23',
    title: '23rd Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 45 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 60 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 45 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 45 },
      { index: 4, iconPath: 'urinary.svg', percentage: 40 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 45 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 40 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),

    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '24',
    title: '24th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 45 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 60 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 45 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 45 },
      { index: 4, iconPath: 'urinary.svg', percentage: 40 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 45 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 40 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '25',
    title: '25th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 55 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 70 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 60 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 60 },
      { index: 4, iconPath: 'urinary.svg', percentage: 55 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 60 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 55 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 50 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 30 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '26',
    title: '26th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 55 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 70 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 60 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 60 },
      { index: 4, iconPath: 'urinary.svg', percentage: 55 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 60 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 55 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 50 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 30 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '27',
    title: '27th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 55 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 70 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 60 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 60 },
      { index: 4, iconPath: 'urinary.svg', percentage: 55 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 60 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 55 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 50 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 30 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '28',
    title: '28th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 65 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 78 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 70 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 70 },
      { index: 4, iconPath: 'urinary.svg', percentage: 65 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 70 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 65 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 60 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 50 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 40 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '29',
    title: '29th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 65 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 78 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 70 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 70 },
      { index: 4, iconPath: 'urinary.svg', percentage: 65 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 70 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 65 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 60 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 50 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 40 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '30',
    title: '30th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 65 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 78 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 70 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 70 },
      { index: 4, iconPath: 'urinary.svg', percentage: 65 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 70 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 65 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 60 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 50 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 40 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '31',
    title: '31st Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 65 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 78 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 70 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 70 },
      { index: 4, iconPath: 'urinary.svg', percentage: 65 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 70 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 65 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 60 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 50 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 40 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '32',
    title: '32nd Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 75 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 85 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 80 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 80 },
      { index: 4, iconPath: 'urinary.svg', percentage: 75 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 80 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 75 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 70 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 70 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 65 },
      { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '33',
    title: '33rd Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 75 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 85 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 80 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 80 },
      { index: 4, iconPath: 'urinary.svg', percentage: 75 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 80 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 75 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 70 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 70 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 65 },
      { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '34',
    title: '34th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 75 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 85 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 80 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 80 },
      { index: 4, iconPath: 'urinary.svg', percentage: 75 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 80 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 75 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 70 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 70 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 65 },
      { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '35',
    title: '35th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 75 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 85 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 80 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 80 },
      { index: 4, iconPath: 'urinary.svg', percentage: 75 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 80 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 75 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 70 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 70 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 65 },
      { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '36',
    title: '36th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 75 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 85 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 80 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 80 },
      { index: 4, iconPath: 'urinary.svg', percentage: 75 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 80 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 75 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 70 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 70 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 65 },
      { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '37',
    title: '37th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 75 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 85 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 80 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 80 },
      { index: 4, iconPath: 'urinary.svg', percentage: 75 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 80 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 75 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 70 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 70 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 65 },
      { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '38',
    title: '38th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 75 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 85 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 80 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 80 },
      { index: 4, iconPath: 'urinary.svg', percentage: 75 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 80 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 75 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 70 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 70 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 65 },
      { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '39',
    title: '39th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 100 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 100 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 95 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 90 },
      { index: 4, iconPath: 'urinary.svg', percentage: 89 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 85 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 87 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 90 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 91 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 97 },
      { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 90 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '40',
    title: '40th Week',
    circleIcons: [
      { index: 0, iconPath: 'heartSystem.svg', percentage: 100 },
      { index: 1, iconPath: 'brainSystem.svg', percentage: 100 },
      { index: 2, iconPath: 'boneSystem.svg', percentage: 100 },
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 100 },
      { index: 4, iconPath: 'urinary.svg', percentage: 100 },
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 100 },
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 100 },
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 100 },
      { index: 8, iconPath: 'respiratorySystem.svg', percentage: 100 },
      { index: 9, iconPath: 'senseSystem.svg', percentage: 100 },
      { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 100 },
    ],
    description:
      'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
      {
        day: 'Mon',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket', 'running'],
      },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      {
        day: 'Wed',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['basket'],
      },
      {
        day: 'Thu',
        icons: ['heart', 'basket', 'running'],
        isActive: false,
        activeIcons: ['heart', 'basket'],
      },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
];

// Memoize SVG components to prevent unnecessary re-renders
const SunSVG = React.memo(() => (
  <SvgXml xml={SUN_SVG} width={SUN_SIZE} height={SUN_SIZE} />
));

const CloudSVG = React.memo(({ size }: { size: number }) => (
  <SvgXml xml={CLOUD_SVG} width={size} height={size} />
));

function HomeTopDecorations({ enabled }: { enabled: boolean }) {
  const sunRotation = useSharedValue(0);
  const cloud1TranslateX = useSharedValue(0);
  const cloud2TranslateX = useSharedValue(0);
  const cloud3TranslateX = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(sunRotation);
    cancelAnimation(cloud1TranslateX);
    cancelAnimation(cloud2TranslateX);
    cancelAnimation(cloud3TranslateX);

    sunRotation.value = 0;
    cloud1TranslateX.value = 0;
    cloud2TranslateX.value = 0;
    cloud3TranslateX.value = 0;

    if (!enabled) {
      return;
    }

    sunRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false,
    );
    cloud1TranslateX.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    cloud2TranslateX.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    cloud3TranslateX.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(sunRotation);
      cancelAnimation(cloud1TranslateX);
      cancelAnimation(cloud2TranslateX);
      cancelAnimation(cloud3TranslateX);
    };
  }, [
    enabled,
    sunRotation,
    cloud1TranslateX,
    cloud2TranslateX,
    cloud3TranslateX,
  ]);

  const sunAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sunRotation.value}deg` }],
  }));

  const cloud1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -cloud1TranslateX.value * 200 }],
  }));

  const cloud2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -cloud2TranslateX.value * 180 }],
  }));

  const cloud3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -cloud3TranslateX.value * 190 }],
  }));

  return (
    <View style={topDecoStyles.container} pointerEvents="none">
      <Animated.View
        style={[topDecoStyles.sunContainer, sunAnimatedStyle]}
        shouldRasterizeIOS={true}
        renderToHardwareTextureAndroid={true}
      >
        <SunSVG />
      </Animated.View>
      <Animated.View style={[topDecoStyles.cloud1, cloud1AnimatedStyle]}>
        <CloudSVG size={CLOUD_SIZE} />
      </Animated.View>
      <Animated.View style={[topDecoStyles.cloud2, cloud2AnimatedStyle]}>
        <CloudSVG size={CLOUD_SIZE * 0.85} />
      </Animated.View>
      <Animated.View style={[topDecoStyles.cloud3, cloud3AnimatedStyle]}>
        <CloudSVG size={CLOUD_SIZE * 0.7} />
      </Animated.View>
    </View>
  );
}

const topDecoStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0.5,
    overflow: 'hidden',
  },
  sunContainer: {
    position: 'absolute',
    top: 120,
    right: 24,
    opacity: 0.65,
  },
  cloud1: {
    position: 'absolute',
    top: 100,
    right: SCREEN_WIDTH * 0.15,
    opacity: 0.5,
  },
  cloud2: {
    position: 'absolute',
    top: 180,
    right: -30,
    opacity: 0.4,
  },
  cloud3: {
    position: 'absolute',
    top: 140,
    right: SCREEN_WIDTH * 0.2,
    opacity: 0.35,
  },
});

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToToday,
  onPrepareNavigateToToday,
  onNavigateToProfile,
  onNavigateToBabyStatus,
  onNavigateToPlanBirthday,
  onNavigateToHistoricalWeek,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale =
    i18n.resolvedLanguage === 'fr'
      ? 'fr-FR'
      : i18n.resolvedLanguage === 'sw'
      ? 'sw-KE'
      : 'en-US';
  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const flatListRef = useRef<FlatList>(null);
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState === 'active',
  );
  const shouldAnimateHome = isFocused && isAppActive && !reduceMotion;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setIsAppActive(nextState === 'active');
    });

    return () => subscription.remove();
  }, []);

  // Active week state - can be loaded from storage (MMKV) on mount
  // Example with MMKV:
  // import { MMKV } from 'react-native-mmkv';
  // const storage = new MMKV();
  // const [activeWeek, setActiveWeek] = useState<number>(() => {
  //   const saved = storage.getNumber('activeWeek');
  //   return saved && saved >= 1 && saved <= 40 ? saved : 1;
  // });
  const { profile } = useUserStore();
  const birthdayCardPresentation = useMemo(
    () => resolveBirthdayCardPresentation(profile.expectedDueDate, locale),
    [locale, profile.expectedDueDate],
  );
  const profileActiveWeek = getCurrentPregnancyWeek(
    profile.pregnancyWeek,
    profile.pregnancyWeekSetDate,
  );
  const [apiActiveWeek, setApiActiveWeek] = useState<number | null>(null);
  const activeWeek = resolveHomeActiveWeek({
    profileWeek: profileActiveWeek,
    profileWeekConfirmed: profile.pregnancyWeekConfirmed,
    apiWeek: apiActiveWeek,
  });
  const [weeksData, setWeeksData] = useState<WeekData[]>(WEEKS_DATA);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [weekItemHeight, setWeekItemHeight] = useState(0);
  const [showTodayAds, setShowTodayAds] = useState(false);
  const [isNavigatingToToday, setIsNavigatingToToday] = useState(false);
  const preparedTodayNavigationRef = useRef<(() => void) | null>(null);
  const prepareTodayNavigationRequestRef = useRef(0);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] =
    useState<LocationPermissionStatus | null>(() =>
      locationTracker.isTracking() ? 'granted' : null,
    );
  const [locationPromptDismissed, setLocationPromptDismissed] =
    useState(false);
  const [suppressAirPulse, setSuppressAirPulse] = useState(false);
  const [airExposure, setAirExposure] = useState<AirExposure | null>(null);
  const [dismissedAirPulseKey, setDismissedAirPulseKey] = useState<
    string | null
  >(null);
  const [birthdayCardHeight, setBirthdayCardHeight] = useState(CARD_HEIGHT);
  const totalWeeks = weeksData.length;
  const actionCompletions = useRecommendationExperienceStore(
    state => state.actionCompletions,
  );
  const checkIns = useRecommendationExperienceStore(state => state.checkIns);
  const todayDateKey = formatLocalDate(new Date());
  const todayTaskCounts = useMemo(
    () => countCompletedActionsByDomain(actionCompletions[todayDateKey] ?? {}),
    [actionCompletions, todayDateKey],
  );
  const airPulseKey = useMemo(() => {
    if (!airExposure) return null;
    const observedAt = new Date(airExposure.timestamp);
    if (Number.isNaN(observedAt.getTime())) return null;

    // Show at most once per air-quality level per measurement day. A changed
    // level gets a new key and therefore surfaces a new message immediately.
    return `${formatLocalDate(observedAt)}:${resolveAirQualityLevel(
      airExposure,
    )}`;
  }, [airExposure]);

  // Fetch API Data
  useEffect(() => {
    if (DEV_LOCAL_SESSION) {
      return undefined;
    }

    let mounted = true;
    const fetchData = async () => {
      try {
        const [summary, userProfile] = await Promise.all([
          SummaryService.getSummary(),
          ProfileService.getProfile(),
        ]);

        if (mounted) {
          if (userProfile?.id !== undefined && userProfile?.id !== null) {
            useUserStore.getState().setProfile({
              backendUserId: String(userProfile.id),
            });
          }

          // Update active week
          const apiWeek =
            userProfile.current_pregnancy_week ||
            summary.week_info?.week ||
            profileActiveWeek ||
            1;
          setApiActiveWeek(Math.max(1, Math.min(40, apiWeek)));

          // Update Weeks Data with API content
          const updatedWeeksData = [...WEEKS_DATA];
          const weekIndex = apiWeek - 1;

          // Update description for current week
          if (
            updatedWeeksData[weekIndex] &&
            summary.week_info?.text &&
            (summary.week_info.week === undefined ||
              summary.week_info.week === apiWeek)
          ) {
            updatedWeeksData[weekIndex] = {
              ...updatedWeeksData[weekIndex],
              description: summary.week_info.text,
              isApiText: true,
            };
          }

          // Update history for ALL weeks up to (and including) current week
          if (userProfile.pregnancy_start_date) {
            const startDate = new Date(userProfile.pregnancy_start_date);

            for (let wIdx = 0; wIdx <= weekIndex; wIdx++) {
              if (!updatedWeeksData[wIdx]) continue;

              const weekStart = new Date(startDate);
              weekStart.setDate(startDate.getDate() + wIdx * 7);

              const updatedWeekDays = updatedWeeksData[wIdx].weekDays.map(
                (dayItem, dIndex) => {
                  const dayDate = new Date(weekStart);
                  dayDate.setDate(weekStart.getDate() + dIndex);
                  const dateStr = formatLocalDate(dayDate);
                  const dayName = dayDate.toLocaleDateString(locale, {
                    weekday: 'short',
                  });

                  const historyItem = summary.exposure_history?.items?.find(
                    (item: any) => item.date === dateStr,
                  );
                  const hasHistory = !!historyItem;

                  return {
                    ...dayItem,
                    day: dayName,
                    isActive: hasHistory ? true : dayItem.isActive || false,
                    activeIcons: hasHistory
                      ? (['running'] as ('heart' | 'basket' | 'running')[])
                      : dayItem.activeIcons,
                  };
                },
              );

              updatedWeeksData[wIdx] = {
                ...updatedWeeksData[wIdx],
                weekDays: updatedWeekDays,
              };
            }
          }
          setWeeksData(updatedWeeksData);
        }
      } catch (e) {
        console.error('Failed to fetch home data', e);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isFocused || !isAppActive) {
      return undefined;
    }

    let mounted = true;

    if (locationTracker.isTracking()) {
      setLocationPermissionStatus('granted');
      return () => {
        mounted = false;
      };
    }

    locationTracker
      .getPermissionStatus()
      .then(status => {
        if (mounted) {
          setLocationPermissionStatus(status);
        }
      })
      .catch(() => {
        if (mounted) {
          setLocationPermissionStatus('unavailable');
        }
      });

    return () => {
      mounted = false;
    };
  }, [isAppActive, isFocused]);

  useEffect(() => {
    if (!isFocused || !isAppActive) {
      return undefined;
    }

    let mounted = true;

    const loadAirExposure = async () => {
      if (locationPermissionStatus !== 'granted') {
        if (mounted) {
          setAirExposure(null);
        }
        return;
      }

      if (DEV_LOCAL_SESSION) {
        const environment = selectPresentationDay(
          activeWeek,
          formatLocalDate(new Date()),
        ).environment;

        if (mounted) {
          setAirExposure({
            timestamp: new Date().toISOString(),
            pm25: environment.pm25,
            temperature: environment.temperature,
            humidity: environment.humidity,
            uvi: environment.uvi,
            uvi_level: environment.uviLevel,
            indoor_pm25: environment.indoorPm25,
            indoor_temperature: environment.indoorTemperature,
          });
        }
        return;
      }

      try {
        const exposure = await ExposureService.getAirExposure();
        if (mounted) {
          setAirExposure(isAirExposureFresh(exposure) ? exposure : null);
        }
      } catch (error) {
        if (mounted) {
          setAirExposure(null);
        }
        console.error('Failed to fetch Home air exposure', error);
      }
    };

    loadAirExposure();

    return () => {
      mounted = false;
    };
  }, [activeWeek, isAppActive, isFocused, locationPermissionStatus]);

  // Get today's day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const getTodayDayOfWeek = useCallback((): number => {
    const today = new Date();
    const dayIndex = today.getDay();
    // Convert to our format: Monday = 0, Tuesday = 1, ..., Sunday = 6
    return dayIndex === 0 ? 6 : dayIndex - 1;
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#fff',
        },
        content: {
          flex: 1,
          paddingHorizontal: spacing('md'),
          paddingTop: spacing('lg'),
        },
        birthdayCardWrapper: {
          marginTop: HEADER_MARGIN_TOP,
          marginBottom: HEADER_MARGIN_BOTTOM,
          alignItems: 'center',
        },
        birthdayCardContainer: {
          width: CARD_WIDTH,
          minHeight: CARD_HEIGHT,
          marginTop: HEADER_CARD_MARGIN_TOP,
        },
        iconCircleContainer: {
          position: 'absolute',
          top: -ICON_SIZE / 1.5,
          left: (CARD_WIDTH - ICON_SIZE) / 2,
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: ICON_SIZE / 2,
          backgroundColor: '#FF9A88',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
          elevation: 8,
        },
        cardOverlay: {
          alignItems: 'center',
          paddingTop: NOTCH_DEPTH + 20,
          paddingBottom: spacing('xl'),
          paddingHorizontal: spacing('lg'),
        },
        textContainer: {
          alignItems: 'center',
          marginBottom: spacing('md'),
        },
        title: {
          fontSize: CARD_WIDTH * 0.06,
          fontFamily: theme.typography.fontFamily.bold,
          color: '#FFFFFF',
          textAlign: 'center',
          marginBottom: spacing('xs'),
        },
        subtitle: {
          fontSize: CARD_WIDTH * 0.04,
          fontFamily: theme.typography.fontFamily.regular,
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: CARD_WIDTH * 0.055,
          opacity: 0.95,
        },
        planButton: {
          backgroundColor: '#FFFFFF',
          borderRadius: 30,
          paddingVertical: 12,
          paddingHorizontal: 28,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        planButtonText: {
          color: theme.colors.orange500,
          fontSize: 14,
          fontFamily: theme.typography.fontFamily.bold,
          textAlign: 'center',
        },
        weekItem: {
          marginBottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column-reverse',
        },
        emptyStateBanner: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing('sm'),
          backgroundColor: '#FFF8F0',
          borderWidth: 1,
          borderColor: '#FFD9B3',
          borderRadius: 12,
          padding: spacing('md'),
          marginHorizontal: spacing('md'),
          marginTop: spacing('md'),
        },
        emptyStateBannerIcon: {
          fontSize: 24,
        },
        emptyStateBannerTitle: {
          fontSize: 14,
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          marginBottom: 4,
        },
        emptyStateBannerSubtitle: {
          fontSize: 13,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.neutral500,
          lineHeight: 18,
        },
        fixedBackground: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT / 1.5,
          zIndex: 0,
          opacity: 0.25,
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
        },
      }),
    [theme],
  );

  // Memoize the header component
  const handleHeaderLayout = useCallback(
    (event: any) => {
      const height = event?.nativeEvent?.layout?.height ?? 0;
      if (height > 0 && height !== headerHeight) {
        setHeaderHeight(height);
      }
    },
    [headerHeight],
  );

  const handleWeekItemLayout = useCallback(
    (event: any) => {
      const height = event?.nativeEvent?.layout?.height ?? 0;
      if (height > 0 && height !== weekItemHeight) {
        setWeekItemHeight(height);
      }
    },
    [weekItemHeight],
  );

  const handleLocationAllow = useCallback(async () => {
    setShowLocationSheet(false);

    const status = await locationTracker
      .requestAndStart()
      .catch(() => 'unavailable' as const);
    setLocationPermissionStatus(status);

    if (status === 'granted') {
      setSuppressAirPulse(true);
    } else if (status === 'blocked') {
      Linking.openSettings().catch(() => {});
    }
  }, []);

  const handleRequestLocation = useCallback(() => {
    setLocationPromptDismissed(true);
    setShowLocationSheet(true);
  }, []);

  const renderHeader = useCallback(
    () => (
      <View onLayout={handleHeaderLayout}>
        {locationPermissionStatus !== null &&
          locationPermissionStatus !== 'granted' && (
          <TouchableOpacity
            style={styles.emptyStateBanner}
            onPress={handleRequestLocation}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyStateBannerIcon} allowFontScaling={false}>
              📍
            </Text>
            <View style={{ flex: 1 }}>
              <Text
                style={styles.emptyStateBannerTitle}
                allowFontScaling={false}
              >
                {t('home.location_banner_title')}
              </Text>
              <Text
                style={styles.emptyStateBannerSubtitle}
                allowFontScaling={false}
              >
                {t('home.location_banner_subtitle')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.birthdayCardWrapper}>
          <View
            style={styles.birthdayCardContainer}
            onLayout={e => {
              const h = e.nativeEvent.layout.height;
              if (h > 0 && h !== birthdayCardHeight) setBirthdayCardHeight(h);
            }}
          >
            {/* SVG Background with curved notch — height tracks actual card height */}
            <Svg
              width={CARD_WIDTH}
              height={birthdayCardHeight}
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <Defs>
                <LinearGradient
                  id="cardGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <Stop offset="0%" stopColor="#FFB86A" />
                  <Stop offset="50%" stopColor="#FF9045" />
                  <Stop offset="100%" stopColor="#FF6D5C" />
                </LinearGradient>
              </Defs>
              <Path
                d={`
              M 20 0
              L ${CARD_WIDTH * 0.3} 0
              C ${CARD_WIDTH * 0.35} 0, ${CARD_WIDTH * 0.38} ${
                  NOTCH_DEPTH * 0.1
                }, ${CARD_WIDTH * 0.42} ${NOTCH_DEPTH * 0.5}
              C ${CARD_WIDTH * 0.45} ${NOTCH_DEPTH * 0.9}, ${
                  CARD_WIDTH * 0.55
                } ${NOTCH_DEPTH * 0.9}, ${CARD_WIDTH * 0.58} ${
                  NOTCH_DEPTH * 0.5
                }
              C ${CARD_WIDTH * 0.62} ${NOTCH_DEPTH * 0.1}, ${
                  CARD_WIDTH * 0.65
                } 0, ${CARD_WIDTH * 0.7} 0
              L ${CARD_WIDTH - 20} 0
              Q ${CARD_WIDTH} 0, ${CARD_WIDTH} 20
              L ${CARD_WIDTH} ${birthdayCardHeight - 20}
              Q ${CARD_WIDTH} ${birthdayCardHeight}, ${
                  CARD_WIDTH - 20
                } ${birthdayCardHeight}
              L 20 ${birthdayCardHeight}
              Q 0 ${birthdayCardHeight}, 0 ${birthdayCardHeight - 20}
              L 0 20
              Q 0 0, 20 0
              Z
            `}
                fill="url(#cardGradient)"
              />
            </Svg>

            {/* Icon inside circle */}
            <View style={styles.iconCircleContainer}>
              <Image
                source={require('../assets/icons/birthdayIcon.png')}
                style={{ width: ICON_SIZE * 0.55, height: ICON_SIZE * 0.65 }}
                resizeMode="contain"
              />
            </View>

            {/* Card Content — normal flow so card expands with content */}
            <View style={styles.cardOverlay}>
              <View style={styles.textContainer}>
                <Text style={styles.title} allowFontScaling={false}>
                  {t(birthdayCardPresentation.titleKey)}
                </Text>
                <Text style={styles.subtitle} allowFontScaling={false}>
                  {t(birthdayCardPresentation.subtitleKey, {
                    date: birthdayCardPresentation.dateLabel,
                  })}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.planButton}
                onPress={onNavigateToPlanBirthday}
                activeOpacity={0.7}
              >
                <Text style={styles.planButtonText} allowFontScaling={false}>
                  {t(birthdayCardPresentation.actionKey)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    ),
    [
      styles,
      handleHeaderLayout,
      onNavigateToPlanBirthday,
      locationPermissionStatus,
      handleRequestLocation,
      t,
      birthdayCardHeight,
      setBirthdayCardHeight,
      birthdayCardPresentation,
    ],
  );

  const prepareTodayNavigation = useCallback(() => {
    const requestId = prepareTodayNavigationRequestRef.current + 1;
    prepareTodayNavigationRequestRef.current = requestId;
    preparedTodayNavigationRef.current = null;

    if (!onPrepareNavigateToToday) return;

    onPrepareNavigateToToday()
      .then((navigate) => {
        if (prepareTodayNavigationRequestRef.current === requestId) {
          preparedTodayNavigationRef.current = navigate;
        }
      })
      .catch(() => {
        if (prepareTodayNavigationRequestRef.current === requestId) {
          preparedTodayNavigationRef.current = null;
        }
      });
  }, [onPrepareNavigateToToday]);

  const handleNavigateToToday = useCallback(() => {
    if (showTodayAds || isNavigatingToToday) return;
    setIsNavigatingToToday(true);
    prepareTodayNavigation();
    setTimeout(() => {
      setIsNavigatingToToday(false);
      setShowTodayAds(true);
    }, 350);
  }, [prepareTodayNavigation, showTodayAds, isNavigatingToToday]);

  const handleTodayAdClose = useCallback(() => {
    const navigate = preparedTodayNavigationRef.current;
    preparedTodayNavigationRef.current = null;
    prepareTodayNavigationRequestRef.current += 1;
    setShowTodayAds(false);

    if (navigate) {
      navigate();
      return;
    }

    onNavigateToToday?.();
  }, [onNavigateToToday]);

  // Memoize the render function for week items
  // Note: In reversed array, index 0 = week 40, so active week index calculation:
  // If activeWeek = 1, then in reversed array it's at index (40 - 1) = 39
  // If activeWeek = 40, then in reversed array it's at index (40 - 40) = 0
  const getWeekDescKey = useCallback((week: number): string => {
    const normalizedWeek = Math.max(1, Math.min(40, week));
    return `home.week_desc_w${String(normalizedWeek).padStart(2, '0')}`;
  }, []);

  const renderWeekItem: ListRenderItem<WeekData> = useCallback(
    ({ item, index }) => {
      // Calculate if this item is the active week
      // In reversed array: index = totalWeeks - weekNumber
      // So: weekNumber = totalWeeks - index
      const weekNumber = totalWeeks - index;
      const isActiveWeek = weekNumber === activeWeek;

      // Compute today's day index once
      const todayDayIndex = getTodayDayOfWeek();

      // For all weeks, derive isStartDay and isMissed based on
      // activeWeek + today's day:
      // - All days in weeks before activeWeek => missed
      // - In activeWeek: days before today => missed, today => start
      // - Future weeks keep their original missed state
      const DAY_KEYS = [
        'day_mon',
        'day_tue',
        'day_wed',
        'day_thu',
        'day_fri',
        'day_sat',
        'day_sun',
      ] as const;
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - todayDayIndex);
      const updatedWeekDays = item.weekDays.map((dayData, dayIndex) => {
        const dayDate = new Date(monday);
        dayDate.setDate(
          monday.getDate() + dayIndex + (weekNumber - activeWeek) * 7,
        );
        const dateKey = formatLocalDate(dayDate);
        const localRecords = actionCompletions[dateKey] ?? {};
        const pathDay = selectWeekPathDay({
          pregnancyWeek: weekNumber,
          date: dateKey,
          checkIn: checkIns[dateKey],
          actionRecords: localRecords,
          backendActive: dayData.isActive === true,
          usePresentation: false,
        });
        const localDomains = pathDay.domains;
        const localActive = pathDay.active;
        const localActiveIcons: Array<'heart' | 'basket' | 'running'> = [
          ...(localDomains.some(
            domain => domain === 'behaviour' || domain === 'wellbeing',
          )
            ? (['heart'] as const)
            : []),
          ...(localDomains.includes('diet') ? (['basket'] as const) : []),
          ...(localDomains.includes('activity') ? (['running'] as const) : []),
        ];
        const {
          isActive: isDayActive,
          isStartDay,
          isMissed,
        } = resolveHomeDayState({
          weekNumber,
          activeWeek,
          dayIndex,
          todayDayIndex,
          hasRecordedActivity: localActive,
        });

        return {
          ...dayData,
          day: t(`common.${DAY_KEYS[dayIndex]}`),
          isActive: isDayActive,
          activeIcons:
            localActiveIcons.length > 0
              ? localActiveIcons
              : dayData.activeIcons,
          isStartDay,
          isMissed,
        };
      });

      // Calculate if this week should be reversed (alternating pattern)
      // In reversed array: week 40 is at index 0 (no reverse), week 39 is at index 1 (reverse), etc.
      const shouldReverse = index % 2 === 1;
      const completedCareDays = updatedWeekDays.filter(
        day => day.isActive,
      ).length;
      const progressPercent =
        weekNumber <= activeWeek && completedCareDays > 0
          ? Math.round((completedCareDays / 7) * 100)
          : isActiveWeek
          ? 0
          : undefined;
      const weekState: 'current' | 'review' | 'future' | 'complete' =
        weekNumber === 40 && activeWeek >= 40
          ? 'complete'
          : isActiveWeek
          ? 'current'
          : weekNumber < activeWeek
          ? 'review'
          : 'future';
      const trimester = weekNumber <= 13 ? 1 : weekNumber <= 27 ? 2 : 3;
      const chapterLabel =
        isActiveWeek ||
        weekNumber === 1 ||
        weekNumber === 14 ||
        weekNumber === 28
          ? t('home.trimester_label', { number: trimester })
          : undefined;

      return (
        <View
          style={styles.weekItem}
          onLayout={index === 0 ? handleWeekItemLayout : undefined}
        >
          <WeekCycleView
            title={t('home.week_label', { week: weekNumber })}
            description={t(getWeekDescKey(weekNumber))}
            centerImage={item.centerImage}
            circleIcons={item.circleIcons}
            weekDays={updatedWeekDays}
            onStartPress={handleNavigateToToday}
            onImagePress={
              isActiveWeek
                ? onNavigateToBabyStatus
                : weekNumber < activeWeek && onNavigateToHistoricalWeek
                ? () => {
                    const endDate = new Date();
                    endDate.setDate(
                      endDate.getDate() - (activeWeek - weekNumber) * 7,
                    );
                    onNavigateToHistoricalWeek(
                      weekNumber,
                      formatLocalDate(endDate),
                    );
                  }
                : undefined
            }
            isActive={isActiveWeek && shouldAnimateHome}
            weekState={weekState}
            chapterLabel={chapterLabel}
            progressPercent={progressPercent}
            reversed={shouldReverse}
          />
        </View>
      );
    },
    [
      actionCompletions,
      checkIns,
      styles.weekItem,
      handleNavigateToToday,
      onNavigateToBabyStatus,
      onNavigateToHistoricalWeek,
      handleWeekItemLayout,
      activeWeek,
      totalWeeks,
      getTodayDayOfWeek,
      t,
      getWeekDescKey,
      shouldAnimateHome,
    ],
  );

  // Memoize key extractor
  const keyExtractor = useCallback((item: WeekData) => item.id, []);

  // Reverse weeks data for display (column-reverse effect)
  const reversedWeeksData = useMemo(
    () => [...weeksData].reverse(),
    [weeksData],
  );

  // Calculate index for active week in reversed array
  // If activeWeek = 1, index should be 39 (40 - 1) in reversed array
  // If activeWeek = 40, index should be 0 in reversed array
  const activeWeekIndex = useMemo(() => {
    return totalWeeks - activeWeek;
  }, [activeWeek, totalWeeks]);

  // Get item layout for accurate scrolling
  // Note: Heights are approximate and may need adjustment based on actual measurements
  const getItemLayout = useCallback(
    (data: any, index: number) => {
      const headerExtra =
        HEADER_MARGIN_TOP +
        HEADER_MARGIN_BOTTOM +
        HEADER_CARD_MARGIN_TOP +
        HEADER_BUTTON_MARGIN_BOTTOM;
      const headerLength = headerHeight + headerExtra;
      const itemLength = weekItemHeight + WEEK_ITEM_MARGIN_BOTTOM;
      return {
        length: itemLength,
        offset: headerLength + itemLength * index,
        index,
      };
    },
    [headerHeight, weekItemHeight],
  );

  // Scroll to active week when layout is ready
  useEffect(() => {
    if (
      isLayoutReady &&
      flatListRef.current &&
      activeWeek >= 1 &&
      activeWeek <= totalWeeks
    ) {
      const attemptScroll = (attempt: number = 1) => {
        const delay = attempt * 300;
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: activeWeekIndex,
              animated: attempt === 1,
              viewPosition: 0,
              // Keep the current week's title and badge in the primary view.
              // Positive viewOffset was placing the following week on screen.
              viewOffset: -WEEK_CARD_TEXT_SECTION_HEIGHT,
            });
          } catch {
            const layout = getItemLayout(null, activeWeekIndex);
            const offsetCorrected =
              layout.offset + WEEK_CARD_TEXT_SECTION_HEIGHT;
            flatListRef.current?.scrollToOffset({
              offset: offsetCorrected,
              animated: attempt === 1,
            });
            if (attempt < 3) {
              attemptScroll(attempt + 1);
            }
          }
        }, delay);
      };
      attemptScroll(1);
    }
  }, [
    isLayoutReady,
    activeWeekIndex,
    activeWeek,
    getItemLayout,
    reversedWeeksData,
    totalWeeks,
  ]);

  // Handle scroll to index errors with better retry logic
  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      const layout = getItemLayout(null, info.index);
      const offsetCorrected = layout.offset + WEEK_CARD_TEXT_SECTION_HEIGHT;
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({
            offset: offsetCorrected,
            animated: true,
          });
        }
      }, 200);
    },
    [getItemLayout],
  );

  // Handle layout ready - wait for both content size and layout
  const handleContentSizeChange = useCallback(() => {
    if (!isLayoutReady && headerHeight > 0 && weekItemHeight > 0) {
      // Additional delay to ensure all items are measured
      setTimeout(() => {
        setIsLayoutReady(true);
      }, 200);
    }
  }, [isLayoutReady, headerHeight, weekItemHeight]);

  // Also handle onLayout for more reliable detection
  const handleLayout = useCallback(() => {
    if (!isLayoutReady && headerHeight > 0 && weekItemHeight > 0) {
      setTimeout(() => {
        setIsLayoutReady(true);
      }, 200);
    }
  }, [isLayoutReady, headerHeight, weekItemHeight]);

  useEffect(() => {
    if (!isLayoutReady && headerHeight > 0 && weekItemHeight > 0) {
      setIsLayoutReady(true);
    }
  }, [isLayoutReady, headerHeight, weekItemHeight]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedBackground}>
        <Image
          source={require('../assets/images/homeBackground.png')}
          style={{ width: SCREEN_HEIGHT / 1.5, height: '100%' }}
          resizeMode="contain"
        />
      </View>
      <HomeTopDecorations enabled={shouldAnimateHome} />
      <MainHeader
        weekNumber={t('home.week_label', { week: activeWeek })}
        icons={[
          { type: 'food', count: todayTaskCounts.diet },
          { type: 'exercise', count: todayTaskCounts.activity },
          { type: 'heart', count: todayTaskCounts.behaviour },
          { type: 'mental', count: todayTaskCounts.wellbeing },
        ]}
        onProfilePress={onNavigateToProfile}
      />

      <FlatList
        ref={flatListRef}
        style={{ backgroundColor: 'transparent', flex: 1, zIndex: 1 }}
        data={reversedWeeksData}
        renderItem={renderWeekItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{
          paddingBottom: HOME_LIST_BOTTOM_CLEARANCE,
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={Math.min(activeWeekIndex + 3, 6)}
        getItemLayout={getItemLayout}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        updateCellsBatchingPeriod={50}
      />

      {locationPermissionStatus !== null &&
      locationPermissionStatus !== 'granted' &&
      !locationPromptDismissed ? (
        <AirQualityPulseToast
          animate={!reduceMotion}
          locationPermissionRequired
          onRequestLocation={handleRequestLocation}
          onDismiss={() => setLocationPromptDismissed(true)}
        />
      ) : locationPermissionStatus === 'granted' &&
        !suppressAirPulse &&
        airExposure &&
        airPulseKey &&
        airPulseKey !== dismissedAirPulseKey ? (
        <AirQualityPulseToast
          airExposure={airExposure}
          animate={!reduceMotion}
          onDismiss={() => setDismissedAirPulseKey(airPulseKey)}
        />
      ) : null}

      <AccessLocationBottomSheet
        visible={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        onAllow={handleLocationAllow}
        onNotNow={() => setShowLocationSheet(false)}
      />

      <TransitionLoader visible={isNavigatingToToday} />

      <Modal
        visible={showTodayAds}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <AdsScreen
          placement="home-to-today"
          onClose={handleTodayAdClose}
        />
      </Modal>
    </SafeAreaView>
  );
};
