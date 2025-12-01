import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Tokens, LoginRequest, SignUpRequest } from '../types/auth';
import { AuthService } from '../services/authService';
import { ApiError, handleApiError } from '../utils/apiErrors';
import { DeviceUtils } from '../utils/deviceUtils';
import { useTokenStore, setTokens as tokenStoreSetTokens, clearTokens as tokenStoreClearTokens } from './tokenStore';
import { connectSocketAfterLogin, disconnectSocketAfterLogout } from '../utils/socketInitializer';

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
  set: (newState: Partial<AuthState>) => void;
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

      setTokens: (tokens: Tokens) => {
        set({ tokens });
        tokenStoreSetTokens(tokens);
      },

      login: (user: User, tokens: Tokens) => {
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false
        });
        tokenStoreSetTokens(tokens);
      },

      logout: async () => {
        try {
          const deviceId = await DeviceUtils.getDeviceId();
          const refreshToken = getRefreshToken();

          // 리프레시 토큰이 없으면 서버 요청 생략 (클라이언트 사이드 정리만 수행)
          if (!refreshToken) {
          } else {
            await AuthService.logout({ refreshToken, deviceId });
          }
        } catch (error) {
          console.error('Logout API error:', error);
        } finally {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false
          });
          tokenStoreClearTokens();

          // 로그아웃 시 소켓 연결 해제
          disconnectSocketAfterLogout();
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
          tokenStoreSetTokens(tokens);

          // 로그인 성공 시 소켓 재연결
          try {
            await connectSocketAfterLogin();
          } catch (error) {
            console.error('로그인 후 소켓 연결 실패:', error);
            // 로그인 성공 자체는 유지
          }

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

      set: (newState) => set(newState),
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

// 편의 함수들 (tokenStore에서 가져오도록 변경)
export const getAccessToken = () => useTokenStore.getState().tokens?.accessToken;
export const getRefreshToken = () => useTokenStore.getState().tokens?.refreshToken;
export const isUserAuthenticated = () => useAuthStore.getState().isAuthenticated;

// 토큰 관리 함수들 (tokenStore 위임)
export const setAccessToken = (accessToken: string) => {
  useTokenStore.getState().setAccessToken(accessToken);
};

export const clearTokens = async () => {
  useAuthStore.getState().clearAuth();
  tokenStoreClearTokens();
};
