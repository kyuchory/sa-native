import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LIGHT_COLORS } from '../themes/light-colors';
import { DARK_COLORS } from '../themes/dark-colors';

// 색상 타입을 유연하게 정의
type ThemeColors = Record<string, string>;

interface ThemeStore {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDark: false, // 초기값: 라이트 모드
      colors: LIGHT_COLORS,

      toggleTheme: () => {
        const isDark = !get().isDark;
        const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
        set({ isDark, colors });
      },

      setTheme: (isDark: boolean) => {
        const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
        set({ isDark, colors });
      },
    }),
    {
      name: 'theme-storage', // AsyncStorage 키
      partialize: (state) => ({ isDark: state.isDark }), // isDark만 저장
    }
  )
);

// 편의를 위한 hooks
export const useColors = () => useThemeStore((state) => state.colors);
export const useIsDark = () => useThemeStore((state) => state.isDark);
export const useToggleTheme = () => useThemeStore((state) => state.toggleTheme);
