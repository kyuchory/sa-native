import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 피드 목록 리프레시 상태 인터페이스
interface FeedState {
  // 목록 새로고침 필요 여부
  shouldRefreshFeeds: boolean;

  // 피드 목록 새로고침 필요 여부
  shouldRefreshProfilePosts: boolean;

  // 비디오 편집 결과 (로컬 데이터 - 통합 업로드용)
  videoEditResult: {
    videoUri: string;
    editInfo: {
      trimStart: number;
      trimEnd: number;
      cropArea: { x: number; y: number; width: number; height: number };
    };
  } | null;

  // 액션들
  setShouldRefreshFeeds: (shouldRefresh: boolean) => void;
  setShouldRefreshProfilePosts: (shouldRefresh: boolean) => void;
  setVideoEditResult: (result: FeedState['videoEditResult']) => void;
}

// Redux devtools를 위한 미들웨어 추가
const useFeedStore = create<FeedState>()(
  subscribeWithSelector((set) => ({
    // 초기 상태
    shouldRefreshFeeds: false,
    shouldRefreshProfilePosts: false,
    videoEditResult: null,

    // 액션들
    setShouldRefreshFeeds: (shouldRefresh) =>
      set({ shouldRefreshFeeds: shouldRefresh }),
    setShouldRefreshProfilePosts: (shouldRefresh) =>
      set({ shouldRefreshProfilePosts: shouldRefresh }),
    setVideoEditResult: (result: FeedState['videoEditResult']) =>
      set({ videoEditResult: result }),
  }))
);

export default useFeedStore;
