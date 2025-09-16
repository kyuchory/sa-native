import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthNavigator from './src/navigation/AuthNavigator';
import { useThemeStore } from './src/stores/themeStore';

export default function App() {
  const { isDark, colors } = useThemeStore();
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.WHITE} />
      <AuthNavigator />
    </SafeAreaProvider>
  );
}
