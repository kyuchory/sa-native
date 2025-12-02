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
  // 🔥 비디오 플레이어 - URL을 직접 전달 (안정적인 참조)
  const player = useVideoPlayer(item.content_url || '', (player) => {
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

  // 🔥 애니메이션 참조를 useRef로 관리
  const overlayAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // 🔥 player의 유효성을 추적하기 위한 ref
  const isPlayerValidRef = useRef(true);

  const triggerOverlay = useCallback((isPlayingNow: boolean) => {
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
      if (finished) setShowOverlayIcon(false);
    });
  }, [overlayOpacity]);

  // 🔥 재생/정지 제어
  useEffect(() => {
    if (item.type !== 'video') return;

    // player 유효성 플래그 설정
    isPlayerValidRef.current = true;

    if (isActive) {
      try {
        player.play();
        startTracking(player);
      } catch (error) {
        console.warn('Video play error:', error);
      }
    } else {
      try {
        player.pause();
        stopTracking();
        recordAndReset();
      } catch (error) {
        console.warn('Video pause error:', error);
      }
    }
  }, [isActive, item.type]); // 🔥 player 제외

  // 🔥 언마운트 시 정리 - 한 번만 실행
  useEffect(() => {
    return () => {
      // 애니메이션 정리
      if (overlayAnimationRef.current) {
        overlayAnimationRef.current.stop();
      }

      // 시청 기록 저장
      recordAndReset();

      // 🔥 player가 유효한 경우에만 pause 호출
      if (item.type === 'video' && isPlayerValidRef.current) {
        try {
          player.pause();
        } catch (error) {
          // player가 이미 해제된 경우 에러 무시
          console.warn('Video cleanup error (ignored):', error);
        }
      }

      // player 무효화 표시
      isPlayerValidRef.current = false;
    };
  }, []); // 🔥 빈 배열 - 마운트 시 한 번만 등록

  const handleTogglePlay = useCallback(() => {
    if (item.type !== 'video' || !isActive || !isPlayerValidRef.current) return;

    try {
      if (player.playing) {
        player.pause();
        triggerOverlay(false);
      } else {
        player.play();
        triggerOverlay(true);
      }
    } catch (error) {
      console.warn('Toggle play error:', error);
    }
  }, [item.type, isActive, player, triggerOverlay]);

  // 🔥 콜백 함수들을 useCallback으로 감싸기
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
// 🔥 커스텀 비교 함수 - 불필요한 리렌더링 방지
(prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.extraBottomMargin === nextProps.extraBottomMargin &&
    // 좋아요/북마크 상태는 내부에서 관리하므로 비교 불필요
    prevProps.item.content_url === nextProps.item.content_url
  );
}
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: COLORS.BLACK, // 🔥 배경색 추가로 깜빡임 방지
  },
  media: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // 🔥 포인터 이벤트를 통과시켜 아래 버튼들이 동작하도록
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
