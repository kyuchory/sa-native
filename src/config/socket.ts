// 소켓 설정
import { API_CONFIG } from './api';

export const SOCKET_CONFIG = {
  // 개발 환경
  development: {
    chatUrl: API_CONFIG.development.wsBaseURL,
    notificationUrl: API_CONFIG.development.wsBaseURL,
    options: {
      // 재연결 설정
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      
      // 연결 설정
      transports: ['websocket', 'polling'],
      upgrade: true,
      
      // 인증 설정
      auth: {
        token: '', // 런타임에 설정
      },
    },
  },
  
  // 프로덕션 환경
  production: {
    chatUrl: API_CONFIG.production.wsBaseURL,
    notificationUrl: API_CONFIG.production.wsBaseURL,
    options: {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      upgrade: true,
      auth: {
        token: '',
      },
    },
  },
};

// 환경별 설정 가져오기
export const getSocketConfig = () => {
  return __DEV__ ? SOCKET_CONFIG.development : SOCKET_CONFIG.production;
};

// 네임스페이스 경로
export const SOCKET_NAMESPACES = {
  CHAT: '/chat',
  NOTIFICATION: '/notification',
} as const;

// 소켓 이벤트 타입
export const SOCKET_EVENTS = {
  // 연결 이벤트
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  
  // 채팅 이벤트
  CHAT_JOIN_ROOM: 'join_room',
  CHAT_LEAVE_ROOM: 'leave_room',
  CHAT_MESSAGE_SEND: 'message:send',
  CHAT_MESSAGE_RECEIVE: 'message:receive',
  CHAT_MESSAGE_SENT: 'message:sent',
  CHAT_TYPING_START: 'typing:start',
  CHAT_TYPING_STOP: 'typing:stop',
  CHAT_USER_JOINED: 'user_joined',
  CHAT_USER_LEFT: 'user_left',
  CHAT_JOINED_ROOM: 'joined_room',
  
  // 알림 이벤트
  NOTIFICATION_SUBSCRIBE: 'notification:subscribe',
  NOTIFICATION_UNSUBSCRIBE: 'notification:unsubscribe',
  NOTIFICATION_SUBSCRIBED: 'notification:subscribed',
  NOTIFICATION_UNSUBSCRIBED: 'notification:unsubscribed',
  NOTIFICATION_FOLLOWED: 'notification:followed',
  NOTIFICATION_FEED_LIKED: 'notification:feed_liked',
  NOTIFICATION_POST_LIKED: 'notification:post_liked',
  NOTIFICATION_FEED_COMMENTED: 'notification:feed_commented',
  NOTIFICATION_POST_COMMENTED: 'notification:post_commented',
  NOTIFICATION_FEED_CREATED: 'notification:feed_created',
  NOTIFICATION_POST_CREATED: 'notification:post_created',
  NOTIFICATION_MESSAGE: 'notification:message',
  NOTIFICATION_MESSAGE_BADGE: 'notification:message_badge',
  NOTIFICATION_UNREAD_COUNT: 'unread_count',
} as const;

// 재연결 전략 설정
export const RECONNECT_STRATEGY = {
  // 기본 재연결 시도 횟수
  MAX_ATTEMPTS: 5,
  
  // 재연결 간격 (ms)
  DELAY: 1000,
  MAX_DELAY: 5000,
  
  // 백업 재연결 간격 (AppState 기반)
  BACKUP_DELAY: 2000,
  
  // 연결 타임아웃 (ms)
  CONNECTION_TIMEOUT: 20000,
} as const;
