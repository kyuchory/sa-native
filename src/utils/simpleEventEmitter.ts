// React Native 호환 이벤트 이미터 (Node.js EventEmitter 없이 구현)
type EventCallback<T = any> = (data: T) => void;

export class SimpleEventEmitter {
  private static instance: SimpleEventEmitter;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  static getInstance(): SimpleEventEmitter {
    if (!SimpleEventEmitter.instance) {
      SimpleEventEmitter.instance = new SimpleEventEmitter();
    }
    return SimpleEventEmitter.instance;
  }

  // 이벤트 리스너 등록
  on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // 정리 함수 반환
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  }

  // 이벤트 한 번만 리스너 등록
  once<T = any>(event: string, callback: EventCallback<T>): () => void {
    const onceCallback = (data: T) => {
      callback(data);
      this.off(event, onceCallback);
    };
    return this.on(event, onceCallback);
  }

  // 이벤트 리스너 제거
  off<T = any>(event: string, callback?: EventCallback<T>): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // 이벤트 발행
  emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`이벤트 콜백 실행 중 에러 (${event}):`, error);
        }
      });
    }
  }

  // 이벤트 리스너 존재 여부 확인
  hasListeners(event: string): boolean {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size > 0 : false;
  }

  // 특정 이벤트의 리스너 수 반환
  listenerCount(event: string): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size : 0;
  }

  // 모든 이벤트 리스너 제거
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// 싁글톤 인스턴스
export const simpleEventEmitter = SimpleEventEmitter.getInstance();

// 인증 이벤트 타입들
export enum AuthEvent {
  LOGIN = 'auth:login',
  LOGOUT = 'auth:logout',
  TOKEN_REFRESH = 'auth:token_refresh',
}

// 편의 함수들
export const onAuthLogin = (callback: EventCallback) => simpleEventEmitter.on(AuthEvent.LOGIN, callback);
export const onAuthLogout = (callback: EventCallback) => simpleEventEmitter.on(AuthEvent.LOGOUT, callback);
export const onAuthTokenRefresh = (callback: EventCallback) => simpleEventEmitter.on(AuthEvent.TOKEN_REFRESH, callback);

export const emitAuthLogin = (data?: any) => simpleEventEmitter.emit(AuthEvent.LOGIN, data);
export const emitAuthLogout = (data?: any) => simpleEventEmitter.emit(AuthEvent.LOGOUT, data);
export const emitAuthTokenRefresh = (data?: any) => simpleEventEmitter.emit(AuthEvent.TOKEN_REFRESH, data);
