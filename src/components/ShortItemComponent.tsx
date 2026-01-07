import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { PlayIcon, PauseIcon } from './CutIcons';
import { ShortActionButtons } from './ShortActionButtons';
import { ShortBottomOverlay } from './ShortBottomOverlay';
import { useShortViewTracking } from '../hooks/useShortViewTracking';
import { useShortInteractions } from '../hooks/useShortInteractions';
import { ShortItem, RecordShortViewRequest } from '../types/cut';
import { COLORS } from '../constants/theme';

interface ShortItemProps {
  item: ShortItem;
  isActive: boolean;
  onComment: (short: ShortItem) => void;
  onShare: (short: ShortItem) => void;
  onUpload: () => void;
  onViewComplete: (shortId: number, data: RecordShortViewRequest) => void;
  onProfilePress: (userId: string) => void;
  extraBottomMargin?: number;
}

export const ShortItemComponent = React.memo<ShortItemProps>(({
  item,
  isActive,
  onComment,
  onShare,
  onUpload,
  onViewComplete,
  onProfilePress,
  extraBottomMargin,
}) => {
  // 🔥 비디오 플레이어 - 단순화
  const player = useVideoPlayer(item.content_url ?? '');

  const { startTracking, stopTracking, recordAndReset } = useShortViewTracking({
    shortId: item.id,
    isActive,
    onViewComplete,
  });

  // ✅ 최신 player를 항상 ref에 유지
  const playerRef = useRef<any>(null);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // ✅ 최신 isActive를 이벤트에서도 쓰기 위한 ref
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // ✅ 비디오 ready 상태 기억용 ref
  const isReadyRef = useRef(false);

  useEffect(() => {
    if (player) {
      player.loop = false; // 🔥 loop 비활성화

      const handleStatusChange = (payload: any) => {
        if (payload.status === 'readyToPlay') {
          isReadyRef.current = true;

          try {
            playerRef.current?.seekBy?.(0.1);
          } catch {}

          // ✅ 지금 활성 상태면 재생 보장 + tracking 시작
          if (isActiveRef.current) {
            try {
              playerRef.current?.play?.();
              startTracking(playerRef.current);
            } catch {}
          }

          playerRef.current?.removeListener?.('statusChange', handleStatusChange);
        }
      };

      // 🔥 영상 종료 시 처음으로 돌아가기 (iOS 검은 화면 방지)
      const handlePlayToEnd = () => {
        if (isMountedRef.current && !isCleaningUpRef.current && isActiveRef.current) {
          try {
            const p = playerRef.current;
            if (!p) return;
            p.currentTime = 0.1;
            p.play?.();
          } catch {}
        }
      };

      player.addListener('statusChange', handleStatusChange);
      player.addListener('playToEnd', handlePlayToEnd);

      return () => {
        player.removeListener('statusChange', handleStatusChange);
        player.removeListener('playToEnd', handlePlayToEnd);
      };
    }
  }, [player, startTracking]);

  const {
    isLiked,
    likeCount,
    isLikeLoading,
    isBookmarked,
    isBookmarkLoading,
    toggleLike,
    toggleBookmark,
  } = useShortInteractions({
    shortId: item.id,
    initialLiked: item.is_liked || false,
    initialLikeCount: item.like_count,
    initialBookmarked: item.is_bookmarked || false,
  });

  const [showOverlayIcon, setShowOverlayIcon] = useState(false);
  const [overlayIsPlaying, setOverlayIsPlaying] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const overlayAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // 🔥 cleanup 플래그 추가
  const isCleaningUpRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasCalledPauseRef = useRef(false); // 🔥 pause 호출 여부 추적

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

  // ✅ 최신 player 기준으로 제어
  const safePause = useCallback(() => {
    if (isCleaningUpRef.current) return;

    try {
      playerRef.current?.pause?.();
      hasCalledPauseRef.current = true;
    } catch {}
  }, []);

  const safePlay = useCallback(() => {
    if (isCleaningUpRef.current) return;

    try {
      playerRef.current?.play?.();
    } catch {}
  }, []);

  // 🔥 재생/정지 제어 - 개선된 버전
  useEffect(() => {
    if (isCleaningUpRef.current) return;

    if (isActive) {
      hasCalledPauseRef.current = false;

      const t = setTimeout(() => {
        if (!isCleaningUpRef.current && isMountedRef.current) {
          safePlay();

          // ✅ 추가: 이미 ready 상태면 여기서 tracking 시작
          if (isReadyRef.current) {
            startTracking(playerRef.current);
          }
        }
      }, 50);

      return () => clearTimeout(t);
    } else {
      safePause();
      stopTracking();
      recordAndReset();
    }
  }, [isActive, item.id, safePlay, safePause, stopTracking, recordAndReset, startTracking]);

  // 🔥 언마운트 시 정리 - 개선된 버전
  useEffect(() => {
    return () => {
      // 🔥 cleanup 플래그 설정
      isCleaningUpRef.current = true;
      isMountedRef.current = false;

      // 애니메이션 정리
      if (overlayAnimationRef.current) {
        overlayAnimationRef.current.stop();
      }

      // 시청 기록 저장
      recordAndReset();

      // 🔥 safePause 사용 (중복 방지)
      safePause();
    };
  }, [safePause]); // 🔥 safePause 의존성 추가

  const handleTogglePlay = useCallback(() => {
    if (!isActive || isCleaningUpRef.current) return;

    const p = playerRef.current;
    if (!p) return;

    try {
      if (p.playing) {
        safePause();
        triggerOverlay(false);
      } else {
        hasCalledPauseRef.current = false;
        p.play?.();
        triggerOverlay(true);
      }
    } catch (e) {
      console.warn('Toggle play error:', e);
    }
  }, [isActive, triggerOverlay, safePause]);

  const handleComment = useCallback(() => onComment(item), [onComment, item]);
  const handleShare = useCallback(() => onShare(item), [onShare, item]);
  const handleProfilePress = useCallback(() => onProfilePress(item.user_id.toString()), [onProfilePress, item.user_id]);

  // 비디오 타입
  return (
    <View style={styles.container}>
      <VideoView
        key={`video-${item.id}`}
        style={styles.media}
        player={player}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />

      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleTogglePlay}
      >
        {showOverlayIcon && (
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <View style={styles.overlayIcon}>
              {overlayIsPlaying ? (
                <PlayIcon size={48} color={COLORS.WHITE} filled />
              ) : (
                <PauseIcon size={48} color={COLORS.WHITE} filled />
              )}
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>

      <ShortActionButtons
        isLiked={isLiked}
        likeCount={likeCount}
        isLikeLoading={isLikeLoading}
        commentCount={item.comment_count}
        isBookmarked={isBookmarked}
        isBookmarkLoading={isBookmarkLoading}
        viewCount={item.view_count}
        onLike={toggleLike}
        onComment={handleComment}
        onBookmark={toggleBookmark}
        onShare={handleShare}
        onUpload={onUpload}
        bottomInsets={extraBottomMargin}
      />

      <ShortBottomOverlay
        nickname={item.nickname}
        profileImg={item.profile_img}
        createdAt={item.created_at}
        description={item.description}
        categories={item.categories}
        onProfilePress={handleProfilePress}
        bottomInsets={extraBottomMargin}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: COLORS.BLACK,
  },
  media: {
    width: '100%',
    height: '100%',
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
});
