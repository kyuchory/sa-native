import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import {
  HeartIcon,
  CommentIcon,
  BookmarkIcon,
  ShareIcon,
  UploadIcon,
  ViewIcon,
} from './CutIcons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface ShortActionButtonsProps {
  isLiked: boolean;
  likeCount: number;
  isLikeLoading: boolean;
  commentCount: number;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  viewCount: number;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onUpload: () => void;
  bottomInsets?: number;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export const ShortActionButtons = React.memo<ShortActionButtonsProps>(
  ({
    isLiked,
    likeCount,
    isLikeLoading,
    commentCount,
    isBookmarked,
    isBookmarkLoading,
    viewCount,
    onLike,
    onComment,
    onBookmark,
    onShare,
    onUpload,
    bottomInsets,
  }) => {
    // 🔥 동적 스타일 생성 (CutDetailScreen에서만 사용)
    const styles = useMemo(() => bottomInsets ? createDynamicStyles(bottomInsets) : defaultStyles, [bottomInsets]);

    return (
      <View style={styles.container}>
      {/* 좋아요 */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onLike}
        activeOpacity={0.8}
        disabled={isLikeLoading}
      >
        <View style={styles.iconContainer}>
          {isLikeLoading ? (
            <ActivityIndicator size="small" color={COLORS.ERROR} />
          ) : (
            <HeartIcon
              size={28}
              color={isLiked ? COLORS.ERROR : COLORS.WHITE}
              filled={isLiked}
            />
          )}
        </View>
        <Text style={[styles.actionText, isLikeLoading && styles.actionLoadingText]}>
          {formatCount(likeCount)}
        </Text>
      </TouchableOpacity>

      {/* 댓글 */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onComment}
        activeOpacity={0.8}
      >
        <CommentIcon size={28} color={COLORS.WHITE} />
        <Text style={styles.actionText}>{formatCount(commentCount)}</Text>
      </TouchableOpacity>

      {/* 북마크 */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onBookmark}
        activeOpacity={0.8}
        disabled={isBookmarkLoading}
      >
        <View style={styles.iconContainer}>
          {isBookmarkLoading ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <BookmarkIcon
              size={28}
              color={isBookmarked ? COLORS.PRIMARY : COLORS.WHITE}
              filled={isBookmarked}
            />
          )}
        </View>
        <Text style={[styles.actionText, isBookmarkLoading && styles.actionLoadingText]}>
          저장
        </Text>
      </TouchableOpacity>

      {/* 조회수 (터치 불가능) */}
      <View style={styles.actionButton}>
        <ViewIcon size={24} color={COLORS.WHITE} />
        <Text style={styles.actionText}>{formatCount(viewCount)}</Text>
      </View>

      {/* 업로드 */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onUpload}
        activeOpacity={0.8}
      >
        <UploadIcon size={28} color={COLORS.WHITE} />
        <Text style={styles.actionText}>업로드</Text>
      </TouchableOpacity>
    </View>
  );
},
// 🔥 커스텀 비교 함수 - 데이터 속성만 비교, 콜백 함수 제외
(prevProps, nextProps) => {
  return (
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.likeCount === nextProps.likeCount &&
    prevProps.isLikeLoading === nextProps.isLikeLoading &&
    prevProps.commentCount === nextProps.commentCount &&
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.isBookmarkLoading === nextProps.isBookmarkLoading &&
    prevProps.viewCount === nextProps.viewCount
    // onLike, onComment, onBookmark, onShare, onUpload은 비교 제외
  );
}
);

// 🔥 기본 스타일 (CutScreen에서 사용)
const defaultStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: SPACING.SM,
    bottom: 150, // bottomOverlay가 차지하는 영역 바로 위에 위치하게 조정
    alignItems: 'center',
    gap: SPACING.MD,
  },
  actionButton: {
    alignItems: 'center',
    gap: SPACING.XS,
  },
  actionText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionLoadingText: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// 🔥 동적 스타일을 위한 함수 (CutDetailScreen에서만 사용)
const createDynamicStyles = (bottomInsets: number) => StyleSheet.create({
  ...defaultStyles,
  container: {
    ...defaultStyles.container,
    bottom: 150 + bottomInsets,
  },
});
