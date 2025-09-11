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
}

interface SocketStore {
  // 네임스페이스별 Socket 연결 상태
  connections: Map<string, SocketConnection>;

  // Connection 관리 액션
  connect: (namespace: string) => Promise<Socket>;
  disconnect: (namespace: string) => void;
  disconnectAll: () => void;
  reconnect: (namespace: string) => Promise<Socket>;

  // 이벤트 구독 관리 (네임스페이스별)
  subscribe: (namespace: string, storeName: string) => void;
  unsubscribe: (namespace: string, storeName: string) => void;
  getSubscriberCount: (namespace: string) => number;

  // 유틸리티 메소드
  isConnected: (namespace: string) => boolean;
  getSocket: (namespace: string) => Socket | null;
  getNamespaces: () => string[];
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  // 초기 상태
  connections: new Map<string, SocketConnection>(),

  // 특정 네임스페이스의 Socket 연결 생성/재사용
  connect: async (namespace: string): Promise<Socket> => {
    const { connections } = get();

    // 기존 연결 확인
    const existingConnection = connections.get(namespace);

    // 이미 연결되어 있다면 재사용
    if (existingConnection?.socket && existingConnection.isConnected) {
      console.log(`✅ ${namespace} 네임스페이스 기존 연결 재사용`);
      return existingConnection.socket;
    }

    // 연결 중이라면 무시
    if (existingConnection?.isConnecting) {
      console.log(`🔄 ${namespace} 네임스페이스 연결 진행 중...`);
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          const updatedConnection = get().connections.get(namespace);
          if (updatedConnection?.socket && updatedConnection.isConnected) {
            resolve(updatedConnection.socket);
          } else if (updatedConnection && !updatedConnection.isConnecting) {
            reject(new Error(`${namespace} 연결 실패`));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    try {
      // 연결 상태 업데이트
      const newConnection: SocketConnection = {
        socket: null,
        isConnected: false,
        isConnecting: true,
        lastConnectionError: null,
        subscribers: existingConnection?.subscribers || new Set<string>(),
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

      console.log(`🔌 ${namespace} 네임스페이스 WebSocket 연결 시도...`);

      const newSocket = io(WS_BASE_URL + namespace, {
        auth: { token }
      });

      // Socket 이벤트 설정
      newSocket.on('connected', (data) => {
        console.log(`✅ ${namespace} 네임스페이스 연결 성공:`, data);
        set((state) => {
          const updatedConnections = new Map(state.connections);
          const connection = updatedConnections.get(namespace);
          if (connection) {
            updatedConnections.set(namespace, {
              ...connection,
              socket: newSocket,
              isConnected: true,
              isConnecting: false,
              lastConnectionError: null,
            });
          }
          return { connections: updatedConnections };
        });
      });

      // 연결 에러 처리 - 자동 토큰 재발급 포함
      newSocket.on('connect_error', async (error) => {
        console.error(`❌ ${namespace} 네임스페이스 연결 실패:`, error);
        set((state) => {
          const updatedConnections = new Map(state.connections);
          const connection = updatedConnections.get(namespace);
          if (connection) {
            updatedConnections.set(namespace, {
              ...connection,
              isConnecting: false,
              lastConnectionError: error.message,
            });
          }
          return { connections: updatedConnections };
        });

        // TOKEN_EXPIRED 에러 체크
        if (error.message && error.message.includes('TOKEN_EXPIRED')) {
          console.log(`🔄 ${namespace} 네임스페이스 토큰 만료 감지 - 자동 재연결 시도...`);

          try {
            const newAccessToken = await apiClient.refreshToken();
            console.log(`🔄 ${namespace} 네임스페이스 새 토큰으로 재연결 시도...`);

            // 기존 소켓 정리
            newSocket.disconnect();

            // 새 토큰으로 재연결
            await get().reconnect(namespace);

          } catch (refreshError) {
            console.error(`🛑 ${namespace} 네임스페이스 토큰 갱신 실패:`, refreshError);
            set((state) => {
              const updatedConnections = new Map(state.connections);
              const connection = updatedConnections.get(namespace);
              if (connection) {
                updatedConnections.set(namespace, {
                  ...connection,
                  isConnected: false,
                  socket: null,
                });
              }
              return { connections: updatedConnections };
            });

            const errorMessage = String(refreshError);
            if (errorMessage.includes('TOKEN_EXPIRED') ||
                errorMessage.includes('refresh') ||
                errorMessage.includes('expired') ||
                errorMessage.includes('Refresh token')) {
              console.log('리프레시 토큰 만료 - apiClient에서 로그아웃 처리 완료');
            } else {
              Alert.alert(`토큰 갱신 실패`, `자동 로그인 갱신에 실패했습니다.`);
            }
          }
        } else {
          Alert.alert('연결 오류', `${namespace} 네임스페이스 서버에 연결할 수 없습니다.`);
        }
      });

      // 연결 끊김 이벤트
      newSocket.on('disconnect', (reason) => {
        console.log(`🔌 ${namespace} 네임스페이스 연결 해제:`, reason);
        set((state) => {
          const updatedConnections = new Map(state.connections);
          const connection = updatedConnections.get(namespace);
          if (connection) {
            updatedConnections.set(namespace, {
              ...connection,
              isConnected: false,
              socket: null,
            });
          }
          return { connections: updatedConnections };
        });
      });

      // Socket을 초기 상태로 설정
      set((state) => {
        const updatedConnections = new Map(state.connections);
        const connection = updatedConnections.get(namespace);
        if (connection) {
          updatedConnections.set(namespace, {
            ...connection,
            socket: newSocket,
          });
        }
        return { connections: updatedConnections };
      });

      // 연결 완료를 기다림
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          const updatedConnection = get().connections.get(namespace);
          if (updatedConnection?.socket && updatedConnection.isConnected) {
            resolve(newSocket);
          } else if (updatedConnection && !updatedConnection.isConnecting) {
            reject(new Error(`${namespace} 연결 실패`));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        setTimeout(checkConnection, 0);
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
        return { connections: updatedConnections };
      });
      Alert.alert('오류', `${namespace} WebSocket 연결에 실패했습니다.`);
      throw error;
    }
  },

  // 특정 네임스페이스 연결 해제
  disconnect: (namespace: string) => {
    const { connections } = get();
    const connection = connections.get(namespace);

    if (connection?.socket) {
      console.log(`🔌 ${namespace} 네임스페이스 연결 해제`);
      connection.socket.disconnect();

      set((state) => {
        const updatedConnections = new Map(state.connections);
        updatedConnections.set(namespace, {
          ...connection,
          socket: null,
          isConnected: false,
          isConnecting: false,
          lastConnectionError: null,
        });
        return { connections: updatedConnections };
      });
    }
  },

  // 모든 네임스페이스 연결 해제
  disconnectAll: () => {
    const { connections } = get();

    console.log('🔌 모든 네임스페이스 연결 해제');
    connections.forEach((connection, namespace) => {
      if (connection.socket) {
        connection.socket.disconnect();
      }
    });

    set({
      connections: new Map<string, SocketConnection>(),
    });
  },

  // 특정 네임스페이스 재연결
  reconnect: async (namespace: string): Promise<Socket> => {
    console.log(`🔄 ${namespace} 네임스페이스 재연결 시도...`);
    get().disconnect(namespace);
    return get().connect(namespace);
  },

  // 네임스페이스 이벤트 구독 등록
  subscribe: (namespace: string, storeName: string) => {
    set((state) => {
      const updatedConnections = new Map(state.connections);
      const connection = updatedConnections.get(namespace) || {
        socket: null,
        isConnected: false,
        isConnecting: false,
        lastConnectionError: null,
        subscribers: new Set<string>(),
      };

      console.log(`📢 ${storeName} 스토어가 ${namespace} 네임스페이스 구독`);
      connection.subscribers.add(storeName);
      updatedConnections.set(namespace, connection);

      return { connections: updatedConnections };
    });
  },

  // 네임스페이스 이벤트 구독 해제
  unsubscribe: (namespace: string, storeName: string) => {
    set((state) => {
      const updatedConnections = new Map(state.connections);
      const connection = updatedConnections.get(namespace);

      if (connection) {
        console.log(`📭 ${storeName} 스토어가 ${namespace} 네임스페이스 구독 해제`);
        connection.subscribers.delete(storeName);
        updatedConnections.set(namespace, connection);
      }

      return { connections: updatedConnections };
    });
  },

  // 네임스페이스 구독자 수 확인
  getSubscriberCount: (namespace: string) => {
    const { connections } = get();
    const connection = connections.get(namespace);
    return connection?.subscribers.size || 0;
  },

  // 네임스페이스 연결 상태 확인
  isConnected: (namespace: string) => {
    const { connections } = get();
    const connection = connections.get(namespace);
    return connection?.isConnected || false;
  },

  // 네임스페이스 Socket 직접 접근
  getSocket: (namespace: string) => {
    const { connections } = get();
    const connection = connections.get(namespace);
    return connection?.socket || null;
  },

  // 모든 네임스페이스 목록 반환
  getNamespaces: () => {
    const { connections } = get();
    return Array.from(connections.keys());
  },
}));
