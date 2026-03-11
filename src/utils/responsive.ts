/**
 * Responsive scaling utility for MamaAir
 * 
 * Design reference: 390 x 844 (6.1" phone - iPhone 14 / standard design)
 * Minimum supported: ~375 x 667 (4.7" phone)
 * 
 * Usage:
 *   import { s, vs, ms, mvs, fs } from '../utils/responsive';
 *   
 *   width: s(150)         // Horizontal scaling (widths, horizontal padding/margin)
 *   height: vs(100)       // Vertical scaling (heights, vertical padding/margin)
 *   fontSize: fs(16)      // Font scaling (moderate + system font normalization)
 *   borderRadius: ms(12)  // Moderate scaling (radius, icon sizes, button heights)
 *   marginTop: mvs(64)    // Moderate vertical scaling (vertical spacing that shouldn't shrink too much)
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Reference design size (6.1" phone)
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

/**
 * Scales a value based on screen width ratio.
 * Use for: widths, horizontal padding/margin, image widths
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / DESIGN_WIDTH) * size;
};

/**
 * Scales a value based on screen height ratio.
 * Use for: heights, vertical padding/margin (when they should shrink proportionally)
 */
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / DESIGN_HEIGHT) * size;
};

/**
 * Moderate horizontal scaling - doesn't scale as aggressively.
 * Use for: border radius, icon sizes, button heights, element dimensions
 * @param factor 0 = no scaling, 1 = full scaling (default 0.5)
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Moderate vertical scaling - doesn't shrink/grow as aggressively.
 * Use for: vertical margins/paddings that shouldn't shrink too much
 * @param factor 0 = no scaling, 1 = full scaling (default 0.75)
 */
export const moderateVerticalScale = (size: number, factor: number = 0.75): number => {
  return size + (verticalScale(size) - size) * factor;
};

/**
 * Font size scaling.
 * Uses moderate scale (factor 0.35) to keep fonts readable on small screens
 * and normalizes against system font scaling to prevent layout breakage.
 */
export const fontScale = (size: number): number => {
  const scaled = moderateScale(size, 0.35);
  // Normalize against system font scaling so layout doesn't break
  // when user increases system font size
  return scaled / PixelRatio.getFontScale();
};

// Short aliases for convenience
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;
export const mvs = moderateVerticalScale;
export const fs = fontScale;

// Screen info exports
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
export const isSmallScreen = SCREEN_HEIGHT < 700;
export const isMediumScreen = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 800;

/**
 * Standard bottom padding for scrollable content that has a FixedButtonContainer.
 * This ensures content is never hidden behind the fixed button.
 * Button height (~58) + top padding (~16) + bottom padding (~24) + extra safety = ~120
 */
export const FIXED_BUTTON_AREA_HEIGHT = moderateScale(58) + scale(16) + scale(24) + scale(16);

/**
 * Standard top padding for screens with BackButton + ProgressBar.
 * BackButton is at: safeArea.top + spacing('md'), height ~36px
 * We need to clear that + some breathing room.
 */
export const HEADER_CLEARANCE = verticalScale(80);



