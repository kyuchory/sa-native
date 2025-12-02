import { AppState } from 'react-native';
import { initializeSocketStore, cleanupSocketStore, useSocketStore } from '../stores/socketStore';
import { useSocketAppState } from '../hooks/useAppState';
import { tokenService } from '../services/tokenService';
import { onAuthLogin, onAuthLogout } from './simpleEventEmitter';

/**
 * 소켓 서비스 초기화 유틸리티
 *
 * 앱 시작시 호출해야 하는 초기화 함수들:
 * 1. 소켓 스토어 초기화
 * 2. AppState 감지 설정
 * 3. 로그인 상태 확인 후 자동 연결
 */

// 소켓 서비스 초기화 상태
let isInitialized = false;

/**
 * 소켓 서비스 전체 초기화
 * 앱 시작시 (App.tsx 등)에서 호출해야 함
 */
export const initializeSocketServices = async (): Promise<void> => {
  if (isInitialized) {
    console.log('🔄 소켓 서비스 이미 초기화됨');
    return;
  }

  try {
    console.log('🚀 소켓 서비스 초기화 시작...');

    // 1. 소켓 스토어 초기화 (이벤트 리스너 설정)
    initializeSocketStore();

    // 2. 앱 상태가 active인지 확인
    const currentAppState = AppState.currentState;
    console.log(`📱 현재 앱 상태: ${currentAppState}`);

    // 3. 로그인 토큰 확인 후 자동 연결 시도
    // 주의: 여기서는 실제 로그인 상태를 확인하는 로직이 필요함
    // 현재는 간단히 토큰 존재 여부만 확인
    const hasValidToken = await checkLoginStatus();

    if (hasValidToken && currentAppState === 'active') {
      console.log('🔗 로그인 상태 확인됨, 소켓 연결 시도...');
      console.log(`🔑 인증 토큰 존재 여부: ${!!tokenService.getAccessToken()}`);
      console.log(`📱 앱 상태: ${currentAppState}`);

      try {
        // 소켓 연결 시도 (실패시 예외 발생하지 않도록 try-catch)
        await useSocketStore.getState().connect();
        console.log('🚀 소켓 초기 연결 성공');
      } catch (error) {
        console.warn('소켓 초기 연결 실패 (백그라운드에서 시도할 수 있음):', error);
        // 초기 연결 실패는 치명적이지 않으므로 로그만 남김
      }
    } else if (!hasValidToken) {
      console.log('🔐 로그인되지 않음 - 소켓 연결 스킵');
    } else if (currentAppState !== 'active') {
      console.log('📱 앱이 백그라운드 상태 - 소켓 연결 대기');
    }

    // 4. 인증 이벤트 리스너 등록
    setupAuthEventListeners();

    // 5. 초기화 완료 표시
    isInitialized = true;
    console.log('✅ 소켓 서비스 초기화 완료');

  } catch (error) {
    console.error('❌ 소켓 서비스 초기화 실패:', error);
    throw error;
  }
};

/**
 * 소켓 서비스 정리
 * 앱 종료시 호출해야 함
 */
export const cleanupSocketServices = (): void => {
  if (!isInitialized) {
    return;
  }

  try {
    console.log('🧹 소켓 서비스 정리 시작...');

    // 소켓 스토어 정리
    cleanupSocketStore();

    // 소켓 연결 해제
    useSocketStore.getState().disconnect();

    // 초기화 상태 초기화
    isInitialized = false;

    console.log('✅ 소켓 서비스 정리 완료');

  } catch (error) {
    console.error('❌ 소켓 서비스 정리 실패:', error);
  }
};

/**
 * 로그인 상태 확인 함수
 * 실제 구현시에는 authStore 등에서 로그인 상태를 확인해야 함
 */
const checkLoginStatus = async (): Promise<boolean> => {
  try {
    // 실제 구현시에는 authStore에서 토큰 유효성을 확인해야 함
    // 현재는 간단히 토큰 존재 여부만 확인
    const token = tokenService.getAccessToken();

    if (!token) {
      return false;
    }

    // 토큰 유효성 검증 (간단히)
    // 실제 구현시에는 서버에 토큰 검증 요청을 보내야 할 수 있음
    return tokenService.isTokenValid(token);

  } catch (error) {
    console.error('로그인 상태 확인 실패:', error);
    return false;
  }
};

/**
 * 앱 포그라운드 진입시 소켓 재연결 유틸리티
 * useAppState 훅에서 자동으로 호출되지만 수동으로도 호출 가능
 */
export const handleAppForeground = async (): Promise<void> => {
  if (!isInitialized) {
    console.warn('소켓 서비스가 초기화되지 않음');
    return;
  }

  try {
    const hasValidToken = await checkLoginStatus();

    if (hasValidToken && !useSocketStore.getState().isConnected) {
      console.log('🔄 앱 포그라운드 - 소켓 재연결 시도');
      await useSocketStore.getState().connect();
    }

  } catch (error) {
    console.error('앱 포그라운드 소켓 재연결 실패:', error);
  }
};

/**
 * 로그인 성공 후 소켓 연결 유틸리티
 */
export const connectSocketAfterLogin = async (): Promise<void> => {
  if (!isInitialized) {
    await initializeSocketServices();
  }

  try {
    console.log('🔗 로그인 후 소켓 연결 시도');
    await useSocketStore.getState().connect();

  } catch (error) {
    console.error('로그인 후 소켓 연결 실패:', error);
    throw error;
  }
};

/**
 * 로그아웃시 소켓 연결 해제 유틸리티
 */
export const disconnectSocketAfterLogout = (): void => {
  try {
    console.log('🔌 로그아웃 - 소켓 연결 해제');
    useSocketStore.getState().disconnect();

  } catch (error) {
    console.error('로그아웃 후 소켓 연결 해제 실패:', error);
  }
};

/**
 * 인증 이벤트 리스너 설정
 * 로그인/로그아웃 이벤트에 따라 소켓 연결/해제를 처리
 */
const setupAuthEventListeners = (): void => {
  // 로그인 이벤트 리스너
  onAuthLogin(async (data) => {
    console.log('🔐 로그인 이벤트 수신, 소켓 연결 시도...');
    try {
      await useSocketStore.getState().connect();
      console.log('✅ 로그인 후 소켓 연결 성공');
    } catch (error) {
      console.error('❌ 로그인 후 소켓 연결 실패:', error);
      // 로그인 성공 자체는 유지하므로 에러를 throw하지 않음
    }
  });

  // 로그아웃 이벤트 리스너
  onAuthLogout((data) => {
    console.log('🚪 로그아웃 이벤트 수신, 소켓 연결 해제...');
    try {
      useSocketStore.getState().disconnect();
      console.log('✅ 로그아웃 후 소켓 연결 해제 완료');
    } catch (error) {
      console.error('❌ 로그아웃 후 소켓 연결 해제 실패:', error);
    }
  });
};

// 초기화 상태 확인
export const isSocketServicesInitialized = (): boolean => {
  return isInitialized;
};
