import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from '../services/notificationService';
import { useAuthStore } from './authStore';
import { Notification } from '../types/notification';

interface NotificationState {
  // 상태
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  lastUpdated: Date | null;

  // 포그라운드 푸시 알림 상태
  foregroundNotification: { id: string; title: string; body: string; data?: any } | null;

  // 액션
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (notificationId: number) => void;
  markAllNotificationsAsRead: () => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  loadNotifications: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  setLoading: (loading: boolean) => void;

  // 포그라운드 알림 액션
  showForegroundNotification: (title: string, body: string, data?: any) => void;
  hideForegroundNotification: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      lastUpdated: null,
      foregroundNotification: null,

      // 알림 목록 액션들
      setNotifications: (notifications: Notification[]) => set({
        notifications,
        lastUpdated: new Date()
      }),

      addNotification: (notification: Notification) => set(state => {
        // 중복 알림 체크
        const exists = state.notifications.some(n => n.id === notification.id);
        if (exists) {
          return state;
        }

        return {
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
          lastUpdated: new Date()
        };
      }),

      markNotificationAsRead: (notificationId: number) => set(state => ({
        notifications: state.notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        lastUpdated: new Date()
      })),

      markAllNotificationsAsRead: () => set(state => ({
        notifications: state.notifications.map(notification => ({
          ...notification,
          is_read: true
        })),
        unreadCount: 0,
        lastUpdated: new Date()
      })),

      // 기존 액션들 (수정됨)
      setUnreadCount: (count: number) => set({
        unreadCount: Math.max(0, count),
        lastUpdated: new Date()
      }),

      incrementUnreadCount: () => set(state => ({
        unreadCount: state.unreadCount + 1,
        lastUpdated: new Date()
      })),

      decrementUnreadCount: () => set(state => ({
        unreadCount: Math.max(0, state.unreadCount - 1),
        lastUpdated: new Date()
      })),

      resetUnreadCount: () => set({
        unreadCount: 0,
        lastUpdated: new Date()
      }),

      loadNotifications: async () => {
        const { isAuthenticated } = useAuthStore.getState();

        if (!isAuthenticated) {
          set({ notifications: [], unreadCount: 0, isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await NotificationService.getNotifications({
            limit: 50,
            offset: 0
          });

          if (response.data) {
            set({
              notifications: response.data.notifications,
              unreadCount: response.data.unread_count,
              isLoading: false,
              lastUpdated: new Date()
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('❌ NotificationStore: 알림 목록 로드 실패:', error);
          set({ isLoading: false });
        }
      },

      loadUnreadCount: async () => {
        const { isAuthenticated } = useAuthStore.getState();

        if (!isAuthenticated) {
          set({ unreadCount: 0, isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await NotificationService.getUnreadCount();

          if (response.code === 200 && response.data) {
            set({
              unreadCount: response.data.unread_count,
              isLoading: false,
              lastUpdated: new Date()
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('❌ NotificationStore: 읽지않은 알림 개수 로드 실패:', error);
          set({ isLoading: false });
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // 포그라운드 알림 표시
      showForegroundNotification: (title: string, body: string, data?: any) =>
        set({
          foregroundNotification: {
            id: Date.now().toString(),
            title,
            body,
            data
          }
        }),

      // 포그라운드 알림 숨김
      hideForegroundNotification: () => set({ foregroundNotification: null }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        lastUpdated: state.lastUpdated
      }),
    }
  )
);

// 편의 함수들
export const loadNotifications = () => useNotificationStore.getState().loadNotifications();
export const loadUnreadNotificationCount = () => useNotificationStore.getState().loadUnreadCount();
export const setUnreadNotificationCount = (count: number) => useNotificationStore.getState().setUnreadCount(count);
export const incrementUnreadNotificationCount = () => useNotificationStore.getState().incrementUnreadCount();
export const decrementUnreadNotificationCount = () => useNotificationStore.getState().decrementUnreadCount();
export const resetUnreadNotificationCount = () => useNotificationStore.getState().resetUnreadCount();
export const addNotification = (notification: Notification) => useNotificationStore.getState().addNotification(notification);
export const markNotificationAsRead = (notificationId: number) => useNotificationStore.getState().markNotificationAsRead(notificationId);
export const markAllNotificationsAsRead = () => useNotificationStore.getState().markAllNotificationsAsRead();
