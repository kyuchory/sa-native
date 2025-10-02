import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatService } from '../services/chatService';
import { useAuthStore } from './authStore';

interface ChatState {
  // 상태
  unreadCount: number;
  isLoading: boolean;
  lastUpdated: Date | null;

  // 액션
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  loadUnreadCount: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      unreadCount: 0,
      isLoading: false,
      lastUpdated: null,

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

      loadUnreadCount: async () => {
        const { isAuthenticated } = useAuthStore.getState();

        if (!isAuthenticated) {
          set({ unreadCount: 0, isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await ChatService.getUnreadChatCount();

          if (response) {
            set({
              unreadCount: response.unread_count,
              isLoading: false,
              lastUpdated: new Date()
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('❌ ChatStore: 읽지 않은 채팅방 개수 로드 실패:', error);
          set({ isLoading: false });
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        unreadCount: state.unreadCount,
        lastUpdated: state.lastUpdated
      }),
    }
  )
);

// 편의 함수들
export const loadChatUnreadCount = () => useChatStore.getState().loadUnreadCount();
export const setChatUnreadCount = (count: number) => useChatStore.getState().setUnreadCount(count);
export const incrementChatUnreadCount = () => useChatStore.getState().incrementUnreadCount();
export const decrementChatUnreadCount = () => useChatStore.getState().decrementUnreadCount();
export const resetChatUnreadCount = () => useChatStore.getState().resetUnreadCount();
