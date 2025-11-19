import { useState, useEffect, useCallback } from 'react';
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

  // Props 변경 시 동기화
  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialLikeCount);
  }, [initialLiked, initialLikeCount]);

  useEffect(() => {
    setIsBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  const toggleLike = useCallback(async () => {
    if (isLikeLoading) return;

    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;
    const newLikeState = !isLiked;

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
  }, [shortId, isLiked, likeCount, isLikeLoading]);

  const toggleBookmark = useCallback(async () => {
    if (isBookmarkLoading) return;

    const originalIsBookmarked = isBookmarked;
    const newBookmarkState = !isBookmarked;

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
  }, [shortId, isBookmarked, isBookmarkLoading]);

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
