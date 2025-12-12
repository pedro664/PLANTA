// Deep Link Service - Handle incoming deep links

import * as Linking from 'expo-linking';
import { parseQRData } from '../utils/qrCodeUtils';

class DeepLinkService {
  constructor() {
    this.navigationRef = null;
    this.isReady = false;
    this.pendingLinks = [];
    this.linkingListener = null;
  }

  /**
   * Initialize the deep link service
   * @param {Object} navigationRef - React Navigation ref
   */
  initialize(navigationRef) {
    if (!navigationRef) {
      console.warn('DeepLinkService: navigationRef is null or undefined');
      return;
    }

    this.navigationRef = navigationRef;
    
    // Wait for navigation to be ready before processing links
    this.waitForNavigationReady();

    // Handle initial URL if app was opened via deep link
    this.handleInitialURL();

    // Listen for incoming deep links while app is running
    this.addLinkingListener();
  }

  /**
   * Wait for navigation to be ready and process pending links
   */
  waitForNavigationReady() {
    const checkReady = () => {
      try {
        if (this.navigationRef?.current && typeof this.navigationRef.current.navigate === 'function') {
          this.isReady = true;
          this.processPendingLinks();
        } else {
          setTimeout(checkReady, 200);
        }
      } catch (error) {
        console.warn('Error checking navigation readiness:', error);
        setTimeout(checkReady, 500);
      }
    };
    
    // Start checking after a small delay
    setTimeout(checkReady, 100);
  }

  /**
   * Process any pending deep links
   */
  processPendingLinks() {
    while (this.pendingLinks.length > 0) {
      const url = this.pendingLinks.shift();
      this.handleDeepLink(url);
    }
  }

  /**
   * Handle initial URL when app is opened via deep link
   */
  async handleInitialURL() {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && !initialUrl.includes('exp://') && !initialUrl.includes('.exp.direct')) {
        this.handleDeepLink(initialUrl);
      }
    } catch (error) {
      console.error('Error handling initial URL:', error);
    }
  }

  /**
   * Add listener for incoming deep links
   */
  addLinkingListener() {
    if (this.linkingListener) {
      this.linkingListener.remove();
    }
    
    this.linkingListener = Linking.addEventListener('url', (event) => {
      this.handleDeepLink(event.url);
    });
    
    return this.linkingListener;
  }

  /**
   * Handle deep link URL
   * @param {string} url - Deep link URL
   */
  handleDeepLink(url) {
    if (!url) {
      console.warn('DeepLinkService: Received empty URL');
      return;
    }

    // Filter out Expo development URLs
    if (url.includes('exp://') || url.includes('.exp.direct')) {
      console.log('Ignoring Expo development URL:', url);
      return;
    }

    if (!this.isReady || !this.navigationRef?.current?.isReady?.()) {
      console.log('Navigation not ready, queuing deep link:', url);
      this.pendingLinks.push(url);
      return;
    }

    try {
      const parsedData = parseQRData(url);
      
      if (parsedData.isValid && parsedData.type === 'plant') {
        // Navigate to plant detail screen
        if (this.navigationRef.current.navigate) {
          this.navigationRef.current.navigate('PlantDetail', {
            plantId: parsedData.plantId
          });
          console.log('Navigated to plant:', parsedData.plantId);
        } else {
          console.warn('Navigation method not available');
        }
      } else {
        console.log('Invalid deep link format:', url);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  /**
   * Cleanup method
   */
  cleanup() {
    if (this.linkingListener) {
      this.linkingListener.remove();
      this.linkingListener = null;
    }
    this.pendingLinks = [];
    this.isReady = false;
  }

  /**
   * Generate deep link URL for a plant
   * @param {string} plantId - Plant ID
   * @returns {string} - Deep link URL
   */
  generatePlantLink(plantId) {
    return Linking.createURL(`plant/${plantId}`);
  }

  /**
   * Check if a URL can be handled by this app
   * @param {string} url - URL to check
   * @returns {boolean} - Whether URL can be handled
   */
  canHandleURL(url) {
    if (!url || url.includes('exp://') || url.includes('.exp.direct')) {
      return false;
    }
    
    const parsedData = parseQRData(url);
    return parsedData.isValid;
  }
}

// Export singleton instance
const deepLinkService = new DeepLinkService();
export default deepLinkService;