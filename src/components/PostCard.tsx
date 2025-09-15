import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import type { PostListItem } from '../types/post';
import { EmptyHeartIcon, FilledHeartIcon } from './PostCardIcons';
import { CommentIcon, BookmarkIcon } from './PostIcons';
import { PostService } from '../services/postService';
import { useThemeStore } from '../stores/themeStore';

interface PostCardProps {
  post: PostListItem;
  onPress?: () => void;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onAuthorPress?: () => void;
}

export default function PostCard({
  post,
  onPress,
  onCommentPress,
  onAuthorPress
}: PostCardProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  
  // 로컬 상태 관리
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // 로컬 북마크 상태 관리
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked || false);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmark_count);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // post prop이 변경될 때 상태 초기화
  useEffect(() => {
    setIsLiked(post.is_liked || false);
    setLikeCount(post.like_count);
    setIsBookmarked(post.is_bookmarked || false);
    setBookmarkCount(post.bookmark_count);
  }, [post.is_liked, post.like_count, post.is_bookmarked, post.bookmark_count]);

  // 좋아요 토글 핸들러 (낙관적 UI 적용)
  const handleLikeToggle = async () => {
    if (isLikeLoading) return; // 이미 요청 중이면 무시
    
    // 낙관적 UI: 즉시 상태 업데이트
    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;
    const newLikeState = !isLiked;
    
    setIsLiked(newLikeState);
    setLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    setIsLikeLoading(true);
    
    try {
      // API 호출
      const response = await PostService.togglePostLike(post.id);
      
      // 서버 응답으로 최종 상태 동기화
      setIsLiked(response.is_liked);
      setLikeCount(response.like_count);
      
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      
      // 실패 시 원래 상태로 롤백
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);
      
      // TODO: 에러 토스트 메시지 표시
      
  } finally {
    setIsLikeLoading(false);
  }
  };

  // 북마크 토글 핸들러 (낙관적 UI 적용)
  const handleBookmarkToggle = async () => {
    if (isBookmarkLoading) return; // 이미 요청 중이면 무시

    // 낙관적 UI: 즉시 상태 업데이트
    const originalIsBookmarked = isBookmarked;
    const originalBookmarkCount = bookmarkCount;
    const newBookmarkState = !isBookmarked;

    setIsBookmarked(newBookmarkState);
    setBookmarkCount(prev => newBookmarkState ? prev + 1 : Math.max(0, prev - 1));
    setIsBookmarkLoading(true);

    try {
      // API 호출
      const response = await PostService.togglePostBookmark(post.id);

      // 서버 응답으로 최종 상태 동기화
      setIsBookmarked(response.is_bookmarked);
      setBookmarkCount(response.bookmark_count);

    } catch (error) {
      console.error('북마크 토글 실패:', error);

      // 실패 시 원래 상태로 롤백
      setIsBookmarked(originalIsBookmarked);
      setBookmarkCount(originalBookmarkCount);

      // TODO: 에러 토스트 메시지 표시

    } finally {
      setIsBookmarkLoading(false);
    }
  };
  
  // 시간 포맷팅 함수
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  // 숫자 포맷팅 함수 (1000 -> 1K)
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 100000) / 10}M`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}K`;
    return num.toString();
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* 상단: 작성자 정보 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorInfo}
          onPress={onAuthorPress}
          activeOpacity={0.7}
          disabled={!onAuthorPress}
        >
          <View style={styles.profileImageContainer}>
            {post.user.profile_img ? (
              <Image
                source={{ uri: post.user.profile_img }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Text style={styles.profileImageText}>
                  {post.user.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{post.user.nickname}</Text>
            <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryText}>
            {post.sub_category.category.name} {'>'} {post.sub_category.name}
          </Text>
        </View>
      </View>

      {/* 본문 영역 */}
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
          <Text style={styles.contentText} numberOfLines={3}>
            {post.content}
          </Text>
        </View>

        {/* 이미지가 있는 경우 */}
        {post.preview_image && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: post.preview_image }} 
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      {/* 하단: 상호작용 버튼들 */}
      <View style={styles.footer}>
        <View style={styles.interactionButtons}>
          <TouchableOpacity 
            style={styles.interactionButton}
            onPress={handleLikeToggle}
            activeOpacity={0.7}
            disabled={isLikeLoading}
          >
            {isLikeLoading ? (
              <ActivityIndicator size="small" color={colors.ERROR} />
            ) : isLiked ? (
              <FilledHeartIcon size={18} color={colors.ERROR} />
            ) : (
              <EmptyHeartIcon size={18} color={colors.GRAY_400} />
            )}
            <Text style={[styles.interactionText, isLikeLoading && styles.loadingText]}>
              {formatNumber(likeCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interactionButton}
            onPress={onCommentPress}
            activeOpacity={0.7}
          >
            <CommentIcon size={18} color={colors.GRAY_400} />
            <Text style={styles.interactionText}>{formatNumber(post.comment_count)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interactionButton}
            onPress={handleBookmarkToggle}
            activeOpacity={0.7}
            disabled={isBookmarkLoading}
          >
            {isBookmarkLoading ? (
              <ActivityIndicator size="small" color={colors.PRIMARY} />
            ) : (
              <BookmarkIcon
                size={18}
                filled={isBookmarked}
                color={isBookmarked ? colors.PRIMARY : colors.GRAY_400}
              />
            )}
            <Text style={[styles.interactionText, isBookmarkLoading && styles.loadingText]}>
              {formatNumber(bookmarkCount)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },

  // 헤더 (작성자 정보)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    marginRight: SPACING.SM,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileImagePlaceholder: {
    backgroundColor: colors.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: 1,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 본문 내용
  content: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  textContent: {
    flex: 1,
    marginRight: SPACING.SM,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.XS,
    lineHeight: 22,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    lineHeight: 20,
  },

  // 썸네일 이미지
  imageContainer: {
    width: 80,
    height: 80,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.GRAY_100,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.GRAY_100,
  },

  // 하단 통계
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    paddingTop: SPACING.SM,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.MD,
    paddingVertical: SPACING.XS,
  },
  statIcon: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    marginRight: SPACING.XS,
  },
  statText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  interactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.XS,
    paddingVertical: SPACING.XS,
  },
  interactionText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginLeft: SPACING.XS,
  },
  loadingText: {
    opacity: 0.6,
  },
});
