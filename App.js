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

// Esconder splash imediatamente ao iniciar
SplashScreen.preventAutoHideAsync()
  .then(() => {
    // Esconder após 1 segundo no máximo
    setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1000);
  })
  .catch(() => {});

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

  useEffect(() => {
    // Marcar app como pronto imediatamente ou após fontes
    const timer = setTimeout(() => {
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 500);

    if (fontsLoaded) {
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  // Sempre renderizar o app - não bloquear por fontes
  return (
    <SimpleErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
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
