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

    // 알림 관련 상태
    isSubscribed: false,
    isSubscribing: false,
    restoredRooms: [],
    lastSubscribedAt: null,
    subscriptionError: null,

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


        // 연결 성공 후 더 충분한 지연 후 알림 구독 시도
        setTimeout(async () => {
          try {
            await get().subscribeToNotifications();
            console.log('📨 알림 구독 자동 시도 완료');
          } catch (error) {
            console.warn('알림 구독 실패:', error);
            // 실패시 재시도
            setTimeout(async () => {
              try {
                await get().subscribeToNotifications();
                console.log('📨 알림 구독 재시도 성공');
              } catch (retryError) {
                console.warn('알림 구독 재시도 실패:', retryError);
              }
            }, 1000);
          }
        }, 500); // 500ms 지연으로 증가

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
        connectionError: null,
        isSubscribed: false,
        isSubscribing: false,
        restoredRooms: [],
        lastSubscribedAt: null,
        subscriptionError: null
      });

      console.log('🔌 소켓 연결 해제');
    },

    // 알림 구독
    subscribeToNotifications: async () => {
      if (get().isSubscribed || get().isSubscribing) {
        console.log('이미 알림을 구독중이거나 구독되어 있습니다.');
        return;
      }

      // 실제 소켓 연결 상태 확인 (socketService.isConnected 사용)
      if (!socketService.isConnected) {
        console.log('🔍 소켓 연결 상태 확인: 실제 연결되지 않음');
        throw new Error('소켓이 연결되지 않았습니다.');
      }

      // 서버 연결 완료 상태 확인 (서버 응답 대기)
      if (!socketService.isServerConnected) {
        console.log('🔍 서버 연결 완료 상태 확인: 아직 서버 응답 대기중');
        throw new Error('서버 연결이 완료되지 않았습니다.');
      }

      console.log('🔍 소켓 및 서버 연결 상태 확인: 모두 완료됨');

      try {
        set({ isSubscribing: true, subscriptionError: null });

        await notificationSocketService.subscribeToNotifications();

        set({
          isSubscribed: true,
          isSubscribing: false,
          lastSubscribedAt: new Date(),
          subscriptionError: null,
          restoredRooms: notificationSocketService.notificationRestoredRooms
        });

        console.log('📨 알림 구독 완료');

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알림 구독 실패';

        set({
          isSubscribing: false,
          subscriptionError: errorMessage
        });

        console.error('❌ 알림 구독 실패:', error);
        throw error;
      }
    },

    // 알림 구독 해제
    unsubscribeFromNotifications: async () => {
      if (!get().isSubscribed) {
        console.log('알림이 구독되어 있지 않습니다.');
        return;
      }

      try {
        set({ isSubscribing: true });

        await notificationSocketService.unsubscribeFromNotifications();

        set({
          isSubscribed: false,
          isSubscribing: false,
          restoredRooms: [],
          lastSubscribedAt: null,
          subscriptionError: null
        });

        console.log('🔔 알림 구독 해제 완료');

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알림 구독 해제 실패';

        set({
          isSubscribing: false,
          subscriptionError: errorMessage
        });

        console.error('❌ 알림 구독 해제 실패:', error);
        throw error;
      }
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
        reconnectAttempts: 0,

        isSubscribed: false,
        isSubscribing: false,
        restoredRooms: [],
        lastSubscribedAt: null,
        subscriptionError: null
      });

      console.log('🔄 소켓 상태 초기화 완료');
    }
  }))
);

// 소켓 상태 변경 감지 및 자동 처리
let unsubscribeSocket: (() => void) | null = null;
let unsubscribeNotification: (() => void) | null = null;

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

  // 알림 구독 상태 변경 감지
  unsubscribeNotification = notificationSocketService.onSubscriptionChange((subscribed) => {
    useSocketStore.setState({
      isSubscribed: subscribed,
      subscriptionError: null
    });

    if (subscribed) {
      useSocketStore.setState({
        lastSubscribedAt: new Date(),
        restoredRooms: notificationSocketService.notificationRestoredRooms
      });
    }
  });
};

// 스토어 정리 함수
export const cleanupSocketStore = () => {
  if (unsubscribeSocket) {
    unsubscribeSocket();
    unsubscribeSocket = null;
  }

  if (unsubscribeNotification) {
    unsubscribeNotification();
    unsubscribeNotification = null;
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

export const useNotificationSubscription = () => useSocketStore((state) => ({
  isSubscribed: state.isSubscribed,
  isSubscribing: state.isSubscribing,
  restoredRooms: state.restoredRooms,
  lastSubscribedAt: state.lastSubscribedAt,
  subscriptionError: state.subscriptionError,
}));

export const useSocketActions = () => useSocketStore((state) => ({
  connect: state.connect,
  disconnect: state.disconnect,
  subscribeToNotifications: state.subscribeToNotifications,
  unsubscribeFromNotifications: state.unsubscribeFromNotifications,
  handleAuthError: state.handleAuthError,
  reset: state.reset,
}));
