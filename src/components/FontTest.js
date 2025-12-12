import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';

// Simple component to test if fonts are loading
const FontTest = () => {
  return (
    <View style={styles.container}>
      <RNText style={styles.regular}>Regular: Overlock Font Test</RNText>
      <RNText style={styles.bold}>Bold: Overlock Font Test</RNText>
      <RNText style={styles.black}>Black: Overlock Font Test</RNText>
      <RNText style={styles.italic}>Italic: Overlock Font Test</RNText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  regular: {
    fontFamily: 'Overlock-Regular',
    fontSize: 18,
    marginBottom: 10,
  },
  bold: {
    fontFamily: 'Overlock-Bold',
    fontSize: 18,
    marginBottom: 10,
  },
  black: {
    fontFamily: 'Overlock-Black',
    fontSize: 18,
    marginBottom: 10,
  },
  italic: {
    fontFamily: 'Overlock-Italic',
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 10,
  },
});

export default FontTest;
