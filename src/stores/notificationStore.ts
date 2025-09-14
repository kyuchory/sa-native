import { create } from 'zustand';
import { Alert } from 'react-native';
import { Notification, UnreadCountData, GetUnreadCountApiResponse } from '../types/notification';
import { useSocketStore } from './socketStore';
import { useAuthStore } from './authStore';
import { NotificationService } from '../services/notificationService';

interface NotificationStore {
  // 알림 상태
  notifications: Notification[];
  unreadCount: number;

  // 이벤트 리스너 등록 상태 (메모리 누수 방지)
  notificationEventListenersRegistered: boolean;

  // Actions
  initializeNotificationEvents: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;

  // 구독 관리
  subscribeToNotifications: () => void;
  subscribeToHeaderNotifications: () => void;
  unsubscribeFromNotifications: () => void;

  // 알림 관리
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  loadNotifications: (notifications: Notification[]) => void;
  removeAllNotifications: () => void;

  // Setters
  setUnreadCount: (count: number) => void;
  setNotificationEventListenersRegistered: (registered: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // 초기 상태
  notifications: [],
  unreadCount: 0,
  notificationEventListenersRegistered: false,

  // 알림 이벤트 핸들러 초기화 - /notification 네임스페이스 리스너 등록
  initializeNotificationEvents: async () => {
    // 이미 등록된 리스너가 있으면 재등록하지 않음
    if (get().notificationEventListenersRegistered) {
      console.log('🔔 NotificationStore 이벤트 리스너가 이미 등록됨');
      return;
    }

    try {
      // /notification 네임스페이스 연결 (이미 연결되어 있어야 함)
      const socket = useSocketStore.getState().getSocket('/notification');
      if (!socket) {
        throw new Error('Notification socket not connected');
      }

      useSocketStore.getState().subscribe('/notification', 'notificationStore');

      console.log('🔔 NotificationStore가 /notification 네임스페이스 이벤트 구독 시작');

      // 기존 이벤트 핸들러 제거
      socket.off('notification:new');
      socket.off('notification:subscribed');
      socket.off('notification:header_subscribed');
      socket.off('notification:unsubscribed');
      socket.off('unread_count');
      socket.off('error');

      // 알림 이벤트 핸들러 설정
      socket.on('notification:new', (notification: Notification) => {
        console.log('🔔 새 알림 수신:', notification);
        get().addNotification(notification);
      });

      socket.on('notification:subscribed', (data: any) => {
        console.log('✅ 알림 구독 성공:', data);
      });

      socket.on('notification:header_subscribed', (data: any) => {
        console.log('✅ 헤더 알림 구독 성공:', data);
      });

      // 헤더용 읽지 않은 알림 개수 수신 이벤트 핸들러
      socket.on('unread_count', (data: UnreadCountData) => {
        console.log('📨 헤더 읽지 않은 알림 개수 수신:', data.unread_count);
        get().setUnreadCount(data.unread_count);
      });

      // 팔로우 알림 이벤트 핸들러 추가
      socket.on('notification:followed', (data: any) => {
        console.log('🔔 팔로우 알림:', data);

        // Socket 데이터에서 Notification 타입으로 변환
        const notification: Notification = {
          id: data.id,
          type: data.type,
          sender: {
            id: data.sender.id,
            nickname: data.sender.nickname,
            profile_img: data.sender.profile_img || null,
          },
          message: data.message,
          reference_id: data.reference_id,
          is_read: data.is_read,
          created_at: data.created_at,
        };

        // UI에 즉시 반영
        get().addNotification(notification);
      });

      // 피드 좋아요 알림 이벤트 핸들러 추가
      socket.on('notification:feed_liked', (data: any) => {
        console.log('🔔 피드 좋아요 알림:', data);

        // Socket 데이터에서 Notification 타입으로 변환
        const notification: Notification = {
          id: data.id,
          type: data.type,
          sender: {
            id: data.sender.id,
            nickname: data.sender.nickname,
            profile_img: data.sender.profile_img || null,
          },
          message: data.message,
          reference_id: data.reference_id,
          is_read: data.is_read,
          created_at: data.created_at,
        };

        // UI에 즉시 반영
        get().addNotification(notification);
      });

      // 게시물 댓글 알림 이벤트 핸들러 추가
      socket.on('notification:post_commented', (data: any) => {
        console.log('🔔 게시물 댓글 알림:', data);

        // Socket 데이터에서 Notification 타입으로 변환
        const notification: Notification = {
          id: data.id,
          type: data.type,
          sender: {
            id: data.sender.id,
            nickname: data.sender.nickname,
            profile_img: data.sender.profile_img || null,
          },
          message: data.message,
          reference_id: data.reference_id,
          is_read: data.is_read,
          created_at: data.created_at,
        };

        // UI에 즉시 반영
        get().addNotification(notification);
      });

      // 게시물 좋아요 알림 이벤트 핸들러 추가
      socket.on('notification:post_liked', (data: any) => {
        console.log('🔔 게시물 좋아요 알림:', data);

        // Socket 데이터에서 Notification 타입으로 변환
        const notification: Notification = {
          id: data.id,
          type: data.type,
          sender: {
            id: data.sender.id,
            nickname: data.sender.nickname,
            profile_img: data.sender.profile_img || null,
          },
          message: data.message,
          reference_id: data.reference_id,
          is_read: data.is_read,
          created_at: data.created_at,
        };

        // UI에 즉시 반영
        get().addNotification(notification);
      });

      // 피드 댓글 알림 이벤트 핸들러 추가
      socket.on('notification:feed_commented', (data: any) => {
        console.log('🔔 피드 댓글 알림:', data);

        // Socket 데이터에서 Notification 타입으로 변환
        const notification: Notification = {
          id: data.id,
          type: data.type,
          sender: {
            id: data.sender.id,
            nickname: data.sender.nickname,
            profile_img: data.sender.profile_img || null,
          },
          message: data.message,
          reference_id: data.reference_id,
          is_read: data.is_read,
          created_at: data.created_at,
        };

        // UI에 즉시 반영
        get().addNotification(notification);
      });

      // 게시물 생성 알림 이벤트 핸들러 추가
      socket.on('notification:post_created', (data: any) => {
        console.log('🔔 게시물 생성 알림:', data);

        // Socket 데이터에서 Notification 타입으로 변환
        const notification: Notification = {
          id: data.id,
          type: data.type,
          sender: {
            id: data.sender.id,
            nickname: data.sender.nickname,
            profile_img: data.sender.profile_img || null,
          },
          message: data.message,
          reference_id: data.reference_id,
          is_read: data.is_read,
          created_at: data.created_at,
        };

        // UI에 즉시 반영
        get().addNotification(notification);
      });

      // 피드 생성 알림 이벤트 핸들러 추가
      socket.on('notification:feed_created', (data: any) => {
        console.log('🔔 피드 생성 알림:', data);

        // Socket 데이터에서 Notification 타입으로 변환
        const notification: Notification = {
          id: data.id,
          type: data.type,
          sender: {
            id: data.sender.id,
            nickname: data.sender.nickname,
            profile_img: data.sender.profile_img || null,
          },
          message: data.message,
          reference_id: data.reference_id,
          is_read: data.is_read,
          created_at: data.created_at,
        };

        // UI에 즉시 반영
        get().addNotification(notification);
      });

      socket.on('notification:unsubscribed', (data: any) => {
        console.log('🔔 알림 구독 해제:', data);
      });

      socket.on('error', (error: any) => {
        console.error('💥 Notification socket 에러:', error);
        switch(error.type) {
          default:
            Alert.alert('오류', error.message || '알림 서버 오류가 발생했습니다.');
        }
      });

      // 이벤트 리스너 등록 완료 표시
      get().setNotificationEventListenersRegistered(true);

    console.log('✅ NotificationStore 이벤트 핸들러 초기화 완료');
    } catch (error) {
      console.error('❌ NotificationStore 이벤트 초기화 실패:', error);
    }
  },

  // 읽지 않은 알림 개수 조회
  fetchUnreadCount: async () => {
    try {
      console.log('📨 API에서 읽지 않은 알림 개수 조회');
      const response: GetUnreadCountApiResponse = await NotificationService.getUnreadCount();

      if (response.data) {
        get().setUnreadCount(response.data.unreadCount);
        console.log('✅ 읽지 않은 알림 개수 설정:', response.data.unreadCount);
      }
    } catch (error) {
      console.error('❌ 읽지 않은 알림 개수 조회 실패:', error);
    }
  },

  // 알림 구독
  subscribeToNotifications: () => {
    const socket = useSocketStore.getState().getSocket('/notification');
    const isConnected = useSocketStore.getState().isConnected('/notification');

    if (!socket || !isConnected) {
      console.warn('🔔 알림 서버에 연결되지 않아 구독을 건너뜁니다.');
      return;
    }

    console.log('📨 알림 구독 요청');
    socket.emit('notification:subscribe');
  },

  // 헤더 알림 구독
  subscribeToHeaderNotifications: () => {
    const socket = useSocketStore.getState().getSocket('/notification');
    const isConnected = useSocketStore.getState().isConnected('/notification');

    if (!socket || !isConnected) {
      console.warn('🔔 알림 서버에 연결되지 않아 헤더 구독을 건너뜁니다.');
      return;
    }

    console.log('📨 헤더 알림 구독 요청');
    socket.emit('notification:subscribe_header');
  },

  // 알림 구독 해제
  unsubscribeFromNotifications: () => {
    const socket = useSocketStore.getState().getSocket('/notification');
    const isConnected = useSocketStore.getState().isConnected('/notification');

    if (!socket || !isConnected) {
      console.warn('🔔 알림 서버에 연결되지 있어 구독 해제를 건너뜁니다.');
      return;
    }

    console.log('📤 알림 구독 해제 요청');
    socket.emit('notification:unsubscribe');
  },

  // 알림 추가
  addNotification: (notification: Notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),

  // 읽음으로 표시
  markAsRead: (notificationId: number) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === notificationId ? { ...n, is_read: true } : n
    ),
    unreadCount: state.notifications.filter(n =>
      n.id !== notificationId && !n.is_read
    ).length
  })),

  // 모두 읽음으로 표시
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, is_read: true })),
    unreadCount: 0
  })),

  // 알림 목록 로드
  loadNotifications: (newNotifications: Notification[]) => set(() => ({
    notifications: newNotifications,
    unreadCount: newNotifications.filter(n => !n.is_read).length
  })),

  // 모든 알림 제거
  removeAllNotifications: () => set({ notifications: [], unreadCount: 0 }),

  // Setters
  setUnreadCount: (count) => set({ unreadCount: count }),
  setNotificationEventListenersRegistered: (registered) => set({ notificationEventListenersRegistered: registered })
}));
