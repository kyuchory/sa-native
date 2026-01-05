import { socketService } from './socketService';

/**
 * 채팅 소켓 서비스
 * 싱글톤 패턴으로 구현하여 이벤트 리스너 충돌 방지
 * 재연결 시 자동 복원 및 안전한 구독 관리
 */
class ChatSocketService {
  // 싱글톤 인스턴스
  private static instance: ChatSocketService | null = null;

  private isSubscribed = false;
  private isSubscribing = false;
  private currentChatRoomId: number | null = null;
  private error: string | null = null;
  private eventListenersSetup = false;

  // 명시적 핸들러 참조로 안전한 리스너 관리
  private eventHandlers: { [key: string]: (...args: any[]) => void } = {};

  // 구독 상태 변경 콜백들
  private subscriptionCallbacks: Array<(status: { isSubscribed: boolean; error: string | null; chatRoomId: number | null }) => void> = [];

  // 메시지 이벤트 콜백들
  public messageCallbacks: Array<(type: 'sent' | 'receive' | 'failed', data: any) => void> = [];

  // 타이핑 이벤트 콜백들
  public typingCallbacks: Array<(data: { chat_room_id: number; user_id: number; nickname: string; is_typing: boolean }) => void> = [];

  private constructor() {
    this.setupSocketConnectionListener();
    this.setupReconnectHandlers();
  }

  // 싱글톤 인스턴스 획득
  static getInstance(): ChatSocketService {
    if (!ChatSocketService.instance) {
      ChatSocketService.instance = new ChatSocketService();
    }
    return ChatSocketService.instance;
  }

  // 재연결 핸들러 설정
  private setupReconnectHandlers() {
    socketService.onReconnect(() => {
      // 재연결 시 이벤트 리스너 재설정 및 구독 복원
      this.eventListenersSetup = false; // 플래그 리셋
      this.setupSocketEventListeners();

      // 현재 채팅방이 있었다면 자동 재구독 (상태 초기화 후)
      if (this.currentChatRoomId) {
        // 재연결 후에는 구독 상태를 초기화하여 깨끗한 상태에서 시작
        this.isSubscribed = false;
        this.error = null;
        this.notifySubscriptionCallbacks();

        // 충분한 지연 시간 후 재구독 시도
        setTimeout(() => {
          if (this.currentChatRoomId) {
            this.attemptResubscription(this.currentChatRoomId);
          }
        }, 400); // 재연결 안정화 대기 시간 증가
      }
    });
  }

  // 재구독 시도 (재시도 로직 포함)
  private async attemptResubscription(chatRoomId: number, retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1초

    try {
      await this.subscribeToChat(chatRoomId);
    } catch (error) {

      if (retryCount < maxRetries) {
        setTimeout(() => {
          this.attemptResubscription(chatRoomId, retryCount + 1);
        }, retryDelay);
      } else {
        console.error(`💀 채팅방 ${chatRoomId} 구독 복원 최종 실패 - 수동 재시도 필요`);
        this.error = '구독 복원 실패. 화면을 새로고침해주세요.';
        this.notifySubscriptionCallbacks();
      }
    }
  }

  // 현재 구독 상태
  get subscriptionStatus() {
    return {
      isSubscribed: this.isSubscribed,
      isSubscribing: this.isSubscribing,
      error: this.error,
      chatRoomId: this.currentChatRoomId
    };
  }

  // 소켓 연결 상태 리스너 설정 - 연결별 안전한 관리
  private setupSocketConnectionListener() {
    // 소켓 연결 상태 변경 감지 (연결별로 정리된 리스너 관리)
    socketService.onConnectionChange((connected: boolean) => {
      if (connected) {
        // 🔧 새 연결 시 기존 리스너 완전 정리 후 재설정
        this.clearAllEventListeners();
        setTimeout(() => {
          this.setupSocketEventListeners();
        }, 100); // 연결 안정화 대기

        // 재연결 시에만 자동 복원 수행
        socketService.onReconnect(() => {
          // 재연결 핸들러에서 이미 처리됨
        });

      } else {
        // 연결 해제 시 이벤트 리스너 정리 및 구독 상태 초기화
        this.clearAllEventListeners();
        this.isSubscribed = false; // 연결이 끊어지면 구독도 무효화
        this.isSubscribing = false;
        this.error = null;
        this.notifySubscriptionCallbacks();
      }
    });

    // 초기 연결 상태에 따라 설정
    if (socketService.isConnected) {
      setTimeout(() => {
        this.setupSocketEventListeners();
      }, 100);
    }
  }

  // 채팅 구독 이벤트 리스너 설정 - 명시적 핸들러 참조 사용
  private setupSocketEventListeners() {
    // 재연결 시에도 리스너 재설정 가능하도록 플래그 체크 하지 않음

    // 기존 핸들러 제거 (명시적 참조로 안전하게)
    Object.keys(this.eventHandlers).forEach(eventName => {
      const handler = this.eventHandlers[eventName];
      socketService.off(eventName, handler);
    });
    this.eventHandlers = {}; // 핸들러 맵 초기화

    // 구독 성공 핸들러
    this.eventHandlers['chat:subscribed'] = (data: { chat_room_id: number; message: string }) => {
      if (data.chat_room_id === this.currentChatRoomId) {
        this.isSubscribed = true;
        this.isSubscribing = false;
        this.error = null;
        this.notifySubscriptionCallbacks();
      }
    };
    socketService.on('chat:subscribed', this.eventHandlers['chat:subscribed']);

    // 구독 해제 성공 핸들러
    this.eventHandlers['chat:unsubscribed'] = (data: { chat_room_id: number; message: string }) => {
      if (data.chat_room_id === this.currentChatRoomId) {
        this.isSubscribed = false;
        this.isSubscribing = false;
        this.error = null;
        this.notifySubscriptionCallbacks();
      }
    };
    socketService.on('chat:unsubscribed', this.eventHandlers['chat:unsubscribed']);

    // 구독 상태 확인 응답 핸들러
    this.eventHandlers['chat:subscription:status'] = (data: {
      chat_room_id: number;
      is_subscribed: boolean;
      user_id: number
    }) => {
      if (data.chat_room_id === this.currentChatRoomId) {
        const wasSubscribed = this.isSubscribed;
        this.isSubscribed = data.is_subscribed;
        this.isSubscribing = false;

        if (!data.is_subscribed && wasSubscribed) {
          this.error = '구독이 해제되었습니다. 재연결을 시도합니다.';
        }

        this.notifySubscriptionCallbacks();
      }
    };
    socketService.on('chat:subscription:status', this.eventHandlers['chat:subscription:status']);

    // 메시지 이벤트 핸들러들
    this.eventHandlers['chat:message:sent'] = (data: {
      temp_id: string;
      message: {
        id: number;
        chat_room_id: number;
        sender_id: number;
        type: 'text' | 'image' | 'video';
        content: string;
        created_at: string;
        sender: {
          id: number;
          nickname: string;
          profile_img: string | null;
        };
        mentions: any[];
      }
    }) => {
      this.notifyMessageCallbacks('sent', data);
    };
    socketService.on('chat:message:sent', this.eventHandlers['chat:message:sent']);

    this.eventHandlers['chat:message:receive'] = (data: {
      id: number;
      chat_room_id: number;
      sender_id: number;
      type: 'text' | 'image' | 'video';
      content: string;
      created_at: string;
      sender: {
        id: number;
        nickname: string;
        profile_img: string | null;
      };
      mentions: any[];
    }) => {
      this.notifyMessageCallbacks('receive', data);
    };
    socketService.on('chat:message:receive', this.eventHandlers['chat:message:receive']);

    this.eventHandlers['chat:message:failed'] = (data: {
      temp_id: string;
      error: string;
    }) => {
      this.notifyMessageCallbacks('failed', data);
    };
    socketService.on('chat:message:failed', this.eventHandlers['chat:message:failed']);

    // 타이핑 이벤트 핸들러
    this.eventHandlers['chat:typing:status'] = (data: {
      chat_room_id: number;
      user_id: number;
      nickname: string;
      is_typing: boolean;
    }) => {
      this.notifyTypingCallbacks(data);
    };
    socketService.on('chat:typing:status', this.eventHandlers['chat:typing:status']);

    // 이벤트 리스너 설정 완료 표시
    this.eventListenersSetup = true;
  }


  // Promise 기반 채팅 구독 - 서버 상태를 신뢰하지 않고 항상 강제 구독
  async subscribeToChat(chatRoomId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const attemptSubscription = (retryCount: number) => {
        // 🚨 키 포인트: 클라이언트 캐시 상태를 무시하고 항상 서버에 구독 시도

        // 소켓 연결 확인 및 재시도
        if (!socketService.isConnected) {
          if (retryCount < 3) {
            setTimeout(() => attemptSubscription(retryCount + 1), 300);
            return;
          } else {
            const error = '소켓이 연결되지 않았습니다.';
            this.error = error;
            this.notifySubscriptionCallbacks();
            reject(new Error(error));
            return;
          }
        }

        // 구독 중복 방지 (실제 진행 중인 구독만 체크)
        if (this.isSubscribing) {
          const error = '이미 구독 진행 중입니다.';
          this.error = error;
          reject(new Error(error));
          return;
        }

        this.isSubscribing = true;
        this.currentChatRoomId = chatRoomId;
        this.error = null;
        this.notifySubscriptionCallbacks();

        // 타임아웃 설정
        const timeout = setTimeout(() => {
          if (this.isSubscribing) {
            this.isSubscribing = false;
            this.error = '구독 응답 타임아웃';
            this.notifySubscriptionCallbacks();
            reject(new Error('구독 응답 타임아웃'));
          }
        }, 5000);

        // 일회성 이벤트 핸들러 설정 - 구독 성공 대기
        const subscriptionHandler = (data: { chat_room_id: number; message: string }) => {
          if (data.chat_room_id === this.currentChatRoomId) {
            clearTimeout(timeout);

            // 이벤트 핸들러 제거 (일회성)
            socketService.off('chat:subscribed', subscriptionHandler);

            this.isSubscribed = true;
            this.isSubscribing = false;
            this.error = null;
            this.notifySubscriptionCallbacks();

            resolve(); // 구독 성공 시 resolve
          }
        };

        socketService.on('chat:subscribed', subscriptionHandler);

        // 🛠️ 항상 서버로 구독 요청 전송 (캐시 무시)
        socketService.emit('chat:subscribe', { chat_room_id: chatRoomId });
      };

      attemptSubscription(0);
    });
  }

  // 채팅 구독 해제
  async unsubscribeFromChat(chatRoomId?: number): Promise<void> {
    const targetChatRoomId = chatRoomId || this.currentChatRoomId;
    if (!targetChatRoomId) return;

    if (!socketService.isConnected) {
      return;
    }

    // 구독 상태와 관계없이 항상 구독 해제 시도 (안전한 해제)

    try {
      socketService.emit('chat:unsubscribe', { chat_room_id: targetChatRoomId });

      // 즉시 상태 업데이트 (안전한 해제)
      this.isSubscribed = false;
      this.isSubscribing = false;
      this.notifySubscriptionCallbacks();

      // 타임아웃 처리
      setTimeout(() => {
        // 구독 해제 응답 타임아웃 (정상적으로 처리됨)
      }, 2000);

    } catch (error) {
      console.error('❌ 채팅방 구독 해제 실패:', error);
      // 구독 해제 실패는 크게 문제되지 않음
    }
  }

  // 구독 상태 확인
  async checkSubscriptionStatus(chatRoomId: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (!socketService.isConnected) {
        console.warn('⚠️ 소켓이 연결되지 않아 구독 상태를 확인할 수 없음');
        resolve(false);
        return;
      }

      socketService.emit('chat:subscription:check', {
        chat_room_id: chatRoomId
      });

      const timeout = setTimeout(() => {
        socketService.off('chat:subscription:status', handler);
        console.warn('⏰ 구독 상태 확인 타임아웃');
        resolve(false);
      }, 3000);

      const handler = (data: {
        chat_room_id: number;
        is_subscribed: boolean;
        user_id: number
      }) => {
        if (data.chat_room_id === chatRoomId) {
          clearTimeout(timeout);
          socketService.off('chat:subscription:status', handler);
          resolve(data.is_subscribed);
        }
      };

      socketService.on('chat:subscription:status', handler);
    });
  }

  // 구독 상태 변경 콜백 등록
  onSubscriptionChange(callback: (status: { isSubscribed: boolean; error: string | null; chatRoomId: number | null }) => void): () => void {
    this.subscriptionCallbacks.push(callback);

    // 현재 상태 즉시 전달
    callback(this.subscriptionStatus);

    // 정리 함수 반환
    return () => {
      const index = this.subscriptionCallbacks.indexOf(callback);
      if (index > -1) {
        this.subscriptionCallbacks.splice(index, 1);
      }
    };
  }

  // 콜백 알림
  private notifySubscriptionCallbacks() {
    const status = this.subscriptionStatus;
    this.subscriptionCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('구독 상태 콜백 실행 중 에러:', error);
      }
    });
  }

  // 메시지 콜백 알림
  private notifyMessageCallbacks(type: 'sent' | 'receive' | 'failed', data: any) {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('메시지 콜백 실행 중 에러:', error);
      }
    });
  }

  // 타이핑 콜백 알림
  private notifyTypingCallbacks(data: { chat_room_id: number; user_id: number; nickname: string; is_typing: boolean }) {
    this.typingCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('타이핑 콜백 실행 중 에러:', error);
      }
    });
  }

  // 특정 채팅방 구독 상태 초기화
  resetChatRoom(chatRoomId: number) {
    if (this.currentChatRoomId === chatRoomId) {
      this.isSubscribed = false;
      this.isSubscribing = false;
      this.error = null;
      this.currentChatRoomId = null;
      this.notifySubscriptionCallbacks();
    }
  }

  // 모든 이벤트 리스너 제거 (연결별 정리용)
  private clearAllEventListeners() {
    Object.keys(this.eventHandlers).forEach(eventName => {
      const handler = this.eventHandlers[eventName];
      socketService.off(eventName, handler);
    });
    this.eventHandlers = {};
    this.eventListenersSetup = false; // 재설정 가능하도록 플래그 초기화
  }

  // 전체 초기화
  reset() {
    this.clearAllEventListeners(); // 이벤트 리스너도 함께 정리
    this.isSubscribed = false;
    this.isSubscribing = false;
    this.currentChatRoomId = null;
    this.error = null;
    this.subscriptionCallbacks = [];
    this.messageCallbacks = [];
    this.typingCallbacks = [];
  }

  // 정리
  destroy() {
    this.reset();
  }
}

// 메시지 전송
export const sendMessage = (tempId: string, chatRoomId: number, type: 'text' | 'image' | 'video', content?: string, mentionUserIds?: number[]) => {
  if (!socketService.isConnected) {
    console.error('메시지 전송 실패: 소켓 연결되지 않음');
    return;
  }

  const messageData = {
    temp_id: tempId,
    chat_room_id: chatRoomId,
    type,
    content,
    mention_user_ids: mentionUserIds
  };

  socketService.emit('chat:message:send', messageData);
};

// 타이핑 시작
export const startTyping = (chatRoomId: number) => {
  if (!socketService.isConnected) return;

  socketService.emit('chat:typing:start', { chat_room_id: chatRoomId });
};

// 타이핑 중단
export const stopTyping = (chatRoomId: number) => {
  if (!socketService.isConnected) return;

  socketService.emit('chat:typing:stop', { chat_room_id: chatRoomId });
};

// 메시지 이벤트 콜백 등록
export const onMessageEvent = (callback: (type: 'sent' | 'receive' | 'failed', data: any) => void) => {
  chatSocketService.messageCallbacks.push(callback);

  // 정리 함수 반환
  return () => {
    const index = chatSocketService.messageCallbacks.indexOf(callback);
    if (index > -1) {
      chatSocketService.messageCallbacks.splice(index, 1);
    }
  };
};

// 타이핑 이벤트 콜백 등록
export const onTypingEvent = (callback: (data: { chat_room_id: number; user_id: number; nickname: string; is_typing: boolean }) => void) => {
  chatSocketService.typingCallbacks.push(callback);

  // 정리 함수 반환
  return () => {
    const index = chatSocketService.typingCallbacks.indexOf(callback);
    if (index > -1) {
      chatSocketService.typingCallbacks.splice(index, 1);
    }
  };
};

// 싱글톤 인스턴스
export const chatSocketService = ChatSocketService.getInstance();

// 편의 함수들
export const subscribeToChat = (chatRoomId: number) => chatSocketService.subscribeToChat(chatRoomId);
export const unsubscribeFromChat = (chatRoomId?: number) => chatSocketService.unsubscribeFromChat(chatRoomId);
export const checkChatSubscription = (chatRoomId: number) => chatSocketService.checkSubscriptionStatus(chatRoomId);
export const onChatSubscriptionChange = (callback: (status: { isSubscribed: boolean; error: string | null; chatRoomId: number | null }) => void) =>
  chatSocketService.onSubscriptionChange(callback);
