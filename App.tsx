import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthNavigator from './src/navigation/AuthNavigator';
import { useThemeStore } from './src/stores/themeStore';
import { setApiClientAuthErrorHandler } from './src/services/apiClient';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const { isDark, colors, setSystemColorScheme } = useThemeStore();
  const systemColorScheme = useColorScheme();

  // 앱 시작 시 시스템 색상 스키마를 themeStore에 전달
  useEffect(() => {
    setSystemColorScheme(systemColorScheme || null);
  }, [systemColorScheme, setSystemColorScheme]);

  // API 클라이언트에 인증 에러 핸들러 설정 (순환 참조 방지)
  useEffect(() => {
    setApiClientAuthErrorHandler(() => {
      useAuthStore.getState().logout();
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.WHITE} />
      <AuthNavigator />
    </SafeAreaProvider>
  );
}
