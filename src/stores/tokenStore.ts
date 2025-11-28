import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tokens } from '../types/auth';

interface TokenState {
  tokens: Tokens | null;
  setTokens: (tokens: Tokens) => void;
  setAccessToken: (accessToken: string) => void;
  clearTokens: () => void;
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      tokens: null,

      // 액션들
      setTokens: (tokens: Tokens) => set({ tokens }),

      setAccessToken: (accessToken: string) =>
        set((state) => ({
          tokens: state.tokens ? { ...state.tokens, accessToken } : null
        })),

      clearTokens: () => set({ tokens: null }),
    }),
    {
      name: 'token-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tokens: state.tokens }),
    }
  )
);

// 편의 함수들 (apiClient에서 사용)
export const getAccessToken = () => useTokenStore.getState().tokens?.accessToken;
export const getRefreshToken = () => useTokenStore.getState().tokens?.refreshToken;
export const setAccessToken = (accessToken: string) => useTokenStore.getState().setAccessToken(accessToken);
export const setTokens = (tokens: Tokens) => useTokenStore.getState().setTokens(tokens);
export const clearTokens = () => useTokenStore.getState().clearTokens();
