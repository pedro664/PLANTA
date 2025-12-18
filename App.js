import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import {
  useFonts,
  Overlock_400Regular,
  Overlock_400Regular_Italic,
  Overlock_700Bold,
  Overlock_700Bold_Italic,
  Overlock_900Black,
  Overlock_900Black_Italic,
} from '@expo-google-fonts/overlock';

import SimpleErrorBoundary from './src/components/SimpleErrorBoundary';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastComponent } from './src/components/Toast';
import OfflineIndicator from './src/components/OfflineIndicator';
import { supabase } from './src/services/supabase';

// Helper function to parse URL query params (similar to expo-auth-session)
const getQueryParams = (url) => {
  try {
    const params = {};
    
    // Check for hash fragment first (Supabase uses this for tokens)
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const hashParams = url.substring(hashIndex + 1);
      const searchParams = new URLSearchParams(hashParams);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    // Also check query string
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const endIndex = hashIndex !== -1 ? hashIndex : url.length;
      const queryString = url.substring(queryIndex + 1, endIndex);
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    return { params, errorCode: params.error_code || null };
  } catch (error) {
    console.error('Error parsing URL params:', error);
    return { params: {}, errorCode: 'parse_error' };
  }
};

// Manter splash nativa visível até o app estar pronto
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState(null);
  
  const [fontsLoaded] = useFonts({
    'Overlock-Regular': Overlock_400Regular,
    'Overlock-Italic': Overlock_400Regular_Italic,
    'Overlock-Bold': Overlock_700Bold,
    'Overlock-BoldItalic': Overlock_700Bold_Italic,
    'Overlock-Black': Overlock_900Black,
    'Overlock-BlackItalic': Overlock_900Black_Italic,
  });

  // Handle deep links for password reset
  useEffect(() => {
    const createSessionFromUrl = async (url) => {
      try {
        console.log('🔗 Processing URL:', url);
        
        // Parse query params from URL
        const { params, errorCode } = getQueryParams(url);
        
        if (errorCode && errorCode !== 'parse_error') {
          console.error('❌ Error in URL params:', errorCode);
          return false;
        }
        
        const { access_token, refresh_token, type } = params;
        
        console.log('📋 URL params:', { type, hasAccessToken: !!access_token, hasRefreshToken: !!refresh_token });
        
        // Check if this is a password recovery link
        if (type === 'recovery' && access_token && refresh_token) {
          console.log('🔐 Recovery tokens found, setting session...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          
          if (error) {
            console.error('❌ Error setting session:', error);
            return false;
          }
          
          console.log('✅ Session set successfully for password reset');
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('❌ Error processing URL:', error);
        return false;
      }
    };

    const handleDeepLink = async (event) => {
      const url = event?.url || event;
      if (!url) return;
      
      console.log('🔗 Deep link received:', url);
      
      const isRecovery = await createSessionFromUrl(url);
      if (isRecovery) {
        setInitialRoute('ResetPassword');
      }
    };

    // Check initial URL (app opened via link)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Listen for URL changes while app is open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => subscription?.remove();
  }, []);

  // Esconder splash nativa quando fontes estiverem carregadas
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || appReady) {
      // Pequeno delay para garantir que a UI está renderizada
      await new Promise(resolve => setTimeout(resolve, 100));
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, appReady]);

  useEffect(() => {
    // Timeout de segurança - esconder splash após 3 segundos mesmo se fontes não carregarem
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 3000);

    if (fontsLoaded) {
      setAppReady(true);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  // Não renderizar nada até estar pronto (splash nativa fica visível)
  if (!fontsLoaded && !appReady) {
    return null;
  }

  return (
    <SimpleErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <AppProvider>
            <AppNavigator initialRoute={initialRoute} />
            <OfflineIndicator />
            <StatusBar style="dark" />
            <ToastComponent />
          </AppProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </SimpleErrorBoundary>
  );
}
