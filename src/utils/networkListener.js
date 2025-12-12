// networkListener.js - Network connectivity monitoring utility

import NetInfo from '@react-native-community/netinfo';

/**
 * Network listener utility for monitoring connectivity changes
 * Provides hooks and utilities to track online/offline status
 */

let currentNetworkState = null;
let listeners = [];

/**
 * Initialize network monitoring
 * @param {Function} onConnectionChange - Callback function called when connection status changes
 * @returns {Function} Unsubscribe function
 */
export const initializeNetworkListener = (onConnectionChange) => {
  // Subscribe to network state updates
  const unsubscribe = NetInfo.addEventListener(state => {
    const isConnected = state.isConnected && state.isInternetReachable;
    const wasConnected = currentNetworkState?.isConnected && currentNetworkState?.isInternetReachable;
    
    // Update current state
    currentNetworkState = {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
    };
    
    // Only call callback if connection status actually changed
    if (wasConnected !== isConnected) {
      console.log(`Network status changed: ${isConnected ? 'Online' : 'Offline'}`);
      onConnectionChange(!isConnected); // Pass isOffline (inverted)
    }
  });

  // Get initial network state
  NetInfo.fetch().then(state => {
    const isConnected = state.isConnected && state.isInternetReachable;
    currentNetworkState = {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
    };
    
    console.log(`Initial network status: ${isConnected ? 'Online' : 'Offline'}`);
    onConnectionChange(!isConnected); // Pass isOffline (inverted)
  });

  return unsubscribe;
};

/**
 * Get current network state
 * @returns {Promise<Object>} Current network state
 */
export const getCurrentNetworkState = async () => {
  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      isOffline: !(state.isConnected && state.isInternetReachable),
      type: state.type,
      details: state.details,
    };
  } catch (error) {
    console.error('Error fetching network state:', error);
    return {
      isConnected: false,
      isInternetReachable: false,
      isOffline: true,
      type: 'unknown',
      details: null,
    };
  }
};

/**
 * Check if device is currently online
 * @returns {Promise<boolean>} True if online, false if offline
 */
export const isOnline = async () => {
  const state = await getCurrentNetworkState();
  return !state.isOffline;
};

/**
 * Check if device is currently offline
 * @returns {Promise<boolean>} True if offline, false if online
 */
export const isOffline = async () => {
  const state = await getCurrentNetworkState();
  return state.isOffline;
};

/**
 * Add a listener for network changes
 * @param {Function} listener - Function to call when network status changes
 * @returns {Function} Function to remove the listener
 */
export const addNetworkListener = (listener) => {
  listeners.push(listener);
  
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

/**
 * Remove all network listeners
 */
export const removeAllNetworkListeners = () => {
  listeners = [];
};

/**
 * Get network type information
 * @returns {Promise<string>} Network type (wifi, cellular, ethernet, etc.)
 */
export const getNetworkType = async () => {
  const state = await getCurrentNetworkState();
  return state.type || 'unknown';
};

/**
 * Get detailed connection information
 * @returns {Promise<Object>} Detailed network information
 */
export const getConnectionDetails = async () => {
  const state = await getCurrentNetworkState();
  return {
    type: state.type,
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    isOffline: state.isOffline,
    details: state.details,
  };
};