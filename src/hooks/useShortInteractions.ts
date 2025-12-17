import { useState, useEffect, useCallback, useRef } from 'react';
import { CutService } from '../services/cutService';

interface UseShortInteractionsProps {
  shortId: number;
  initialLiked: boolean;
  initialLikeCount: number;
  initialBookmarked: boolean;
}

export const useShortInteractions = ({
  shortId,
  initialLiked,
  initialLikeCount,
  initialBookmarked,
}: UseShortInteractionsProps) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // 🔥 ref로 최신 상태 추적 (의존성 배열 최소화)
  const stateRef = useRef({
    isLiked,
    likeCount,
    isLikeLoading,
    isBookmarked,
    isBookmarkLoading,
  });

  // 🔥 ref 동기화
  useEffect(() => {
    stateRef.current = {
      isLiked,
      likeCount,
      isLikeLoading,
      isBookmarked,
      isBookmarkLoading,
    };
  });

  // Props 변경 시 동기화
  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialLikeCount);
  }, [initialLiked, initialLikeCount]);

  useEffect(() => {
    setIsBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  // 🔥 최적화: 의존성 배열에서 상태 제거
  const toggleLike = useCallback(async () => {
    const state = stateRef.current;
    if (state.isLikeLoading) return;

    const originalIsLiked = state.isLiked;
    const originalLikeCount = state.likeCount;
    const newLikeState = !state.isLiked;

    setIsLiked(newLikeState);
    setLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    setIsLikeLoading(true);

    try {
      const response = await CutService.toggleShortLike(shortId);
      setIsLiked(response.data.is_liked);
      setLikeCount(response.data.like_count);
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);
    } finally {
      setIsLikeLoading(false);
    }
  }, [shortId]); // 🔥 shortId만 의존

  // 🔥 최적화: 의존성 배열에서 상태 제거
  const toggleBookmark = useCallback(async () => {
    const state = stateRef.current;
    if (state.isBookmarkLoading) return;

    const originalIsBookmarked = state.isBookmarked;
    const newBookmarkState = !state.isBookmarked;

    setIsBookmarked(newBookmarkState);
    setIsBookmarkLoading(true);

    try {
      const response = await CutService.toggleShortBookmark(shortId);
      setIsBookmarked(response.data.is_bookmarked);
    } catch (error) {
      console.error('북마크 토글 실패:', error);
      setIsBookmarked(originalIsBookmarked);
    } finally {
      setIsBookmarkLoading(false);
    }
  }, [shortId]); // 🔥 shortId만 의존

  return {
    isLiked,
    likeCount,
    isLikeLoading,
    isBookmarked,
    isBookmarkLoading,
    toggleLike,
    toggleBookmark,
  };
};