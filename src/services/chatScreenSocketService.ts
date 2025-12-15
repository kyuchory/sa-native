import { socketService } from './socketService';

/**
 * ChatScreen 채팅 목록 소켓 서비스
 * ChatDetailScreen 패턴과 동일하게 useFocusEffect + useAppState 사용
 * 요약된 채팅 메시지 수신하여 채팅 목록 실시간 업데이트
 */
class ChatScreenSocketService {
  // 싱글톤 인스턴스
  private static instance: ChatScreenSocketService | null = null;

  private isSubscribed = false;
  private isSubscribing = false;
  private error: string | null = null;

  // 이벤트 리스너 설정 완료 플래그
  private eventListenersSetup = false;

  // 명시적 핸들러 참조로 안전한 리스너 관리
  private eventHandlers: { [key: string]: (...args: any[]) => void } = {};

  // 요약 메시지 콜백들
  public summaryMessageCallbacks: Array<(data: {
    chat_room_id: number;
    last_message: {
      id: number;
      content: string;
      type: 'text' | 'image' | 'video';
      sender_id: number;
      sender_nickname: string;
      created_at: string;
    };
  }) => void> = [];

  // 채팅방 업데이트 콜백들
  public roomUpdatedCallbacks: Array<(data: {
    event: 'updated';
    room_info: any;
    reason: string;
  }) => void> = [];

  // 채팅방 생성 콜백들
  public roomCreatedCallbacks: Array<(data: {
    event: 'created';
    room_info: any;
  }) => void> = [];

  private constructor() {
    this.setupSocketConnectionListener();
  }

  // 싱글톤 인스턴스 획득
  static getInstance(): ChatScreenSocketService {
    if (!ChatScreenSocketService.instance) {
      ChatScreenSocketService.instance = new ChatScreenSocketService();
    }
    return ChatScreenSocketService.instance;
  }

  // 소켓 연결 상태 리스너 설정
  private setupSocketConnectionListener() {
    socketService.onConnectionChange((connected: boolean) => {
      if (connected) {
        this.setupSummaryEventListeners();
      } else {
        this.clearAllEventListeners();
        this.isSubscribed = false;
        this.isSubscribing = false;
        this.error = null;
      }
    });

    // 초기 연결 상태에 따라 설정
    if (socketService.isConnected) {
      this.setupSummaryEventListeners();
    }
  }

  // 요약 채팅 메시지 이벤트 리스너 설정
  private setupSummaryEventListeners() {
    if (this.eventListenersSetup) return;

    // 기존 핸들러 제거 (명시적 참조로 안전하게)
    Object.keys(this.eventHandlers).forEach(eventName => {
      const handler = this.eventHandlers[eventName];
      socketService.off(eventName, handler);
    });
    this.eventHandlers = {};

    // 요약 메시지 이벤트 핸들러
    this.eventHandlers['chat:summary:receive'] = (data: {
      chat_room_id: number;
      last_message: {
        id: number;
        content: string;
        type: 'text' | 'image' | 'video';
        sender_id: number;
        sender_nickname: string;
        created_at: string;
      };
    }) => {
      this.notifySummaryMessageCallbacks(data);
    };
    socketService.on('chat:summary:receive', this.eventHandlers['chat:summary:receive']);

    // 채팅방 업데이트 이벤트 핸들러
    this.eventHandlers['chat:room:updated'] = (data: {
      event: 'updated';
      room_info: any;
      reason: string;
    }) => {
      this.notifyRoomUpdatedCallbacks(data);
    };
    socketService.on('chat:room:updated', this.eventHandlers['chat:room:updated']);

    // 채팅방 생성 이벤트 핸들러
    this.eventHandlers['chat:room:created'] = (data: {
      event: 'created';
      room_info: any;
    }) => {
      this.notifyRoomCreatedCallbacks(data);
    };
    socketService.on('chat:room:created', this.eventHandlers['chat:room:created']);

    this.eventListenersSetup = true;
  }

  // 요약 메시지 콜백 알림
  private notifySummaryMessageCallbacks(data: {
    chat_room_id: number;
    last_message: {
      id: number;
      content: string;
      type: 'text' | 'image' | 'video';
      sender_id: number;
      sender_nickname: string;
      created_at: string;
    };
  }) {
    this.summaryMessageCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('요약 메시지 콜백 실행 중 에러:', error);
      }
    });
  }

  // ChatScreen에서 사용될 구독/해제 메소드들
  // 실제로는 서버에 구독 요청을 하지 않고, 이벤트 수신만 함
  async subscribeToChatList(): Promise<void> {
    // ChatScreen은 특정 채팅방을 구독하지 않고 모든 요약 메시지를 수신함
    // 따라서 별도 구독 로직 없이 이벤트 리스너만 활성화
    this.isSubscribed = true;
    this.error = null;
  }

  async unsubscribeFromChatList(): Promise<void> {
    this.isSubscribed = false;
    this.error = null;
  }

  // 요약 메시지 이벤트 콜백 등록
  onSummaryMessage(callback: (data: {
    chat_room_id: number;
    last_message: {
      id: number;
      content: string;
      type: 'text' | 'image' | 'video';
      sender_id: number;
      sender_nickname: string;
      created_at: string;
    };
  }) => void): () => void {
    this.summaryMessageCallbacks.push(callback);

    // 정리 함수 반환
    return () => {
      const index = this.summaryMessageCallbacks.indexOf(callback);
      if (index > -1) {
        this.summaryMessageCallbacks.splice(index, 1);
      }
    };
  }

  // 채팅방 업데이트 이벤트 콜백 등록
  onRoomUpdated(callback: (data: {
    event: 'updated';
    room_info: any;
    reason: string;
  }) => void): () => void {
    this.roomUpdatedCallbacks.push(callback);

    // 정리 함수 반환
    return () => {
      const index = this.roomUpdatedCallbacks.indexOf(callback);
      if (index > -1) {
        this.roomUpdatedCallbacks.splice(index, 1);
      }
    };
  }

  // 채팅방 생성 이벤트 콜백 등록
  onRoomCreated(callback: (data: {
    event: 'created';
    room_info: any;
  }) => void): () => void {
    this.roomCreatedCallbacks.push(callback);

    // 정리 함수 반환
    return () => {
      const index = this.roomCreatedCallbacks.indexOf(callback);
      if (index > -1) {
        this.roomCreatedCallbacks.splice(index, 1);
      }
    };
  }

  // 채팅방 업데이트 콜백 알림
  private notifyRoomUpdatedCallbacks(data: {
    event: 'updated';
    room_info: any;
    reason: string;
  }) {
    this.roomUpdatedCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('채팅방 업데이트 콜백 실행 중 에러:', error);
      }
    });
  }

  // 채팅방 생성 콜백 알림
  private notifyRoomCreatedCallbacks(data: {
    event: 'created';
    room_info: any;
  }) {
    this.roomCreatedCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('채팅방 생성 콜백 실행 중 에러:', error);
      }
    });
  }

  // 모든 이벤트 리스너 제거 (연결별 정리용)
  private clearAllEventListeners() {
    Object.keys(this.eventHandlers).forEach(eventName => {
      const handler = this.eventHandlers[eventName];
      socketService.off(eventName, handler);
    });
    this.eventHandlers = {};
    this.eventListenersSetup = false;
  }

  // 현재 구독 상태
  get subscriptionStatus() {
    return {
      isSubscribed: this.isSubscribed,
      isSubscribing: this.isSubscribing,
      error: this.error
    };
  }
}

// 요약 메시지 이벤트 콜백 등록 함수
export const onChatSummaryMessage = (callback: (data: {
  chat_room_id: number;
  last_message: {
    id: number;
    content: string;
    type: 'text' | 'image' | 'video';
    sender_id: number;
    sender_nickname: string;
    created_at: string;
  };
}) => void) => {
  const service = ChatScreenSocketService.getInstance();
  return service.onSummaryMessage(callback);
};

// 채팅방 업데이트 이벤트 콜백 등록 함수
export const onChatRoomUpdated = (callback: (data: {
  event: 'updated';
  room_info: any;
  reason: string;
}) => void) => {
  const service = ChatScreenSocketService.getInstance();
  return service.onRoomUpdated(callback);
};

// 채팅방 생성 이벤트 콜백 등록 함수
export const onChatRoomCreated = (callback: (data: {
  event: 'created';
  room_info: any;
}) => void) => {
  const service = ChatScreenSocketService.getInstance();
  return service.onRoomCreated(callback);
};

// ChatScreen 구독 함수들
export const subscribeToChatList = () => ChatScreenSocketService.getInstance().subscribeToChatList();
export const unsubscribeFromChatList = () => ChatScreenSocketService.getInstance().unsubscribeFromChatList();

// 싱글톤 인스턴스
export const chatScreenSocketService = ChatScreenSocketService.getInstance();
