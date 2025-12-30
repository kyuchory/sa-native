import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform, ScrollView, NativeScrollEvent, NativeSyntheticEvent, Animated } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer, VideoSource } from 'expo-video';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, interpolate, Extrapolation, useAnimatedScrollHandler, SharedValue } from 'react-native-reanimated';
import { TYPOGRAPHY, SPACING, COLORS } from '../constants/theme';
import { FeedListItem } from '../types/feed';
import { FeedService } from '../services/feedService';
import { useThemeStore } from '../stores/themeStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { MenuIcon, MuteIcon, UnmuteIcon } from './CommonIcons';
import { PlayIcon, PauseIcon } from './CutIcons';
import useFeedStore from '../stores/feedStore';
import useProfileStore from '../stores/profileStore';
import { useNetworkState, shouldAutoPlayVideo } from '../hooks/useNetworkState';
import { useVideoSettingsStore } from '../stores/videoSettingsStore';

const { width: screenWidth } = Dimensions.get('window');

interface FeedCardProps {
  feed: FeedListItem;
  onLikePress?: (feedId: number) => void;
  onCommentPress?: (feedId: number) => void;
  onBookmarkPress?: (feedId: number) => void;
  onUserPress?: (userId: number) => void;
  onMenuPress?: (feed: FeedListItem) => void;
  isVisible?: boolean;
  isRecommended?: boolean;
}

type FeedCardNavigationProp = StackNavigationProp<AuthStackParamList>;

import { HeartIcon, CommentIcon, BookmarkIcon } from './FeedCardIcons';
import UserAvatar from './UserAvatar';

const AnimatedScrollView = AnimatedReanimated.ScrollView;

// 애니메이션 페이지 인디케이터 - 스크롤 오프셋 기반
const AnimatedPageIndicator: React.FC<{
  index: number;
  totalPages: number;
  scrollX: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}> = ({ index, totalPages, scrollX, activeColor, inactiveColor }) => {
  
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
      backgroundColor: isActive ? activeColor : inactiveColor,
    };
  });
  
  return (
    <AnimatedReanimated.View
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
  const networkState = useNetworkState();
  const { autoPlayMode } = useVideoSettingsStore();
  const shouldAutoPlay = shouldAutoPlayVideo(networkState.type, autoPlayMode);

  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = false; // 🔥 loop 비활성화 (CutScreen 방식)
    player.muted = true;
  });

  // 🔥 CutScreen 방식의 이벤트 리스너 추가
  useEffect(() => {
    if (player) {
      const handleStatusChange = (payload: any) => {
        if (payload.status === 'readyToPlay') {
          player.seekBy(0.1); // 영상 시작을 0.1초부터
          player.removeListener('statusChange', handleStatusChange);
        }
      };

      // 🔥 영상 종료 시 처음으로 돌아가기 (iOS 검은 화면 방지)
      const handlePlayToEnd = () => {
        // 영상이 끝났을 때
        if (isMountedRef.current && !isCleaningUpRef.current) {
          player.currentTime = 0.1; // 검은 프레임을 스킵한 위치로 즉시 이동
          player.play(); // 자동으로 재생 시작
        }
      };

      player.addListener('statusChange', handleStatusChange);
      player.addListener('playToEnd', handlePlayToEnd);

      return () => {
        player.removeListener('statusChange', handleStatusChange);
        player.removeListener('playToEnd', handlePlayToEnd);
      };
    }
  }, [player]);

  const [isPlaying, setIsPlaying] = useState(shouldAutoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [showOverlayIcon, setShowOverlayIcon] = useState(false);
  const [overlayIsPlaying, setOverlayIsPlaying] = useState(false);

  // 🔥 cleanup 플래그 추가 (ShortItemComponent 방식)
  const isCleaningUpRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasCalledPauseRef = useRef(false); // 🔥 pause 호출 여부 추적
  const hasPlayedOnceRef = useRef(false); // 🔥 한 번이라도 재생됐는지 추적

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const triggerOverlay = useCallback((isPlayingNow: boolean) => {
    if (!isMountedRef.current) return;

    if (overlayAnimationRef.current) {
      overlayAnimationRef.current.stop();
    }

    setOverlayIsPlaying(isPlayingNow);
    setShowOverlayIcon(true);
    overlayOpacity.setValue(1);

    overlayAnimationRef.current = Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    });

    overlayAnimationRef.current.start(({ finished }) => {
      if (finished && isMountedRef.current) setShowOverlayIcon(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 🔥 의존성 제거 - overlayOpacity는 ref이므로 안정적

  // 🔥 안전한 pause 함수 (ShortItemComponent 방식)
  const safePause = useCallback(() => {
    if (hasCalledPauseRef.current) return; // 이미 pause 호출됨
    if (isCleaningUpRef.current) return; // cleanup 중

    try {
      if (player && typeof player.pause === 'function') {
        player.pause();
        hasCalledPauseRef.current = true; // 🔥 pause 호출 기록
      }
    } catch (error) {
      // 무시
    }
  }, [player]);

  // 🔥 개선된 재생/정지 제어 (CutScreen 방식 적용)
  useEffect(() => {
    if (isCleaningUpRef.current) return;

    // 🔥 isVisible이 true일 때
    if (isVisible) {
      // 첫 재생인 경우: shouldAutoPlay 체크
      // 이미 재생된 적이 있는 경우: 무조건 재생 (탭 전환 후 돌아왔을 때)
      const shouldPlay = hasPlayedOnceRef.current || shouldAutoPlay;

      if (shouldPlay) {
        hasCalledPauseRef.current = false;

        const playTimer = setTimeout(() => {
          if (!isCleaningUpRef.current && isMountedRef.current) {
            try {
              player?.play();
              setIsPlaying(true);
              hasPlayedOnceRef.current = true; // 🔥 재생 기록
            } catch (error) {
              console.warn('Video auto-play error:', error);
            }
          }
        }, 50);

        return () => {
          clearTimeout(playTimer);
        };
      }
    } else {
      // isVisible이 false일 때: 일시정지
      safePause();
      setIsPlaying(false);
    }
  }, [isVisible, shouldAutoPlay, player, safePause]); // 🔥 shouldAutoPlay는 의존성으로 유지

  const handleTogglePlay = useCallback(() => {
    if (isCleaningUpRef.current) return;

    try {
      if (isPlaying) {
        safePause(); // 🔥 safePause 사용
        setIsPlaying(false);
        triggerOverlay(false);
      } else {
        hasCalledPauseRef.current = false; // play 시 플래그 리셋
        hasPlayedOnceRef.current = true; // 🔥 수동 재생도 기록
        player?.play();
        setIsPlaying(true);
        triggerOverlay(true);
      }
    } catch (error) {
      console.warn('Toggle play error:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, safePause, player, triggerOverlay]); // 🔥 triggerOverlay 의존성 추가

  const handleToggleMute = () => {
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // 🔥 언마운트 시 정리 (ShortItemComponent 방식)
  useEffect(() => {
    return () => {
      // 🔥 cleanup 플래그 설정
      isCleaningUpRef.current = true;
      isMountedRef.current = false;

      // 애니메이션 정리
      if (overlayAnimationRef.current) {
        overlayAnimationRef.current.stop();
      }

      // 🔥 safePause 사용 (중복 방지)
      safePause();
    };
  }, [safePause]);

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
      {showOverlayIcon && (
        <Animated.View style={[videoStyles.overlay, { opacity: overlayOpacity }]}>
          <View style={videoStyles.overlayIcon}>
            {overlayIsPlaying ? (
              <PlayIcon size={48} color={COLORS.WHITE} filled />
            ) : (
              <PauseIcon size={48} color={COLORS.WHITE} filled />
            )}
          </View>
        </Animated.View>
      )}
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


function FeedCard({
  feed,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  onUserPress,
  onMenuPress,
  isVisible = true,
  isRecommended = false
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
            {isRecommended && (
              <Text style={styles.recommendedText}>추천 피드</Text>
            )}
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
                    <TapPauseVideo
                      videoUri={block.value}
                      isVisible={isVisible && currentPage === index}
                    />
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
              activeColor={colors.PRIMARY}
              inactiveColor={colors.GRAY_400}
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
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isLikeLoading ? (
          <ActivityIndicator size="small" color={colors.ERROR} />
        ) : (
          <HeartIcon filled={isLiked} size={20} color={isLiked ? colors.ERROR : colors.GRAY_600} />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleLikePress}
        disabled={isLikeLoading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[
          styles.actionCount,
          isLiked && { color: colors.ERROR },
          isLikeLoading && styles.loadingText
        ]}>
          {likeCount}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleCommentPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <CommentIcon size={20} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleCommentPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.actionCount}>{feed.comment_count}</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.rightActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleBookmarkPress}
        disabled={isBookmarkLoading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleBookmarkPress}
        disabled={isBookmarkLoading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[
          styles.actionCount,
          styles.rightActionCount,
          isBookmarked && { color: colors.PRIMARY },
          isBookmarkLoading && styles.loadingText
        ]}>
          {bookmarkCount}
        </Text>
      </TouchableOpacity>
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
  recommendedText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
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
    color: colors.GRAY_900,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginRight: SPACING.MD,
  },
  rightActionCount: {
    marginRight: 0,
  },
  loadingText: {
    opacity: 0.6,
  },
  contentContainer: {
    paddingHorizontal: SPACING.MD,
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
    paddingHorizontal: SPACING.MD,
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
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
    zIndex: 15,
  },
  overlayIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const feedCardPropsAreEqual = (prevProps: FeedCardProps, nextProps: FeedCardProps): boolean => {
  const prevFeed = prevProps.feed;
  const nextFeed = nextProps.feed;

  // 기본 정보 비교
  if (
    prevFeed.id !== nextFeed.id ||
    prevFeed.is_liked !== nextFeed.is_liked ||
    prevFeed.like_count !== nextFeed.like_count ||
    prevFeed.is_bookmarked !== nextFeed.is_bookmarked ||
    prevFeed.bookmark_count !== nextFeed.bookmark_count ||
    prevFeed.comment_count !== nextFeed.comment_count ||
    prevProps.isVisible !== nextProps.isVisible
  ) {
    return false;
  }

  // content_blocks 비교 - 텍스트 내용
  const prevTextBlock = prevFeed.content_blocks.find(b => b.type === 'text');
  const nextTextBlock = nextFeed.content_blocks.find(b => b.type === 'text');
  if (prevTextBlock?.value !== nextTextBlock?.value) {
    return false;
  }

  // content_blocks 비교 - 미디어 개수 및 순서
  const prevMediaBlocks = prevFeed.content_blocks.filter(b => b.type === 'image' || b.type === 'video');
  const nextMediaBlocks = nextFeed.content_blocks.filter(b => b.type === 'image' || b.type === 'video');

  if (prevMediaBlocks.length !== nextMediaBlocks.length) {
    return false;
  }

  // 각 미디어 블록의 순서와 값 비교
  for (let i = 0; i < prevMediaBlocks.length; i++) {
    if (
      prevMediaBlocks[i].sequence !== nextMediaBlocks[i].sequence ||
      prevMediaBlocks[i].value !== nextMediaBlocks[i].value ||
      prevMediaBlocks[i].type !== nextMediaBlocks[i].type
    ) {
      return false;
    }
  }

  return true;
};

export default React.memo(FeedCard, feedCardPropsAreEqual);
