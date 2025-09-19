// 통합 소켓 관리 스토어
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import { 
  getSocketConfig, 
  SOCKET_NAMESPACES, 
  SOCKET_EVENTS, 
  RECONNECT_STRATEGY 
} from '../config/socket';
import { 
  SocketStoreState, 
  SocketInstance, 
  SocketNamespace, 
  SocketConnectionOptions,
  SocketError,
  TokenRefreshResult 
} from '../types/socket';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';
import { apiClient } from '../services/apiClient';

// 소켓 인스턴스 생성 함수
const createSocketInstance = (
  namespace: SocketNamespace, 
  options: SocketConnectionOptions
): SocketInstance => {
  const config = getSocketConfig();
  const url = namespace === SOCKET_NAMESPACES.CHAT 
    ? config.chatUrl 
    : config.notificationUrl;
  
  const socketOptions = {
    ...config.options,
    auth: {
      token: options.token,
    },
    ...options,
  };

  const socket = io(`${url}${namespace}`, socketOptions);

  return {
    socket,
    namespace,
    state: 'connecting',
    lastConnectedAt: null,
    reconnectAttempts: 0,
  };
};

// 소켓 에러 처리 함수
const handleSocketError = (error: any): SocketError => {
  console.error('소켓 에러:', error);
  
  if (error?.message?.includes('TOKEN_EXPIRED')) {
    return {
      message: '토큰이 만료되었습니다.',
      type: 'TOKEN_EXPIRED',
      code: error.code,
    };
  }
  
  if (error?.message?.includes('AUTH_FAILED')) {
    return {
      message: '인증에 실패했습니다.',
      type: 'AUTH_FAILED',
      code: error.code,
    };
  }
  
  return {
    message: error?.message || '알 수 없는 에러가 발생했습니다.',
    type: 'UNKNOWN',
    code: error?.code,
  };
};

// 토큰 갱신 함수
const refreshToken = async (): Promise<TokenRefreshResult> => {
  try {
    console.log('🔄 토큰 갱신 시도...');
    
    // apiClient의 refreshToken 메서드 사용 (자동으로 토큰 저장도 처리됨)
    const newToken = await apiClient.refreshToken();
    
    console.log('✅ 토큰 갱신 성공');
    return {
      success: true,
      newToken,
    };
  } catch (error) {
    console.error('❌ 토큰 갱신 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '토큰 갱신 중 에러가 발생했습니다.',
    };
  }
};

export const useSocketStore = create<SocketStoreState>((set, get) => ({
  // 초기 상태
  chatSocket: {
    socket: null,
    namespace: SOCKET_NAMESPACES.CHAT,
    state: 'disconnected',
    lastConnectedAt: null,
    reconnectAttempts: 0,
  },
  notificationSocket: {
    socket: null,
    namespace: SOCKET_NAMESPACES.NOTIFICATION,
    state: 'disconnected',
    lastConnectedAt: null,
    reconnectAttempts: 0,
  },
  isInitialized: false,
  isAppActive: true,

  // 소켓 초기화
  initializeSockets: async (token: string) => {
    const state = get();
    
    if (state.isInitialized) {
      console.log('소켓이 이미 초기화되었습니다.');
      return;
    }

    try {
      console.log('🔌 소켓 초기화 시작...');
      
      const options: SocketConnectionOptions = {
        token,
        reconnection: true,
        reconnectionAttempts: RECONNECT_STRATEGY.MAX_ATTEMPTS,
        reconnectionDelay: RECONNECT_STRATEGY.DELAY,
        reconnectionDelayMax: RECONNECT_STRATEGY.MAX_DELAY,
        timeout: RECONNECT_STRATEGY.CONNECTION_TIMEOUT,
      };

      // 채팅 소켓 생성
      const chatSocket = createSocketInstance(SOCKET_NAMESPACES.CHAT, options);
      
      // 알림 소켓 생성
      const notificationSocket = createSocketInstance(SOCKET_NAMESPACES.NOTIFICATION, options);

      // 이벤트 리스너 설정
      setupSocketEventListeners(chatSocket, 'chat');
      setupSocketEventListeners(notificationSocket, 'notification');

      set({
        chatSocket,
        notificationSocket,
        isInitialized: true,
      });

      // AppState 리스너 설정
      setupAppStateListener();

      console.log('✅ 소켓 초기화 완료');
    } catch (error) {
      console.error('❌ 소켓 초기화 실패:', error);
      throw error;
    }
  },

  // 모든 소켓 연결 해제
  disconnectAllSockets: () => {
    const state = get();
    
    console.log('🔌 모든 소켓 연결 해제...');
    
    if (state.chatSocket.socket) {
      state.chatSocket.socket.disconnect();
    }
    
    if (state.notificationSocket.socket) {
      state.notificationSocket.socket.disconnect();
    }

    // AppState 리스너 정리
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }

    // NotificationStore 구독 상태 초기화
    useNotificationStore.setState({
      isSubscribed: false,
      notifications: [],
      unreadCount: 0,
    });

    set({
      chatSocket: {
        socket: null,
        namespace: SOCKET_NAMESPACES.CHAT,
        state: 'disconnected',
        lastConnectedAt: null,
        reconnectAttempts: 0,
      },
      notificationSocket: {
        socket: null,
        namespace: SOCKET_NAMESPACES.NOTIFICATION,
        state: 'disconnected',
        lastConnectedAt: null,
        reconnectAttempts: 0,
      },
      isInitialized: false,
    });
  },

  // 토큰 갱신 (최적화된 버전)
  updateToken: async (newToken: string) => {
    const state = get();
    
    if (!state.isInitialized) {
      console.log('소켓이 초기화되지 않았습니다.');
      return;
    }

    console.log('🔄 토큰 갱신 중...');

    try {
      // 채팅 소켓 토큰 업데이트
      if (state.chatSocket.socket) {
        state.chatSocket.socket.auth = { token: newToken };
        state.chatSocket.socket.disconnect();
        state.chatSocket.socket.connect();
        console.log('✅ 채팅 소켓 토큰 업데이트 완료');
      }

      // 알림 소켓 토큰 업데이트
      if (state.notificationSocket.socket) {
        state.notificationSocket.socket.auth = { token: newToken };
        state.notificationSocket.socket.disconnect();
        state.notificationSocket.socket.connect();
        console.log('✅ 알림 소켓 토큰 업데이트 완료');
      }

      console.log('✅ 토큰 갱신 완료');

      // 토큰 갱신 후 알림 구독 보장
      const { subscribe: subscribeNotifications } = useNotificationStore.getState();
      subscribeNotifications();
    } catch (error) {
      console.error('❌ 토큰 갱신 실패, 전체 재연결 시도...', error);
      
      // 최적화된 방법이 실패하면 전체 재연결 (백업)
      state.disconnectAllSockets();
      await state.initializeSockets(newToken);
      
      // 재연결 후 알림 구독 보장
      const { subscribe: subscribeNotifications } = useNotificationStore.getState();
      subscribeNotifications();
    }
  },

  // 모든 소켓 재연결
  reconnectAllSockets: async () => {
    const state = get();
    
    if (!state.isInitialized) {
      console.log('소켓이 초기화되지 않았습니다.');
      return;
    }

    console.log('🔄 모든 소켓 재연결 중...');

    const authStore = useAuthStore.getState();
    const token = authStore.tokens?.accessToken;

    if (!token) {
      console.log('토큰이 없어 재연결할 수 없습니다.');
      return;
    }

    // 기존 소켓들 연결 해제
    state.disconnectAllSockets();

    // 재연결
    await state.initializeSockets(token);
    
    console.log('✅ 모든 소켓 재연결 완료');

    // 알림 구독 보장
    const { subscribe: subscribeNotifications } = useNotificationStore.getState();
    subscribeNotifications();
  },

  // 연결 상태 확인
  isConnected: (namespace: SocketNamespace) => {
    const state = get();
    const socketInstance = namespace === SOCKET_NAMESPACES.CHAT 
      ? state.chatSocket 
      : state.notificationSocket;
    
    return socketInstance.socket?.connected || false;
  },

  // 소켓 인스턴스 가져오기
  getSocket: (namespace: SocketNamespace) => {
    const state = get();
    const socketInstance = namespace === SOCKET_NAMESPACES.CHAT 
      ? state.chatSocket 
      : state.notificationSocket;
    
    return socketInstance.socket;
  },

  // 이벤트 구독
  subscribe: (namespace: SocketNamespace, storeName: string) => {
    const socket = get().getSocket(namespace);
    if (socket) {
      console.log(`📡 ${storeName}이 ${namespace} 네임스페이스 구독`);
    }
  },

  // 이벤트 구독 해제
  unsubscribe: (namespace: SocketNamespace, storeName: string) => {
    const socket = get().getSocket(namespace);
    if (socket) {
      console.log(`📡 ${storeName}이 ${namespace} 네임스페이스 구독 해제`);
    }
  },
}));

// 소켓 이벤트 리스너 설정
const setupSocketEventListeners = (
  socketInstance: SocketInstance, 
  type: 'chat' | 'notification'
) => {
  const socket = socketInstance.socket;
  if (!socket) return;

  // 연결 성공
  socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log(`✅ ${type} 소켓 연결 성공`);
    
    const updateKey = type === 'chat' ? 'chatSocket' : 'notificationSocket';
    
    useSocketStore.setState((prev) => ({
      [updateKey]: {
        ...prev[updateKey],
        state: 'connected',
        lastConnectedAt: new Date(),
        reconnectAttempts: 0,
      },
    }));
  });

  // 연결 해제
  socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
    console.log(`❌ ${type} 소켓 연결 해제:`, reason);
    
    const updateKey = type === 'chat' ? 'chatSocket' : 'notificationSocket';
    
    useSocketStore.setState((prev) => ({
      [updateKey]: {
        ...prev[updateKey],
        state: 'disconnected',
      },
    }));
  });

  // 연결 에러
  socket.on(SOCKET_EVENTS.CONNECT_ERROR, async (error) => {
    console.error(`❌ ${type} 소켓 연결 에러:`, error);
    
    const socketError = handleSocketError(error);
    
    // TOKEN_EXPIRED 에러 처리
    if (socketError.type === 'TOKEN_EXPIRED') {
      console.log('🔄 토큰 만료 감지, 토큰 갱신 시도...');
      
      const refreshResult = await refreshToken();
      
      if (refreshResult.success && refreshResult.newToken) {
        console.log('✅ 토큰 갱신 성공, 재연결 시도...');
        await useSocketStore.getState().updateToken(refreshResult.newToken);
      } else {
        console.error('❌ 토큰 갱신 실패:', refreshResult.error);
        // 로그아웃 처리
        const authStore = useAuthStore.getState();
        await authStore.logout();
      }
    }
  });

  // 재연결 시도
  socket.on(SOCKET_EVENTS.RECONNECT, (attemptNumber) => {
    console.log(`🔄 ${type} 소켓 재연결 시도 ${attemptNumber}번째`);
    
    const updateKey = type === 'chat' ? 'chatSocket' : 'notificationSocket';
    
    useSocketStore.setState((prev) => ({
      [updateKey]: {
        ...prev[updateKey],
        state: 'reconnecting',
        reconnectAttempts: attemptNumber,
      },
    }));
  });

  // 재연결 에러
  socket.on(SOCKET_EVENTS.RECONNECT_ERROR, (error) => {
    console.error(`❌ ${type} 소켓 재연결 에러:`, error);
  });

  // 재연결 실패
  socket.on(SOCKET_EVENTS.RECONNECT_FAILED, () => {
    console.error(`❌ ${type} 소켓 재연결 실패`);
    
    const updateKey = type === 'chat' ? 'chatSocket' : 'notificationSocket';
    
    useSocketStore.setState((prev) => ({
      [updateKey]: {
        ...prev[updateKey],
        state: 'disconnected',
      },
    }));
  });
};

// AppState 리스너 설정
let appStateSubscription: any = null;

const setupAppStateListener = () => {
  // 기존 리스너가 있으면 제거
  if (appStateSubscription) {
    appStateSubscription.remove();
  }

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    const state = useSocketStore.getState();
    
    console.log(`📱 AppState 변경: ${state.isAppActive ? 'active' : 'background'} → ${nextAppState}`);
    
    const wasActive = state.isAppActive;
    const isNowActive = nextAppState === 'active';
    
    useSocketStore.setState({ isAppActive: isNowActive });
    
    // 백그라운드에서 포그라운드로 돌아올 때 재연결 시도
    if (!wasActive && isNowActive && state.isInitialized) {
      console.log('🔄 앱이 포그라운드로 돌아옴, 소켓 재연결 시도...');
      
      // 잠시 대기 후 재연결 (네트워크 상태 안정화 대기)
      setTimeout(async () => {
        try {
          await state.reconnectAllSockets();
        } catch (error) {
          console.error('❌ 백업 재연결 실패:', error);
        }
      }, RECONNECT_STRATEGY.BACKUP_DELAY);
    }
  };

  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
  
  // 클린업 함수 반환
  return () => {
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
  };
};
