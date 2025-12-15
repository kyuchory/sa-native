import { io } from 'socket.io-client';
import { getApiConfig } from '../config/api';
import { tokenService } from './tokenService';
import { apiClient } from './apiClient';

// 소켓 서비스 클래스
class SocketService {
  private socket: any = null; // Socket.io 타입 이슈로 any 사용
  private _isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1초
  private serverConnected = false; // 서버 연결 완료 상태

  // 연결 상태 콜백들
  private connectionCallbacks: Array<(connected: boolean) => void> = [];
  private errorCallbacks: Array<(error: string) => void> = [];
  private reconnectCallbacks: Array<() => void> = [];

  // 게터들
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get isConnecting(): boolean {
    return this._isConnecting;
  }

  get currentReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  get isServerConnected(): boolean {
    return this.serverConnected;
  }

  constructor() {
    // 초기에는 소켓을 생성하지 않고, connect() 시점에 생성
    // 이렇게 하면 토큰 로딩 타이밍 문제를 해결할 수 있음
  }

  // Socket.IO 설정
  private setupSocketIO(token?: string) {
    const baseURL = getApiConfig().wsBaseURL;

    this.socket = io(baseURL, {
      // 인증 설정 (토큰이 제공되면 사용, 아니면 빈 값)
      auth: {
        token: token || ''
      },

      // 자동 재연결 설정 (Socket.io 기본 기능 활용)
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,

      // 타임아웃 설정
      timeout: 20000,
      forceNew: false,

      // 전송 설정
      transports: ['websocket', 'polling'],

      // 추가 옵션들
      upgrade: true,
      rememberUpgrade: false,
    });

    this.setupEventListeners();
  }

  // 이벤트 리스너 설정
  private setupEventListeners() {
    if (!this.socket) return;

    // 연결 성공
    this.socket.on('connect', () => {
      this._isConnecting = false;
      this.reconnectAttempts = 0;
      this.notifyConnectionCallbacks(true);
    });

    // 연결 실패
    this.socket.on('connect_error', async (error: any) => {
      this._isConnecting = false;

      // 인증 관련 에러 처리 (API처럼 재발급 먼저 시도)
      if (this.isAuthError(error)) {
        const reconnected = await this.handleAuthError();
        if (reconnected) {
          return;
        } else {
          const errorMessage = error?.message || '알 수 없는 인증 에러';
          console.error('❌ 소켓 연결 실패 (setupEventListeners):', errorMessage);
          this.notifyErrorCallbacks('인증에 실패했습니다. 다시 로그인해주세요.');
          return;
        }
      }

      // 일반 연결 에러
      const errorMessage = error?.message || '알 수 없는 연결 에러';
      console.error('❌ 소켓 연결 실패 (setupEventListeners):', errorMessage);
      this.notifyErrorCallbacks(`연결 실패: ${errorMessage}`);
      this.notifyConnectionCallbacks(false);
    });

    // 연결 해제
    this.socket.on('disconnect', (reason: string) => {
      this._isConnecting = false;

      // 의도적 해제가 아닌 경우 자동 재연결은 Socket.io가 처리
      if (reason === 'io server disconnect') {
        // 서버에서 연결을 끊은 경우 - 재연결 시도하지 않음
        this.notifyErrorCallbacks('서버에서 연결이 끊어졌습니다.');
      }

      this.notifyConnectionCallbacks(false);
    });

    // 재연결 시도
    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      this._isConnecting = true;
      this.reconnectAttempts = attemptNumber;
    });

    // 재연결 성공
    this.socket.on('reconnect', (attemptNumber: number) => {
      this._isConnecting = false;
      this.reconnectAttempts = 0;
      this.notifyConnectionCallbacks(true);
      this.notifyReconnectCallbacks(); // 이벤트 리스너 재설정
    });

    // 재연결 실패
    this.socket.on('reconnect_failed', () => {
      console.error('❌ 재연결 실패 - 최대 시도 횟수 초과');
      this._isConnecting = false;
      this.notifyErrorCallbacks('연결을 다시 시도할 수 없습니다. 네트워크 상태를 확인해주세요.');
      this.notifyConnectionCallbacks(false);
    });

    // 서버 연결 응답
    this.socket.on('connected', (data: any) => {
      this.serverConnected = true;
    });

    // 에러 처리
    this.socket.on('error', (error: any) => {
      console.error('🚨 서버 에러:', error);
      this.notifyErrorCallbacks(error.message);
    });
  }

  // 인증 에러 감지
  private isAuthError(error: any): boolean {
    const authErrorMessages = [
      '인증 토큰이 없습니다',
      '유효하지 않은 토큰입니다',
      '존재하지 않는 사용자입니다',
      'Authentication error',
      'Unauthorized',
      // 서버에서 실제로 보내주는 토큰 만료 메시지들
      'TOKEN_EXPIRED',
      'TOKEN_INVALID',
      'TOKEN_NOT_BEFORE'
    ];

    return authErrorMessages.some(msg =>
      error.message?.includes(msg) || error.message === msg
    );
  }

  // 인증 에러 처리 (토큰 재발급)
  private async handleAuthError(): Promise<boolean> {
    try {
      // 기존 apiClient의 refreshToken 로직 활용
      await apiClient.refreshToken();

      // 새로운 토큰으로 소켓 완전 재생성
      const newToken = tokenService.getAccessToken();
      if (newToken) {
        // 기존 소켓 정리 후 재연결
        if (this.socket) {
          this.socket.disconnect();
          this.socket.removeAllListeners();
          this.socket = null;
        }

        await this.connect();

        return true;
      }

      console.warn('⚠️ 토큰 재발급 후 새로운 토큰을 찾을 수 없음');
      return false;
    } catch (error) {
      console.error('❌ 토큰 재발급 실패:', error);

      // 재발급 실패시 로그아웃 처리
      try {
        tokenService.clearTokens();
        this.notifyErrorCallbacks('로그인이 만료되었습니다. 다시 로그인해주세요.');
      } catch (logoutError) {
        console.error('로그아웃 처리 실패:', logoutError);
      }

      return false;
    }
  }

  // 연결
  async connect(): Promise<void> {
    if (this._isConnecting || this.isConnected) {
      return;
    }

    // 실시간으로 토큰 가져오기
    const token = tokenService.getAccessToken() || undefined;

    // 소켓이 없거나 토큰이 변경된 경우 재생성
    if (!this.socket) {
      this.setupSocketIO(token);
    } else if (token) {
      // 기존 소켓이 있고 토큰이 있으면 auth 토큰 업데이트
      this.socket.auth = { token };
    }

    // 연결 시작
    this._isConnecting = true;
    this.socket?.connect();
  }

  // 연결 해제
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this._isConnecting = false;
      this.reconnectAttempts = 0;
      this.serverConnected = false;
    }
  }

  // 현재 join된 룸들 확인 (디버깅용)
  getCurrentRooms(): string[] {
    if (!this.socket || !this.socket.rooms) return [];
    try {
      return Array.from(this.socket.rooms);
    } catch (error) {
      return [];
    }
  }

  // 이벤트 리스너 등록
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  // 이벤트 리스너 제거
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  // 이벤트 발생
  emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }

  // 연결 상태 콜백 등록
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.push(callback);

    // 현재 상태 즉시 전달
    callback(this.isConnected);

    // 정리 함수 반환
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  // 에러 콜백 등록
  onError(callback: (error: string) => void): () => void {
    this.errorCallbacks.push(callback);

    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // 재연결 콜백 등록
  onReconnect(callback: () => void): () => void {
    this.reconnectCallbacks.push(callback);

    return () => {
      const index = this.reconnectCallbacks.indexOf(callback);
      if (index > -1) {
        this.reconnectCallbacks.splice(index, 1);
      }
    };
  }

  // 콜백 알림 함수들
  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('연결 상태 콜백 실행 중 에러:', error);
      }
    });
  }

  private notifyErrorCallbacks(error: string): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('에러 콜백 실행 중 에러:', error);
      }
    });
  }

  private notifyReconnectCallbacks(): void {
    this.reconnectCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('재연결 콜백 실행 중 에러:', error);
      }
    });
  }

  // 정리
  destroy(): void {
    this.disconnect();
    this.socket?.removeAllListeners();
    this.socket = null;
    this.serverConnected = false;
    this.connectionCallbacks = [];
    this.errorCallbacks = [];
  }
}

// 싱글톤 인스턴스 생성
export const socketService = new SocketService();

// 편의 함수들
export const connectSocket = () => socketService.connect();
export const disconnectSocket = () => socketService.disconnect();
export const isSocketConnected = () => socketService.isConnected;
export const onSocketConnectionChange = (callback: (connected: boolean) => void) =>
  socketService.onConnectionChange(callback);
export const onSocketError = (callback: (error: string) => void) =>
  socketService.onError(callback);
