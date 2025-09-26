import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS } from '../themes/light-colors';
import { DARK_COLORS } from '../themes/dark-colors';

// 색상 타입을 유연하게 정의
type ThemeColors = Record<string, string>;
type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeStore {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      themeMode: 'light', // 초기값: 라이트 모드
      isDark: false, // 초기값: 라이트 모드
      colors: LIGHT_COLORS,

      toggleTheme: () => {
        try {
          const isDark = !get().isDark;
          const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
          set({ isDark, colors });
        } catch (error) {
          console.warn('테마 토글 중 오류 발생:', error);
        }
      },

      setTheme: (isDark: boolean) => {
        try {
          const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
          set({ isDark, colors });
        } catch (error) {
          console.warn('테마 설정 중 오류 발생:', error);
        }
      },

      setThemeMode: (mode: ThemeMode) => {
        try {
          let isDark: boolean;
          let colors: ThemeColors;

          switch (mode) {
            case 'system':
              // 시스템 모드는 아직 지원하지 않으므로 라이트 모드로 설정
              isDark = false;
              colors = LIGHT_COLORS;
              break;
            case 'light':
              isDark = false;
              colors = LIGHT_COLORS;
              break;
            case 'dark':
              isDark = true;
              colors = DARK_COLORS;
              break;
            default:
              isDark = false;
              colors = LIGHT_COLORS;
          }

          set({ themeMode: mode, isDark, colors });
        } catch (error) {
          console.warn('테마 모드 설정 중 오류 발생:', error);
        }
      },
    }),
    {
      name: 'theme-storage', // AsyncStorage 키
      storage: createJSONStorage(() => AsyncStorage), // React Native AsyncStorage 명시적 지정
      partialize: (state) => ({ themeMode: state.themeMode, isDark: state.isDark }), // themeMode와 isDark 저장
      onRehydrateStorage: () => (state) => {
        // 저장된 데이터가 없거나 오류가 있을 때 기본값으로 초기화
        if (!state) {
          console.warn('테마 저장소 복원 실패, 기본값으로 초기화');
          return;
        }
        // 테마 모드에 따라 색상 동기화
        const { themeMode } = state;
        if (themeMode === 'dark') {
          state.colors = DARK_COLORS;
        } else {
          state.colors = LIGHT_COLORS;
        }
      },
    }
  )
);

// 편의를 위한 hooks
export const useColors = () => useThemeStore((state) => state.colors);
export const useIsDark = () => useThemeStore((state) => state.isDark);
export const useToggleTheme = () => useThemeStore((state) => state.toggleTheme);
