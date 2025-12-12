import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

/**
 * Custom Text component that ALWAYS applies Overlock font
 * Uses specific font variants instead of relying on fontWeight
 */
const Text = ({ style, children, ...props }) => {
  // Flatten the style to properly read all properties
  const flatStyle = StyleSheet.flatten(style) || {};
  const { fontWeight, fontStyle } = flatStyle;
  
  // Convert fontWeight to string and handle all possible values
  const weight = String(fontWeight || '400').toLowerCase();
  const isItalic = fontStyle === 'italic';
  
  // Determine the correct Overlock font variant
  let fontFamily = 'Overlock-Regular';
  
  if (weight === '900' || weight === 'black') {
    fontFamily = isItalic ? 'Overlock-BlackItalic' : 'Overlock-Black';
  } else if (weight === '700' || weight === 'bold') {
    fontFamily = isItalic ? 'Overlock-BoldItalic' : 'Overlock-Bold';
  } else if (isItalic) {
    fontFamily = 'Overlock-Italic';
  }
  
  // Debug log
  if (__DEV__ && (weight === '700' || weight === 'bold' || isItalic)) {
    console.log('🔤 Text:', fontFamily, 'from weight:', weight, 'italic:', isItalic);
  }
  
  // Create clean style object - remove fontWeight and fontStyle to avoid conflicts
  const { fontWeight: _, fontStyle: __, fontFamily: ___, ...cleanStyle } = flatStyle;
  
  const finalStyle = {
    ...cleanStyle,
    fontFamily,
    // Don't set fontWeight or fontStyle - let the font variant handle it
  };
  
  return (
    <RNText 
      {...props}
      style={finalStyle}
    >
      {children}
    </RNText>
  );
};

export default Text;
