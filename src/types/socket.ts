// Socket.io 관련 타입 정의

// 클라이언트에서 서버로 보내는 이벤트들
export interface ClientToServerEvents {
  // 알림 관련
  'notification:subscribe': () => void;
  'notification:unsubscribe': () => void;

  // 채팅 관련 (나중에 구현)
  'chat:join_room': (data: { chat_room_id: number }) => void;
  'chat:leave_room': (data: { chat_room_id: number }) => void;
  'chat:message:send': (data: {
    temp_id: string;
    chat_room_id: number;
    type: 'text' | 'image' | 'video';
    content?: string;
    mention_user_ids?: number[];
  }) => void;
  'chat:typing:start': (data: { chat_room_id: number }) => void;
  'chat:typing:stop': (data: { chat_room_id: number }) => void;
}

// 서버에서 클라이언트로 보내는 이벤트들
export interface ServerToClientEvents {
  // 연결 관련
  'connected': (data: {
    message: string;
    user_id: number;
    nickname: string;
    connected_at: Date;
  }) => void;

  // 알림 관련
  'notification:subscribed': (data: { userId: number }) => void;
  'notification:unsubscribed': (data: { userId: number }) => void;
  'notification:subscription:restored': (data: {
    userId: number;
    restoredRooms: string[];
    message: string;
  }) => void;

  // 다양한 알림 타입들
  'notification:followed': (data: {
    id: number;
    type: 'followed';
    sender: {
      id: number;
      nickname: string;
      profile_img?: string;
    };
    reference_id: number;
    is_read: boolean;
    created_at: string;
  }) => void;
  'notification:feed_liked': (data: {
    id: number;
    type: 'feed_liked';
    sender: {
      id: number;
      nickname: string;
      profile_img?: string;
    };
    reference_id: number;
    is_read: boolean;
    created_at: string;
    feed: {
      id: number;
      title: string;
      content: string;
    };
  }) => void;
  'notification:post_liked': (data: {
    id: number;
    type: 'post_liked';
    sender: {
      id: number;
      nickname: string;
      profile_img?: string;
    };
    reference_id: number;
    is_read: boolean;
    created_at: string;
    post: {
      id: number;
      title: string;
      content: string;
    };
  }) => void;
  'notification:feed_commented': (data: {
    id: number;
    type: 'feed_commented';
    sender: {
      id: number;
      nickname: string;
      profile_img?: string;
    };
    reference_id: number;
    is_read: boolean;
    created_at: string;
    feed: {
      id: number;
      title: string;
      content: string;
    };
    comment_content: string;
  }) => void;
  'notification:post_commented': (data: {
    id: number;
    type: 'post_commented';
    sender: {
      id: number;
      nickname: string;
      profile_img?: string;
    };
    reference_id: number;
    is_read: boolean;
    created_at: string;
    post: {
      id: number;
      title: string;
      content: string;
    };
    comment_content: string;
  }) => void;
  'notification:feed_created': (data: {
    id: number;
    type: 'feed_created';
    sender: {
      id: number;
      nickname: string;
      profile_img?: string;
    };
    reference_id: number;
    is_read: boolean;
    created_at: string;
    feed: {
      id: number;
      title: string;
      content: string;
    };
  }) => void;
  'notification:post_created': (data: {
    id: number;
    type: 'post_created';
    sender: {
      id: number;
      nickname: string;
      profile_img?: string;
    };
    reference_id: number;
    is_read: boolean;
    created_at: string;
    post: {
      id: number;
      title: string;
      content: string;
    };
  }) => void;
  'notification:message': (data: any) => void;
  'notification:message_badge': (data: {
    chat_room_id: number;
    unread_count: number;
    updated_at: string;
  }) => void;
  'notification:unread_count': (data: {
    unread_count: number;
    updated_at: string;
  }) => void;
  'notification:chat_badge': (data: {
    hasNewMessage: boolean;
    updated_at: string;
  }) => void;

  // 멘션 알림 (채팅에서 멘션당했을 때)
  'notification:mention:receive': (data: {
    message_id: number;
    chat_room_id: number;
    mentioned_user_id: number;
    mentioned_user_nickname: string;
    sender_nickname: string;
    content?: string;
    created_at: Date;
  }) => void;

  // 채팅방 관련
  'chat:joined_room': (data: { chat_room_id: number; message: string }) => void;
  'chat:left_room': (data: { chat_room_id: number; message: string }) => void;
  'chat:user_joined': (data: { user_id: number; nickname: string; message: string }) => void;
  'chat:user_left': (data: { user_id: number; nickname: string; message: string }) => void;
  'chat:subscription:restored': (data: {
    userId: number;
    restoredRooms: number[];
    message: string;
  }) => void;
  'chat:message:sent': (data: any) => void;
  'chat:message:failed': (data: { temp_id: string; error: string }) => void;
  'chat:message:receive': (data: any) => void;
  'chat:typing:status': (data: {
    chat_room_id: number;
    user_id: number;
    nickname: string;
    is_typing: boolean;
  }) => void;

  // 에러 처리
  'error': (data: {
    type?: string;
    message: string;
    details?: string;
  }) => void;
}

// 소켓 연결 인터페이스
export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: {
    id: number;
    email: string;
    nickname: string;
  };
}

// 소켓 서비스 상태 타입들
export interface SocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  connectionError: string | null;
  lastConnectedAt: Date | null;
  reconnectAttempts: number;
}

// 전체 소켓 상태 (알림 구독은 서버에서 자동 처리하므로 관련 상태 제거)
export interface SocketState extends SocketConnectionState {
  // 소켓 인스턴스
  socket: any; // Socket 타입은 나중에 import

  // 액션들
  connect: () => Promise<void>;
  disconnect: () => void;

  // 토큰 재발급 관련
  handleAuthError: () => Promise<boolean>; // true면 재연결 성공, false면 실패

  // 리셋
  reset: () => void;
}
