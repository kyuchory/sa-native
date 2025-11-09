import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type VideoAutoPlayMode = 'always' | 'wifi_only' | 'cellular_only' | 'manual';

interface VideoSettingsStore {
  autoPlayMode: VideoAutoPlayMode;
  setAutoPlayMode: (mode: VideoAutoPlayMode) => void;
}

export const useVideoSettingsStore = create<VideoSettingsStore>()(
  persist(
    (set) => ({
      autoPlayMode: 'always', // 초기값: 항상 자동 재생

      setAutoPlayMode: (mode: VideoAutoPlayMode) => {
        try {
          set({ autoPlayMode: mode });
        } catch (error) {
          console.warn('비디오 자동 재생 설정 변경 중 오류 발생:', error);
        }
      },
    }),
    {
      name: 'video-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        autoPlayMode: state.autoPlayMode,
      }),
    }
  )
);

// 편의를 위한 hooks
export const useAutoPlayMode = () => useVideoSettingsStore((state) => state.autoPlayMode);
export const useSetAutoPlayMode = () => useVideoSettingsStore((state) => state.setAutoPlayMode);
