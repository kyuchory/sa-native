import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 피드 목록 리프레시 상태 인터페이스
interface FeedState {
  // 목록 새로고침 필요 여부
  shouldRefreshFeeds: boolean;

  // 액션들
  setShouldRefreshFeeds: (shouldRefresh: boolean) => void;
}

// Redux devtools를 위한 미들웨어 추가
const useFeedStore = create<FeedState>()(
  subscribeWithSelector((set) => ({
    // 초기 상태
    shouldRefreshFeeds: false,

    // 액션들
    setShouldRefreshFeeds: (shouldRefresh) =>
      set({ shouldRefreshFeeds: shouldRefresh }),
  }))
);

export default useFeedStore;
