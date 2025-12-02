import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Image, Animated, StyleSheet } from 'react-native';
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
  onComment: (shortId: number) => void;
  onShare: (shortId: number) => void;
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
  // 🔥 videoSource를 useMemo로 안정화
  const videoSource = React.useMemo(() => item.content_url || '', [item.content_url]);
  
  // 🔥 비디오 플레이어 - 안정적인 source 사용
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
  });

  const { startTracking, stopTracking, recordAndReset } = useShortViewTracking({
    shortId: item.id,
    isActive,
    onViewComplete,
  });

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
  }, [overlayOpacity]);

  // 🔥 안전한 pause 함수
  const safePause = useCallback(() => {
    if (item.type !== 'video') return;
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
  }, [item.type, player]);

  // 🔥 재생/정지 제어 - 개선된 버전
  useEffect(() => {
    if (item.type !== 'video') return;
    if (isCleaningUpRef.current) return;

    if (isActive) {
      // pause 플래그 리셋
      hasCalledPauseRef.current = false;
      
      const playTimer = setTimeout(() => {
        if (!isCleaningUpRef.current && isMountedRef.current) {
          try {
            player.play();
            startTracking(player);
          } catch (error) {
            console.warn('Video play error:', error);
          }
        }
      }, 50);

      return () => {
        clearTimeout(playTimer);
      };
    } else {
      // 🔥 safePause 사용
      safePause();
      stopTracking();
      recordAndReset();
    }
  }, [isActive, item.type, item.id, safePause]);

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
    if (item.type !== 'video' || !isActive || isCleaningUpRef.current) return;

    try {
      if (player.playing) {
        safePause(); // 🔥 safePause 사용
        triggerOverlay(false);
      } else {
        hasCalledPauseRef.current = false; // play 시 플래그 리셋
        player.play();
        triggerOverlay(true);
      }
    } catch (error) {
      console.warn('Toggle play error:', error);
    }
  }, [item.type, isActive, player, triggerOverlay, safePause]);

  const handleComment = useCallback(() => onComment(item.id), [onComment, item.id]);
  const handleShare = useCallback(() => onShare(item.id), [onShare, item.id]);
  const handleProfilePress = useCallback(() => onProfilePress(item.user_id.toString()), [onProfilePress, item.user_id]);

  // 이미지 타입
  if (item.type === 'image') {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: item.content_url }}
          style={styles.media}
          resizeMode="cover"
        />

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
        />

        <ShortBottomOverlay
          username={item.username}
          profileImg={item.profile_img}
          createdAt={item.created_at}
          description={item.description}
          categories={item.categories}
          onProfilePress={handleProfilePress}
          extraBottomMargin={extraBottomMargin}
        />
      </View>
    );
  }

  // 비디오 타입
  return (
    <View style={styles.container}>
      <VideoView
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
      />

      <ShortBottomOverlay
        username={item.username}
        profileImg={item.profile_img}
        createdAt={item.created_at}
        description={item.description}
        categories={item.categories}
        onProfilePress={handleProfilePress}
        extraBottomMargin={extraBottomMargin}
      />
    </View>
  );
},
// 🔥 커스텀 비교 함수
(prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.extraBottomMargin === nextProps.extraBottomMargin &&
    prevProps.item.content_url === nextProps.item.content_url
  );
}
);

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