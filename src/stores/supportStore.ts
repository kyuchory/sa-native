import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 고객센터 문의 상태 인터페이스
interface SupportState {
  // 목록 새로고침 필요 여부
  shouldRefreshInquiries: boolean;

  // 액션들
  setShouldRefreshInquiries: (shouldRefresh: boolean) => void;
}

// Redux devtools를 위한 미들웨어 추가
const useSupportStore = create<SupportState>()(
  subscribeWithSelector((set) => ({
    // 초기 상태
    shouldRefreshInquiries: false,

    // 액션들
    setShouldRefreshInquiries: (shouldRefresh) =>
      set({ shouldRefreshInquiries: shouldRefresh }),
  }))
);

export default useSupportStore;
