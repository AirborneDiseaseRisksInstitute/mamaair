import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useTheme, spacing } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { BIRTHDAY_SVG, SUN_SVG, CLOUD_SVG } from '../utils/svgIcons';
import { WeekCycleView, MainHeader, FloatingActionButton } from '../components/ui';
import { SummaryService, SummaryResponse } from '../services/api/SummaryService';
import { ProfileService } from '../services/api/ProfileService';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import { AdsScreen } from './AdsScreen';

const SUN_SIZE = 52;
const CLOUD_SIZE = 32;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_PADDING = 16 * 2;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING;
const CARD_HEIGHT = CARD_WIDTH * 0.55;
const ICON_SIZE = CARD_WIDTH * 0.20; // icon circle
const NOTCH_DEPTH = ICON_SIZE * 0.7; // notch depth - creates gap

const getOrdinalSuffix = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const HEADER_MARGIN_TOP = ICON_SIZE / 2;
const HEADER_MARGIN_BOTTOM = spacing('lg');
const HEADER_CARD_MARGIN_TOP = 24;
const HEADER_BUTTON_MARGIN_BOTTOM = 32;
const WEEK_ITEM_MARGIN_BOTTOM = spacing('lg');
// Extra scroll offset so the active week card sits a bit higher (circle + days clearly in view).
const WEEK_CARD_TEXT_SECTION_HEIGHT = 390;

interface HomeScreenProps {
  onNavigateToToday?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToBabyStatus?: () => void;
  onNavigateToPlanBirthday?: () => void;
}

interface WeekData {
  id: string;
  title: string;
  description: string;
  centerImage?: any;
  circleIcons?: Array<{ index: number; iconPath?: string; percentage?: number }>;
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
    description: 'The seed of life is now part of you, growing, dividing, and quietly preparing for everything to come.',
    weekDays: [
      { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
      { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
      { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
      { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
      { day: 'Fri', icons: ['heart', 'basket', 'running'], isMissed: false },
      { day: 'Sat', icons: ['heart', 'basket', 'running'], isActive: false },
      { day: 'Sun', icons: ['heart', 'basket', 'running'], isActive: false },
    ],
  },
  {
    id: '2',
    title: '2nd Week',
    description: 'Your body begins to open and align, quietly preparing the ground for what\'s about to arrive.',
    centerImage: require('../assets/weeks/week2.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 1, iconPath: 'brainSystem.svg', percentage: 5 }
    
    ],
    description: 'A spark of life awakens, the first signs of the nervous system appear.',
    centerImage: require('../assets/weeks/week3.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
  { index: 1, iconPath: 'brainSystem.svg', percentage: 10 }    
    ],
    description: 'The heart awakens and beats for the first time, life finds its rhythm.',
    centerImage: require('../assets/weeks/week4.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 2, iconPath: 'boneSystem.svg', percentage: 5 }
    ],
    description: 'The heart grows stronger as the nervous system gently expands, life quietly strengthens within.',
    centerImage: require('../assets/weeks/week5.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 5 }
    
    ],
    description: 'New senses begin to awaken, the first gentle sparks of touch and awareness emerge within.',
    centerImage: require('../assets/weeks/week6.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 3, iconPath: 'digestiveSystem.svg', percentage: 10 }
      
    
    ],
    description: 'Awareness deepens, tiny signals of sound and light begin to reach the growing life within.',
    centerImage: require('../assets/weeks/week7.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
  { index: 4, iconPath: 'urinary.svg', percentage: 5 }   

    ],
    description: 'Connections grow stronger, the tiny being starts to sense and respond, quietly learning the rhythm of life.',
    centerImage: require('../assets/weeks/week8.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 4, iconPath: 'urinary.svg', percentage: 10 } 
     

    ],
    description: 'Deep inside, life begins to nourish itself, the first pathways for digestion quietly take shape.',
    centerImage: require('../assets/weeks/week9.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
  { index: 4, iconPath: 'urinary.svg', percentage: 15 }
     

    ],
    description: 'Deep inside, life begins to nourish itself, the first pathways for digestion quietly take shape.',
    centerImage: require('../assets/weeks/week9.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
  { index: 5, iconPath: 'integumentarySystem.svg', percentage: 10 }
     

    ],
    description: 'Movements grow more coordinated, each tiny motion guided by the expanding web of nerves and muscles.',
    centerImage: require('../assets/weeks/week9.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 5, iconPath: 'integumentarySystem.svg', percentage: 15 }
     
    ],
    description: 'The soft form begins to strengthen, the first delicate bones take shape, giving structure to life within.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 10 }
     
    ],
    description: 'Strength and balance awaken, tiny muscles begin to move, guided by the body\'s first inner signals of harmony.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
  { index: 6, iconPath: 'endocrineSystem.svg', percentage: 15 }
     
    ],
    description: 'Movements grow smoother, the tiny body starts to stretch and flex with gentle strength.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 6, iconPath: 'endocrineSystem.svg', percentage: 20 }
     
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
  { index: 7, iconPath: 'immuneSystem.svg', percentage: 25 }
     
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
  { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 }
     
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
  { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 }
     
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 }
     
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 }     
     
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
  { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 }    
  
     
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
      { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 }    
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 }     
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 7, iconPath: 'immuneSystem.svg', percentage: 35 }    
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 8, iconPath: 'respiratorySystem.svg', percentage: 30 }     
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 8, iconPath: 'respiratorySystem.svg', percentage: 30 }     
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 8, iconPath: 'respiratorySystem.svg', percentage: 30 }     
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 9, iconPath: 'senseSystem.svg', percentage: 40 }     
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 9, iconPath: 'senseSystem.svg', percentage: 40 }      
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 9, iconPath: 'senseSystem.svg', percentage: 40 }    
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 9, iconPath: 'senseSystem.svg', percentage: 40 }     
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 }      
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 }    
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 }     
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 }     
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 }    
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 }    
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 50 }    
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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
        { index: 10, iconPath: 'reproductiveSystem.svg', percentage: 100 }      
  
    ],
    description: 'The senses sharpen and movements gain rhythm, life begins to explore its own space.',
    centerImage: require('../assets/weeks/week10.png'),
    weekDays: [
              { day: 'Mon', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket', 'running'] },
              { day: 'Tue', icons: ['heart', 'basket', 'running'], isStartDay: false },
              { day: 'Wed', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['basket'] },
              { day: 'Thu', icons: ['heart', 'basket', 'running'], isActive: false, activeIcons: ['heart', 'basket'] },
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

function HomeTopDecorations() {
  const sunRotation = useSharedValue(0);
  const cloud1TranslateX = useSharedValue(0);
  const cloud2TranslateX = useSharedValue(0);
  const cloud3TranslateX = useSharedValue(0);

  useEffect(() => {
    sunRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      true
    );
    cloud1TranslateX.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      true
    );
    cloud2TranslateX.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.linear }),
      -1,
      true
    );
    cloud3TranslateX.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1,
      true
    );
  }, [sunRotation, cloud1TranslateX, cloud2TranslateX, cloud3TranslateX]);

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

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToToday, onNavigateToProfile, onNavigateToBabyStatus, onNavigateToPlanBirthday }) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  
  // Active week state - can be loaded from storage (MMKV) on mount
  // Example with MMKV:
  // import { MMKV } from 'react-native-mmkv';
  // const storage = new MMKV();
  // const [activeWeek, setActiveWeek] = useState<number>(() => {
  //   const saved = storage.getNumber('activeWeek');
  //   return saved && saved >= 1 && saved <= 40 ? saved : 1;
  // });
  const { profile } = useUserStore();
  const [activeWeek, setActiveWeek] = useState<number>(
    getCurrentPregnancyWeek(profile.pregnancyWeek, profile.pregnancyWeekSetDate) || 1,
  );
  const [weeksData, setWeeksData] = useState<WeekData[]>(WEEKS_DATA);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [weekItemHeight, setWeekItemHeight] = useState(0);
  const [showTodayAds, setShowTodayAds] = useState(false);
  const totalWeeks = weeksData.length;

  // Fetch API Data
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [summary, userProfile] = await Promise.all([
          SummaryService.getSummary(),
          ProfileService.getProfile()
        ]);
        
        if (mounted) {
          setSummaryData(summary);
          
          // Update active week
          const apiWeek = summary.week_info?.week || userProfile.current_pregnancy_week || activeWeek;
          setActiveWeek(Math.max(1, Math.min(40, apiWeek)));

          // Update Weeks Data with API content
          const updatedWeeksData = [...WEEKS_DATA];
          const weekIndex = apiWeek - 1;

          // Update description for current week
          if (updatedWeeksData[weekIndex] && summary.week_info?.text) {
            updatedWeeksData[weekIndex] = {
              ...updatedWeeksData[weekIndex],
              description: summary.week_info.text
            };
          }

          // Update history for ALL weeks up to (and including) current week
          if (userProfile.pregnancy_start_date) {
            const startDate = new Date(userProfile.pregnancy_start_date);

            for (let wIdx = 0; wIdx <= weekIndex; wIdx++) {
              if (!updatedWeeksData[wIdx]) continue;

              const weekStart = new Date(startDate);
              weekStart.setDate(startDate.getDate() + (wIdx * 7));

              const updatedWeekDays = updatedWeeksData[wIdx].weekDays.map((dayItem, dIndex) => {
                const dayDate = new Date(weekStart);
                dayDate.setDate(weekStart.getDate() + dIndex);
                const dateStr = dayDate.toISOString().split('T')[0];
                const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

                const historyItem = summary.exposure_history?.items?.find(
                  (item: any) => item.date === dateStr
                );
                const hasHistory = !!historyItem;

                return {
                  ...dayItem,
                  day: dayName,
                  isActive: hasHistory ? true : (dayItem.isActive || false),
                  activeIcons: hasHistory ? (['running'] as ('heart' | 'basket' | 'running')[]) : dayItem.activeIcons,
                };
              });

              updatedWeeksData[wIdx] = {
                ...updatedWeeksData[wIdx],
                weekDays: updatedWeekDays
              };
            }
          }
          setWeeksData(updatedWeeksData);
        }
      } catch (e) {
        console.error("Failed to fetch home data", e);
      }
    };
    fetchData();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get today's day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const getTodayDayOfWeek = useCallback((): number => {
    const today = new Date();
    const dayIndex = today.getDay();
    // Convert to our format: Monday = 0, Tuesday = 1, ..., Sunday = 6
    return dayIndex === 0 ? 6 : dayIndex - 1;
  }, []);

  const styles = useMemo(() => StyleSheet.create({
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
      position: 'relative',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
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
      position: 'absolute',
      top: NOTCH_DEPTH + 20,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
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
      paddingVertical: 14,
      paddingHorizontal: 36,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      marginBottom: HEADER_BUTTON_MARGIN_BOTTOM
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
  }), [theme]);

  // Memoize the header component
  const handleHeaderLayout = useCallback((event: any) => {
    const height = event?.nativeEvent?.layout?.height ?? 0;
    if (height > 0 && height !== headerHeight) {
      setHeaderHeight(height);
    }
  }, [headerHeight]);

  const handleWeekItemLayout = useCallback((event: any) => {
    const height = event?.nativeEvent?.layout?.height ?? 0;
    if (height > 0 && height !== weekItemHeight) {
      setWeekItemHeight(height);
    }
  }, [weekItemHeight]);

  const renderHeader = useCallback(() => (
    <View style={styles.birthdayCardWrapper} onLayout={handleHeaderLayout}>
      <View style={styles.birthdayCardContainer}>
        {/* SVG Background with curved top */}
        <Svg width={CARD_WIDTH} height={CARD_HEIGHT} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFB86A" />
              <Stop offset="50%" stopColor="#FF9045" />
              <Stop offset="100%" stopColor="#FF6D5C" />
            </LinearGradient>
          </Defs>
          <Path
            d={`
              M 20 0
              L ${CARD_WIDTH * 0.3} 0
              C ${CARD_WIDTH * 0.35} 0, ${CARD_WIDTH * 0.38} ${NOTCH_DEPTH * 0.1}, ${CARD_WIDTH * 0.42} ${NOTCH_DEPTH * 0.5}
              C ${CARD_WIDTH * 0.45} ${NOTCH_DEPTH * 0.9}, ${CARD_WIDTH * 0.55} ${NOTCH_DEPTH * 0.9}, ${CARD_WIDTH * 0.58} ${NOTCH_DEPTH * 0.5}
              C ${CARD_WIDTH * 0.62} ${NOTCH_DEPTH * 0.1}, ${CARD_WIDTH * 0.65} 0, ${CARD_WIDTH * 0.7} 0
              L ${CARD_WIDTH - 20} 0
              Q ${CARD_WIDTH} 0, ${CARD_WIDTH} 20
              L ${CARD_WIDTH} ${CARD_HEIGHT - 20}
              Q ${CARD_WIDTH} ${CARD_HEIGHT}, ${CARD_WIDTH - 20} ${CARD_HEIGHT}
              L 20 ${CARD_HEIGHT}
              Q 0 ${CARD_HEIGHT}, 0 ${CARD_HEIGHT - 20}
              L 0 20
              Q 0 0, 20 0
              Z
            `}
            fill="url(#cardGradient)"
          />
        </Svg>

        {/* Icon inside circle */}
        <View style={styles.iconCircleContainer}>
          <SvgXml xml={BIRTHDAY_SVG} width={ICON_SIZE * 0.55} height={ICON_SIZE * 0.65} />
        </View>

        {/* Card Content Overlay */}
        <View style={styles.cardOverlay}>
          <View style={styles.textContainer}>
            <Text style={styles.title} allowFontScaling={false}>Pick your baby's birthday</Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Pregnancy cycle is over and now you{'\n'}can pick birth date
            </Text>
          </View>

          <TouchableOpacity style={styles.planButton} onPress={onNavigateToPlanBirthday} activeOpacity={0.7}>
            <Text style={styles.planButtonText} allowFontScaling={false}>Plan Birthday</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [styles, handleHeaderLayout, onNavigateToPlanBirthday]);

  const handleNavigateToToday = useCallback(() => {
    if (showTodayAds) return;
    setShowTodayAds(true);
  }, [showTodayAds]);

  // Memoize the render function for week items
  // Note: In reversed array, index 0 = week 40, so active week index calculation:
  // If activeWeek = 1, then in reversed array it's at index (40 - 1) = 39
  // If activeWeek = 40, then in reversed array it's at index (40 - 40) = 0
  const renderWeekItem: ListRenderItem<WeekData> = useCallback(({ item, index }) => {
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
    const updatedWeekDays = item.weekDays.map((dayData, dayIndex) => {
      const isBeforeToday =
        weekNumber < activeWeek ||
        (weekNumber === activeWeek && dayIndex < todayDayIndex);

      const isStartDay = weekNumber === activeWeek && dayIndex === todayDayIndex;

      // If active (completed), it's not missed. Only missed if before today AND not active.
      const isMissed = dayData.isActive ? false : (isBeforeToday ? true : (dayData.isMissed || false));

      return {
        ...dayData,
        isStartDay,
        isMissed,
      };
    });
    
    // Calculate if this week should be reversed (alternating pattern)
    // In reversed array: week 40 is at index 0 (no reverse), week 39 is at index 1 (reverse), etc.
    const shouldReverse = index % 2 === 1;
    
    return (
      <View style={styles.weekItem} onLayout={index === 0 ? handleWeekItemLayout : undefined}>
        <WeekCycleView
          title={item.title}
          description={item.description}
          centerImage={item.centerImage}
          circleIcons={item.circleIcons}
          weekDays={updatedWeekDays}
          onStartPress={handleNavigateToToday}
          onImagePress={isActiveWeek ? onNavigateToBabyStatus : undefined}
          isActive={isActiveWeek}
          reversed={shouldReverse}
        />
      </View>
    );
  }, [styles.weekItem, handleNavigateToToday, onNavigateToBabyStatus, handleWeekItemLayout, activeWeek, totalWeeks, getTodayDayOfWeek]);

  // Memoize key extractor
  const keyExtractor = useCallback((item: WeekData) => item.id, []);

  // Reverse weeks data for display (column-reverse effect)
  const reversedWeeksData = useMemo(() => [...weeksData].reverse(), [weeksData]);

  // Calculate index for active week in reversed array
  // If activeWeek = 1, index should be 39 (40 - 1) in reversed array
  // If activeWeek = 40, index should be 0 in reversed array
  const activeWeekIndex = useMemo(() => {
    return totalWeeks - activeWeek;
  }, [activeWeek, totalWeeks]);

  // Get item layout for accurate scrolling
  // Note: Heights are approximate and may need adjustment based on actual measurements
  const getItemLayout = useCallback((data: any, index: number) => {
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
  }, [headerHeight, weekItemHeight]);

  // Scroll to active week when layout is ready
  useEffect(() => {
    if (isLayoutReady && flatListRef.current && activeWeek >= 1 && activeWeek <= totalWeeks) {
      console.log(`[HomeScreen] Scrolling to activeWeek: ${activeWeek}, calculated index: ${activeWeekIndex}`);
      console.log(`[HomeScreen] Reversed array: first item is "${reversedWeeksData[0]?.title}", last item is "${reversedWeeksData[reversedWeeksData.length - 1]?.title}"`);
      
      // Multiple attempts with increasing delays to ensure proper rendering
      const attemptScroll = (attempt: number = 1) => {
        const delay = attempt * 300;
        setTimeout(() => {
          try {
            console.log(`[HomeScreen] Scroll attempt ${attempt}, scrolling to index ${activeWeekIndex}`);
            flatListRef.current?.scrollToIndex({
              index: activeWeekIndex,
              animated: attempt === 1, // Only animate first attempt
              viewPosition: 0,
              viewOffset: WEEK_CARD_TEXT_SECTION_HEIGHT, // Scroll more so active week card is in view (opposite of subtract)
            });
          } catch (error) {
            console.log(`[HomeScreen] ScrollToIndex failed on attempt ${attempt}, using scrollToOffset fallback`, error);
            const layout = getItemLayout(null, activeWeekIndex);
            const offsetCorrected = layout.offset + WEEK_CARD_TEXT_SECTION_HEIGHT;
            console.log(`[HomeScreen] Using offset: ${offsetCorrected} (raw: ${layout.offset})`);
            flatListRef.current?.scrollToOffset({
              offset: offsetCorrected,
              animated: attempt === 1,
            });
            
            // Retry if first attempt failed
            if (attempt < 3) {
              attemptScroll(attempt + 1);
            }
          }
        }, delay);
      };
      
      attemptScroll(1);
    }
  }, [isLayoutReady, activeWeekIndex, activeWeek, getItemLayout, reversedWeeksData, totalWeeks]);

  // Handle scroll to index errors with better retry logic
  const handleScrollToIndexFailed = useCallback((info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
    console.log('ScrollToIndexFailed:', info);
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
  }, [getItemLayout]);

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
      <HomeTopDecorations />
      <MainHeader 
        weekNumber={`${activeWeek}${getOrdinalSuffix(activeWeek)} Week`}
        icons={[
          { type: 'food', count: 0 },
          { type: 'exercise', count: 0 },
          { type: 'heart', count: 0 },
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
        contentContainerStyle={{ paddingBottom: spacing('xl') }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={11}
        initialNumToRender={Math.min(activeWeekIndex + 3, 10)}
        getItemLayout={getItemLayout}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        updateCellsBatchingPeriod={100}
      />


      {/* FAB */}
      <FloatingActionButton
        onApply={(data: { moods: string[]; symptoms: string[]; waterAmount: number }) => {
          // Handle apply with data
          console.log('Applied data:', data);
        }}
      />
      
      <Modal
        visible={showTodayAds}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <AdsScreen
          onClose={() => {
            setShowTodayAds(false);
            onNavigateToToday?.();
          }}
        />
      </Modal>
    </SafeAreaView>
  );
};
