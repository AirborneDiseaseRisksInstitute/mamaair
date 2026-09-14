import { scale, moderateScale, fontScale } from '../utils/responsive';

export const theme = {
  colors: {
    // Orange palette
    orange50: '#FFF7ED',
    orange100: '#FFEDD4',
    orange200: '#FFD6A8',
    orange300: '#FFB86A',
    orange400: '#FF8904',
    orange500: '#FF6900',
    orange600: '#F54900',
    orange700: '#CA3500',
    orange800: '#9F2D00',
    orange900: '#7E2A0C',
    orange950: '#441306',

    // Neutral palette
    neutral50: '#FAFAFA',
    neutral100: '#F5F5F5',
    neutral200: '#E5E5E5',
    neutral300: '#D4D4D4',
    neutral400: '#A1A1A1',
    neutral500: '#737373',
    neutral600: '#525252',
    neutral700: '#404040',
    neutral800: '#262626',
    neutral900: '#171717',
    neutral950: '#0A0A0A',

     // Gray palette
     gray50: '#FAFAFA',
     gray100: '#F5F5F5',
     gray200: '#E5E5E5',
     gray300: '#D4D4D4',
     gray400: '#A1A1A1',
     gray500: '#737373',
     gray600: '#525252',
     gray700: '#404040',
     gray800: '#262626',
     gray900: '#171717',
     gray950: '#0A0A0A',

    // Semantic colors (using orange as primary)
    primary: '#FF6900',
    background: '#FFFFFF',
    textPrimary: '#171717',
    textSecondary: '#525252',
    textTertiary: '#A1A1A1',
    selectedOption: '#9B3F00',
  },

  spacing: {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
  },

  radius: {
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(16),
  },

  typography: {
    fontFamily: {
      regular: 'MPLUSRounded1c-Regular',
      medium: 'MPLUSRounded1c-Medium',
      bold: 'MPLUSRounded1c-Bold',
      extraBold: 'MPLUSRounded1c-ExtraBold',
    },
    fontSize: {
      xs: fontScale(12),
      sm: fontScale(14),
      md: fontScale(16),
      lg: fontScale(18),
      xl: fontScale(20),
      '2xl': fontScale(24),
      '3xl': fontScale(30),
      '4xl': fontScale(36),
    },
    lineHeight: {
      xs: fontScale(16),
      sm: fontScale(20),
      md: fontScale(24),
      lg: fontScale(28),
      xl: fontScale(32),
      '2xl': fontScale(36),
      '3xl': fontScale(44),
      '4xl': fontScale(48),
    },
    // Predefined text styles
    h1: {
      fontFamily: 'MPLUSRounded1c-Bold',
      fontSize: fontScale(36),
      lineHeight: fontScale(48),
    },
    h2: {
      fontFamily: 'MPLUSRounded1c-Bold',
      fontSize: fontScale(30),
      lineHeight: fontScale(44),
    },
    h3: {
      fontFamily: 'MPLUSRounded1c-Bold',
      fontSize: fontScale(24),
      lineHeight: fontScale(36),
    },
    h4: {
      fontFamily: 'MPLUSRounded1c-Bold',
      fontSize: fontScale(20),
      lineHeight: fontScale(32),
    },
    title: {
      fontFamily: 'MPLUSRounded1c-Medium',
      fontSize: fontScale(20),
      lineHeight: fontScale(28),
    },
    body: {
      fontFamily: 'MPLUSRounded1c-Regular',
      fontSize: fontScale(16),
      lineHeight: fontScale(24),
    },
    bodyMedium: {
      fontFamily: 'MPLUSRounded1c-Medium',
      fontSize: fontScale(16),
      lineHeight: fontScale(24),
    },
    caption: {
      fontFamily: 'MPLUSRounded1c-Regular',
      fontSize: fontScale(12),
      lineHeight: fontScale(16),
    },
    small: {
      fontFamily: 'MPLUSRounded1c-Regular',
      fontSize: fontScale(14),
      lineHeight: fontScale(20),
    },
  },
};

export type Theme = typeof theme;
