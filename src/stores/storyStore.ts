import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { StoryListResponse } from '../types/story';
import { StoryService } from '../services/storyService';

// 스토리 상태 인터페이스
interface StoryState {
  // 스토리 데이터
  stories: StoryListResponse | null;
  // 로딩 상태
  loading: boolean;
  // 에러 메시지
  error: string | null;
}

interface StoryActions {
  // 스토리 목록 로드
  loadStories: () => Promise<void>;
  // 에러 초기화
  clearError: () => void;
  // 데이터 리셋 (필요시)
  resetStories: () => void;
}

type StoryStore = StoryState & StoryActions;

// Zustand 스토어 생성
const useStoryStore = create<StoryStore>()(
  subscribeWithSelector((set, get) => ({
    // 초기 상태
    stories: null,
    loading: false,
    error: null,

    // 액션들
    loadStories: async () => {
      // 이미 로딩 중이면 무시
      if (get().loading) return;

      // 로딩 시작 (데이터는 유지)
      set({ loading: true, error: null });

      try {
        const response = await StoryService.getStories();
        // 성공: 데이터 교체 및 로딩 종료
        set({ stories: response, loading: false });
      } catch (error) {
        console.error('스토리 로드 실패:', error);
        set({
          error: error instanceof Error ? error.message : '스토리 로드 실패',
          loading: false,
        });
        // 에러 시에도 기존 데이터 유지
      }
    },

    clearError: () => {
      set({ error: null });
    },

    resetStories: () => {
      set({ stories: null, loading: false, error: null });
    },
  }))
);

export default useStoryStore;
