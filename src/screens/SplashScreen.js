/**
 * Educultivo - Simple Splash Screen
 * Clean green background with white logo
 */

import React, { useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import theme
import { colors } from '../theme/colors';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    console.log('🎬 Simple SplashScreen mounted');
    let isMounted = true;
    
    // Load app data in background
    loadAppData().catch(error => {
      console.log('Error loading app data:', error);
    });
    
    // Shorter splash time to get to app faster
    const timer = setTimeout(() => {
      if (isMounted) {
        console.log('⏰ Splash timer finished, navigating...');
        finishSplash();
      }
    }, 1000); // Reduced from 2000 to 1000ms

    return () => {
      console.log('🎬 SplashScreen unmounting');
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);



  const loadAppData = async () => {
    try {
      // Load data with timeout to prevent hanging
      const loadWithTimeout = (promise, timeout = 1000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);
      };

      // Load actual data from AsyncStorage with timeout
      const userData = await loadWithTimeout(
        AsyncStorage.getItem('@educultivo:user')
      ).catch(() => null);
      
      const plantsData = await loadWithTimeout(
        AsyncStorage.getItem('@educultivo:plants')
      ).catch(() => null);
      
      // If no user data exists, create initial data structure
      if (!userData) {
        const initialUser = {
          id: '1',
          name: 'Jardineiro',
          avatar: '',
          joinDate: new Date().toISOString(),
          xp: 0,
          level: 'Iniciante',
          stats: {
            totalPlants: 0,
            activeDays: 1,
            badges: []
          }
        };
        await AsyncStorage.setItem('@educultivo:user', JSON.stringify(initialUser)).catch(() => {});
      }

      if (!plantsData) {
        await AsyncStorage.setItem('@educultivo:plants', JSON.stringify([])).catch(() => {});
      }
      
    } catch (error) {
      console.log('Error loading data during splash:', error);
      // Don't block the app if storage fails
    }
  };

  const finishSplash = () => {
    console.log('🚀 Finishing splash screen...');
    
    try {
      navigation.replace('Auth');
      console.log('✅ Navigation to Auth completed');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Fallback navigation
      setTimeout(() => {
        navigation.navigate('Auth');
      }, 100);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={colors.botanical.dark}
        translucent={false}
      />
      
      {/* Simple logo centered */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/logo-loading.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.botanical.dark, // Green background
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Logo section
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    tintColor: '#FFFFFF', // White logo
  },
});

export default SplashScreen;