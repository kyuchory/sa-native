import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 프로필 관련 상태 인터페이스
interface ProfileState {
  shouldRefreshProfilePosts: boolean; // 자신의 게시물 목록 새로고침 플래그
  shouldRefreshProfileFeeds: boolean; // 자신의 피드 목록 새로고침 플래그
  shouldRefreshProfileShorts: boolean; // 자신의 쇼츠 목록 새로고침 플래그
  setShouldRefreshProfilePosts: (shouldRefresh: boolean) => void;
  setShouldRefreshProfileFeeds: (shouldRefresh: boolean) => void;
  setShouldRefreshProfileShorts: (shouldRefresh: boolean) => void;
  resetProfileFlags: () => void; // 모든 플래그 초기화
}

const useProfileStore = create<ProfileState>()(
  subscribeWithSelector((set, get) => ({
    shouldRefreshProfilePosts: false,
    shouldRefreshProfileFeeds: false,
    shouldRefreshProfileShorts: false,
    setShouldRefreshProfilePosts: (shouldRefresh) => set({ shouldRefreshProfilePosts: shouldRefresh }),
    setShouldRefreshProfileFeeds: (shouldRefresh) => set({ shouldRefreshProfileFeeds: shouldRefresh }),
    setShouldRefreshProfileShorts: (shouldRefresh) => set({ shouldRefreshProfileShorts: shouldRefresh }),
    resetProfileFlags: () => set({
      shouldRefreshProfilePosts: false,
      shouldRefreshProfileFeeds: false,
      shouldRefreshProfileShorts: false
    }),
  }))
);

export default useProfileStore;
