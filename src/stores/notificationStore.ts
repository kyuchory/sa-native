import { create } from 'zustand';
import { Alert } from 'react-native';
import { useSocketStore } from './socketStore';

interface Notification {
  id: number;
  type: 'friend_request' | 'message_mention' | 'post_like' | 'feed_comment' | 'system';
  title: string;
  message: string;
  senderId?: number;
  senderNickname?: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationStore {
  // 알림 관련 상태
  notifications: Notification[];
  unreadCount: number;

  // Actions
  initializeNotificationEvents: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: number) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // 초기 상태
  notifications: [],
  unreadCount: 0,

  // 알림 이벤트 핸들러 초기화
  initializeNotificationEvents: async () => {
    try {
      // /notification 네임스페이스 연결 및 구독
      const socket = await useSocketStore.getState().connect('/notification');
      useSocketStore.getState().subscribe('/notification', 'notificationStore');

      console.log('🔔 NotificationStore가 /notification 네임스페이스 이벤트 구독 시작');

      // 기존 이벤트 핸들러 제거
      socket.off('notification:friend_request');
      socket.off('notification:message_mention');
      socket.off('notification:post_like');
      socket.off('notification:feed_comment');
      socket.off('notification:system');

      // 친구 요청 알림 이벤트
      socket.on('notification:friend_request', (data: any) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'friend_request',
          title: '새로운 친구 요청',
          message: `${data.senderNickname}님이 친구 요청을 보냈습니다.`,
          senderId: data.senderId,
          senderNickname: data.senderNickname,
          isRead: false,
          createdAt: new Date().toISOString(),
          data: { friendRequestId: data.friendRequestId }
        };
        get().addNotification(notification);
      });

      // 메시지 멘션 알림 이벤트
      socket.on('notification:message_mention', (data: any) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'message_mention',
          title: '멘션 알림',
          message: `${data.senderNickname}님이 채팅에서 회원님을 멘션했습니다.`,
          senderId: data.senderId,
          senderNickname: data.senderNickname,
          isRead: false,
          createdAt: new Date().toISOString(),
          data: { chatRoomId: data.chatRoomId, messageId: data.messageId }
        };
        get().addNotification(notification);
        Alert.alert('멘션 알림', `${data.senderNickname}님이 회원님을 멘션했습니다.`);
      });

      // 포스트 좋아요 알림 이벤트
      socket.on('notification:post_like', (data: any) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'post_like',
          title: '좋아요 알림',
          message: `${data.senderNickname}님이 회원님의 ${data.postType}을 좋아합니다.`,
          senderId: data.senderId,
          senderNickname: data.senderNickname,
          isRead: false,
          createdAt: new Date().toISOString(),
          data: { postId: data.postId, postType: data.postType }
        };
        get().addNotification(notification);
      });

      // 피드 댓글 알림 이벤트
      socket.on('notification:feed_comment', (data: any) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'feed_comment',
          title: '댓글 알림',
          message: `${data.senderNickname}님이 회원님의 ${data.feedType}에 댓글을 달았습니다.`,
          senderId: data.senderId,
          senderNickname: data.senderNickname,
          isRead: false,
          createdAt: new Date().toISOString(),
          data: { feedId: data.feedId, feedType: data.feedType, commentId: data.commentId }
        };
        get().addNotification(notification);
      });

      // 시스템 알림 이벤트
      socket.on('notification:system', (data: any) => {
        const notification: Notification = {
          id: Date.now(),
          type: 'system',
          title: data.title || '시스템 알림',
          message: data.message,
          isRead: false,
          createdAt: new Date().toISOString(),
          data: data.additionalData
        };
        get().addNotification(notification);
        Alert.alert('시스템 알림', data.message);
      });

      console.log('✅ NotificationStore 이벤트 핸들러 초기화 완료');
    } catch (error) {
      console.error('❌ NotificationStore 이벤트 초기화 실패:', error);
    }
  },

  // 알림 추가
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications].slice(0, 100),
    unreadCount: state.unreadCount + 1
  })),

  // 알림 읽음 처리
  markAsRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map(notif =>
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),

  // 모든 알림 읽음 처리
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(notif => ({ ...notif, isRead: true })),
    unreadCount: 0
  })),

  // 알림 제거
  removeNotification: (notificationId) => set((state) => {
    const notificationToRemove = state.notifications.find(notif => notif.id === notificationId);
    const newUnreadCount = notificationToRemove && !notificationToRemove.isRead
      ? Math.max(0, state.unreadCount - 1)
      : state.unreadCount;

    return {
      notifications: state.notifications.filter(notif => notif.id !== notificationId),
      unreadCount: newUnreadCount
    };
  }),

  // 모든 알림 제거
  clearAll: () => set({
    notifications: [],
    unreadCount: 0
  })
}));
