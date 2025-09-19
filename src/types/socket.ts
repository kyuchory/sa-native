// 소켓 관련 타입 정의
import { Socket } from 'socket.io-client';

// 네임스페이스 타입
export type SocketNamespace = '/chat' | '/notification';

// 소켓 연결 상태
export type SocketConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// 소켓 인스턴스 타입
export interface SocketInstance {
  socket: Socket | null;
  namespace: SocketNamespace;
  state: SocketConnectionState;
  lastConnectedAt: Date | null;
  reconnectAttempts: number;
}

// 소켓 이벤트 핸들러 타입
export type SocketEventHandler<T = any> = (data: T) => void;

// 소켓 연결 옵션
export interface SocketConnectionOptions {
  token: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

// 채팅 관련 이벤트 타입
export interface ChatMessage {
  id: number;
  chat_room_id: number;
  user_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  updated_at: string;
  is_read: boolean;
  temp_id?: string; // 임시 ID (전송 중인 메시지용)
  sender?: {
    id: number;
    nickname: string;
    profile_img: string | null;
  };
}

export interface ChatRoom {
  id: number;
  name: string;
  type: 'private' | 'group';
  avatar_url: string | null;
  last_message: ChatMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  members: Array<{
    id: number;
    nickname: string;
    profile_img: string | null;
  }>;
}

export interface TypingUser {
  user_id: number;
  nickname: string;
  profile_img: string | null;
}

// 채팅 이벤트 데이터 타입
export interface ChatJoinRoomData {
  chat_room_id: number;
}

export interface ChatLeaveRoomData {
  chat_room_id: number;
}

export interface ChatSendMessageData {
  chat_room_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  temp_id: string;
}

export interface ChatMessageReceiveData extends ChatMessage {}

export interface ChatMessageSentData {
  temp_id: string;
  message: ChatMessage;
}

export interface ChatTypingData {
  chat_room_id: number;
  is_typing: boolean;
}

export interface ChatUserJoinedData {
  user_id: number;
  nickname: string;
  profile_img: string | null;
  chat_room_id: number;
}

export interface ChatUserLeftData {
  user_id: number;
  nickname: string;
  chat_room_id: number;
}

export interface ChatJoinedRoomData {
  chat_room_id: number;
  message: string;
}

// 알림 관련 이벤트 타입
export interface NotificationData {
  id: number;
  type: 'followed' | 'feed_liked' | 'post_liked' | 'feed_commented' | 'post_commented' | 'feed_created' | 'post_created' | 'message';
  sender: {
    id: number;
    nickname: string;
    profile_img: string | null;
  };
  message: string;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
  // 추가 데이터 (UI 표시용)
  feed?: {
    id: number;
    content: string;
  };
  post?: {
    id: number;
    title: string;
    content: string;
  };
  comment?: {
    content: string;
    preview: string;
  };
  chatRoom?: {
    id: number;
  };
  unreadCount?: number;
}

export interface MessageBadgeData {
  type: 'message_badge';
  chatRoomId: number;
  unreadCount: number;
  updatedAt: string;
}

export interface UnreadCountData {
  unread_count: number;
  updated_at: string;
}

// 알림 구독 이벤트 데이터
export interface NotificationSubscribeData {
  userId: number;
}

export interface NotificationUnsubscribeData {
  userId: number;
}

// 소켓 에러 타입
export interface SocketError {
  message: string;
  type: 'TOKEN_EXPIRED' | 'AUTH_FAILED' | 'CONNECTION_FAILED' | 'UNKNOWN';
  code?: string | number;
}

// 토큰 갱신 결과 타입
export interface TokenRefreshResult {
  success: boolean;
  newToken?: string;
  error?: string;
}

// AppState 타입 (React Native)
export type AppStateStatus = 'active' | 'background' | 'inactive';

// 소켓 스토어 상태 타입
export interface SocketStoreState {
  // 소켓 인스턴스들
  chatSocket: SocketInstance;
  notificationSocket: SocketInstance;
  
  // 연결 상태
  isInitialized: boolean;
  isAppActive: boolean;
  
  // Actions
  initializeSockets: (token: string) => Promise<void>;
  disconnectAllSockets: () => void;
  updateToken: (newToken: string) => Promise<void>;
  reconnectAllSockets: () => Promise<void>;
  
  // 연결 상태 확인
  isConnected: (namespace: SocketNamespace) => boolean;
  getSocket: (namespace: SocketNamespace) => Socket | null;
  
  // 이벤트 구독/해제
  subscribe: (namespace: SocketNamespace, storeName: string) => void;
  unsubscribe: (namespace: SocketNamespace, storeName: string) => void;
}

// 알림 스토어 상태 타입
export interface NotificationStoreState {
  // 알림 상태
  notifications: NotificationData[];
  unreadCount: number;
  isSubscribed: boolean;
  
  // Actions
  subscribe: () => void;
  unsubscribe: () => void;
  addNotification: (notification: NotificationData) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  loadNotifications: (apiNotifications: NotificationData[]) => void;
  updateUnreadCount: (count: number) => void;
  
  // 이벤트 핸들러
  handleNotificationReceived: (notification: NotificationData) => void;
  handleMessageBadgeUpdate: (badgeData: MessageBadgeData) => void;
  handleUnreadCountUpdate: (countData: UnreadCountData) => void;
}
