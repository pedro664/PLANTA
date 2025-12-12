import { Platform } from 'react-native';

/**
 * Get platform-specific gesture configuration for stack navigators
 */
export const getGestureConfig = () => ({
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  ...(Platform.OS === 'ios' && {
    gestureResponseDistance: {
      horizontal: 50, // Allow swipe from edge
    },
  }),
});

/**
 * Get platform-specific refresh control colors
 */
export const getRefreshControlColors = (colors) => ({
  tintColor: colors.botanical.dark,
  colors: [colors.botanical.dark],
  progressBackgroundColor: colors.botanical.base,
});

/**
 * Configure hardware back button for Android
 * @param {Object} navigationRef - Navigation reference
 * @returns {Function} Cleanup function
 */
export const configureAndroidBackButton = (navigationRef) => {
  if (Platform.OS !== 'android') {
    return () => {}; // No-op for iOS
  }

  const { BackHandler } = require('react-native');
  
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    try {
      // Check if navigationRef and current are valid before accessing
      if (navigationRef && navigationRef.current && typeof navigationRef.current.canGoBack === 'function') {
        if (navigationRef.current.canGoBack()) {
          navigationRef.current.goBack();
          return true; // Prevent default behavior
        }
      }
    } catch (error) {
      console.warn('Error handling back button:', error);
    }
    return false; // Allow default behavior (exit app)
  });

  return () => {
    try {
      backHandler.remove();
    } catch (error) {
      console.warn('Error removing back handler:', error);
    }
  };
};