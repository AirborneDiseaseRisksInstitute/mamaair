import { scale, moderateScale, fontScale } from '../utils/responsive';

const colorChannels = (value: string): [number, number, number] | null => {
  const hex = value.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];
};

const toHex = (channels: number[]) => `#${channels.map(channel =>
  Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'),
).join('').toUpperCase()}`;

const darkSurfaceColor = (lightColor: string): string => {
  const channels = colorChannels(lightColor);
  if (!channels) return '#252525';
  const average = (channels[0] + channels[1] + channels[2]) / 3;
  return toHex(channels.map(channel => 37 + (channel - average) * 0.55));
};

const darkBorderColor = (lightColor: string): string => {
  const channels = colorChannels(lightColor);
  if (!channels) return '#4A4A4A';
  const average = (channels[0] + channels[1] + channels[2]) / 3;
  return toHex(channels.map(channel => 70 + (channel - average) * 0.4));
};

const contrastLuminance = (channels: number[]) => {
  const linear = channels.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};

const darkAccentTextColor = (lightColor: string): string => {
  const channels = colorChannels(lightColor);
  if (!channels) return lightColor;
  const surfaceLuminance = contrastLuminance([37, 37, 37]);
  for (let mix = 0; mix <= 1; mix += 0.05) {
    const adjusted = channels.map(channel => channel + (255 - channel) * mix);
    if ((contrastLuminance(adjusted) + 0.05) / (surfaceLuminance + 0.05) >= 4.5) {
      return toHex(adjusted);
    }
  }
  return '#FFFFFF';
};

export const theme = {
  mode: 'light' as 'light' | 'dark',
  surfaceColor: (lightColor: string): string => lightColor,
  borderColor: (lightColor: string): string => lightColor,
  accentTextColor: (lightColor: string): string => lightColor,
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
    surface: '#FFFFFF',
    surfaceMuted: '#FAFAFA',
    textPrimary: '#171717',
    textSecondary: '#525252',
    textTertiary: '#A1A1A1',
    selectedOption: '#9B3F00',
    buttonDepth: '#7E2A0C',
    buttonDisabledDepth: '#525252',
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

export const darkTheme: Theme = {
  ...theme,
  mode: 'dark',
  surfaceColor: darkSurfaceColor,
  borderColor: darkBorderColor,
  accentTextColor: darkAccentTextColor,
  colors: {
    ...theme.colors,
    orange50: '#271A13',
    orange100: '#382317',
    orange200: '#54301A',
    orange300: '#B8733D',
    orange700: '#FF9B5A',
    orange800: '#FFB982',
    orange900: '#FFD2A9',
    orange950: '#FFE9D5',
    neutral50: '#151515',
    neutral100: '#202020',
    neutral200: '#343434',
    neutral300: '#4A4A4A',
    neutral400: '#8D8D8D',
    neutral500: '#B0B0B0',
    neutral600: '#C8C8C8',
    neutral700: '#DADADA',
    neutral800: '#EBEBEB',
    neutral900: '#F5F5F5',
    neutral950: '#FFFFFF',
    gray50: '#151515',
    gray100: '#202020',
    gray200: '#343434',
    gray300: '#4A4A4A',
    gray400: '#8D8D8D',
    gray500: '#B0B0B0',
    gray600: '#C8C8C8',
    gray700: '#DADADA',
    gray800: '#EBEBEB',
    gray900: '#F5F5F5',
    gray950: '#FFFFFF',
    background: '#121212',
    surface: '#1D1D1D',
    surfaceMuted: '#252525',
    textPrimary: '#F5F5F5',
    textSecondary: '#C8C8C8',
    textTertiary: '#A0A0A0',
    selectedOption: '#FFB982',
    buttonDepth: '#7E2A0C',
    buttonDisabledDepth: '#171717',
  },
};
