import { theme } from './tokens';

/**
 * Helper function to get spacing value
 */
export const spacing = (key: keyof typeof theme.spacing): number => {
  return theme.spacing[key];
};

/**
 * Helper function to get radius value
 */
export const radius = (key: keyof typeof theme.radius): number => {
  return theme.radius[key];
};

/**
 * Helper function to get color value
 */
export const color = (key: keyof typeof theme.colors): string => {
  return theme.colors[key];
};

/**
 * Helper function to create text style from typography
 */
export const textStyle = (
  style:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'title'
    | 'body'
    | 'bodyMedium'
    | 'caption'
    | 'small',
): {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
} => {
  const typographyStyle = theme.typography[style];
  if (typeof typographyStyle === 'object' && 'fontFamily' in typographyStyle) {
    return typographyStyle as {
      fontFamily: string;
      fontSize: number;
      lineHeight: number;
    };
  }
  // Fallback
  return theme.typography.body;
};

