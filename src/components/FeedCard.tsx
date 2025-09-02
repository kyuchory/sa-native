import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, ActivityIndicator } from 'react-native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { FeedListItem, FeedContentBlock } from '../types/feed';
import { FeedService } from '../services/feedService';

const { width: screenWidth } = Dimensions.get('window');

interface FeedCardProps {
  feed: FeedListItem;
  onLikePress?: (feedId: number) => void;
  onCommentPress?: (feedId: number) => void;
  onBookmarkPress?: (feedId: number) => void;
  onUserPress?: (userId: number) => void;
  onImagePress?: (feedId: number) => void;
}

// 아이콘 컴포넌트들
import { HeartIcon, CommentIcon, BookmarkIcon } from './FeedCardIcons';

// 시간 포맷 함수
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}시간 전`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  }
};

export default function FeedCard({
  feed,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  onUserPress,
  onImagePress
}: FeedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(feed.is_liked);
  const [likeCount, setLikeCount] = useState(feed.like_count);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(feed.is_bookmarked);

  // feed prop이 변경될 때 상태 초기화
  useEffect(() => {
    setIsLiked(feed.is_liked || false);
    setLikeCount(feed.like_count);
  }, [feed.is_liked, feed.like_count]);

  // 이미지 블록만 필터링
  const imageBlocks = feed.content_blocks.filter(block => block.type === 'image');
  // 텍스트 블록 찾기
  const textBlock = feed.content_blocks.find(block => block.type === 'text');

  // 좋아요 토글 핸들러 (낙관적 UI 적용)
  const handleLikePress = async () => {
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
      const response = await FeedService.toggleLike(feed.id);
      
      // 서버 응답으로 최종 상태 동기화
      setIsLiked(response.is_liked);
      setLikeCount(response.like_count);
      
      // 부모 컴포넌트에 알림
      onLikePress?.(feed.id);
      
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

  const handleBookmarkPress = () => {
    setIsBookmarked(!isBookmarked);
    onBookmarkPress?.(feed.id);
  };

  const handleUserPress = () => {
    onUserPress?.(feed.user.id);
  };

  const handleCommentPress = () => {
    onCommentPress?.(feed.id);
  };

  const handleImagePress = () => {
    onImagePress?.(feed.id);
  };

  // 텍스트 더보기/접기 처리
  const renderContent = () => {
    if (!textBlock) return null;
    
    const content = textBlock.value;
    const shouldTruncate = content.length > 100;
    
    if (!shouldTruncate) {
      return <Text style={styles.contentText}>{content}</Text>;
    }
    
    if (isExpanded) {
      return (
        <View>
          <Text style={styles.contentText}>{content}</Text>
          <TouchableOpacity onPress={() => setIsExpanded(false)}>
            <Text style={styles.moreText}>접기</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View>
        <Text style={styles.contentText}>
          {content.substring(0, 100)}...
        </Text>
        <TouchableOpacity onPress={() => setIsExpanded(true)}>
          <Text style={styles.moreText}>더보기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 - 프로필 정보 */}
      <TouchableOpacity style={styles.header} onPress={handleUserPress} activeOpacity={0.7}>
        <Image source={{ uri: feed.user.profile_img }} style={styles.profileImage} />
        <View style={styles.userInfo}>
          <Text style={styles.nickname}>{feed.user.nickname}</Text>
        </View>
      </TouchableOpacity>

      {/* 이미지 영역 */}
      {imageBlocks.length > 0 && (
        <TouchableOpacity style={styles.imageContainer} onPress={handleImagePress} activeOpacity={0.9}>
          <Image
            source={{ uri: imageBlocks[0].value }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {feed.media_count > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>+{feed.media_count - 1}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* 액션 버튼들 */}
      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLikePress}>
            {isLikeLoading ? (
              <ActivityIndicator size="small" color={COLORS.ERROR} />
            ) : (
              <HeartIcon filled={isLiked} size={20} color={isLiked ? COLORS.ERROR : TEXT_COLORS.SECONDARY} />
            )}
          </TouchableOpacity>
          <Text style={[styles.actionCount, isLiked && { color: COLORS.ERROR }]}>
            {likeCount}
          </Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleCommentPress}>
            <CommentIcon size={20} />
          </TouchableOpacity>
          <Text style={styles.actionCount}>{feed.comment_count}</Text>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleBookmarkPress}>
            <BookmarkIcon filled={isBookmarked} size={20} />
          </TouchableOpacity>
          <Text style={styles.actionCount}>{feed.bookmark_count}</Text>
        </View>
      </View>

      {/* 콘텐츠 텍스트 */}
      {textBlock && (
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      )}

      {/* 시간 정보 */}
      <Text style={styles.timeText}>{formatTimeAgo(feed.created_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    marginBottom: SPACING.MD,
  },
  
  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.SM,
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: TEXT_COLORS.PRIMARY,
  },
  location: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
    marginTop: 2,
  },
  
  // 이미지
  imageContainer: {
    position: 'relative',
  },
  mainImage: {
    width: screenWidth,
    height: screenWidth,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: SPACING.SM,
    left: SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
  },
  imageCountText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  
  // 액션 버튼들
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: SPACING.XS,
  },
  actionCount: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginRight: SPACING.MD,
  },
  
  // 콘텐츠
  contentContainer: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.PRIMARY,
    lineHeight: 20,
  },
  moreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
    marginTop: SPACING.XS,
  },
  
  // 시간
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  },
});
