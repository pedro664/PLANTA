/**
 * Educultivo - Theme System
 * Central export for all theme modules
 */

export { default as colors, botanicalColors, systemColors, uiColors } from './colors';
export { default as typography, textStyles } from './typography';
export { default as spacing, borderRadius, layout, margins, paddings, sizes } from './spacing';
export { default as shadows, componentShadows, pressedShadows, getShadow, getComponentShadow } from './shadows';

// Complete theme object for easy access
export const theme = {
  colors: require('./colors').default,
  typography: require('./typography').default,
  spacing: require('./spacing').default,
  shadows: require('./shadows').default,
};

export default theme;