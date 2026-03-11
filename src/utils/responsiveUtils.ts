import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Responsive utility functions to handle different screen sizes and font scaling
 * Targets mobile devices from 4.3" to 6.7" with various font scale settings
 * Provides allowFontScaling: false to prevent system font size settings from breaking layout
 */

export const responsiveUtils = {
  /**
   * Get responsive padding based on screen height
   * Scales down on smaller screens to prevent overlap
   */
  getResponsivePadding: (basePadding: number): number => {
    const SMALL_SCREEN = 640;
    const MEDIUM_SCREEN = 720;
    const LARGE_SCREEN = 800;
    const XLARGE_SCREEN = 1000;
    
    if (SCREEN_HEIGHT < SMALL_SCREEN) {
      return basePadding * 0.5;
    } else if (SCREEN_HEIGHT < MEDIUM_SCREEN) {
      return basePadding * 0.65;
    } else if (SCREEN_HEIGHT < LARGE_SCREEN) {
      return basePadding * 0.75;
    } else if (SCREEN_HEIGHT < XLARGE_SCREEN) {
      return basePadding * 0.85;
    }
    return basePadding * 0.6;
  },

  /**
   * Get responsive font size based on screen width
   * Accounts for system font scaling
   */
  getResponsiveFontSize: (baseFontSize: number): number => {
    const SMALL_SCREEN = 360;
    const MEDIUM_SCREEN = 375;
    const LARGE_SCREEN = 410;
    
    if (SCREEN_WIDTH < SMALL_SCREEN) {
      return baseFontSize * 0.85;
    } else if (SCREEN_WIDTH < MEDIUM_SCREEN) {
      return baseFontSize * 0.92;
    } else if (SCREEN_WIDTH < LARGE_SCREEN) {
      return baseFontSize * 0.97;
    }
    return baseFontSize;
  },

  /**
   * Get responsive line height
   */
  getResponsiveLineHeight: (baseFontSize: number, baseLineHeight: number): number => {
    const responsiveFontSize = responsiveUtils.getResponsiveFontSize(baseFontSize);
    const ratio = baseLineHeight / baseFontSize;
    return responsiveFontSize * ratio;
  },

  /**
   * Get responsive spacing - reduces spacing on smaller screens
   */
  getResponsiveSpacing: (baseSpacing: number): number => {
    const SMALL_SCREEN = 640;
    const MEDIUM_SCREEN = 720;
    const LARGE_SCREEN = 1000;
    
    if (SCREEN_HEIGHT < SMALL_SCREEN) {
      return baseSpacing * 0.6;
    } else if (SCREEN_HEIGHT < MEDIUM_SCREEN) {
      return baseSpacing * 0.75;
    } else if (SCREEN_HEIGHT < LARGE_SCREEN) {
      return baseSpacing * 0.9;
    }
    return baseSpacing * 0.8;
  },

  /**
   * Get content padding that adapts to screen size
   * Smaller on large screens to ensure content fits
   * Larger on small screens for safety margin
   */
  getResponsiveContentPadding: (): { top: number; bottom: number } => {
    const SMALL_SCREEN = 640;
    const MEDIUM_SCREEN = 720;
    const LARGE_SCREEN = 1000;
    
    if (SCREEN_HEIGHT < SMALL_SCREEN) {
      return { top: 70, bottom: 70 };
    } else if (SCREEN_HEIGHT < MEDIUM_SCREEN) {
      return { top: 80, bottom: 80 };
    } else if (SCREEN_HEIGHT < LARGE_SCREEN) {
      return { top: 90, bottom: 90 };
    }
    return { top: 80, bottom: 80 };
  },

  /**
   * Get responsive image size
   */
  getResponsiveImageSize: (baseSize: number): number => {
    const SMALL_SCREEN = 640;
    
    if (SCREEN_HEIGHT < SMALL_SCREEN) {
      return baseSize * 0.75;
    }
    return baseSize;
  },

  /**
   * Check if screen is considered "small" for conditional rendering
   */
  isSmallScreen: (): boolean => {
    return SCREEN_HEIGHT < 680;
  },

  /**
   * Check if using large system font scale (accessibility feature)
   */
  shouldReduceContentOnSmallScreen: (): boolean => {
    return SCREEN_HEIGHT < 680;
  },

  /**
   * Get the safe scrollable area height
   */
  getScrollableHeight: (): number => {
    const contentPadding = responsiveUtils.getResponsiveContentPadding();
    return SCREEN_HEIGHT - contentPadding.top - contentPadding.bottom - 50;
  },

  /**
   * CRITICAL: Configuration for Text components to prevent system font scaling
   * Usage in Text components: allowFontScaling={false}
   * This ensures the app ignores the phone's system font size settings
   */
  textScalingConfig: {
    allowFontScaling: false,
  },

  /**
   * Get fixed font size for headers that should not scale with system settings
   * Base size is scaled only by screen dimensions, NOT by system font settings
   */
  getFixedFontSize: (baseFontSize: number): number => {
    // Only scale based on screen width, ignore system font scale
    const SMALL_SCREEN = 360;
    const MEDIUM_SCREEN = 375;
    const LARGE_SCREEN = 410;
    
    if (SCREEN_WIDTH < SMALL_SCREEN) {
      return baseFontSize * 0.85;
    } else if (SCREEN_WIDTH < MEDIUM_SCREEN) {
      return baseFontSize * 0.92;
    } else if (SCREEN_WIDTH < LARGE_SCREEN) {
      return baseFontSize * 0.97;
    }
    return baseFontSize;
  },

  /**
   * Get fixed line height independent of system settings
   */
  getFixedLineHeight: (baseFontSize: number, baseLineHeight: number): number => {
    const fixedFontSize = responsiveUtils.getFixedFontSize(baseFontSize);
    const ratio = baseLineHeight / baseFontSize;
    return fixedFontSize * ratio;
  },

  /**
   * Get badge/small text size for counters and labels
   * Prevents badge text from becoming unreadably large on high font scale devices
   */
  getBadgeFontSize: (): number => {
    // Badge text stays fixed at 10px regardless of system scale
    return 10;
  },

  /**
   * Get day label size for WeekCycle component
   * Ensures day labels (Mon, Tue, etc.) stay readable and don't overlap
   */
  getDayLabelFontSize: (): number => {
    // Base 12px for day labels, slightly adjust for very small screens
    if (SCREEN_WIDTH < 360) {
      return 11;
    }
    return 12;
  },

  /**
   * Get icon size for WeekCycle view (activity icons)
   * Adaptive sizing based on screen width to prevent overlap
   */
  getWeekCycleIconSize: (): number => {
    // Base 25px for icons, scale down on small screens
    if (SCREEN_WIDTH < 360) {
      return 22;
    } else if (SCREEN_WIDTH < 375) {
      return 24;
    }
    return 25;
  },

  /**
   * Get dot size for WeekCycle circular view
   * Size of the circles representing each day
   */
  getWeekCycleDotSize: (): number => {
    // Base 15px for dots, scale down on small screens
    if (SCREEN_WIDTH < 360) {
      return 13;
    } else if (SCREEN_WIDTH < 375) {
      return 14;
    }
    return 15;
  },

  /**
   * Get main circle diameter for WeekCycle
   * The main center circle that contains all the dots
   */
  getWeekCycleMainCircleDiameter: (): number => {
    // Base 170px, adaptive to screen width
    if (SCREEN_WIDTH < 360) {
      return 150;
    } else if (SCREEN_WIDTH < 375) {
      return 160;
    } else if (SCREEN_WIDTH < 410) {
      return 165;
    }
    return 170;
  },
};
