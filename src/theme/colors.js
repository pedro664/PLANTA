/**
 * EduCultivo - Color Palette
 * Botanical theme colors that transmit calm and connection with nature
 */

export const colors = {
  // Main botanical palette
  botanical: {
    base: '#F7F5F0',    // Background principal - warm off-white
    dark: '#2E4A3D',    // Texto e elementos escuros - deep forest green
    sage: '#8DA399',    // Texto secundário - sage green
    clay: '#C66B3D',    // Accent/CTA - terracotta clay
    sand: '#E6E2DD',    // Backgrounds secundários - warm sand
  },
  
  // System colors for feedback and states
  system: {
    success: '#4CAF50',  // Green for success states
    error: '#F44336',    // Red for error states
    warning: '#FF9800',  // Orange for warning states
    info: '#2196F3',     // Blue for info states
  },
  
  // UI element colors
  ui: {
    background: '#FFFFFF',  // Pure white background
    surface: '#F7F5F0',     // Surface color (same as botanical.base)
    border: '#E6E2DD',      // Border color (same as botanical.sand)
    disabled: '#BDBDBD',    // Disabled state color
    placeholder: '#9E9E9E', // Placeholder text color
  },
  
  // Tab navigation colors
  tab: {
    active: '#2E4A3D',      // Active tab color (botanical.dark)
    inactive: '#8DA399',    // Inactive tab color (botanical.sage)
    background: '#FFFFFF',  // Tab bar background
  },
  
  // Plant status colors
  plant: {
    healthy: '#4CAF50',     // Healthy plant status
    thirsty: '#2196F3',     // Needs water
    attention: '#FF9800',   // Needs attention
    critical: '#F44336',    // Critical state
  },
  
  // Transparency variants for overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.9)',
    dark: 'rgba(46, 74, 61, 0.8)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  }
};

// Export individual color groups for convenience
export const botanicalColors = colors.botanical;
export const systemColors = colors.system;
export const uiColors = colors.ui;

export default colors;