import React, { useCallback } from 'react';
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

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    'Overlock-Regular': Overlock_400Regular,
    'Overlock-Italic': Overlock_400Regular_Italic,
    'Overlock-Bold': Overlock_700Bold,
    'Overlock-BoldItalic': Overlock_700Bold_Italic,
    'Overlock-Black': Overlock_900Black,
    'Overlock-BlackItalic': Overlock_900Black_Italic,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  // Don't block the app if fonts fail to load - use system fonts as fallback
  const shouldRender = fontsLoaded || true; // Always render after 3 seconds

  if (!shouldRender) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5F0' }}>
        <ActivityIndicator size="large" color="#2E4A3D" />
        <Text style={{ marginTop: 10, color: '#2E4A3D' }}>Carregando...</Text>
      </View>
    );
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
