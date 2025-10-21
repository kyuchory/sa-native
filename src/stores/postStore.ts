import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 게시물 목록 리프레시 상태 인터페이스
interface PostState {
  // 목록 새로고침 필요 여부
  shouldRefreshPosts: boolean;
  // 선택된 카테고리/서브카테고리
  selectedCategoryId?: number;
  selectedSubcategoryId?: number;
  // 비디오 편집 결과
  videoEditResult: {
    videoPath: string;
    videoUrl: string;
    thumbnailPath: string;
    thumbnailUrl: string;
  } | null;

  // 액션들
  setShouldRefreshPosts: (shouldRefresh: boolean) => void;
  setSelectedCategory: (categoryId?: number, subcategoryId?: number) => void;
  setVideoEditResult: (result: PostState['videoEditResult']) => void;
}

// Redux devtools를 위한 미들웨어 추가
const usePostStore = create<PostState>()(
  subscribeWithSelector((set) => ({
    // 초기 상태
    shouldRefreshPosts: false,
    selectedCategoryId: undefined,
    selectedSubcategoryId: undefined,
    videoEditResult: null,

    // 액션들
    setShouldRefreshPosts: (shouldRefresh) =>
      set({ shouldRefreshPosts: shouldRefresh }),

    setSelectedCategory: (selectedCategoryId, selectedSubcategoryId) =>
      set({
        selectedCategoryId,
        selectedSubcategoryId,
        shouldRefreshPosts: false // 카테고리 변경 시에는 리프레시 false
      }),

    setVideoEditResult: (videoEditResult) =>
      set({ videoEditResult }),
  }))
);

export default usePostStore;
