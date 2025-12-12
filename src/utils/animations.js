import { Animated, Easing } from 'react-native';

/**
 * Animation utilities for Educultivo using React Native's built-in Animated API
 * Provides reusable animations for consistent user experience
 */

// Animation durations
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 600,
  SPLASH: 3000,
};

// Easing curves
export const EASING = {
  EASE_OUT: Easing.out(Easing.quad),
  EASE_IN: Easing.in(Easing.quad),
  EASE_IN_OUT: Easing.inOut(Easing.quad),
  SPRING: Easing.elastic(1.2),
};

/**
 * Fade In Animation
 * Used for screen transitions and element appearances
 * @param {Animated.Value} animatedValue - The animated value to animate
 * @param {number} duration - Animation duration in ms
 * @param {function} onComplete - Callback when animation completes
 * @returns {Animated.CompositeAnimation} React Native animation
 */
export const fadeIn = (animatedValue, duration = ANIMATION_DURATION.NORMAL, onComplete) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

/**
 * Fade Out Animation
 * Used for screen exits and element disappearances
 * @param {Animated.Value} animatedValue - The animated value to animate
 * @param {number} duration - Animation duration in ms
 * @param {function} onComplete - Callback when animation completes
 * @returns {Animated.CompositeAnimation} React Native animation
 */
export const fadeOut = (animatedValue, duration = ANIMATION_DURATION.NORMAL, onComplete) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Scale Animation
 * Used for button presses and interactive elements
 * @param {Animated.Value} animatedValue - The animated value to animate
 * @param {number} toValue - Target scale (0.95 for press, 1 for release)
 * @param {number} duration - Animation duration in ms
 * @returns {Animated.CompositeAnimation} React Native animation
 */
export const scale = (animatedValue, toValue = 0.95, duration = ANIMATION_DURATION.FAST) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

/**
 * Pulse Animation
 * Used for elements that need attention (notifications, alerts)
 * @param {Animated.Value} animatedValue - The animated value to animate
 * @param {number} scale - Maximum scale value (default 1.1)
 * @param {number} duration - Single pulse duration in ms
 * @returns {Animated.CompositeAnimation} React Native animation
 */
export const pulse = (animatedValue, scale = 1.1, duration = 800) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: scale,
        duration: duration / 2,
        easing: EASING.EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration / 2,
        easing: EASING.EASE_IN,
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Float Animation
 * Used for splash screen and floating elements
 * Creates a gentle up and down movement
 * @param {Animated.Value} animatedValue - The animated value to animate
 * @param {number} distance - Float distance in pixels
 * @param {number} duration - Single float cycle duration in ms
 * @returns {Animated.CompositeAnimation} React Native animation
 */
export const float = (animatedValue, distance = 10, duration = 2000) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: distance,
        duration: duration / 2,
        easing: EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -distance,
        duration: duration / 2,
        easing: EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Bounce Animation
 * Used for success states and positive feedback
 * @param {Animated.Value} animatedValue - The animated value to animate
 * @param {number} scale - Maximum bounce scale
 * @param {number} duration - Total animation duration in ms
 * @returns {Animated.CompositeAnimation} React Native animation
 */
export const bounce = (animatedValue, scale = 1.2, duration = 600) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: scale,
      duration: duration * 0.3,
      easing: EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0.9,
      duration: duration * 0.2,
      easing: EASING.EASE_IN,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration * 0.5,
      easing: EASING.SPRING,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Shake Animation
 * Used for error states and validation feedback
 * @param {Animated.Value} animatedValue - The animated value to animate
 * @param {number} distance - Shake distance in pixels
 * @param {number} duration - Total shake duration in ms
 * @returns {Animated.CompositeAnimation} React Native animation
 */
export const shake = (animatedValue, distance = 10, duration = 400) => {
  return Animated.sequence([
    Animated.timing(animatedValue, { toValue: distance, duration: duration / 8, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -distance, duration: duration / 4, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: distance, duration: duration / 4, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -distance, duration: duration / 4, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: duration / 8, useNativeDriver: true }),
  ]);
};

/**
 * Rotate Animation
 * Used for loading indicators and refresh buttons
 * @param {Animated.Value} animatedValue - The animated value to animate
 * @param {number} duration - Single rotation duration in ms
 * @returns {Animated.CompositeAnimation} React Native animation
 */
export const rotate = (animatedValue, duration = 1000) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Spring Animation
 * Used for natural feeling animations
 * @param {Animated.Value} animatedValue - The animated value to animate
 * @param {number} toValue - Target value
 * @param {object} config - Spring configuration
 * @returns {Animated.CompositeAnimation} React Native animation
 */
export const spring = (animatedValue, toValue, config = {}) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension: 100,
    friction: 8,
    useNativeDriver: true,
    ...config,
  });
};

// Pre-configured animation presets for common use cases
export const ANIMATION_PRESETS = {
  // Interactive feedback
  BUTTON_PRESS_SCALE: 0.95,
  BUTTON_RELEASE_SCALE: 1,
  SUCCESS_BOUNCE_SCALE: 1.1,
  ERROR_SHAKE_DISTANCE: 8,
  
  // Attention animations
  PULSE_SCALE: 1.05,
  PULSE_DURATION: 1000,
  
  // Splash screen
  SPLASH_FLOAT_DISTANCE: 15,
  SPLASH_FLOAT_DURATION: 3000,
  
  // Loading states
  LOADING_ROTATE_DURATION: 1000,
  LOADING_PULSE_SCALE: 1.1,
  LOADING_PULSE_DURATION: 800,
};

export default {
  fadeIn,
  fadeOut,
  scale,
  pulse,
  float,
  bounce,
  shake,
  rotate,
  spring,
  ANIMATION_DURATION,
  EASING,
  ANIMATION_PRESETS,
};