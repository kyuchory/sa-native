import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform, Animated } from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer, VideoSource } from 'expo-video';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import { TYPOGRAPHY, SPACING, COLORS } from '../constants/theme';
import { ShortItem } from '../types/cut';
import { CutService } from '../services/cutService';
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

interface FeedCutCardProps {
  cut: ShortItem;
  onLikePress?: (cutId: number) => void;
  onCommentPress?: (cutId: number) => void;
  onBookmarkPress?: (cutId: number) => void;
  onUserPress?: (userId: number) => void;
  onMenuPress?: (cut: ShortItem) => void;
  onCutPress?: (cut: ShortItem) => void;
  isVisible?: boolean;
}

type FeedCutCardNavigationProp = StackNavigationProp<AuthStackParamList>;

import { HeartIcon, CommentIcon, BookmarkIcon } from './FeedCardIcons';
import UserAvatar from './UserAvatar';

// TapPauseVideo 컴포넌트 (Cut용)
const TapPauseVideo = React.memo(({
  videoUri,
  thumbnailUri: serverThumbnailUri,
  isVisible,
  onPress,
  cutId
}: {
  videoUri: string;
  thumbnailUri?: string;
  isVisible?: boolean;
  onPress?: () => void;
  cutId: number;
}) => {
  const networkState = useNetworkState();
  const { autoPlayMode } = useVideoSettingsStore();
  const shouldAutoPlay = shouldAutoPlayVideo(networkState.type, autoPlayMode);

  const [thumbnailUri, setThumbnailUri] = useState<string | null>(serverThumbnailUri || null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);

  const videoSource = useMemo<VideoSource>(() => ({
    uri: videoUri,
    useCaching: true,
    headers: Platform.OS === 'ios' && videoUri.includes('.m3u8') ? undefined : {}
  }), [videoUri]);

  useEffect(() => {
    // 서버 썸네일이 있으면 즉시 사용
    if (serverThumbnailUri) {
      setThumbnailUri(serverThumbnailUri);
      return;
    }

    // 서버 썸네일이 없으면 클라이언트에서 생성 (폴백)
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
  }, [videoUri, serverThumbnailUri]);

  const player = useVideoPlayer(videoUri, player => {
    player.loop = false; // 🔥 loop 비활성화 (ShortItemComponent 방식)
    player.muted = true;
    setIsPlayerReady(true);
    playerRef.current = player;
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
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // 🔥 cleanup 플래그 추가 (ShortItemComponent 방식)
  const isCleaningUpRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasCalledPauseRef = useRef(false); // 🔥 pause 호출 여부 추적

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

  // 🔥 개선된 재생/정지 제어 (ShortItemComponent 방식)
  useEffect(() => {
    if (isCleaningUpRef.current) return;

    if (isVisible && shouldAutoPlay) {
      // pause 플래그 리셋
      hasCalledPauseRef.current = false;

      const playTimer = setTimeout(() => {
        if (!isCleaningUpRef.current && isMountedRef.current) {
          try {
            player?.play();
            setIsPlaying(true);
          } catch (error) {
            console.warn('Video auto-play error:', error);
          }
        }
      }, 50);

      return () => {
        clearTimeout(playTimer);
      };
    } else {
      // 🔥 safePause 사용
      safePause();
      setIsPlaying(false);
    }
  }, [isVisible, shouldAutoPlay, player, safePause]);

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTogglePlay = useCallback(() => {
    if (isCleaningUpRef.current) return;

    try {
      if (isPlaying) {
        safePause(); // 🔥 safePause 사용
        setIsPlaying(false);
        triggerOverlay(false);
      } else {
        hasCalledPauseRef.current = false; // play 시 플래그 리셋
        player?.play();
        setIsPlaying(true);
        triggerOverlay(true);
      }
    } catch (error) {
      console.warn('Toggle play error:', error);
    }
  }, [isPlaying, safePause, triggerOverlay, player]);

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
    <View style={cutVideoStyles.container}>
      {!isPlayerReady && thumbnailUri && (
        <Image
          source={{ uri: thumbnailUri }}
          style={cutVideoStyles.mainImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}

      <VideoView
        player={player}
        style={cutVideoStyles.videoView}
        contentFit="contain"
        nativeControls={false}
        surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
        onFirstFrameRender={() => setThumbnailUri(null)}
      />

      {/* 음소거 버튼 */}
      <TouchableOpacity
        onPress={handleToggleMute}
        activeOpacity={0.9}
        style={cutVideoStyles.muteButton}
      >
        {isMuted ? (
          <MuteIcon size={20} color={COLORS.WHITE} />
        ) : (
          <UnmuteIcon size={20} color={COLORS.WHITE} />
        )}
      </TouchableOpacity>

      {/* 탭으로 재생/일시정지 */}
      <TouchableOpacity
        onPress={handleTogglePlay}
        activeOpacity={1}
        style={cutVideoStyles.touchOverlay}
      >
        {showOverlayIcon && (
          <Animated.View style={[cutVideoStyles.overlay, { opacity: overlayOpacity }]}>
            <View style={cutVideoStyles.overlayIcon}>
              {overlayIsPlaying ? (
                <PlayIcon size={48} color={COLORS.WHITE} filled />
              ) : (
                <PauseIcon size={48} color={COLORS.WHITE} filled />
              )}
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* 하단 오버레이 - 인스타그램 스타일 */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={cutVideoStyles.bottomOverlay}
      >
        <View style={cutVideoStyles.bottomContent}>
          <Text style={cutVideoStyles.bottomText}>Cuts</Text>
          <Text style={cutVideoStyles.arrowText}>›</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
},
(prevProps, nextProps) => {
  return prevProps.cutId === nextProps.cutId &&
         prevProps.videoUri === nextProps.videoUri &&
         prevProps.isVisible === nextProps.isVisible &&
         prevProps.thumbnailUri === nextProps.thumbnailUri;
}
);

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

function FeedCutCard({
  cut,
  onLikePress,
  onCommentPress,
  onBookmarkPress,
  onUserPress,
  onMenuPress,
  onCutPress,
  isVisible = true
}: FeedCutCardProps) {
  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(cut.is_liked);
  const [likeCount, setLikeCount] = useState(cut.like_count);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(cut.is_bookmarked);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  const navigation = useNavigation<FeedCutCardNavigationProp>();
  const { setShouldRefreshFeeds } = useFeedStore();
  const { setShouldRefreshProfileFeeds } = useProfileStore();

  useEffect(() => {
    setIsLiked(cut.is_liked || false);
    setLikeCount(cut.like_count);
  }, [cut.is_liked, cut.like_count]);

  useEffect(() => {
    setIsBookmarked(cut.is_bookmarked || false);
  }, [cut.is_bookmarked]);

  const handleLikePress = useCallback(async () => {
    if (isLikeLoading) return;

    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;
    const newLikeState = !isLiked;

    setIsLiked(newLikeState);
    setLikeCount(prev => newLikeState ? prev + 1 : Math.max(0, prev - 1));
    setIsLikeLoading(true);

    try {
      const response = await CutService.toggleShortLike(cut.id);
      setIsLiked(response.data.is_liked);
      setLikeCount(response.data.like_count);
      onLikePress?.(cut.id);
    } catch (error) {
      console.error('컷츠 좋아요 토글 실패:', error);
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);
    } finally {
      setIsLikeLoading(false);
    }
  }, [isLikeLoading, isLiked, likeCount, cut.id, onLikePress]);

  const handleBookmarkPress = useCallback(async () => {
    if (isBookmarkLoading) return;

    const originalIsBookmarked = isBookmarked;
    const newBookmarkState = !isBookmarked;

    setIsBookmarked(newBookmarkState);
    setIsBookmarkLoading(true);

    try {
      const response = await CutService.toggleShortBookmark(cut.id);
      setIsBookmarked(response.data.is_bookmarked);
      onBookmarkPress?.(cut.id);
    } catch (error) {
      console.error('컷츠 북마크 토글 실패:', error);
      setIsBookmarked(originalIsBookmarked);
    } finally {
      setIsBookmarkLoading(false);
    }
  }, [isBookmarkLoading, isBookmarked, cut.id, onBookmarkPress]);

  const handleUserPress = useCallback(() => {
    onUserPress?.(cut.user_id);
  }, [onUserPress, cut.user_id]);

  const handleCommentPress = useCallback(() => {
    onCommentPress?.(cut.id);
  }, [onCommentPress, cut.id]);

  const handleCutPress = useCallback(() => {
    navigation.navigate('CutDetail', { shortId: cut.id });
  }, [navigation, cut.id]);

  const renderContent = () => {
    if (!cut.description) return null;

    const content = cut.description;
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
            profileImg={cut.profile_img}
            nickname={cut.nickname}
            size={40}
          />
          <View style={styles.userInfo}>
            <Text style={styles.nickname}>{cut.nickname}</Text>
            <View style={styles.cutMetaInfo}>
              <Text style={styles.recommendedText}>추천 컷츠</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => onMenuPress?.(cut)}
          activeOpacity={0.7}
        >
          <MenuIcon size={20} color={colors.GRAY_700} />
        </TouchableOpacity>
      </View>

      {/* 미디어 영역 */}
      <TouchableOpacity style={styles.mediaContainer} activeOpacity={0.9} onPress={handleCutPress}>
        {cut.type === 'video' ? (
          <TapPauseVideo
            videoUri={cut.content_url}
            thumbnailUri={cut.thumbnail_url}
            isVisible={isVisible}
            onPress={handleCutPress}
            cutId={cut.id}
          />
        ) : (
          <View style={cutVideoStyles.container}>
            <Image
              source={{ uri: cut.content_url }}
              style={cutVideoStyles.imageView}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={200}
            />

            {/* 상단 오버레이 */}
            <View style={cutVideoStyles.topOverlay}>
              <TouchableOpacity
                style={cutVideoStyles.cutTextContainer}
                onPress={handleCutPress}
                activeOpacity={0.8}
              >
                <Text style={cutVideoStyles.cutText}>컷츠로 이동하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>

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
            <Text style={styles.actionCount}>{cut.comment_count}</Text>
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
        </View>
      </View>

      {cut.description && (
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      )}

      <Text style={styles.timeText}>{formatTimeAgo(cut.created_at)}</Text>
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
  cutMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  recommendedText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  cutLinkText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginLeft: SPACING.SM,
  },
  mediaContainer: {
    position: 'relative',
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
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  }
});

const cutVideoStyles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: screenWidth * 1.2, // 세로형: 정방형보다 20% 더 길게
    position: 'relative' as const,
  },
  videoView: {
    width: screenWidth,
    height: screenWidth * 1.2,
  },
  mainImage: {
    width: screenWidth,
    height: screenWidth * 1.2,
  },
  imageView: {
    width: screenWidth,
    height: screenWidth * 1.2,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    // 배경 없음 - 깔끔하게
  },
  cutTextContainer: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    // 배경 없음 - 텍스트만
  },
  cutText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cutButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  cutButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.BLACK,
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
  touchOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  overlayIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: SPACING.SM,
    right: SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    zIndex: 15,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bottomText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  arrowText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
    marginTop: -1, // 살짝 위로 올려서 정렬
  },
});

const feedCutCardPropsAreEqual = (prevProps: FeedCutCardProps, nextProps: FeedCutCardProps): boolean => {
  const prevCut = prevProps.cut;
  const nextCut = nextProps.cut;

  // 기본 정보 비교
  if (
    prevCut.id !== nextCut.id ||
    prevCut.is_liked !== nextCut.is_liked ||
    prevCut.like_count !== nextCut.like_count ||
    prevCut.is_bookmarked !== nextCut.is_bookmarked ||
    prevCut.comment_count !== nextCut.comment_count ||
    prevProps.isVisible !== nextProps.isVisible
  ) {
    return false;
  }

  // 컨텐츠 비교
  if (prevCut.description !== nextCut.description) {
    return false;
  }

  // 미디어 정보 비교
  if (prevCut.content_url !== nextCut.content_url ||
      prevCut.thumbnail_url !== nextCut.thumbnail_url ||
      prevCut.type !== nextCut.type) {
    return false;
  }

  return true;
};

export default React.memo(FeedCutCard, feedCutCardPropsAreEqual);
