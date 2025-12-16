import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
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

// Manter splash nativa visível até o app estar pronto
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appReady, setAppReady] = useState(false);
  
  const [fontsLoaded] = useFonts({
    'Overlock-Regular': Overlock_400Regular,
    'Overlock-Italic': Overlock_400Regular_Italic,
    'Overlock-Bold': Overlock_700Bold,
    'Overlock-BoldItalic': Overlock_700Bold_Italic,
    'Overlock-Black': Overlock_900Black,
    'Overlock-BlackItalic': Overlock_900Black_Italic,
  });

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
            <AppNavigator />
            <OfflineIndicator />
            <StatusBar style="dark" />
            <ToastComponent />
          </AppProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </SimpleErrorBoundary>
  );
}
