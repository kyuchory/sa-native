import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Tokens, LoginRequest, SignUpRequest } from '../types/auth';
import { AuthService } from '../services/authService';
import { ApiError, handleApiError } from '../services/apiClient';
import { DeviceUtils } from '../utils/deviceUtils';

interface AuthState {
  // 상태
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 액션
  setUser: (user: User) => void;
  setTokens: (tokens: Tokens) => void;
  login: (user: User, tokens: Tokens) => void;
  loginWithCredentials: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpRequest) => Promise<{ success: boolean; error?: string }>;
  checkEmail: (email: string) => Promise<{ success: boolean; isAvailable?: boolean; error?: string }>;
  checkNickname: (nickname: string) => Promise<{ success: boolean; isAvailable?: boolean; error?: string }>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      // 액션들
      setUser: (user: User) => set({ user }),

      setTokens: (tokens: Tokens) => set({ tokens }),

      login: (user: User, tokens: Tokens) =>
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false
        }),

      logout: async () => {
        try {
          const deviceId = await DeviceUtils.getDeviceId();
          await AuthService.logout({ deviceId });
        } catch (error) {
          console.error('Logout API error:', error);
        } finally {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      loginWithCredentials: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await AuthService.login(credentials);
          const { user, tokens } = response.data;

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false
          });

          return { success: true };
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      signUp: async (data: SignUpRequest) => {
        set({ isLoading: true });
        try {
          await AuthService.signUp(data);
          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      checkEmail: async (email: string) => {
        try {
          const response = await AuthService.checkEmail(email);
          return {
            success: true,
            isAvailable: response.data.isAvailable
          };
        } catch (error) {
          const errorMessage = handleApiError(error);
          return { success: false, error: errorMessage };
        }
      },

      checkNickname: async (nickname: string) => {
        try {
          const response = await AuthService.checkNickname(nickname);
          return {
            success: true,
            isAvailable: response.data.isAvailable
          };
        } catch (error) {
          const errorMessage = handleApiError(error);
          return { success: false, error: errorMessage };
        }
      },

      clearAuth: () => set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false
      }),
    }),
    {
      name: 'auth-storage', // AsyncStorage 키 이름
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated
      }), // 저장할 상태만 선택
    }
  )
);

// 편의 함수들
export const getAccessToken = () => useAuthStore.getState().tokens?.accessToken;
export const getRefreshToken = () => useAuthStore.getState().tokens?.refreshToken;
export const isUserAuthenticated = () => useAuthStore.getState().isAuthenticated;

// 토큰 관리 함수들 (apiClient에서 사용)
export const setAccessToken = (accessToken: string) => {
  const currentTokens = useAuthStore.getState().tokens;
  if (currentTokens) {
    useAuthStore.getState().setTokens({
      ...currentTokens,
      accessToken
    });
  }
};

export const clearTokens = async () => {
  useAuthStore.getState().clearAuth();
};
