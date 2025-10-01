import { socketService } from './socketService';

/**
 * 채팅 소켓 서비스
 * ChatDetailScreen의 채팅 구독/해제 로직을 별도 서비스로 분리
 * notificationSocketService.ts와 유사한 패턴으로 구현
 */
class ChatSocketService {
  private isSubscribed = false;
  private isSubscribing = false;
  private currentChatRoomId: number | null = null;
  private error: string | null = null;
  private eventListenersSetup = false; // 이벤트 리스너 중복 설정 방지

  // 구독 상태 변경 콜백들
  private subscriptionCallbacks: Array<(status: { isSubscribed: boolean; error: string | null; chatRoomId: number | null }) => void> = [];

  // 메시지 이벤트 콜백들
  public messageCallbacks: Array<(type: 'sent' | 'receive' | 'failed', data: any) => void> = [];

  // 타이핑 이벤트 콜백들
  public typingCallbacks: Array<(data: { chat_room_id: number; user_id: number; nickname: string; is_typing: boolean }) => void> = [];

  constructor() {
    this.setupSocketConnectionListener();
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

  // 소켓 연결 상태 리스너 설정
  private setupSocketConnectionListener() {
    // 소켓 연결 상태 변경 감지
    socketService.onConnectionChange((connected: boolean) => {
      if (connected) {
        console.log('🔌 ChatSocketService: 소켓 연결됨, 채팅 이벤트 리스너 설정');
        this.setupSocketEventListeners();
      } else {
        console.log('🔌 ChatSocketService: 소켓 연결 해제됨');
        // 연결 해제 시 상태 초기화
        this.reset();
      }
    });

    // 이미 연결되어 있다면 바로 이벤트 리스너 설정
    if (socketService.isConnected) {
      console.log('🔌 ChatSocketService: 이미 소켓 연결됨, 채팅 이벤트 리스너 설정');
      this.setupSocketEventListeners();
    }
  }

  // 채팅 구독 이벤트 리스너 설정
  private setupSocketEventListeners() {
    // 이벤트 리스너가 이미 설정되어 있는지 확인
    if (this.eventListenersSetup) {
      console.log('🎧 ChatSocketService: 이벤트 리스너 이미 설정됨 - 중복 설정 방지');
      return;
    }

    console.log('🎧 ChatSocketService: 채팅 이벤트 리스너 설정 시작');

    // 기존 리스너 제거 (안전하게)
    socketService.off('chat:subscribed');
    socketService.off('chat:unsubscribed');
    socketService.off('chat:subscription:status');
    socketService.off('chat:message:sent');
    socketService.off('chat:message:receive');
    socketService.off('chat:message:failed');
    socketService.off('chat:typing:status');

    // 구독 성공
    socketService.on('chat:subscribed', (data: { chat_room_id: number; message: string }) => {
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
    });

    // 구독 해제 성공
    socketService.on('chat:unsubscribed', (data: { chat_room_id: number; message: string }) => {
      console.log(`🔍 chat:unsubscribed 이벤트 수신: chat_room_id=${data.chat_room_id}, currentChatRoomId=${this.currentChatRoomId}`);
      if (data.chat_room_id === this.currentChatRoomId) {
        this.isSubscribed = false;
        this.isSubscribing = false;
        this.error = null;
        this.notifySubscriptionCallbacks();
        console.log('✅ 채팅방 구독 해제 성공:', data.message);
      }
    });

    // 구독 상태 확인 응답
    socketService.on('chat:subscription:status', (data: {
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
    });

    // 메시지 이벤트 리스너들
    socketService.on('chat:message:sent', (data: {
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
    });

    socketService.on('chat:message:receive', (data: {
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
    });

    socketService.on('chat:message:failed', (data: {
      temp_id: string;
      error: string;
    }) => {
      console.log(`❌ 메시지 전송 실패: ${data.temp_id} - ${data.error}`);
      this.notifyMessageCallbacks('failed', data);
    });

    // 타이핑 이벤트 리스너들
    socketService.on('chat:typing:status', (data: {
      chat_room_id: number;
      user_id: number;
      nickname: string;
      is_typing: boolean;
    }) => {
      console.log(`⌨️ 타이핑 상태: ${data.nickname} - ${data.is_typing ? '입력중' : '중단'}`);
      this.notifyTypingCallbacks(data);
    });

    // 이벤트 리스너 설정 완료 표시
    this.eventListenersSetup = true;
    console.log('🎧 ChatSocketService: 채팅 이벤트 리스너 설정 완료');
  }


  // 채팅 구독
  async subscribeToChat(chatRoomId: number): Promise<void> {
    if (this.isSubscribed && this.currentChatRoomId === chatRoomId) {
      console.log('✅ 이미 해당 채팅방 구독중');
      return;
    }

    if (!socketService.isConnected) {
      this.error = '소켓이 연결되지 않았습니다.';
      this.notifySubscriptionCallbacks();
      console.warn('⚠️ 소켓이 연결되지 않아 구독을 시도할 수 없음');
      return;
    }

    this.isSubscribing = true;
    this.currentChatRoomId = chatRoomId;
    this.error = null;
    this.notifySubscriptionCallbacks();

    try {
      console.log(`📍 채팅방 ${chatRoomId} 구독 시도`);

      socketService.emit('chat:subscribe', { chat_room_id: chatRoomId });

      // 타임아웃 처리
      setTimeout(() => {
        if (this.isSubscribing) {
          this.isSubscribing = false;
          this.error = '구독 응답 타임아웃 - 재시도해주세요';
          this.notifySubscriptionCallbacks();
          console.warn('⏰ 채팅방 구독 타임아웃');
        }
      }, 5000);

    } catch (error) {
      this.isSubscribing = false;
      this.error = '채팅방 구독에 실패했습니다.';
      this.notifySubscriptionCallbacks();
      console.error('❌ 채팅방 구독 실패:', error);
    }
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

  // 전체 초기화
  reset() {
    this.isSubscribed = false;
    this.isSubscribing = false;
    this.currentChatRoomId = null;
    this.error = null;
    this.eventListenersSetup = false; // 이벤트 리스너 재설정 가능
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
export const chatSocketService = new ChatSocketService();

// 편의 함수들
export const subscribeToChat = (chatRoomId: number) => chatSocketService.subscribeToChat(chatRoomId);
export const unsubscribeFromChat = (chatRoomId?: number) => chatSocketService.unsubscribeFromChat(chatRoomId);
export const checkChatSubscription = (chatRoomId: number) => chatSocketService.checkSubscriptionStatus(chatRoomId);
export const onChatSubscriptionChange = (callback: (status: { isSubscribed: boolean; error: string | null; chatRoomId: number | null }) => void) =>
  chatSocketService.onSubscriptionChange(callback);
