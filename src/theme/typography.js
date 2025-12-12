/**
 * Educultivo - Typography System
 * Using Overlock font family for consistent branding
 */

import { Platform } from 'react-native';

export const typography = {
  // Font families - Overlock for all platforms
  fontFamily: {
    regular: 'Overlock-Regular',
    italic: 'Overlock-Italic',
    bold: 'Overlock-Bold',
    boldItalic: 'Overlock-BoldItalic',
    black: 'Overlock-Black',
    blackItalic: 'Overlock-BlackItalic',
  },
  
  // Font sizes following a consistent scale
  fontSize: {
    xs: 12,    // Small labels, captions
    sm: 14,    // Secondary text, descriptions
    base: 16,  // Body text, default size
    lg: 18,    // Larger body text, subtitles
    xl: 20,    // Section headers
    '2xl': 24, // Screen titles
    '3xl': 30, // Large headers
    '4xl': 36, // Hero text
  },
  
  // Line heights for better readability
  lineHeight: {
    tight: 1.2,    // For headers and titles
    normal: 1.5,   // For body text
    relaxed: 1.75, // For longer paragraphs
  },
  
  // Font weights - mapped to Overlock variants
  fontWeight: {
    normal: '400',
    bold: '700',
    black: '900',
  },
  
  // Letter spacing for different text types
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// Pre-defined text styles for common use cases
export const textStyles = {
  // Headers
  h1: {
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
    fontWeight: '900',
  },
  h2: {
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.tight,
    fontWeight: '700',
  },
  h3: {
    fontSize: typography.fontSize.xl,
    lineHeight: typography.fontSize.xl * typography.lineHeight.tight,
    fontWeight: '700',
  },
  
  // Body text
  body: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    fontWeight: '400',
  },
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    fontWeight: '400',
  },
  
  // Special text styles
  caption: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    fontWeight: '400',
  },
  button: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.tight,
    fontWeight: '700',
    letterSpacing: typography.letterSpacing.wide,
  },
  label: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    fontWeight: '700',
  },
};

export default typography;