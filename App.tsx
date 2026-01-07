//커밋메시지좀 한글로 작성해주세요
import React, { useEffect, useMemo } from 'react';
import { StatusBar, useColorScheme, Platform, StatusBarStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigationContainerRef } from '@react-navigation/native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import mobileAds from 'react-native-google-mobile-ads';
import NaverLogin from '@react-native-seoul/naver-login';
import AuthNavigator from './src/navigation/AuthNavigator';
import { useThemeStore } from './src/stores/themeStore';
import { setApiClientAuthErrorHandler } from './src/services/apiClient';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const { setSystemColorScheme, themeMode } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const [currentRoute, setCurrentRoute] = React.useState<string>('');

  // StatusBar 스타일을 결정 (배경색은 헤더가 있어서 투명 고정)
  const statusBarStyle: StatusBarStyle = useMemo(() => {
    // 영상 재생 화면에서는 강제 light-content (검은 배경 때문)
    const forceLightScreens = ['CutTab', 'CutDetail', 'CutPreview'];
    if (forceLightScreens.includes(currentRoute)) {
      return 'light-content';
    }

    if (themeMode === 'system') {
      // 시스템 모드: useColorScheme 직접 사용 (타이밍 문제 해결)
      return systemColorScheme === 'dark' ? 'light-content' : 'dark-content';
    } else {
      // 수동 모드: themeMode에 따라 결정
      return themeMode === 'dark' ? 'light-content' : 'dark-content';
    }
  }, [themeMode, systemColorScheme, currentRoute]);

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

    useEffect(() => {
      NaverLogin.initialize({
        appName: 'AnimalTalk',
        consumerKey: 'f4nsCY_WWtpL_Hyky8yj',
        consumerSecret: 'j4fJgeH6Pc',
        serviceUrlSchemeIOS: 'naverAnimaltalk',
        disableNaverAppAuthIOS: true,
      });
    }, []);


  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor="transparent"
      />
      <AuthNavigator onStateChange={(state) => {
        if (state) {
          const route = state.routes[state.index];
          if (route) {
            // 탭 네비게이터의 경우 중첩된 구조 처리
            if (route.state) {
              const tabRoute = route.state.routes[route.state.index];
              setCurrentRoute(tabRoute?.name || '');
            } else {
              setCurrentRoute(route.name);
            }
          }
        }
      }} />
    </SafeAreaProvider>
  );
}
