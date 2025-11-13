import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import * as MediaLibrary from 'expo-media-library';
import { File, Paths } from 'expo-file-system';
import * as Network from 'expo-network';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SaveIcon, ShareIcon } from './CommonIcons';
import { useVideoSettingsStore } from '../stores/videoSettingsStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
}

interface MediaViewerModalProps {
  visible: boolean;
  mediaItems: MediaItem[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

// 시간 포맷 함수
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 개별 미디어 아이템 컴포넌트
const MediaItemView: React.FC<{
  mediaItem: MediaItem;
  index: number;
  currentPage: number;
  isZoomed: boolean;
  onZoomChange: (zoomed: boolean) => void;
}> = ({ mediaItem, index, currentPage, isZoomed, onZoomChange }) => {
  const isActive = currentPage === index;
  const isVideo = mediaItem.type === 'video';
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  useEffect(() => {
    if (!isActive) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [isActive]);

  const resetPosition = useCallback(() => {
    'worklet';
    scale.value = withTiming(1, { duration: 300 });
    savedScale.value = 1;
    translateX.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, []);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .enabled(isActive && !isVideo)
    .onEnd((event) => {
      if (scale.value > 1.5) {
        resetPosition();
      } else {
        const tapX = event.x - SCREEN_WIDTH / 2;
        const tapY = event.y - SCREEN_HEIGHT / 2;

        scale.value = withTiming(DOUBLE_TAP_SCALE, { duration: 300 });
        savedScale.value = DOUBLE_TAP_SCALE;
        translateX.value = withTiming(-tapX * (DOUBLE_TAP_SCALE - 1), { duration: 300 });
        translateY.value = withTiming(-tapY * (DOUBLE_TAP_SCALE - 1), { duration: 300 });
        savedTranslateX.value = -tapX * (DOUBLE_TAP_SCALE - 1);
        savedTranslateY.value = -tapY * (DOUBLE_TAP_SCALE - 1);
      }
    });

  const pinch = Gesture.Pinch()
    .enabled(isActive && !isVideo)
    .onBegin((event) => {
      focalX.value = event.focalX - SCREEN_WIDTH / 2;
      focalY.value = event.focalY - SCREEN_HEIGHT / 2;
    })
    .onUpdate((event) => {
      const newScale = Math.max(MIN_SCALE, Math.min(savedScale.value * event.scale, MAX_SCALE));
      scale.value = newScale;
      
      if (newScale > MIN_SCALE) {
        const deltaScale = newScale - savedScale.value;
        translateX.value = savedTranslateX.value - focalX.value * deltaScale;
        translateY.value = savedTranslateY.value - focalY.value * deltaScale;
      } else {
        translateX.value = 0;
        translateY.value = 0;
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      if (scale.value < MIN_SCALE + 0.1) {
        resetPosition();
      } else if (scale.value > MAX_SCALE) {
        scale.value = withTiming(MAX_SCALE, { duration: 300 });
        savedScale.value = MAX_SCALE;
      }
    });

  const pan = Gesture.Pan()
    .enabled(isActive && isZoomed && !isVideo)
    .onUpdate((event) => {
      const maxTransX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const maxTransY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

      translateX.value = Math.max(
        -maxTransX,
        Math.min(maxTransX, savedTranslateX.value + event.translationX)
      );
      translateY.value = Math.max(
        -maxTransY,
        Math.min(maxTransY, savedTranslateY.value + event.translationY)
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = isVideo
    ? Gesture.Manual()
    : Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useAnimatedReaction(
    () => isVideo ? false : scale.value > 1.05,
    (result, previous) => {
      if (result !== previous && isActive) {
        runOnJS(onZoomChange)(result);
      }
    },
    [isActive, isVideo]
  );

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.imageWrapper, animatedStyle]}>
        {isVideo ? (
          <VideoPlayer
            videoUrl={mediaItem.url}
            thumbnailUrl={mediaItem.thumbnailUrl}
            isVisible={isActive}
          />
        ) : (
          <Image
            source={{ uri: mediaItem.url }}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
};

export const ImageViewerModal: React.FC<MediaViewerModalProps> = ({
  visible,
  mediaItems,
  initialIndex = 0,
  title = '미디어 뷰어',
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const [currentPage, setCurrentPage] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const pageTranslateX = useSharedValue(-initialIndex * SCREEN_WIDTH);
  const savedPageTranslateX = useSharedValue(-initialIndex * SCREEN_WIDTH);
  
  const modalOpacity = useSharedValue(1);
  const modalScale = useSharedValue(1);
  const closeTranslateY = useSharedValue(0);

  const updateCurrentPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const closeModal = useCallback(() => {
    'worklet';
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.9, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [onClose]);

  const closePan = Gesture.Pan()
    .enabled(!isZoomed)
    .activeOffsetY([-15, 15])
    .failOffsetX([-15, 15])
    .onUpdate((event) => {
      closeTranslateY.value = event.translationY;
      const progress = Math.min(Math.abs(event.translationY) / 200, 1);
      modalOpacity.value = 1 - progress * 0.5;
      modalScale.value = 1 - progress * 0.1;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationY) > 150 || Math.abs(event.velocityY) > 1000) {
        closeModal();
      } else {
        closeTranslateY.value = withTiming(0, { duration: 300 });
        modalOpacity.value = withTiming(1, { duration: 300 });
        modalScale.value = withTiming(1, { duration: 300 });
      }
    });

  const pageSwipe = Gesture.Pan()
    .enabled(!isZoomed)
    .activeOffsetX([-15, 15])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      const newTranslate = savedPageTranslateX.value + event.translationX;
      const minTranslate = -(mediaItems.length - 1) * SCREEN_WIDTH;
      pageTranslateX.value = Math.max(minTranslate, Math.min(0, newTranslate));
    })
    .onEnd((event) => {
      const currentIdx = Math.round(-savedPageTranslateX.value / SCREEN_WIDTH);
      let nextIdx = currentIdx;

      if (event.velocityX < -800 && currentIdx < mediaItems.length - 1) {
        nextIdx = currentIdx + 1;
      } else if (event.velocityX > 800 && currentIdx > 0) {
        nextIdx = currentIdx - 1;
      } else {
        const threshold = SCREEN_WIDTH * 0.3;
        if (event.translationX < -threshold && currentIdx < mediaItems.length - 1) {
          nextIdx = currentIdx + 1;
        } else if (event.translationX > threshold && currentIdx > 0) {
          nextIdx = currentIdx - 1;
        }
      }

      const targetTranslate = -nextIdx * SCREEN_WIDTH;
      pageTranslateX.value = withTiming(targetTranslate, { duration: 300 });
      savedPageTranslateX.value = targetTranslate;

      if (nextIdx !== currentIdx) {
        runOnJS(updateCurrentPage)(nextIdx);
      }
    });

  const containerGesture = Gesture.Simultaneous(pageSwipe, closePan);

  const pageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pageTranslateX.value }],
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [
      { scale: modalScale.value },
      { translateY: closeTranslateY.value },
    ],
  }));

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const mediaItem = mediaItems[currentPage];
    if (!mediaItem) return;

    try {
      setIsSaving(true);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('갤러리 저장 권한이 필요합니다.');
        return;
      }

      let localUri = mediaItem.url;
      if (mediaItem.url.startsWith('http')) {
        const filename = mediaItem.url.split('/').pop() || `media_${Date.now()}.${mediaItem.type === 'video' ? 'mp4' : 'jpg'}`;
        const file = new File(Paths.cache, filename);
        await File.downloadFileAsync(mediaItem.url, file);
        localUri = file.uri;
      }

      const asset = await MediaLibrary.createAssetAsync(localUri);

      if (Platform.OS === 'android') {
        const album = await MediaLibrary.getAlbumAsync('Download');
        if (album == null) {
          await MediaLibrary.createAlbumAsync('Download', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      }

      alert(`${mediaItem.type === 'video' ? '비디오' : '이미지'}가 갤러리에 저장되었습니다.`);
    } catch (error) {
      console.error('미디어 저장 실패:', error);
      alert('미디어 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [mediaItems, currentPage, isSaving]);

  useEffect(() => {
    if (visible) {
      setCurrentPage(initialIndex);
      setIsZoomed(false);

      pageTranslateX.value = -initialIndex * SCREEN_WIDTH;
      savedPageTranslateX.value = -initialIndex * SCREEN_WIDTH;

      modalOpacity.value = 1;
      modalScale.value = 1;
      closeTranslateY.value = 0;
    }
  }, [visible, initialIndex]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <StatusBar barStyle="light-content" />
          
          <View style={styles.background} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <GestureDetector gesture={containerGesture}>
            <Animated.View style={[styles.imageScrollContainer, pageStyle]}>
              {mediaItems.map((mediaItem, index) => (
                <MediaItemView
                  key={`media-${index}`}
                  mediaItem={mediaItem}
                  index={index}
                  currentPage={currentPage}
                  isZoomed={isZoomed}
                  onZoomChange={setIsZoomed}
                />
              ))}
            </Animated.View>
          </GestureDetector>

          <View style={[styles.bottomMenu, { marginBottom: insets.bottom }]}>
            <TouchableOpacity style={styles.menuButton} activeOpacity={0.7} onPress={handleSave}>
              <SaveIcon size={24} color="#fff" />
              <Text style={styles.menuText}>저장</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
              <ShareIcon size={24} color="#fff" />
              <Text style={styles.menuText}>공유</Text>
            </TouchableOpacity>
          </View>

          {mediaItems.length > 1 && (
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {currentPage + 1} / {mediaItems.length}
              </Text>
            </View>
          )}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// 커스텀 비디오 플레이어
const VideoPlayer: React.FC<{
  videoUrl: string;
  thumbnailUrl?: string;
  isVisible: boolean;
}> = ({ videoUrl, thumbnailUrl, isVisible }) => {
  const { autoPlayMode } = useVideoSettingsStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [networkState, setNetworkState] = useState<'wifi' | 'cellular' | 'none'>('none');
  
  const controlsOpacity = useSharedValue(1);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkNetwork = async () => {
      const networkState = await Network.getNetworkStateAsync();
      if (networkState.isConnected) {
        if (networkState.type === Network.NetworkStateType.WIFI) {
          setNetworkState('wifi');
        } else {
          setNetworkState('cellular');
        }
      } else {
        setNetworkState('none');
      }
    };
    checkNetwork();
  }, []);

  const shouldAutoPlay = useMemo(() => {
    if (!isVisible) return false;

    switch (autoPlayMode) {
      case 'always':
        return true;
      case 'wifi_only':
        return networkState === 'wifi';
      case 'cellular_only':
        return networkState === 'cellular';
      case 'manual':
      default:
        return false;
    }
  }, [autoPlayMode, networkState, isVisible]);

  const player = useVideoPlayer(videoUrl ? { uri: videoUrl } : null, (player) => {
    player.loop = false;
    player.muted = false;
    if (shouldAutoPlay) {
      player.play();
    }
  });

  const { isPlaying: playerIsPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    const sourceLoadSubscription = player.addListener('sourceLoad', (payload) => {
      const dur = payload.duration * 1000;
      setDuration(dur);
    });

    const timeUpdateSubscription = player.addListener('timeUpdate', (payload) => {
      const positionMs = payload.currentTime * 1000;
      setCurrentTime(positionMs);
    });

    player.timeUpdateEventInterval = 1 / 60;

    return () => {
      sourceLoadSubscription.remove();
      timeUpdateSubscription.remove();
    };
  }, [player]);

  useEffect(() => {
    setIsPlaying(playerIsPlaying);
  }, [playerIsPlaying]);

  useEffect(() => {
    if (isVisible && shouldAutoPlay) {
      player.play();
    } else if (!isVisible) {
      player.pause();
    }
  }, [isVisible, shouldAutoPlay, player]);

  const resetControlsTimer = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    setShowControls(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });

    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
        controlsOpacity.value = withTiming(0, { duration: 300 });
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimer();
    } else {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
      setShowControls(true);
      controlsOpacity.value = withTiming(1, { duration: 200 });
    }

    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [isPlaying, resetControlsTimer]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      // 영상이 끝났을 경우 처음부터 재생
      if (currentTime >= duration - 1000) {
        player.currentTime = 0;
      }
      player.play();
    }
    resetControlsTimer();
  }, [isPlaying, player, resetControlsTimer, currentTime, duration]);

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
    setIsMuted(!isMuted);
    resetControlsTimer();
  }, [player, isMuted, resetControlsTimer]);

  const seekTo = useCallback((time: number) => {
    player.currentTime = time;
    resetControlsTimer();
  }, [player, resetControlsTimer]);

  const progressBarTapGesture = Gesture.Tap().onEnd((e) => {
    // progress bar의 실제 너비 계산: (SCREEN_WIDTH - 48) - 40 - 12 - 12 - 40 = SCREEN_WIDTH - 152
    const progressBarWidth = SCREEN_WIDTH - 152;
    const ratio = e.x / progressBarWidth;
    const newTime = ratio * duration;
    scheduleOnRN(seekTo, newTime / 1000); // seekTo expects seconds
  });

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />

      <Animated.View style={[styles.videoControls, controlsStyle]} pointerEvents="box-none">
        {/* 전체 화면 터치 오버레이 */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            if (showControls) {
              resetControlsTimer();
            } else {
              setShowControls(true);
              controlsOpacity.value = withTiming(1, { duration: 200 });
            }
          }}
        />

        {showControls && (
          <>
            {/* 중앙 재생/일시정지 버튼 */}
            <TouchableOpacity
              style={styles.centerPlayButton}
              onPress={togglePlayPause}
              activeOpacity={0.8}
            >
              <View style={styles.centerPlayButtonInner}>
                {isPlaying ? (
                  <Svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <Path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </Svg>
                ) : (
                  <Svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <Path d="M8 5v14l11-7z" />
                  </Svg>
                )}
              </View>
            </TouchableOpacity>

          {/* 하단 컨트롤 바 */}
          <View style={styles.bottomVideoControls}>
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime / 1000)}</Text>
              <GestureDetector gesture={progressBarTapGesture}>
                <View style={styles.progressBar}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                  </View>
                </View>
              </GestureDetector>
              <TouchableOpacity
                style={styles.muteButton}
                onPress={toggleMute}
                activeOpacity={0.7}
              >
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  {isMuted ? (
                    <>
                      <Path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" />
                    </>
                  ) : (
                    <Path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  )}
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
          </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 88,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '300',
  },
  imageScrollContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  videoControls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomVideoControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  muteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 4,
  },
  menuText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    zIndex: 5,
  },
  pageIndicatorText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
});
