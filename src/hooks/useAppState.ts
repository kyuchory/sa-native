import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSocketStore } from '../stores/socketStore';

export interface UseAppStateOptions {
  onForeground?: () => void;
  onBackground?: () => void;
  enableSocketReconnection?: boolean;
}

/**
 * React Native AppState를 활용한 앱 상태 관리 훅
 *
 * 주요 기능:
 * - 앱 포그라운드/백그라운드 상태 감지
 * - 포그라운드 진입시 소켓 연결 상태 확인 및 재연결
 * - iOS 백그라운드에서 알림 제대로 받기 위한 처리
 */
export const useAppState = (options: UseAppStateOptions = {}) => {
  const {
    onForeground,
    onBackground,
    enableSocketReconnection = true
  } = options;

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const { isConnected, connect, disconnect } = useSocketStore();

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log(`📱 앱 상태 변경(chatdetailscreen): ${appState.current} → ${nextAppState}`);

      if (appState.current === 'background' && nextAppState === 'active') {
        // 백그라운드 → 포그라운드 (앱 활성화)
        console.log('🚀 앱이 포그라운드로 전환됨');

        // 사용자 정의 포그라운드 콜백 실행
        onForeground?.();

        // 소켓 재연결 처리
        if (enableSocketReconnection) {
          await handleForegroundTransition();
        }

      } else if (appState.current === 'active' && nextAppState === 'background') {
        // 포그라운드 → 백그라운드 (앱 비활성화)
        console.log('😴 앱이 백그라운드로 전환됨');

        // 사용자 정의 백그라운드 콜백 실행
        onBackground?.();

        // 백그라운드 진입시 소켓 연결 상태 로깅만 (연결 유지)
        if (isConnected) {
          console.log('📡 백그라운드 진입 - 소켓 연결 유지됨');
        }
      }

      appState.current = nextAppState;
    };

    // AppState 변경 이벤트 리스너 등록
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // 정리 함수 반환
    return () => {
      subscription?.remove();
    };
  }, [onForeground, onBackground, enableSocketReconnection, isConnected]);

  // 포그라운드 전환시 처리 로직
  const handleForegroundTransition = async () => {
    try {
      // 소켓 연결 상태 확인
      if (!isConnected) {
        console.log('🔄 포그라운드 진입(chatdetailscreen) - 소켓 연결이 끊어져 있음, 재연결 시도');

        // 소켓 재연결 시도
        await connect();

      } else {
        console.log('✅ 포그라운드 진입 - 소켓 연결 정상 상태');
      }

    } catch (error) {
      console.error('❌ 포그라운드 전환 중 소켓 재연결 실패:', error);

      // 재연결 실패시 사용자에게 알림 가능
      // 추후에 토스트나 알림으로 사용자에게 알려줄 수 있음
    }
  };

  // 현재 앱 상태 반환
  const getCurrentAppState = (): AppStateStatus => {
    return appState.current;
  };

  // 앱이 포그라운드인지 확인
  const isAppActive = (): boolean => {
    return appState.current === 'active';
  };

  // 앱이 백그라운드인지 확인
  const isAppInBackground = (): boolean => {
    return appState.current === 'background';
  };

  return {
    currentAppState: appState.current,
    getCurrentAppState,
    isAppActive,
    isAppInBackground,
    // 포그라운드 전환 처리 함수 (수동 호출용)
    handleForegroundTransition
  };
};

/**
 * 소켓 연결과 함께 사용하는 AppState 훅
 * 앱 상태 변경에 따른 소켓 연결을 자동으로 관리
 */
export const useSocketAppState = () => {
  const { isConnected, connect } = useSocketStore();

  return useAppState({
    enableSocketReconnection: true,

    onForeground: async () => {
      console.log('🚀 소켓 앱 상태: 포그라운드 진입');

      // 소켓 연결 상태 확인 및 재연결
      if (!isConnected) {
        try {
          await connect();
        } catch (error) {
          console.error('소켓 재연결 실패:', error);
        }
      }
    },

    onBackground: () => {
      console.log('😴 소켓 앱 상태: 백그라운드 진입');
      // 백그라운드에서는 소켓 연결을 유지하되 로그만 남김
    }
  });
};
