/**
 * EduCultivo - Shadow System
 * Platform-specific shadows for iOS and Android
 */

import { Platform } from 'react-native';

// Shadow presets for different elevation levels
export const shadows = {
  // No shadow
  none: Platform.select({
    ios: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    android: {
      elevation: 0,
    },
  }),
  
  // Small shadow - for buttons, small cards
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
  
  // Medium shadow - for cards, containers
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
  
  // Large shadow - for modals, floating elements
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
  }),
  
  // Extra large shadow - for major floating elements
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
  }),
};

// Specialized shadows for specific components
export const componentShadows = {
  // Floating Action Button (FAB)
  fab: Platform.select({
    ios: {
      shadowColor: '#2E4A3D', // botanical.dark
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
  }),
  
  // Bottom Tab Bar
  tabBar: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
  
  // Plant Cards
  plantCard: Platform.select({
    ios: {
      shadowColor: '#2E4A3D', // botanical.dark
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 3,
    },
  }),
  
  // Modal backdrop
  modal: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
    },
    android: {
      elevation: 16,
    },
  }),
  
  // Header shadow
  header: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
};

// Pressed/active state shadows (reduced elevation)
export const pressedShadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
  }),
  
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
};

// Utility function to get shadow style by name
export const getShadow = (shadowName) => {
  return shadows[shadowName] || shadows.none;
};

// Utility function to get component-specific shadow
export const getComponentShadow = (componentName) => {
  return componentShadows[componentName] || shadows.none;
};

export default shadows;