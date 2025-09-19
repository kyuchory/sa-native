// 알림 상태 관리 스토어
import { create } from 'zustand';
import { 
  NotificationStoreState, 
  NotificationData, 
  MessageBadgeData, 
  UnreadCountData 
} from '../types/socket';
import { SOCKET_EVENTS, SOCKET_NAMESPACES } from '../config/socket';
import { useSocketStore } from './socketStore';

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  // 초기 상태
  notifications: [],
  unreadCount: 0,
  isSubscribed: false,

  // 알림 구독
  subscribe: () => {
    const state = get();
    
    if (state.isSubscribed) {
      console.log('이미 알림을 구독하고 있습니다.');
      return;
    }

    const socket = useSocketStore.getState().getSocket(SOCKET_NAMESPACES.NOTIFICATION);
    
    if (!socket) {
      console.error('알림 소켓이 연결되지 않았습니다.');
      return;
    }

    console.log('🔔 알림 구독 시작...');
    
    // 서버에 구독 요청
    socket.emit(SOCKET_EVENTS.NOTIFICATION_SUBSCRIBE);
    
    // 이벤트 리스너 설정
    setupNotificationEventListeners(socket);
    
    set({ isSubscribed: true });
  },

  // 알림 구독 해제
  unsubscribe: () => {
    const state = get();
    
    if (!state.isSubscribed) {
      console.log('구독 중이 아닙니다.');
      return;
    }

    const socket = useSocketStore.getState().getSocket(SOCKET_NAMESPACES.NOTIFICATION);
    
    if (socket) {
      console.log('🔔 알림 구독 해제...');
      
      // 서버에 구독 해제 요청
      socket.emit(SOCKET_EVENTS.NOTIFICATION_UNSUBSCRIBE);
      
      // 이벤트 리스너 제거
      removeNotificationEventListeners(socket);
    }
    
    set({ 
      isSubscribed: false,
      notifications: [],
      unreadCount: 0,
    });
  },

  // 알림 추가
  addNotification: (notification: NotificationData) => {
    const state = get();
    
    // 중복 알림 방지 (같은 ID가 있으면 업데이트)
    const existingIndex = state.notifications.findIndex(n => n.id === notification.id);
    
    if (existingIndex >= 0) {
      // 기존 알림 업데이트
      const updatedNotifications = [...state.notifications];
      updatedNotifications[existingIndex] = notification;
      
      set({ notifications: updatedNotifications });
    } else {
      // 새 알림 추가 (최신순으로 정렬)
      const newNotifications = [notification, ...state.notifications];
      
      set({ 
        notifications: newNotifications,
        unreadCount: state.unreadCount + 1,
      });
    }
    
    console.log(`📨 새 알림 추가: ${notification.type} - ${notification.message}`);
  },

  // 알림 읽음 처리
  markAsRead: (notificationId: number) => {
    const state = get();
    
    const notification = state.notifications.find(n => n.id === notificationId);
    if (!notification || notification.is_read) {
      return;
    }
    
    const updatedNotifications = state.notifications.map(n => 
      n.id === notificationId 
        ? { ...n, is_read: true }
        : n
    );
    
    const newUnreadCount = Math.max(0, state.unreadCount - 1);
    
    set({ 
      notifications: updatedNotifications,
      unreadCount: newUnreadCount,
    });
    
    console.log(`✅ 알림 읽음 처리: ${notificationId}`);
  },

  // 모든 알림 읽음 처리
  markAllAsRead: () => {
    const state = get();
    
    const updatedNotifications = state.notifications.map(n => ({ ...n, is_read: true }));
    
    set({ 
      notifications: updatedNotifications,
      unreadCount: 0,
    });
    
    console.log('✅ 모든 알림 읽음 처리');
  },

  // 알림 목록 초기화
  clearNotifications: () => {
    set({ 
      notifications: [],
      unreadCount: 0,
    });
    
    console.log('🗑️ 알림 목록 초기화');
  },

  // API로 알림 목록 로드 (초기 데이터용)
  loadNotifications: (apiNotifications: NotificationData[]) => {
    set({ 
      notifications: apiNotifications,
      unreadCount: apiNotifications.filter(n => !n.is_read).length,
    });
    
    console.log(`📋 API로 알림 목록 로드: ${apiNotifications.length}개`);
  },

  // 읽지 않은 알림 개수 업데이트
  updateUnreadCount: (count: number) => {
    set({ unreadCount: count });
    console.log(`🔔 읽지 않은 알림 개수 업데이트: ${count}`);
  },

  // 알림 수신 이벤트 핸들러
  handleNotificationReceived: (notification: NotificationData) => {
    console.log('📨 알림 수신:', notification);
    get().addNotification(notification);
  },

  // 메시지 배지 업데이트 이벤트 핸들러
  handleMessageBadgeUpdate: (badgeData: MessageBadgeData) => {
    console.log('🔔 메시지 배지 업데이트:', badgeData);
    // 메시지 배지 업데이트는 별도 처리 (채팅 스토어에서 관리)
  },

  // 읽지 않은 알림 개수 업데이트 이벤트 핸들러
  handleUnreadCountUpdate: (countData: UnreadCountData) => {
    console.log('🔔 읽지 않은 알림 개수 업데이트:', countData);
    get().updateUnreadCount(countData.unread_count);
  },
}));

// 알림 이벤트 리스너 설정
const setupNotificationEventListeners = (socket: any) => {
  const store = useNotificationStore.getState();
  
  // 구독 성공 응답
  socket.on(SOCKET_EVENTS.NOTIFICATION_SUBSCRIBED, (data: any) => {
    console.log('✅ 알림 구독 성공:', data);
  });

  // 구독 해제 성공 응답
  socket.on(SOCKET_EVENTS.NOTIFICATION_UNSUBSCRIBED, (data: any) => {
    console.log('✅ 알림 구독 해제 성공:', data);
  });

  // 팔로우 알림
  socket.on(SOCKET_EVENTS.NOTIFICATION_FOLLOWED, (notification: NotificationData) => {
    store.handleNotificationReceived(notification);
  });

  // 피드 좋아요 알림
  socket.on(SOCKET_EVENTS.NOTIFICATION_FEED_LIKED, (notification: NotificationData) => {
    store.handleNotificationReceived(notification);
  });

  // 포스트 좋아요 알림
  socket.on(SOCKET_EVENTS.NOTIFICATION_POST_LIKED, (notification: NotificationData) => {
    store.handleNotificationReceived(notification);
  });

  // 피드 댓글 알림
  socket.on(SOCKET_EVENTS.NOTIFICATION_FEED_COMMENTED, (notification: NotificationData) => {
    store.handleNotificationReceived(notification);
  });

  // 포스트 댓글 알림
  socket.on(SOCKET_EVENTS.NOTIFICATION_POST_COMMENTED, (notification: NotificationData) => {
    store.handleNotificationReceived(notification);
  });

  // 피드 작성 알림
  socket.on(SOCKET_EVENTS.NOTIFICATION_FEED_CREATED, (notification: NotificationData) => {
    store.handleNotificationReceived(notification);
  });

  // 포스트 작성 알림
  socket.on(SOCKET_EVENTS.NOTIFICATION_POST_CREATED, (notification: NotificationData) => {
    store.handleNotificationReceived(notification);
  });

  // 메시지 알림
  socket.on(SOCKET_EVENTS.NOTIFICATION_MESSAGE, (notification: NotificationData) => {
    store.handleNotificationReceived(notification);
  });

  // 메시지 배지 업데이트
  socket.on(SOCKET_EVENTS.NOTIFICATION_MESSAGE_BADGE, (badgeData: MessageBadgeData) => {
    store.handleMessageBadgeUpdate(badgeData);
  });

  // 읽지 않은 알림 개수 업데이트
  socket.on(SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, (countData: UnreadCountData) => {
    store.handleUnreadCountUpdate(countData);
  });
};

// 알림 이벤트 리스너 제거
const removeNotificationEventListeners = (socket: any) => {
  // 모든 알림 관련 이벤트 리스너 제거
  const events = [
    SOCKET_EVENTS.NOTIFICATION_SUBSCRIBED,
    SOCKET_EVENTS.NOTIFICATION_UNSUBSCRIBED,
    SOCKET_EVENTS.NOTIFICATION_FOLLOWED,
    SOCKET_EVENTS.NOTIFICATION_FEED_LIKED,
    SOCKET_EVENTS.NOTIFICATION_POST_LIKED,
    SOCKET_EVENTS.NOTIFICATION_FEED_COMMENTED,
    SOCKET_EVENTS.NOTIFICATION_POST_COMMENTED,
    SOCKET_EVENTS.NOTIFICATION_FEED_CREATED,
    SOCKET_EVENTS.NOTIFICATION_POST_CREATED,
    SOCKET_EVENTS.NOTIFICATION_MESSAGE,
    SOCKET_EVENTS.NOTIFICATION_MESSAGE_BADGE,
    SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT,
  ];

  events.forEach(event => {
    socket.off(event);
  });
  
  console.log('🧹 알림 이벤트 리스너 제거 완료');
};
