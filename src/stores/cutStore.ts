import { create } from 'zustand';
import { ShortCategory } from '../types/cut';
import { CutService } from '../services/cutService';

interface CutStore {
  categories: ShortCategory[];
  isLoadingCategories: boolean;
  error: string | null;
  isLoaded: boolean;

  fetchCategories: () => Promise<void>;
  reset: () => void;
}

export const useCutStore = create<CutStore>((set, get) => ({
  categories: [],
  isLoadingCategories: false,
  error: null,
  isLoaded: false,

  fetchCategories: async () => {
    const { isLoaded, isLoadingCategories } = get();

    // 이미 로드되었거나 로딩중이면 중복 호출 방지
    if (isLoaded || isLoadingCategories) {
      return;
    }

    set({ isLoadingCategories: true, error: null });

    try {
      const response = await CutService.getShortCategories();
      set({
        categories: response.data,
        isLoadingCategories: false,
        isLoaded: true,
        error: null,
      });
    } catch (error: any) {
      console.error('카테고리 조회 실패:', error);
      set({
        isLoadingCategories: false,
        error: error.message || '카테고리 조회에 실패했습니다.',
      });
    }
  },

  reset: () => {
    set({
      categories: [],
      isLoadingCategories: false,
      error: null,
      isLoaded: false,
    });
  },
}));
