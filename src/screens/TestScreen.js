/**
 * Minimal Test Screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TestScreen = () => {
  console.log('🧪 TestScreen rendered');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Test Screen Working!</Text>
      <Text style={styles.subtext}>If you can see this, the app is rendering correctly.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E4A3D',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: '#8DA397',
    textAlign: 'center',
  },
});

export default TestScreen;