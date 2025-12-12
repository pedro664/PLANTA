/**
 * Educultivo - Responsive Design Utilities
 * Device detection and responsive design helpers
 */

import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get current screen dimensions
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  const screenData = Dimensions.get('screen');
  
  return {
    window: { width, height },
    screen: screenData,
    isLandscape: width > height,
    isPortrait: height > width,
  };
};

// Device type detection
export const getDeviceType = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;
  
  // Detect device type based on screen size and platform
  const isTablet = (width >= 768 && height >= 1024) || (width >= 1024 && height >= 768);
  const isPhone = !isTablet;
  
  // Detect notch/dynamic island (approximate detection)
  const hasNotch = Platform.OS === 'ios' && (
    // iPhone X series and newer have these dimensions
    (width === 375 && height === 812) || // iPhone X, XS, 11 Pro
    (width === 414 && height === 896) || // iPhone XR, 11, XS Max, 11 Pro Max
    (width === 390 && height === 844) || // iPhone 12, 12 Pro, 13, 13 Pro
    (width === 428 && height === 926) || // iPhone 12 Pro Max, 13 Pro Max
    (width === 393 && height === 852) || // iPhone 14, 14 Pro
    (width === 430 && height === 932) || // iPhone 14 Pro Max
    aspectRatio > 2.0 // General rule for tall screens
  );
  
  return {
    isTablet,
    isPhone,
    hasNotch,
    platform: Platform.OS,
    aspectRatio,
  };
};

// Responsive breakpoints
export const breakpoints = {
  xs: 0,     // Extra small devices
  sm: 576,   // Small devices
  md: 768,   // Medium devices (tablets)
  lg: 992,   // Large devices
  xl: 1200,  // Extra large devices
};

// Get current breakpoint
export const getCurrentBreakpoint = () => {
  const { width } = getScreenDimensions().window;
  
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
};

// Responsive value selector
export const getResponsiveValue = (values) => {
  const breakpoint = getCurrentBreakpoint();
  
  // Return the value for current breakpoint or fallback to smaller ones
  return values[breakpoint] || 
         values.lg || 
         values.md || 
         values.sm || 
         values.xs || 
         values.default;
};

// Safe area utilities
export const useSafeAreaStyles = () => {
  const insets = useSafeAreaInsets();
  const { isTablet, hasNotch } = getDeviceType();
  
  return {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    
    // Minimum safe areas for devices without insets
    safeTop: Math.max(insets.top, hasNotch ? 44 : 20),
    safeBottom: Math.max(insets.bottom, hasNotch ? 34 : 0),
    safeLeft: Math.max(insets.left, 0),
    safeRight: Math.max(insets.right, 0),
    
    // Content padding that accounts for tab bar
    contentPaddingBottom: Math.max(insets.bottom + 80, 80), // 80 = tab bar height
    
    // FAB positioning
    fabBottom: Math.max(insets.bottom + 80, 80),
    
    // Tablet-specific adjustments
    isTablet,
    hasNotch,
  };
};

// Responsive spacing
export const getResponsiveSpacing = (baseSpacing = 16) => {
  const { isTablet } = getDeviceType();
  const breakpoint = getCurrentBreakpoint();
  
  // Scale spacing based on device type and breakpoint
  const scaleFactor = isTablet ? 1.5 : 1;
  const breakpointScale = {
    xs: 0.8,
    sm: 0.9,
    md: 1,
    lg: 1.1,
    xl: 1.2,
  };
  
  return Math.round(baseSpacing * scaleFactor * (breakpointScale[breakpoint] || 1));
};

// Responsive font sizes
export const getResponsiveFontSize = (baseFontSize = 16) => {
  const { isTablet } = getDeviceType();
  const breakpoint = getCurrentBreakpoint();
  
  // Scale font size based on device type and breakpoint
  const scaleFactor = isTablet ? 1.2 : 1;
  const breakpointScale = {
    xs: 0.9,
    sm: 0.95,
    md: 1,
    lg: 1.05,
    xl: 1.1,
  };
  
  return Math.round(baseFontSize * scaleFactor * (breakpointScale[breakpoint] || 1));
};

// Grid utilities for responsive layouts
export const getResponsiveGrid = (columns = 2) => {
  const { width } = getScreenDimensions().window;
  const { isTablet } = getDeviceType();
  
  // Adjust columns based on screen size
  let responsiveColumns = columns;
  
  if (isTablet) {
    responsiveColumns = Math.min(columns + 1, 4); // Add one column for tablets, max 4
  }
  
  if (width < 400) {
    responsiveColumns = Math.max(columns - 1, 1); // Remove one column for small screens, min 1
  }
  
  const spacing = getResponsiveSpacing(16);
  const itemWidth = (width - (spacing * (responsiveColumns + 1))) / responsiveColumns;
  
  return {
    columns: responsiveColumns,
    itemWidth: Math.floor(itemWidth),
    spacing,
  };
};

// Orientation utilities
export const useOrientation = () => {
  const { isLandscape, isPortrait } = getScreenDimensions();
  
  return {
    isLandscape,
    isPortrait,
    // Styles that adapt to orientation
    getOrientationStyle: (portraitStyle, landscapeStyle) => 
      isLandscape ? landscapeStyle : portraitStyle,
  };
};

// Platform-specific utilities
export const getPlatformStyles = (iosStyles = {}, androidStyles = {}) => {
  return Platform.select({
    ios: iosStyles,
    android: androidStyles,
    default: iosStyles,
  });
};

// Accessibility utilities for responsive design
export const getAccessibilityStyles = () => {
  const { isTablet } = getDeviceType();
  
  return {
    // Minimum touch target sizes
    minTouchTarget: isTablet ? 48 : 44,
    
    // Accessible spacing
    accessibleSpacing: getResponsiveSpacing(8),
    
    // Focus indicators
    focusIndicator: {
      borderWidth: 2,
      borderColor: '#007AFF', // iOS blue
    },
  };
};

// Export all utilities
export default {
  getScreenDimensions,
  getDeviceType,
  breakpoints,
  getCurrentBreakpoint,
  getResponsiveValue,
  useSafeAreaStyles,
  getResponsiveSpacing,
  getResponsiveFontSize,
  getResponsiveGrid,
  useOrientation,
  getPlatformStyles,
  getAccessibilityStyles,
};