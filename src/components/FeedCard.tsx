import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { FeedListItem, FeedContentBlock } from '../types/feed';
import { FeedService } from '../services/feedService';
import { useThemeStore } from '../stores/themeStore';

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
import UserAvatar from './UserAvatar';

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

// VideoBlock 컴포넌트를 FeedCard 외부로 분리하고 React.memo로 래핑
interface VideoBlockProps {
  videoUri: string;
  feedId: number;
  styles: any;
}

const VideoBlock = React.memo(({ videoUri, feedId, styles }: VideoBlockProps) => {
  const player = useVideoPlayer(videoUri, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // cleanup: 컴포넌트 언마운트 시 player 해제
  useEffect(() => {
    return () => {
      player.release();
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={styles.mainImage}
      nativeControls={false}
      contentFit="contain"
    />
  );
}, (prevProps, nextProps) => {
  // feedId와 videoUri가 동일하면 리렌더링 방지
  return prevProps.feedId === nextProps.feedId && 
         prevProps.videoUri === nextProps.videoUri;
});

export default function FeedCard({
  feed,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  onUserPress,
  onImagePress
}: FeedCardProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(feed.is_liked);
  const [likeCount, setLikeCount] = useState(feed.like_count);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(feed.is_bookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(feed.bookmark_count);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // feed prop이 변경될 때 상태 초기화
  useEffect(() => {
    setIsLiked(feed.is_liked || false);
    setLikeCount(feed.like_count);
  }, [feed.is_liked, feed.like_count]);

  // 북마크 상태 초기화 및 업데이트
  useEffect(() => {
    setIsBookmarked(feed.is_bookmarked || false);
    setBookmarkCount(feed.bookmark_count);
  }, [feed.is_bookmarked, feed.bookmark_count]);

  // 미디어 블록 필터링 (이미지 + 비디오)
  const mediaBlocks = feed.content_blocks.filter(block => block.type === 'image' || block.type === 'video');
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

  // 북마크 토글 핸들러 (낙관적 UI 적용, FeedDetailScreen과 동일 패턴)
  const handleBookmarkPress = async () => {
    if (isBookmarkLoading) return; // 이미 요청 중이면 무시

    // 낙관적 UI: 즉시 상태 업데이트
    const originalIsBookmarked = isBookmarked;
    const originalBookmarkCount = bookmarkCount;
    const newBookmarkState = !isBookmarked;

    setIsBookmarked(newBookmarkState);
    setBookmarkCount(prev => newBookmarkState ? prev + 1 : Math.max(0, prev - 1));
    setIsBookmarkLoading(true);

    try {
      // API 호출 - 북마크 토글
      const response = await FeedService.toggleBookmark(feed.id);

      // 서버 응답으로 최종 상태 동기화
      setIsBookmarked(response.is_bookmarked);
      setBookmarkCount(response.bookmark_count);

      // 부모 컴포넌트에 알림
      onBookmarkPress?.(feed.id);

      console.log('북마크 토글 성공:', { feedId: feed.id, is_bookmarked: response.is_bookmarked });

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
        <UserAvatar 
          profileImg={feed.user.profile_img} 
          nickname={feed.user.nickname}
          size={40}
        />
        <View style={styles.userInfo}>
          <Text style={styles.nickname}>{feed.user.nickname}</Text>
        </View>
      </TouchableOpacity>

      {/* 미디어 영역 (이미지 + 비디오) */}
      {mediaBlocks.length > 0 && (
        <TouchableOpacity style={styles.imageContainer} onPress={handleImagePress} activeOpacity={0.9}>
          {mediaBlocks[0].type === 'video' ? (
            <VideoBlock 
              videoUri={mediaBlocks[0].value} 
              feedId={feed.id}
              styles={styles}
            />
          ) : (
            <Image
              source={{ uri: mediaBlocks[0].value }}
              style={styles.mainImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          )}
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLikePress}
            disabled={isLikeLoading}
          >
            {isLikeLoading ? (
              <ActivityIndicator size="small" color={colors.ERROR} />
            ) : (
              <HeartIcon filled={isLiked} size={20} color={isLiked ? colors.ERROR : colors.GRAY_600} />
            )}
          </TouchableOpacity>
          <Text style={[
            styles.actionCount,
            isLiked && { color: colors.ERROR },
            isLikeLoading && styles.loadingText
          ]}>
            {likeCount}
          </Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleCommentPress}>
            <CommentIcon size={20} />
          </TouchableOpacity>
          <Text style={styles.actionCount}>{feed.comment_count}</Text>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBookmarkPress}
            disabled={isBookmarkLoading}
          >
            {isBookmarkLoading ? (
              <ActivityIndicator size="small" color={colors.PRIMARY} />
            ) : (
              <BookmarkIcon
                filled={isBookmarked}
                size={20}
                color={isBookmarked ? colors.PRIMARY : colors.GRAY_600}
              />
            )}
          </TouchableOpacity>
          <Text style={[
            styles.actionCount,
            isBookmarked && { color: colors.PRIMARY },
            isBookmarkLoading && styles.loadingText
          ]}>
            {bookmarkCount}
          </Text>
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

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    marginBottom: SPACING.XS,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
  },
  location: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY
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
    color: colors.WHITE,
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
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginRight: SPACING.MD,
  },
  loadingText: {
    opacity: 0.6,
  },

  // 콘텐츠
  contentContainer: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    lineHeight: 20,
  },
  moreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY
    marginTop: SPACING.XS,
  },

  // 시간
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  },
});
