import React, { useEffect, useMemo } from 'react';
import { StatusBar, useColorScheme, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import mobileAds from 'react-native-google-mobile-ads';
import AuthNavigator from './src/navigation/AuthNavigator';
import { useThemeStore } from './src/stores/themeStore';
import { setApiClientAuthErrorHandler } from './src/services/apiClient';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const { setSystemColorScheme, themeMode } = useThemeStore();
  const systemColorScheme = useColorScheme();

  // StatusBar 스타일을 실제 모드와 시스템 설정에 따라 결정
  const statusBarStyle = useMemo(() => {
    if (themeMode === 'system') {
      // 시스템 모드: useColorScheme 직접 사용 (타이밍 문제 해결)
      return systemColorScheme === 'dark' ? 'light-content' : 'dark-content';
    } else {
      // 수동 모드: themeMode에 따라 결정
      return themeMode === 'dark' ? 'light-content' : 'dark-content';
    }
  }, [themeMode, systemColorScheme]);

  // 앱 시작 시 시스템 색상 스키마를 themeStore에 동기화
  useEffect(() => {
    setSystemColorScheme(systemColorScheme || null);
  }, [systemColorScheme, setSystemColorScheme]);

  // API 클라이언트에 인증 에러 핸들러 설정 (순환 참조 방지)
  useEffect(() => {
    setApiClientAuthErrorHandler(() => {
      useAuthStore.getState().logout();
    });
  }, []);

  // Google Mobile Ads SDK 초기화
  useEffect(() => {
    async function setupAds() {
      try {
        // iOS에서 App Tracking Transparency 권한 요청
        if (Platform.OS === 'ios') {
          const result = await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
          if (result === RESULTS.DENIED) {
            await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
          }
        }

        // Google Mobile Ads SDK 초기화
        await mobileAds().initialize();
        console.log('Google Mobile Ads SDK 초기화 완료');
      } catch (error) {
        console.error('Google Mobile Ads SDK 초기화 실패:', error);
      }
    }

    setupAds();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor="transparent" // iOS 무시, Android 투명
      />
      <AuthNavigator />
    </SafeAreaProvider>
  );
}
