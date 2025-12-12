/**
 * Fallback animations for compatibility issues
 * Simple animations without react-native-reanimated
 */

// Animation durations
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 600,
  SPLASH: 3000,
};

// Simple easing (no reanimated dependency)
export const EASING = {
  EASE_OUT: 'ease-out',
  EASE_IN: 'ease-in',
  EASE_IN_OUT: 'ease-in-out',
  SPRING: 'spring',
};

/**
 * Simple fade in - returns 1 (no animation for now)
 */
export const fadeIn = (duration = ANIMATION_DURATION.NORMAL, onComplete) => {
  if (onComplete) {
    setTimeout(onComplete, duration);
  }
  return 1;
};

/**
 * Simple fade out - returns 0 (no animation for now)
 */
export const fadeOut = (duration = ANIMATION_DURATION.NORMAL, onComplete) => {
  if (onComplete) {
    setTimeout(onComplete, duration);
  }
  return 0;
};

/**
 * Simple slide up - returns target value (no animation for now)
 */
export const slideUp = (toValue = 0, duration = ANIMATION_DURATION.NORMAL) => {
  return toValue;
};

/**
 * Simple slide down - returns target value (no animation for now)
 */
export const slideDown = (toValue, duration = ANIMATION_DURATION.NORMAL) => {
  return toValue;
};

/**
 * Simple pulse - returns 1 (no animation for now)
 */
export const pulse = (scale = 1.1, duration = 800, repeatCount = -1) => {
  return 1;
};

/**
 * Simple float - returns 0 (no animation for now)
 */
export const float = (distance = 10, duration = 2000) => {
  return 0;
};

/**
 * Simple scale - returns target value (no animation for now)
 */
export const scale = (toValue = 0.95, duration = ANIMATION_DURATION.FAST) => {
  return toValue;
};

/**
 * Simple bounce - returns 1 (no animation for now)
 */
export const bounce = (scale = 1.2, duration = 600) => {
  return 1;
};

/**
 * Simple shake - returns 0 (no animation for now)
 */
export const shake = (distance = 10, duration = 400) => {
  return 0;
};

/**
 * Simple rotate - returns degrees (no animation for now)
 */
export const rotate = (degrees = 360, duration = 1000, repeatCount = -1) => {
  return degrees;
};

// Pre-configured animation presets
export const ANIMATION_PRESETS = {
  SCREEN_FADE_IN: 1,
  SCREEN_FADE_OUT: 0,
  MODAL_SLIDE_UP: 0,
  MODAL_SLIDE_DOWN: 1000,
  PULSE_ATTENTION: 1,
  PULSE_INFINITE: 1,
  SPLASH_FLOAT: 0,
  SPLASH_FADE_OUT: 0,
  BUTTON_PRESS: 0.95,
  BUTTON_RELEASE: 1,
  SUCCESS_BOUNCE: 1,
  ERROR_SHAKE: 0,
  LOADING_ROTATE: 360,
  LOADING_PULSE: 1,
};

export default {
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  pulse,
  float,
  scale,
  bounce,
  shake,
  rotate,
  ANIMATION_DURATION,
  EASING,
  ANIMATION_PRESETS,
};