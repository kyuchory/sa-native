import React, { useState, useRef, useEffect } from 'react';
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
  const player = useVideoPlayer((item.content_url || '') as string, (player) => {
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);

  const triggerOverlay = (isPlayingNow: boolean) => {
    setOverlayIsPlaying(isPlayingNow);
    setShowOverlayIcon(true);
    overlayOpacity.setValue(1);

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShowOverlayIcon(false);
    });
  };

  // 🔥 중복 제거: 재생/정지 + 시청 추적을 하나의 useEffect로 통합
  useEffect(() => {
    if (item.type !== 'video') return;

    if (isActive) {
      player.play();
      startTracking(player);
    } else {
      player.pause();
      stopTracking();
      recordAndReset();
    }
  }, [isActive, item.type, player, startTracking, stopTracking, recordAndReset]);

  // 언마운트 시 기록 저장
  useEffect(() => {
    return () => recordAndReset();
  }, [recordAndReset]);

  const handleTogglePlay = () => {
    if (item.type !== 'video' || !isActive) return;

    if (player.playing) {
      player.pause();
      triggerOverlay(false);
    } else {
      player.play();
      triggerOverlay(true);
    }
  };

  // 이미지 타입
  if (item.type === 'image') {
    return (
      <View style={styles.container}>
        <Image source={{ uri: item.content_url }} style={styles.media} />

        <ShortActionButtons
          isLiked={isLiked}
          likeCount={likeCount}
          isLikeLoading={isLikeLoading}
          commentCount={item.comment_count}
          isBookmarked={isBookmarked}
          isBookmarkLoading={isBookmarkLoading}
          viewCount={item.view_count}
          onLike={toggleLike}
          onComment={() => onComment(item.id)}
          onBookmark={toggleBookmark}
          onShare={() => onShare(item.id)}
          onUpload={onUpload}
        />

        <ShortBottomOverlay
          username={item.username}
          profileImg={item.profile_img}
          createdAt={item.created_at}
          description={item.description}
          categories={item.categories}
          isExpanded={isDescriptionExpanded}
          onToggleExpand={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          onProfilePress={() => onProfilePress(item.user_id.toString())}
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
        onComment={() => onComment(item.id)}
        onBookmark={toggleBookmark}
        onShare={() => onShare(item.id)}
        onUpload={onUpload}
      />

      <ShortBottomOverlay
        username={item.username}
        profileImg={item.profile_img}
        createdAt={item.created_at}
        description={item.description}
        categories={item.categories}
        isExpanded={isDescriptionExpanded}
        onToggleExpand={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
        onProfilePress={() => onProfilePress(item.user_id.toString())}
        extraBottomMargin={extraBottomMargin}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
