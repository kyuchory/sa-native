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
      console.log('🔄 ChatSocketService: 소켓 재연결 감지');
      // 재연결 시 이벤트 리스너 재설정 및 구독 복원
      this.eventListenersSetup = false; // 플래그 리셋
      this.setupSocketEventListeners();

      // 현재 채팅방이 있었다면 자동 재구독
      if (this.currentChatRoomId) {
        console.log(`🔄 재연결 후 채팅방 ${this.currentChatRoomId} 자동 재구독 시도`);
        setTimeout(() => {
          this.subscribeToChat(this.currentChatRoomId!);
        }, 500); // 약간의 지연으로 안정화
      }
    });
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
        console.log('🔌 ChatSocketService: 소켓 연결됨, 채팅 이벤트 리스너 재설정');

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
        console.log('🔌 ChatSocketService: 소켓 연결 해제됨');
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
      console.log('🔌 ChatSocketService: 초기 소켓 연결됨, 채팅 이벤트 리스너 설정');
      setTimeout(() => {
        this.setupSocketEventListeners();
      }, 100);
    }
  }

  // 채팅 구독 이벤트 리스너 설정 - 명시적 핸들러 참조 사용
  private setupSocketEventListeners() {
    // 재연결 시에도 리스너 재설정 가능하도록 플래그 체크 하지 않음
    console.log('🎧 ChatSocketService: 채팅 이벤트 리스너 설정 시작');

    // 기존 핸들러 제거 (명시적 참조로 안전하게)
    Object.keys(this.eventHandlers).forEach(eventName => {
      const handler = this.eventHandlers[eventName];
      socketService.off(eventName, handler);
    });
    this.eventHandlers = {}; // 핸들러 맵 초기화

    // 구독 성공 핸들러
    this.eventHandlers['chat:subscribed'] = (data: { chat_room_id: number; message: string }) => {
      console.log(`🔍 chat:subscribed 이벤트 수신: chat_room_id=${data.chat_room_id}, currentChatRoomId=${this.currentChatRoomId}`);
      if (data.chat_room_id === this.currentChatRoomId) {
        this.isSubscribed = true;
        this.isSubscribing = false;
        this.error = null;
        this.notifySubscriptionCallbacks();
        console.log('✅ 채팅방 구독 성공:', data.message);
      } else {
        console.log('⚠️ chat:subscribed 이벤트 무시: 채팅방 ID 불일치');
      }
    };
    socketService.on('chat:subscribed', this.eventHandlers['chat:subscribed']);

    // 구독 해제 성공 핸들러
    this.eventHandlers['chat:unsubscribed'] = (data: { chat_room_id: number; message: string }) => {
      console.log(`🔍 chat:unsubscribed 이벤트 수신: chat_room_id=${data.chat_room_id}, currentChatRoomId=${this.currentChatRoomId}`);
      if (data.chat_room_id === this.currentChatRoomId) {
        this.isSubscribed = false;
        this.isSubscribing = false;
        this.error = null;
        this.notifySubscriptionCallbacks();
        console.log('✅ 채팅방 구독 해제 성공:', data.message);
      }
    };
    socketService.on('chat:unsubscribed', this.eventHandlers['chat:unsubscribed']);

    // 구독 상태 확인 응답 핸들러
    this.eventHandlers['chat:subscription:status'] = (data: {
      chat_room_id: number;
      is_subscribed: boolean;
      user_id: number
    }) => {
      console.log(`🔍 chat:subscription:status 이벤트 수신: chat_room_id=${data.chat_room_id}, currentChatRoomId=${this.currentChatRoomId}`);
      if (data.chat_room_id === this.currentChatRoomId) {
        const wasSubscribed = this.isSubscribed;
        this.isSubscribed = data.is_subscribed;
        this.isSubscribing = false;

        if (!data.is_subscribed && wasSubscribed) {
          this.error = '구독이 해제되었습니다. 재연결을 시도합니다.';
        }

        this.notifySubscriptionCallbacks();
        console.log(`🔍 구독 상태 확인: ${data.is_subscribed ? '구독중' : '구독안함'}`);
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
      console.log(`✅ 메시지 전송 성공 확인: ${data.temp_id}`);
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
      console.log(`📨 새 메시지 수신: ${data.sender.nickname} - ${data.content} (ID: ${data.id})`);
      this.notifyMessageCallbacks('receive', data);
    };
    socketService.on('chat:message:receive', this.eventHandlers['chat:message:receive']);

    this.eventHandlers['chat:message:failed'] = (data: {
      temp_id: string;
      error: string;
    }) => {
      console.log(`❌ 메시지 전송 실패: ${data.temp_id} - ${data.error}`);
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
      console.log(`⌨️ 타이핑 상태: ${data.nickname} - ${data.is_typing ? '입력중' : '중단'}`);
      this.notifyTypingCallbacks(data);
    };
    socketService.on('chat:typing:status', this.eventHandlers['chat:typing:status']);

    // 이벤트 리스너 설정 완료 표시
    this.eventListenersSetup = true;
    console.log('🎧 ChatSocketService: 채팅 이벤트 리스너 설정 완료');
  }


  // Promise 기반 채팅 구독 - 서버 상태를 신뢰하지 않고 항상 강제 구독
  async subscribeToChat(chatRoomId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // 🚨 키 포인트: 클라이언트 캐시 상태를 무시하고 항상 서버에 구독 시도
      console.log(`📍 채팅방 ${chatRoomId} 서버로 구독 요청 (캐시 무시)`);

      // 소켓 연결 확인
      if (!socketService.isConnected) {
        const error = '소켓이 연결되지 않았습니다.';
        this.error = error;
        this.notifySubscriptionCallbacks();
        console.warn('⚠️ 소켓이 연결되지 않아 구독을 시도할 수 없음');
        reject(new Error(error));
        return;
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
          console.warn('⏰ 채팅방 구독 타임아웃');
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

          console.log(`✅ 서버에서 채팅방 ${chatRoomId} 구독 응답 수신`);
          resolve(); // 구독 성공 시 resolve
        }
      };

      socketService.on('chat:subscribed', subscriptionHandler);

      // 🛠️ 항상 서버로 구독 요청 전송 (캐시 무시)
      socketService.emit('chat:subscribe', { chat_room_id: chatRoomId });
    });
  }

  // 채팅 구독 해제
  async unsubscribeFromChat(chatRoomId?: number): Promise<void> {
    const targetChatRoomId = chatRoomId || this.currentChatRoomId;
    if (!targetChatRoomId) return;

    if (!socketService.isConnected) {
      console.log('⚠️ 소켓이 연결되지 않아 구독 해제를 시도할 수 없음');
      return;
    }

    // 구독 상태와 관계없이 항상 구독 해제 시도 (안전한 해제)
    console.log(`🔔 채팅방 ${targetChatRoomId} 구독 해제 시도 (현재 구독 상태: ${this.isSubscribed})`);

    try {
      socketService.emit('chat:unsubscribe', { chat_room_id: targetChatRoomId });

      // 즉시 상태 업데이트 (안전한 해제)
      this.isSubscribed = false;
      this.isSubscribing = false;
      this.notifySubscriptionCallbacks();

      // 타임아웃 처리
      setTimeout(() => {
        console.log('🔔 구독 해제 응답 타임아웃 (정상적으로 처리됨)');
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
    console.log('🧹 ChatSocketService: 모든 이벤트 리스너 정리');
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

  console.log(`📤 메시지 전송: ${tempId} - ${content}`);
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
