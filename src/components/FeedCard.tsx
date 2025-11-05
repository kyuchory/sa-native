import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer, VideoSource } from 'expo-video';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation, useAnimatedScrollHandler, SharedValue } from 'react-native-reanimated';
import { TYPOGRAPHY, SPACING, COLORS } from '../constants/theme';
import { FeedListItem } from '../types/feed';
import { FeedService } from '../services/feedService';
import { useThemeStore } from '../stores/themeStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { MenuIcon, MuteIcon, UnmuteIcon } from './CommonIcons';
import useFeedStore from '../stores/feedStore';
import useProfileStore from '../stores/profileStore';

const { width: screenWidth } = Dimensions.get('window');

interface FeedCardProps {
  feed: FeedListItem;
  onLikePress?: (feedId: number) => void;
  onCommentPress?: (feedId: number) => void;
  onBookmarkPress?: (feedId: number) => void;
  onUserPress?: (userId: number) => void;
  onMenuPress?: (feed: FeedListItem) => void;
  isVisible?: boolean;
}

type FeedCardNavigationProp = StackNavigationProp<AuthStackParamList>;

import { HeartIcon, CommentIcon, BookmarkIcon } from './FeedCardIcons';
import UserAvatar from './UserAvatar';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// 애니메이션 페이지 인디케이터 - 스크롤 오프셋 기반
const AnimatedPageIndicator: React.FC<{
  index: number;
  totalPages: number;
  scrollX: SharedValue<number>;
  colors: Record<string, string>;
}> = ({ index, totalPages, scrollX, colors }) => {
  
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];
    
    // 현재 페이지와의 거리 계산
    const distance = Math.abs(scrollX.value / screenWidth - index);
    
    // 거리에 따라 표시 여부 결정 (현재 기준 앞뒤 2개만)
    if (distance > 2) {
      return {
        width: 0,
        opacity: 0,
        transform: [{ scale: 0 }],
      };
    }
    
    // 너비 애니메이션 (active일 때 12, 나머지 6)
    const width = interpolate(
      scrollX.value,
      inputRange,
      [6, 12, 6],
      Extrapolation.CLAMP
    );
    
    // 투명도 애니메이션
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );
    
    // 스케일 애니메이션
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
      Extrapolation.CLAMP
    );
    
    // active 여부에 따른 색상 결정을 위한 progress
    const isActiveProgress = interpolate(
      scrollX.value,
      [index * screenWidth - screenWidth * 0.3, index * screenWidth, index * screenWidth + screenWidth * 0.3],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    
    return {
      width,
      opacity,
      transform: [{ scale }],
      // 색상은 여기서 처리하지 않고 backgroundColor를 조건부로 설정
    };
  });
  
  // active 판단용 (렌더링용)
  const isActiveStyle = useAnimatedStyle(() => {
    'worklet';
    const currentPage = Math.round(scrollX.value / screenWidth);
    const isActive = currentPage === index;
    
    return {
      backgroundColor: isActive ? colors.PRIMARY : colors.GRAY_400,
    };
  });
  
  return (
    <Animated.View
      style={[
        {
          height: 6,
          borderRadius: 3,
        },
        isActiveStyle,
        animatedStyle,
      ]}
    />
  );
};

// TapPauseVideo 컴포넌트
const TapPauseVideo = ({ videoUri, isVisible }: { videoUri: string; isVisible?: boolean }) => {
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.muted = true;
    if (isVisible) {
      player.play();
    }
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!player) return;

    if (isVisible && player.playing === false) {
      player.play();
    } else if (!isVisible && player.playing === true) {
      player.pause();
    }
  }, [isVisible, player]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleToggleMute = () => {
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <View style={videoStyles.container}>
      <VideoView
        player={player}
        style={videoStyles.videoView}
        contentFit="contain"
        nativeControls={false}
        surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
      />
      <TouchableOpacity
        onPress={handleToggleMute}
        activeOpacity={0.9}
        style={videoStyles.muteButton}
      >
        {isMuted ? (
          <MuteIcon size={20} color={COLORS.WHITE} />
        ) : (
          <UnmuteIcon size={20} color={COLORS.WHITE} />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleTogglePlay}
        activeOpacity={1}
        style={videoStyles.touchOverlay}
      />
    </View>
  );
};

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

// Enhanced VideoBlock 컴포넌트
interface EnhancedVideoBlockProps {
  videoUri: string;
  feedId: number;
  styles: any;
  isVisible?: boolean;
}

const EnhancedVideoBlock = React.memo(({
  videoUri,
  feedId,
  styles,
  isVisible = true
}: EnhancedVideoBlockProps) => {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);

  const videoSource = useMemo<VideoSource>(() => ({
    uri: videoUri,
    useCaching: true,
    headers: Platform.OS === 'ios' && videoUri.includes('.m3u8') ? undefined : {}
  }), [videoUri]);

  useEffect(() => {
    const preloadThumbnail = async () => {
      try {
        const thumbnail = await getThumbnailAsync(videoUri, {
          time: 0.0,
          quality: 0.5
        });
        setThumbnailUri(thumbnail.uri);
      } catch (error) {
        console.warn('썸네일 생성 실패:', error);
      }
    };

    preloadThumbnail();
  }, [videoUri]);

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true;
    if (isVisible) {
      player.play();
    }
    setIsPlayerReady(true);
    playerRef.current = player;
  });

  useEffect(() => {
    if (!player || !isPlayerReady) return;

    if (isVisible && player.playing === false) {
      player.play();
    } else if (!isVisible && player.playing === true) {
      player.pause();
    }
  }, [isVisible, player, isPlayerReady]);

  return (
    <View style={styles.videoContainer}>
      {!isPlayerReady && thumbnailUri && (
        <Image
          source={{ uri: thumbnailUri }}
          style={styles.mainImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      <VideoView
        player={player}
        style={styles.mainImage}
        nativeControls={false}
        contentFit="contain"
        surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
        onFirstFrameRender={() => setThumbnailUri(null)}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.feedId === nextProps.feedId &&
         prevProps.videoUri === nextProps.videoUri &&
         prevProps.isVisible === nextProps.isVisible;
});

function FeedCard({
  feed,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  onUserPress,
  onMenuPress,
  isVisible = true
}: FeedCardProps) {
  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(feed.is_liked);
  const [likeCount, setLikeCount] = useState(feed.like_count);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(feed.is_bookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(feed.bookmark_count);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const scrollX = useSharedValue(0);

  const navigation = useNavigation<FeedCardNavigationProp>();
  const { setShouldRefreshFeeds } = useFeedStore();
  const { setShouldRefreshProfileFeeds } = useProfileStore();

  useEffect(() => {
    setIsLiked(feed.is_liked || false);
    setLikeCount(feed.like_count);
  }, [feed.is_liked, feed.like_count]);

  useEffect(() => {
    setIsBookmarked(feed.is_bookmarked || false);
    setBookmarkCount(feed.bookmark_count);
  }, [feed.is_bookmarked, feed.bookmark_count]);

  const mediaBlocks = feed.content_blocks.filter(block => block.type === 'image' || block.type === 'video');
  const textBlock = feed.content_blocks.find(block => block.type === 'text');

  // 스크롤 핸들러
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleLikePress = useCallback(async () => {
    if (isLikeLoading) return;

    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;
    const newLikeState = !isLiked;

    setIsLiked(newLikeState);
    setLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    setIsLikeLoading(true);

    try {
      const response = await FeedService.toggleLike(feed.id);
      setIsLiked(response.is_liked);
      setLikeCount(response.like_count);
      onLikePress?.(feed.id);
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);
    } finally {
      setIsLikeLoading(false);
    }
  }, [isLikeLoading, isLiked, likeCount, feed.id, onLikePress]);

  const handleBookmarkPress = useCallback(async () => {
    if (isBookmarkLoading) return;

    const originalIsBookmarked = isBookmarked;
    const originalBookmarkCount = bookmarkCount;
    const newBookmarkState = !isBookmarked;

    setIsBookmarked(newBookmarkState);
    setBookmarkCount(prev => newBookmarkState ? prev + 1 : Math.max(0, prev - 1));
    setIsBookmarkLoading(true);

    try {
      const response = await FeedService.toggleBookmark(feed.id);
      setIsBookmarked(response.is_bookmarked);
      setBookmarkCount(response.bookmark_count);
      onBookmarkPress?.(feed.id);
      console.log('북마크 토글 성공:', { feedId: feed.id, is_bookmarked: response.is_bookmarked });
    } catch (error) {
      console.error('북마크 토글 실패:', error);
      setIsBookmarked(originalIsBookmarked);
      setBookmarkCount(originalBookmarkCount);
    } finally {
      setIsBookmarkLoading(false);
    }
  }, [isBookmarkLoading, isBookmarked, bookmarkCount, feed.id, onBookmarkPress]);

  const handleUserPress = useCallback(() => {
    onUserPress?.(feed.user.id);
  }, [onUserPress, feed.user.id]);

  const handleCommentPress = useCallback(() => {
    onCommentPress?.(feed.id);
  }, [onCommentPress, feed.id]);

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={handleUserPress} activeOpacity={0.7}>
          <UserAvatar
            profileImg={feed.user.profile_img}
            nickname={feed.user.nickname}
            size={40}
          />
          <View style={styles.userInfo}>
            <Text style={styles.nickname}>{feed.user.nickname}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => onMenuPress?.(feed)}
          activeOpacity={0.7}
        >
          <MenuIcon size={20} color={colors.GRAY_700} />
        </TouchableOpacity>
      </View>

      {mediaBlocks.length > 0 && (
        <>
          {mediaBlocks.length === 1 ? (
            <TouchableOpacity style={styles.imageContainer} activeOpacity={0.9}>
              {mediaBlocks[0].type === 'video' ? (
                <TapPauseVideo videoUri={mediaBlocks[0].value} isVisible={isVisible} />
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
                  <Text style={styles.imageCountText}>{feed.media_count}장</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <AnimatedScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(event) => {
                const page = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setCurrentPage(page);
              }}
              decelerationRate="fast"
            >
              {mediaBlocks.map((block, index) => (
                <View key={block.sequence} style={styles.carouselItem}>
                  {/* 첫 번째 미디어에만 총 개수 표시 */}
                  {index === 0 && mediaBlocks.length > 1 && (
                    <Text style={styles.moreImagesText}>
                      +{mediaBlocks.length}
                    </Text>
                  )}
                  {block.type === 'video' ? (
                    <TapPauseVideo videoUri={block.value} isVisible={isVisible && currentPage === index} />
                  ) : (
                    <Image
                      source={{ uri: block.value }}
                      style={styles.mainImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                    />
                  )}
                </View>
              ))}
            </AnimatedScrollView>
          )}
        </>
      )}

      {/* 애니메이션 페이지 인디케이터 - 스크롤 기반 */}
      {mediaBlocks.length > 1 && (
        <View style={styles.pageIndicatorContainer}>
          {mediaBlocks.map((_, index) => (
            <AnimatedPageIndicator
              key={index}
              index={index}
              totalPages={mediaBlocks.length}
              scrollX={scrollX}
              colors={colors}
            />
          ))}
        </View>
      )}

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

      {textBlock && (
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      )}

      <Text style={styles.timeText}>{formatTimeAgo(feed.created_at)}</Text>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    marginBottom: SPACING.XS,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SM,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: SPACING.SM,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900,
  },
  location: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    marginTop: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  imageScroll: {
    height: screenWidth,
  },
  carouselItem: {
    position: 'relative',
    width: screenWidth,
    height: screenWidth,
  },
  moreImagesText: {
    position: 'absolute',
    bottom: SPACING.SM,
    right: SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: COLORS.WHITE,
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    zIndex: 10,
  },
  videoContainer: {
    position: 'relative',
  },
  mainImage: {
    width: screenWidth,
    height: screenWidth,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: SPACING.SM,
    right: SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 6,
    minWidth: 36,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCountText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
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
    color: colors.GRAY_900,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginRight: SPACING.MD,
  },
  loadingText: {
    opacity: 0.6,
  },
  contentContainer: {
    paddingHorizontal: SPACING.SM,
    paddingBottom: SPACING.SM,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    lineHeight: 20,
  },
  moreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    marginTop: SPACING.XS,
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    gap: SPACING.XS,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    paddingHorizontal: SPACING.SM,
    paddingBottom: SPACING.MD,
  }
});

const videoStyles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenWidth,
    position: 'relative' as const,
  },
  videoView: {
    width: screenWidth,
    height: screenWidth,
  },
  touchOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  muteButton: {
    position: 'absolute',
    top: SPACING.SM,
    right: SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});

const feedCardPropsAreEqual = (prevProps: FeedCardProps, nextProps: FeedCardProps): boolean => {
  const prevFeed = prevProps.feed;
  const nextFeed = nextProps.feed;

  return (
    prevFeed.id === nextFeed.id &&
    prevFeed.is_liked === nextFeed.is_liked &&
    prevFeed.like_count === nextFeed.like_count &&
    prevFeed.is_bookmarked === nextFeed.is_bookmarked &&
    prevFeed.bookmark_count === nextFeed.bookmark_count &&
    prevFeed.comment_count === nextFeed.comment_count &&
    prevProps.isVisible === nextProps.isVisible
  );
};

export default React.memo(FeedCard, feedCardPropsAreEqual);
