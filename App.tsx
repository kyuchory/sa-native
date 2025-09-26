import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthNavigator from './src/navigation/AuthNavigator';
import { useThemeStore } from './src/stores/themeStore';

export default function App() {
  const { isDark, colors, setSystemColorScheme } = useThemeStore();
  const systemColorScheme = useColorScheme();

  // 앱 시작 시 시스템 색상 스키마를 themeStore에 전달
  useEffect(() => {
    setSystemColorScheme(systemColorScheme || null);
  }, [systemColorScheme, setSystemColorScheme]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.WHITE} />
      <AuthNavigator />
    </SafeAreaProvider>
  );
}
