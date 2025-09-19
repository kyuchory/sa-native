import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthNavigator from './src/navigation/AuthNavigator';
import { useThemeStore } from './src/stores/themeStore';
import { useAuthStore } from './src/stores/authStore';
import { useSocketStore } from './src/stores/socketStore';
import { useNotificationStore } from './src/stores/notificationStore';

export default function App() {
  const { isDark, colors } = useThemeStore();
  const { isAuthenticated, tokens } = useAuthStore();
  const { initializeSockets, disconnectAllSockets, isInitialized } = useSocketStore();
  const { subscribe: subscribeNotifications, unsubscribe: unsubscribeNotifications } = useNotificationStore();

  // 소켓 초기화 및 정리
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (isAuthenticated && tokens?.accessToken && !isInitialized) {
          console.log('🚀 앱 시작 - 소켓 초기화 중...');
          
          // 소켓 초기화
          await initializeSockets(tokens?.accessToken);
          
          // 알림 구독
          subscribeNotifications();
          
          console.log('✅ 앱 초기화 완료');
        } else if (!isAuthenticated && isInitialized) {
          console.log('🚪 로그아웃 감지 - 소켓 정리 중...');
          
          // 알림 구독 해제
          unsubscribeNotifications();
          
          // 모든 소켓 연결 해제
          disconnectAllSockets();
          
          console.log('✅ 소켓 정리 완료');
        }
      } catch (error) {
        console.error('❌ 앱 초기화 실패:', error);
      }
    };

    initializeApp();
  }, [isAuthenticated, tokens?.accessToken, isInitialized, initializeSockets, disconnectAllSockets, subscribeNotifications, unsubscribeNotifications]);

  // 토큰 변경 감지 (토큰 갱신 시)
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) return;
    if (!tokens?.accessToken) return;
  
    console.log('🔄 토큰 변경 감지 - 소켓 업데이트 중...');
    useSocketStore.getState().updateToken(tokens.accessToken)
      .then(() => console.log('✅ 토큰 업데이트 완료'))
      .catch(err => console.error('❌ 토큰 업데이트 실패:', err));
  }, [tokens?.accessToken]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.WHITE} />
      <AuthNavigator />
    </SafeAreaProvider>
  );
}
