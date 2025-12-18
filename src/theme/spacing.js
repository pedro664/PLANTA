/**
 * EduCultivo - Spacing and Layout System
 * Consistent spacing values and border radius for the entire app
 */

export const spacing = {
  // Base spacing scale (multiples of 4 for consistency)
  xs: 4,     // Extra small - minimal spacing
  sm: 8,     // Small - tight spacing
  md: 16,    // Medium - default spacing
  lg: 24,    // Large - generous spacing
  xl: 32,    // Extra large - section spacing
  '2xl': 48, // Double extra large - major sections
  '3xl': 64, // Triple extra large - screen margins
};

// Border radius values for different component types
export const borderRadius = {
  none: 0,
  sm: 8,     // Small radius - buttons, inputs
  md: 16,    // Medium radius - cards, containers
  lg: 24,    // Large radius - modals, major components
  xl: 32,    // Extra large radius - special elements
  full: 9999, // Full radius - circular elements
};

// Layout dimensions and constraints
export const layout = {
  // Container widths
  container: {
    sm: 320,   // Small screens
    md: 768,   // Medium screens (tablets)
    lg: 1024,  // Large screens
    xl: 1280,  // Extra large screens
  },
  
  // Component heights (responsive)
  height: {
    button: 48,      // Standard button height
    input: 48,       // Text input height
    tabBar: {        // Bottom tab bar height (responsive)
      phone: 60,
      tablet: 70,
    },
    header: 56,      // Screen header height
    card: 120,       // Standard card height
    plantCard: 180,  // Plant card height
  },
  
  // Icon sizes
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  // Avatar sizes
  avatar: {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  },
};

// Margin and padding presets for common patterns
export const margins = {
  screen: spacing.md,        // Default screen margins
  section: spacing.lg,       // Section spacing
  component: spacing.sm,     // Component spacing
  element: spacing.xs,       // Element spacing
};

export const paddings = {
  screen: spacing.md,        // Default screen padding
  card: spacing.md,          // Card internal padding
  button: {
    horizontal: spacing.lg,
    vertical: spacing.sm,
  },
  input: {
    horizontal: spacing.md,
    vertical: spacing.sm,
  },
};

// Grid system for layouts
export const grid = {
  columns: 12,               // 12-column grid system
  gutter: spacing.md,        // Space between grid items
  margin: spacing.md,        // Grid container margins
};

// Z-index values for layering
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
};

// Export convenience objects
export const sizes = {
  ...spacing,
  ...layout,
};

export default {
  spacing,
  borderRadius,
  layout,
  margins,
  paddings,
  grid,
  zIndex,
};