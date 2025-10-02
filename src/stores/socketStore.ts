import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { socketService } from '../services/socketService';
import { notificationSocketService } from '../services/notificationSocketService';
import type { SocketState } from '../types/socket';

// 소켓 스토어 인터페이스
interface SocketStore extends SocketState {}

// 소켓 스토어 구현
export const useSocketStore = create<SocketStore>()(
  subscribeWithSelector((set, get) => ({
    // 초기 상태
    socket: null,
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    connectionError: null,
    lastConnectedAt: null,
    reconnectAttempts: 0,

    // 연결
    connect: async () => {
      try {
        set({ isConnecting: true, connectionError: null });

        await socketService.connect();

        set({
          isConnected: true,
          isConnecting: false,
          lastConnectedAt: new Date(),
          connectionError: null
        });

        // 연결 후 이벤트 리스너 재설정 (알림 수신용)
        notificationSocketService.setupListeners();

        // 재연결 시에도 이벤트 리스너 재설정
        socketService.onReconnect(() => {
          console.log('🔄 재연결 후 이벤트 리스너 재설정');
          notificationSocketService.setupListeners();
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '연결 실패';

        set({
          isConnecting: false,
          connectionError: errorMessage
        });

        console.error('❌ 소켓 연결 실패:', error);
        throw error;
      }
    },

    // 연결 해제
    disconnect: () => {
      socketService.disconnect();

      set({
        isConnected: false,
        isConnecting: false,
        isReconnecting: false,
        connectionError: null
      });

      console.log('🔌 소켓 연결 해제');
    },

    // 토큰 재발급 처리
    handleAuthError: async (): Promise<boolean> => {
      try {
        console.log('🔐 인증 에러 감지, 토큰 재발급 시도...');

        // 토큰 재발급은 이미 socketService에서 처리됨
        // 여기서는 상태만 업데이트
        set({
          isConnected: socketService.isConnected,
          connectionError: null
        });

        return socketService.isConnected;

      } catch (error) {
        console.error('❌ 인증 에러 처리 실패:', error);

        set({
          isConnected: false,
          connectionError: '인증에 실패했습니다. 다시 로그인해주세요.'
        });

        return false;
      }
    },

    // 리셋
    reset: () => {
      socketService.destroy();
      notificationSocketService.destroy();

      set({
        socket: null,
        isConnected: false,
        isConnecting: false,
        isReconnecting: false,
        connectionError: null,
        lastConnectedAt: null,
        reconnectAttempts: 0
      });

      console.log('🔄 소켓 상태 초기화 완료');
    }
  }))
);

// 소켓 상태 변경 감지 및 자동 처리
let unsubscribeSocket: (() => void) | null = null;

// 스토어 초기화 함수
export const initializeSocketStore = () => {
  // 소켓 연결 상태 변경 감지
  unsubscribeSocket = socketService.onConnectionChange((connected) => {
    useSocketStore.setState({
      isConnected: connected,
      isReconnecting: !connected && socketService.currentReconnectAttempts > 0
    });

    if (connected) {
      useSocketStore.setState({
        connectionError: null,
        lastConnectedAt: new Date(),
        reconnectAttempts: 0
      });
    }
  });

  // 소켓 에러 감지
  unsubscribeSocket = socketService.onError((error) => {
    useSocketStore.setState({ connectionError: error });
  });
};

// 스토어 정리 함수
export const cleanupSocketStore = () => {
  if (unsubscribeSocket) {
    unsubscribeSocket();
    unsubscribeSocket = null;
  }
};

// 편의 훅들
export const useSocketConnection = () => useSocketStore((state) => ({
  isConnected: state.isConnected,
  isConnecting: state.isConnecting,
  isReconnecting: state.isReconnecting,
  connectionError: state.connectionError,
  lastConnectedAt: state.lastConnectedAt,
  reconnectAttempts: state.reconnectAttempts,
}));

export const useSocketActions = () => useSocketStore((state) => ({
  connect: state.connect,
  disconnect: state.disconnect,
  handleAuthError: state.handleAuthError,
  reset: state.reset,
}));
