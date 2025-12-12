// OfflineIndicator.js - Visual indicator for offline status

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * OfflineIndicator - Shows a banner when the app is offline
 * Automatically appears/disappears based on network connectivity
 */
const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Don't render if online
  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        📡 Sem conexão com a internet
      </Text>
      <Text style={styles.subtext}>
        Suas alterações serão sincronizadas quando voltar online
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B35', // Orange/red color for warning
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingTop: 44, // Account for status bar on iOS
    zIndex: 1000,
    elevation: 1000, // Android elevation
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtext: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default OfflineIndicator;