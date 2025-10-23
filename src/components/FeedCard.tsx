import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer, VideoSource } from 'expo-video';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import { TYPOGRAPHY, SPACING, COLORS } from '../constants/theme';
import { FeedListItem } from '../types/feed';
import { FeedService } from '../services/feedService';
import { useThemeStore } from '../stores/themeStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { MenuIcon } from './CommonIcons';
import useFeedStore from '../stores/feedStore';
import useProfileStore from '../stores/profileStore';

const { width: screenWidth } = Dimensions.get('window');

interface FeedCardProps {
  feed: FeedListItem;
  onLikePress?: (feedId: number) => void;
  onCommentPress?: (feedId: number) => void;
  onBookmarkPress?: (feedId: number) => void;
  onUserPress?: (userId: number) => void;
  onImagePress?: (feedId: number) => void;
  onMenuPress?: (feed: FeedListItem) => void; // 메뉴 버튼 클릭 콜백
  isVisible?: boolean; // 비디오 가시성 제어 (선택적)
}

type FeedCardNavigationProp = StackNavigationProp<AuthStackParamList>;

// 아이콘 컴포넌트들
import { HeartIcon, CommentIcon, BookmarkIcon } from './FeedCardIcons';
import UserAvatar from './UserAvatar';

// TapPauseVideo 컴포넌트 - 탭하면 재생/일시정지
const TapPauseVideo = ({ videoUri, isVisible }: { videoUri: string; isVisible?: boolean }) => {
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.muted = true;
    if (isVisible) {
      player.play();
    }
  });

  const [isPlaying, setIsPlaying] = useState(true);

  // Visibility change effect
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

  return (
    <View style={{ width: screenWidth, height: screenWidth }}>
      <VideoView
        player={player}
        style={{ width: screenWidth, height: screenWidth }}
        contentFit="contain"
        nativeControls={false}
        surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
      />
      {/* 터치 오버레이 - VideoView 위에 투명 레이어 */}
      <TouchableOpacity
        onPress={handleTogglePlay}
        activeOpacity={1}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
        }}
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

// Enhanced VideoBlock 컴포넌트 - 성능 최적화 포함
interface EnhancedVideoBlockProps {
  videoUri: string;
  feedId: number;
  styles: any;
  isVisible?: boolean; // 화면에 보이는지 여부 (미래 확장용)
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

  // 메모이제이션된 VideoSource - 캐싱 활성화 및 플랫폼별 최적화
  const videoSource = useMemo<VideoSource>(() => ({
    uri: videoUri,
    useCaching: true, // 동일 영상 재시청 시 네트워크 요청 제거
    // HLS 제외하고 캐싱 적용 (iOS HLS는 플랫폼 제한)
    headers: Platform.OS === 'ios' && videoUri.includes('.m3u8') ? undefined : {}
  }), [videoUri]);

  // 썸네일 미리 로드
  useEffect(() => {
    const preloadThumbnail = async () => {
      try {
        // 영상 첫 프레임(0초)에서 썸네일 생성
        const thumbnail = await getThumbnailAsync(videoUri, {
          time: 0.0, // 첫 프레임
          quality: 0.5 // 압축 품질 (0.0-1.0)
        });
        setThumbnailUri(thumbnail.uri);
      } catch (error) {
        console.warn('썸네일 생성 실패:', error);
        // 썸네일 실패해도 비디오 재생은 계속됨
      }
    };

    preloadThumbnail();
  }, [videoUri]);

  // 플레이어 설정
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true;
    if (isVisible) {
      player.play(); // 화면에 보이면 자동 재생
    }
    setIsPlayerReady(true);
    playerRef.current = player;
  });

  // Visibility 변화에 따른 플레이어 제어
  useEffect(() => {
    if (!player || !isPlayerReady) return;

    if (isVisible && player.playing === false) {
      player.play();
    } else if (!isVisible && player.playing === true) {
      player.pause();
    }
  }, [isVisible, player, isPlayerReady]);

  // 메모리 정리 불필요 - useVideoPlayer 훅이 자동으로 처리함
  // createVideoPlayer()로 수동 생성한 경우에만 release() 직접 호출 필요

  return (
    <View style={styles.videoContainer}>
      {/* 썸네일 표시 (비디오 로딩 전) */}
      {!isPlayerReady && thumbnailUri && (
        <Image
          source={{ uri: thumbnailUri }}
          style={styles.mainImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      {/* 비디오 플레이어 */}
      <VideoView
        player={player}
        style={styles.mainImage}
        nativeControls={false}
        contentFit="contain"
        // 안드로이드 겹침 문제 해결 - textureView 사용
        surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
        // 비디오가 준비되면 썸네일 오버레이
        onFirstFrameRender={() => setThumbnailUri(null)}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // feedId, videoUri, isVisible가 동일하면 리렌더링 방지
  return prevProps.feedId === nextProps.feedId &&
         prevProps.videoUri === nextProps.videoUri &&
         prevProps.isVisible === nextProps.isVisible;
});

export default function FeedCard({
  feed,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  onUserPress,
  onImagePress,
  onMenuPress,
  isVisible = true // 기본적으로 보이는 것으로 설정
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

  // 카로셀 페이지 상태 관리
  const [currentPage, setCurrentPage] = useState(0);

  const navigation = useNavigation<FeedCardNavigationProp>();
  const { setShouldRefreshFeeds } = useFeedStore(); // 피드 목록 새로고침 플래그 설정용
  const { setShouldRefreshProfileFeeds } = useProfileStore(); // 프로필 플래그 설정용

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

  // 좋아요 토글 핸들러 (낙관적 UI 적용 + useCallback 최적화)
  const handleLikePress = useCallback(async () => {
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
  }, [isLikeLoading, isLiked, likeCount, feed.id, onLikePress]);

  // 북마크 토글 핸들러 (낙관적 UI 적용, FeedDetailScreen과 동일 패턴 + useCallback 최적화)
  const handleBookmarkPress = useCallback(async () => {
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
  }, [isBookmarkLoading, isBookmarked, bookmarkCount, feed.id, onBookmarkPress]);

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

        {/* 모든 피드카드에 메뉴 버튼 표시 */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => onMenuPress?.(feed)}
          activeOpacity={0.7}
        >
          <MenuIcon size={20} color={colors.GRAY_700} />
        </TouchableOpacity>
      </View>

      {/* 미디어 영역 (이미지 + 비디오) */}
      {mediaBlocks.length > 0 && (
        <>
          {mediaBlocks.length === 1 ? (
            // 단일 미디어 표시 (+(media_count - 1) 표시하지 않음, 대신 전체 개수 표시)
            <TouchableOpacity style={styles.imageContainer} onPress={handleImagePress} activeOpacity={0.9}>
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
              {/* 단일 미디어일 때는 세로 영역 표시 */}
              {feed.media_count > 1 && (
                <View style={styles.imageCountBadge}>
                  <Text style={styles.imageCountText}>{feed.media_count}장</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            // 다중 미디어 카로셀
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
              onMomentumScrollEnd={(event) => {
                const page = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setCurrentPage(page);
              }}
              decelerationRate="fast"
            >
              {mediaBlocks.map((block, index) => (
                <View key={block.sequence} style={styles.carouselItem}>
                  {index === 0 && mediaBlocks.length > 1 && (
                    <Text style={styles.moreImagesText}>
                      +{mediaBlocks.length - 1}
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
            </ScrollView>
          )}
        </>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: COLORS.WHITE,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    zIndex: 10, // 이미지 위에 표시되도록 zIndex 추가
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
