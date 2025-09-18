import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';
import { Alert } from 'react-native';
import { WS_BASE_URL } from '../config/api';
import { getAccessToken } from './authStore';
import { apiClient } from '../services/apiClient';

interface SocketConnection {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  lastConnectionError: string | null;
  subscribers: Set<string>;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectTimeout: NodeJS.Timeout | null;
  connectionId: string; // 중복 연결 방지용 고유 ID
  tokenRefreshAttempts: number; // 🔥 토큰 갱신 시도 횟수
  maxTokenRefreshAttempts: number; // 🔥 최대 토큰 갱신 시도 횟수
}

interface SocketStore {
  connections: Map<string, SocketConnection>;
  // 🗑️ isGloballyConnecting 제거 - 네임스페이스별 개별 관리로 변경

  connect: (namespace: string, options?: ConnectOptions) => Promise<Socket>;
  disconnect: (namespace: string) => void;
  disconnectAll: () => void;
  reconnect: (namespace: string) => Promise<Socket>;
  forceReconnect: (namespace: string) => Promise<Socket>;

  subscribe: (namespace: string, storeName: string) => void;
  unsubscribe: (namespace: string, storeName: string) => void;
  getSubscriberCount: (namespace: string) => number;

  isConnected: (namespace: string) => boolean;
  getSocket: (namespace: string) => Socket | null;
  getNamespaces: () => string[];
  
  // 새로운 메소드들
  cleanupConnection: (namespace: string) => void;
  scheduleReconnect: (namespace: string, delay?: number) => void;
  cancelReconnect: (namespace: string) => void;
}

interface ConnectOptions {
  forceReconnect?: boolean;
  timeout?: number;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  connections: new Map<string, SocketConnection>(),
  // 🗑️ isGloballyConnecting 제거

  connect: async (namespace: string, options: ConnectOptions = {}): Promise<Socket> => {
    const { connections } = get();
    const { forceReconnect = false, timeout = 10000 } = options;

    // 🔧 단순화된 연결 중복 방지 - 네임스페이스별로 개별 처리
    const existingConnection = connections.get(namespace);
    if (!forceReconnect && existingConnection?.isConnecting) {
      console.log(`🔄 ${namespace} 이미 연결 진행 중 - 대기`);
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          const connection = get().connections.get(namespace);
          if (connection?.socket && connection.isConnected) {
            clearInterval(checkInterval);
            resolve(connection.socket);
          } else if (!connection?.isConnecting) {
            clearInterval(checkInterval);
            reject(new Error(`${namespace} 연결 실패`));
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error(`${namespace} 연결 타임아웃`));
        }, timeout);
      });
    }

    // 기존 연결 재사용 (강제 재연결이 아닌 경우)
    if (!forceReconnect && existingConnection?.socket && existingConnection.isConnected) {
      console.log(`✅ ${namespace} 기존 연결 재사용`);
      return existingConnection.socket;
    }

    // 기존 연결 정리 (강제 재연결인 경우)
    if (forceReconnect && existingConnection) {
      get().cleanupConnection(namespace);
    }

    // 🗑️ 글로벌 연결 상태 제거 - 네임스페이스별 개별 관리

    try {
      const connectionId = `${namespace}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 연결 상태 초기화
      const newConnection: SocketConnection = {
        socket: null,
        isConnected: false,
        isConnecting: true,
        lastConnectionError: null,
        subscribers: existingConnection?.subscribers || new Set<string>(),
        reconnectAttempts: existingConnection?.reconnectAttempts || 0,
        maxReconnectAttempts: 5,
        reconnectTimeout: null,
        connectionId,
        tokenRefreshAttempts: 0, // 🔥 토큰 갱신 시도 횟수 초기화
        maxTokenRefreshAttempts: 3 // 🔥 최대 3번까지 토큰 갱신 시도
      };

      set((state) => {
        const updatedConnections = new Map(state.connections);
        updatedConnections.set(namespace, newConnection);
        return { connections: updatedConnections };
      });

      const token = getAccessToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      console.log(`🔌 ${namespace} WebSocket 연결 시도... (ID: ${connectionId})`);

      const newSocket = io(WS_BASE_URL + namespace, {
        auth: { token },
        autoConnect: true,
        reconnection: true,           // 🔥 자동 재연결 활성화
        reconnectionAttempts: 5,      // 최대 5번 재시도
        reconnectionDelay: 1000,      // 1초 후 재시도
        reconnectionDelayMax: 5000,   // 최대 5초 지연
        randomizationFactor: 0.5,     // 지터 추가 (서버 부하 분산)
        timeout: timeout,
        forceNew: forceReconnect,
        transports: ['websocket', 'polling'] // fallback 추가
      });

      // 연결 타임아웃 처리
      const connectTimeout = setTimeout(() => {
        if (!get().connections.get(namespace)?.isConnected) {
          console.error(`⏰ ${namespace} 연결 타임아웃`);
          newSocket.disconnect();
          throw new Error('연결 타임아웃');
        }
      }, timeout);

      // 연결 성공 이벤트
      newSocket.on('connect', () => {
        clearTimeout(connectTimeout);
        console.log(`✅ ${namespace} 연결 성공 (ID: ${connectionId})`);
        
        set((state) => {
          const updatedConnections = new Map(state.connections);
          const connection = updatedConnections.get(namespace);
          if (connection && connection.connectionId === connectionId) {
            updatedConnections.set(namespace, {
              ...connection,
              socket: newSocket,
              isConnected: true,
              isConnecting: false,
              lastConnectionError: null,
              reconnectAttempts: 0,
              tokenRefreshAttempts: 0 // 연결 성공 시 토큰 갱신 시도 횟수도 초기화
            });
          }
          return { connections: updatedConnections };
        });
        
        // 🔥 재연결 시 자동 상태 복구
        if (namespace === '/chat') {
          setTimeout(() => {
            // ChatStore에서 오프라인 복구 수행
            import('../stores/chatStore').then(({ useChatStore }) => {
              const chatStore = useChatStore.getState();
              chatStore.recoverFromOffline().catch(error => {
                console.error('❌ 채팅 상태 복구 실패:', error);
              });
            });
          }, 1000); // 1초 후 복구 시작
        } else if (namespace === '/notification') {
          setTimeout(() => {
            // NotificationStore에서 오프라인 복구 수행
            import('../stores/notificationStore').then(({ useNotificationStore }) => {
              const notificationStore = useNotificationStore.getState();
              notificationStore.recoverFromOffline().catch(error => {
                console.error('❌ 알림 상태 복구 실패:', error);
              });
            });
          }, 1200); // 1.2초 후 복구 시작 (chat보다 약간 늦게)
        }
      });

      // 연결 성공 응답 (서버에서 보내는 커스텀 이벤트)
      newSocket.on('connected', (data) => {
        console.log(`✅ ${namespace} 서버 연결 확인:`, data);
      });

      // 🔧 개선된 연결 오류 처리 - 토큰 갱신 동기화 개선
      newSocket.on('connect_error', async (error) => {
        clearTimeout(connectTimeout);
        console.error(`❌ ${namespace} 연결 실패:`, error.message);
        
        const connection = get().connections.get(namespace);
        if (!connection || connection.connectionId !== connectionId) {
          console.log(`🚫 ${namespace} 연결 ID 불일치, 무시`);
          return;
        }

        // 🔥 토큰 만료 처리 - 무한 루프 방지 개선
        if (error.message?.includes('TOKEN_EXPIRED')) {
          const currentAttempts = connection.tokenRefreshAttempts;
          
          if (currentAttempts >= connection.maxTokenRefreshAttempts) {
            console.error(`🛑 ${namespace} 토큰 갱신 최대 시도 횟수 초과 (${currentAttempts}/${connection.maxTokenRefreshAttempts})`);
            
            set((state) => {
              const updatedConnections = new Map(state.connections);
              const conn = updatedConnections.get(namespace);
              if (conn && conn.connectionId === connectionId) {
                updatedConnections.set(namespace, {
                  ...conn,
                  isConnecting: false,
                  isConnected: false,
                  socket: null,
                  lastConnectionError: '토큰 갱신 최대 시도 횟수 초과 - 로그인 필요',
                });
              }
              return { connections: updatedConnections };
            });
            
            Alert.alert('인증 만료', '로그인이 만료되었습니다. 다시 로그인해주세요.');
            return;
          }
          
          console.log(`🔄 ${namespace} 토큰 만료 - 동기화된 갱신 시도 (${currentAttempts + 1}/${connection.maxTokenRefreshAttempts})...`);
          
          try {
            // 토큰 갱신 시도 횟수 증가
            set((state) => {
              const updatedConnections = new Map(state.connections);
              const conn = updatedConnections.get(namespace);
              if (conn && conn.connectionId === connectionId) {
                updatedConnections.set(namespace, {
                  ...conn,
                  tokenRefreshAttempts: currentAttempts + 1
                });
              }
              return { connections: updatedConnections };
            });
            
            // 기존 소켓 즉시 정리
            newSocket.removeAllListeners();
            newSocket.disconnect();
            
            // 토큰 갱신 실행
            await apiClient.refreshToken();
            console.log(`✅ ${namespace} 토큰 갱신 성공`);
            
            // 연결 상태 초기화 (토큰 갱신 성공 시 재연결 시도 횟수 초기화)
            set((state) => {
              const updatedConnections = new Map(state.connections);
              const conn = updatedConnections.get(namespace);
              if (conn && conn.connectionId === connectionId) {
                updatedConnections.set(namespace, {
                  ...conn,
                  socket: null,
                  isConnected: false,
                  isConnecting: false,
                  lastConnectionError: null,
                  reconnectAttempts: 0,
                  tokenRefreshAttempts: 0 // 성공 시 초기화
                });
              }
              return { connections: updatedConnections };
            });
            
            // 새 토큰으로 즉시 재연결 시도 (지연 없이)
            console.log(`🔄 ${namespace} 새 토큰으로 재연결 시도...`);
            setTimeout(() => {
              get().forceReconnect(namespace).catch(reconnectError => {
                console.error(`❌ ${namespace} 토큰 갱신 후 재연결 실패:`, reconnectError);
              });
            }, 500); // 짧은 지연으로 안정성 확보
            
          } catch (refreshError) {
            console.error(`🛑 ${namespace} 토큰 갱신 실패:`, refreshError);
            
            set((state) => {
              const updatedConnections = new Map(state.connections);
              const conn = updatedConnections.get(namespace);
              if (conn && conn.connectionId === connectionId) {
                updatedConnections.set(namespace, {
                  ...conn,
                  isConnecting: false,
                  isConnected: false,
                  socket: null,
                  lastConnectionError: '인증 실패 - 토큰 갱신 실패',
                });
              }
              return { connections: updatedConnections,  };
            });

            const errorMessage = String(refreshError);
            if (errorMessage.includes('TOKEN_EXPIRED') || 
                errorMessage.includes('refresh') || 
                errorMessage.includes('expired')) {
              console.log('🚪 리프레시 토큰 만료 - 로그아웃 처리됨');
            } else {
              Alert.alert('인증 오류', '자동 로그인 갱신에 실패했습니다.');
            }
          }
        } else {
          // 일반적인 연결 오류 - 재시도 로직
          const currentAttempts = connection.reconnectAttempts;
          
          if (currentAttempts < connection.maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, currentAttempts), 30000); // 지수 백오프
            console.log(`🔄 ${namespace} 재연결 시도 ${currentAttempts + 1}/${connection.maxReconnectAttempts} (${delay}ms 후)`);
            
            set((state) => {
              const updatedConnections = new Map(state.connections);
              const conn = updatedConnections.get(namespace);
              if (conn && conn.connectionId === connectionId) {
                updatedConnections.set(namespace, {
                  ...conn,
                  isConnecting: false,
                  reconnectAttempts: currentAttempts + 1,
                  lastConnectionError: error.message
                });
              }
              return { connections: updatedConnections,  };
            });
            
            get().scheduleReconnect(namespace, delay);
          } else {
            // 최대 재시도 횟수 초과
            console.error(`🛑 ${namespace} 최대 재시도 횟수 초과`);
            
            set((state) => {
              const updatedConnections = new Map(state.connections);
              const conn = updatedConnections.get(namespace);
              if (conn && conn.connectionId === connectionId) {
                updatedConnections.set(namespace, {
                  ...conn,
                  isConnecting: false,
                  isConnected: false,
                  socket: null,
                  lastConnectionError: '최대 재시도 횟수 초과'
                });
              }
              return { connections: updatedConnections,  };
            });
            
            Alert.alert('연결 실패', `${namespace} 서버에 연결할 수 없습니다. 네트워크를 확인해주세요.`);
          }
        }
      });

      // 🔧 개선된 연결 해제 이벤트 - 스마트 재연결 정책
      newSocket.on('disconnect', (reason) => {
        console.log(`🔌 ${namespace} 연결 해제:`, reason);
        
        const connection = get().connections.get(namespace);
        if (!connection || connection.connectionId !== connectionId) return;
        
        set((state) => {
          const updatedConnections = new Map(state.connections);
          const conn = updatedConnections.get(namespace);
          if (conn && conn.connectionId === connectionId) {
            updatedConnections.set(namespace, {
              ...conn,
              isConnected: false,
              socket: null,
            });
          }
          return { connections: updatedConnections };
        });

        // 🔥 스마트 재연결 정책
        const RECONNECT_POLICIES: Record<string, boolean> = {
          'io server disconnect': false,    // 서버가 의도적으로 끊음 - 재연결 X
          'client disconnect': false,       // 클라이언트가 끊음 - 재연결 X
          'io client disconnect': false,    // 클라이언트 의도적 끊기 - 재연결 X
          'transport close': false,         // 네트워크 문제 - Socket.IO 자동 재연결이 처리
          'transport error': false,         // 전송 오류 - Socket.IO 자동 재연결이 처리
          'ping timeout': false,            // 핑 타임아웃 - Socket.IO 자동 재연결이 처리
          'server error': false,            // 서버 오류 - 재연결 X
          'forced close': false,            // 강제 종료 - 재연겸 X
        };
        
        const shouldReconnect = RECONNECT_POLICIES[reason] ?? false; // 기본적으로 Socket.IO에 맡김
        
        if (shouldReconnect) {
          console.log(`🔄 ${namespace} 수동 재연결 필요 (${reason})`);
          
          // 지수 백오프 + 지터로 더 안정적인 재연결
          const currentAttempts = connection.reconnectAttempts;
          const baseDelay = 1000;
          const maxDelay = 30000;
          const jitter = Math.random() * 1000;
          const delay = Math.min(baseDelay * Math.pow(2, currentAttempts) + jitter, maxDelay);
          
          get().scheduleReconnect(namespace, delay);
        } else {
          console.log(`🤖 ${namespace} Socket.IO 자동 재연결 또는 재연결 불필요 (${reason})`);
        }
      });

      // 🔥 Socket.IO 자동 재연결 이벤트 처리
      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 ${namespace} Socket.IO 자동 재연결 시도 #${attemptNumber}`);
        
        set((state) => {
          const updatedConnections = new Map(state.connections);
          const conn = updatedConnections.get(namespace);
          if (conn && conn.connectionId === connectionId) {
            updatedConnections.set(namespace, {
              ...conn,
              isConnecting: true,
              reconnectAttempts: attemptNumber - 1,
            });
          }
          return { connections: updatedConnections };
        });
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`✅ ${namespace} Socket.IO 자동 재연결 성공! (시도 횟수: ${attemptNumber})`);
        
        set((state) => {
          const updatedConnections = new Map(state.connections);
          const conn = updatedConnections.get(namespace);
          if (conn && conn.connectionId === connectionId) {
            updatedConnections.set(namespace, {
              ...conn,
              socket: newSocket,
              isConnected: true,
              isConnecting: false,
              lastConnectionError: null,
              reconnectAttempts: 0,
              tokenRefreshAttempts: 0,
            });
          }
          return { connections: updatedConnections };
        });

        // 🔥 재연결 성공 시 자동 상태 복구
        if (namespace === '/chat') {
          setTimeout(() => {
            import('../stores/chatStore').then(({ useChatStore }) => {
              const chatStore = useChatStore.getState();
              chatStore.recoverFromOffline().catch(error => {
                console.error('❌ 채팅 상태 복구 실패:', error);
              });
            });
          }, 1000);
        } else if (namespace === '/notification') {
          setTimeout(() => {
            import('../stores/notificationStore').then(({ useNotificationStore }) => {
              const notificationStore = useNotificationStore.getState();
              notificationStore.recoverFromOffline().catch(error => {
                console.error('❌ 알림 상태 복구 실패:', error);
              });
            });
          }, 1200);
        }
      });

      newSocket.on('reconnect_error', (error) => {
        console.error(`❌ ${namespace} Socket.IO 자동 재연결 실패:`, error);
        
        set((state) => {
          const updatedConnections = new Map(state.connections);
          const conn = updatedConnections.get(namespace);
          if (conn && conn.connectionId === connectionId) {
            updatedConnections.set(namespace, {
              ...conn,
              isConnecting: false,
              lastConnectionError: `자동 재연결 실패: ${error.message}`,
            });
          }
          return { connections: updatedConnections };
        });
      });

      newSocket.on('reconnect_failed', () => {
        console.error(`💥 ${namespace} Socket.IO 자동 재연결 완전 실패 - 최대 시도 횟수 초과`);
        
        set((state) => {
          const updatedConnections = new Map(state.connections);
          const conn = updatedConnections.get(namespace);
          if (conn && conn.connectionId === connectionId) {
            updatedConnections.set(namespace, {
              ...conn,
              isConnecting: false,
              isConnected: false,
              lastConnectionError: '자동 재연결 완전 실패 - 수동 재연결 필요',
            });
          }
          return { connections: updatedConnections };
        });

        Alert.alert('연결 실패', `${namespace} 서버 연결이 복구되지 않았습니다. 앱을 다시 시작해주세요.`);
      });

      // Socket 객체를 연결 상태에 즉시 설정
      set((state) => {
        const updatedConnections = new Map(state.connections);
        const connection = updatedConnections.get(namespace);
        if (connection && connection.connectionId === connectionId) {
          updatedConnections.set(namespace, {
            ...connection,
            socket: newSocket,
          });
        }
        return { connections: updatedConnections };
      });

      // 연결 완료 대기
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          const updatedConnection = get().connections.get(namespace);
          if (updatedConnection?.socket && 
              updatedConnection.isConnected && 
              updatedConnection.connectionId === connectionId) {
            resolve(newSocket);
          } else if (updatedConnection && 
                    !updatedConnection.isConnecting &&
                    updatedConnection.connectionId === connectionId) {
            reject(new Error(`${namespace} 연결 실패: ${updatedConnection.lastConnectionError}`));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        setTimeout(checkConnection, 0);

        // 전체 타임아웃
        setTimeout(() => {
          reject(new Error(`${namespace} 연결 타임아웃`));
        }, timeout);
      });

    } catch (error) {
      console.error(`💥 ${namespace} Socket 초기화 실패:`, error);
      
      set((state) => {
        const updatedConnections = new Map(state.connections);
        const connection = updatedConnections.get(namespace);
        if (connection) {
          updatedConnections.set(namespace, {
            ...connection,
            isConnecting: false,
            lastConnectionError: error instanceof Error ? error.message : '알 수 없는 오류',
          });
        }
        return { connections: updatedConnections,  };
      });
      
      Alert.alert('오류', `${namespace} WebSocket 연결에 실패했습니다.`);
      throw error;
    }
  },

  // 연결 정리 함수
  cleanupConnection: (namespace: string) => {
    const { connections } = get();
    const connection = connections.get(namespace);

    if (connection) {
      // 재연결 타임아웃 취소
      if (connection.reconnectTimeout) {
        clearTimeout(connection.reconnectTimeout);
      }

      // 소켓 연결 해제
      if (connection.socket) {
        connection.socket.removeAllListeners();
        connection.socket.disconnect();
      }

      console.log(`🧹 ${namespace} 연결 정리 완료`);
    }
  },

  // 재연결 스케줄링
  scheduleReconnect: (namespace: string, delay: number = 2000) => {
    const { connections } = get();
    const connection = connections.get(namespace);

    if (!connection) return;

    // 기존 타임아웃 취소
    if (connection.reconnectTimeout) {
      clearTimeout(connection.reconnectTimeout);
    }

    const timeout = setTimeout(async () => {
      console.log(`🔄 ${namespace} 스케줄된 재연결 실행`);
      try {
        await get().forceReconnect(namespace);
      } catch (error) {
        console.error(`❌ ${namespace} 스케줄된 재연결 실패:`, error);
      }
    }, delay);

    set((state) => {
      const updatedConnections = new Map(state.connections);
      const conn = updatedConnections.get(namespace);
      if (conn) {
        updatedConnections.set(namespace, {
          ...conn,
          reconnectTimeout: timeout
        });
      }
      return { connections: updatedConnections };
    });
  },

  // 재연결 취소
  cancelReconnect: (namespace: string) => {
    const { connections } = get();
    const connection = connections.get(namespace);

    if (connection?.reconnectTimeout) {
      clearTimeout(connection.reconnectTimeout);
      
      set((state) => {
        const updatedConnections = new Map(state.connections);
        const conn = updatedConnections.get(namespace);
        if (conn) {
          updatedConnections.set(namespace, {
            ...conn,
            reconnectTimeout: null
          });
        }
        return { connections: updatedConnections };
      });
    }
  },

  // 강제 재연결
  forceReconnect: async (namespace: string): Promise<Socket> => {
    console.log(`🔄 ${namespace} 강제 재연결 시작`);
    get().cleanupConnection(namespace);
    return get().connect(namespace, { forceReconnect: true });
  },

  // 연결 해제
  disconnect: (namespace: string) => {
    console.log(`🔌 ${namespace} 연결 해제 요청`);
    get().cancelReconnect(namespace);
    get().cleanupConnection(namespace);

    set((state) => {
      const updatedConnections = new Map(state.connections);
      const connection = updatedConnections.get(namespace);
      if (connection) {
        updatedConnections.set(namespace, {
          ...connection,
          socket: null,
          isConnected: false,
          isConnecting: false,
          lastConnectionError: null,
          reconnectAttempts: 0,
          reconnectTimeout: null
        });
      }
      return { connections: updatedConnections };
    });
  },

  // 모든 연결 해제
  disconnectAll: () => {
    const { connections } = get();

    console.log('🔌 모든 연결 해제');
    connections.forEach((_, namespace) => {
      get().disconnect(namespace);
    });

    set({
      connections: new Map<string, SocketConnection>()
      // 🗑️ isGloballyConnecting 제거
    });
  },

  // 재연결 (기존 연결 유지 시도)
  reconnect: async (namespace: string): Promise<Socket> => {
    console.log(`🔄 ${namespace} 재연결 시도`);
    const connection = get().connections.get(namespace);
    
    if (connection?.isConnected && connection.socket) {
      return connection.socket;
    }
    
    return get().connect(namespace);
  },

  // 나머지 메소드들은 동일...
  subscribe: (namespace: string, storeName: string) => {
    set((state) => {
      const updatedConnections = new Map(state.connections);
      const connection = updatedConnections.get(namespace) || {
        socket: null,
        isConnected: false,
        isConnecting: false,
        lastConnectionError: null,
        subscribers: new Set<string>(),
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        reconnectTimeout: null,
        connectionId: '',
        tokenRefreshAttempts: 0, // 🔥 누락된 필드 추가
        maxTokenRefreshAttempts: 3 // 🔥 누락된 필드 추가
      };

      console.log(`📢 ${storeName} 스토어가 ${namespace} 구독`);
      connection.subscribers.add(storeName);
      updatedConnections.set(namespace, connection);

      return { connections: updatedConnections };
    });
  },

  unsubscribe: (namespace: string, storeName: string) => {
    set((state) => {
      const updatedConnections = new Map(state.connections);
      const connection = updatedConnections.get(namespace);

      if (connection) {
        console.log(`📭 ${storeName} 스토어가 ${namespace} 구독 해제`);
        connection.subscribers.delete(storeName);
        updatedConnections.set(namespace, connection);

        // 구독자가 없으면 연결 해제
        if (connection.subscribers.size === 0) {
          console.log(`🔌 ${namespace} 구독자가 없어서 연결 해제`);
          get().disconnect(namespace);
        }
      }

      return { connections: updatedConnections };
    });
  },

  getSubscriberCount: (namespace: string) => {
    const { connections } = get();
    return connections.get(namespace)?.subscribers.size || 0;
  },

  isConnected: (namespace: string) => {
    const { connections } = get();
    return connections.get(namespace)?.isConnected || false;
  },

  getSocket: (namespace: string) => {
    const { connections } = get();
    return connections.get(namespace)?.socket || null;
  },

  getNamespaces: () => {
    const { connections } = get();
    return Array.from(connections.keys());
  },
}));