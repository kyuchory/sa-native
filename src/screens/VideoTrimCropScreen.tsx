import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path, Rect, Defs, Mask } from 'react-native-svg';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { manipulateAsync } from 'expo-image-manipulator';
import { useThemeStore } from '../stores/themeStore';
import useFeedStore from '../stores/feedStore';
import usePostStore from '../stores/postStore';
import { FeedService } from '../services/feedService';
import { PostService } from '../services/postService';
import { StoryService } from '../services/storyService';
import { SPACING } from '../constants/theme';
import CommonHeader from '../components/CommonHeader';
import CommonHeaderButton from '../components/CommonHeaderButton';
import CustomAlertModal from '../components/CustomAlertModal';
import LoadingOverlay from '../components/LoadingOverlay';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// SVG Icons
const CheckIcon = ({ size = 24, color = '#FFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlayIcon = ({ size = 24, color = '#FFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 5v14l11-7L8 5z" fill={color} />
  </Svg>
);

const PauseIcon = ({ size = 24, color = '#FFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill={color} />
  </Svg>
);

type Props = {
  route?: {
    params?: {
      videoUri?: string;
      videoDuration?: number;
      aspectRatio?: string;
      uploadService?: string;
      editMode?: 'both' | 'crop' | 'trim';
      maxDuration?: number;
      chatRoomId?: number;
    }
  };
  navigation?: any;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const VIDEO_CONTAINER_HEIGHT = SCREEN_H * 0.6;
const VIDEO_PADDING = 16;

// 유틸리티: 비디오 회전 정보 계산 (중복 로직 통합)
function getVideoRotationInfo(
  videoDimensions: { width: number; height: number } | null,
  actualVideoOrientation: 'landscape' | 'portrait' | null
) {
  if (!videoDimensions || !actualVideoOrientation) return null;
  
  const metadataAspectRatio = videoDimensions.width / videoDimensions.height;
  const metadataOrientation = metadataAspectRatio > 1 ? 'landscape' : 'portrait';
  const isRotated = metadataOrientation !== actualVideoOrientation;
  const effectiveAspectRatio = isRotated
    ? videoDimensions.height / videoDimensions.width
    : videoDimensions.width / videoDimensions.height;
    
  return { isRotated, effectiveAspectRatio, metadataOrientation };
}

// 유틸리티: 회전 보정 좌표 변환
function convertCropAreaForServer(
  screenCropArea: { x: number; y: number; width: number; height: number },
  videoDimensions: { width: number; height: number } | null,
  actualVideoOrientation: 'landscape' | 'portrait' | null
): { x: number; y: number; width: number; height: number } {
  const rotationInfo = getVideoRotationInfo(videoDimensions, actualVideoOrientation);
  
  if (!rotationInfo) {
    console.warn('⚠️ 비디오 차원 정보 없음, 원본 좌표 반환');
    return screenCropArea;
  }

  if (!rotationInfo.isRotated) {
    return screenCropArea;
  }

  // 90도 회전된 경우 좌표 변환
  const converted = {
    x: screenCropArea.y,
    y: 1 - (screenCropArea.x + screenCropArea.width),
    width: screenCropArea.height,
    height: screenCropArea.width,
  };

  console.log('🔄 90도 회전 좌표 변환:', {
    원본메타: videoDimensions,
    메타방향: rotationInfo.metadataOrientation,
    실제방향: actualVideoOrientation,
    화면좌표: screenCropArea,
    서버좌표: converted
  });

  return converted;
}

export default function VideoTrimCropScreen({ route, navigation }: Props) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  const videoUri = route?.params?.videoUri ?? null;
  const aspectRatio = route?.params?.aspectRatio ?? null;
  const uploadService = route?.params?.uploadService ?? null;
  const editMode = route?.params?.editMode ?? 'both';
  const maxDuration = route?.params?.maxDuration;

  // 시간 제한 메시지 생성
  const getTimeLimitMessage = useMemo(() => {
    if (!maxDuration) return '';

    const maxSeconds = Math.floor(maxDuration / 1000);
    const serviceName = {
      post: '게시글',
      feed: '피드',
      cuts: '컷츠',
      story: '데일리 컷'
    }[uploadService || ''] || '콘텐츠';

    return `(${serviceName}의 영상은 ${maxSeconds}초 이내로 편집해주세요.)`;
  }, [maxDuration, uploadService]);

  const { setVideoEditResult: setFeedVideoEditResult } = useFeedStore();
  const { setVideoEditResult: setPostVideoEditResult } = usePostStore();

  const [duration, setDuration] = useState(route?.params?.videoDuration ?? 10000);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 1, height: 1 });
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [actualVideoDimensions, setActualVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [actualVideoOrientation, setActualVideoOrientation] = useState<'landscape' | 'portrait' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState<string | undefined>(undefined);

  const player = useVideoPlayer(videoUri ? { uri: videoUri } : null, (player) => {
    player.loop = false;
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    const subscription = player.addListener('sourceLoad', (payload) => {
      const dur = payload.duration * 1000;
      setDuration(dur);
      setTrimEnd(dur);
      
      if (payload.availableVideoTracks && payload.availableVideoTracks.length > 0) {
        const videoTrack = payload.availableVideoTracks[0];
        if (videoTrack.size) {
          setVideoDimensions({
            width: videoTrack.size.width,
            height: videoTrack.size.height,
          });
        }
      }
      
      if (videoUri) {
        generateThumbnails(videoUri, dur);
      }
    });

    return () => subscription.remove();
  }, [videoUri]);

  useEffect(() => {
    const subscription = player.addListener('timeUpdate', (payload) => {
      const positionMs = payload.currentTime * 1000;
      setCurrentPosition(positionMs);

      if (positionMs >= trimEnd) {
        player.pause();
        player.currentTime = trimStart / 1000;
      }
    });

    return () => subscription.remove();
  }, [trimEnd, trimStart]);

  useEffect(() => {
    player.timeUpdateEventInterval = 1 / 60;
  }, [thumbnailUri]);

  const generateThumbnails = useCallback(async (uri: string, dur: number) => {
    const thumbnailCount = 10;
    const interval = dur / thumbnailCount;
    const thumbs: string[] = [];
    let orientationSet = false;

    try {
      for (let i = 0; i < thumbnailCount; i++) {
        // 첫 번째 썸네일은 trimStart 시간, 나머지는 기존 간격
        const rawTime = i === 0 ? trimStart : i * interval;
        const time = Math.max(0, Math.min(dur - 200, Math.floor(rawTime)));

        try {
          const result = await VideoThumbnails.getThumbnailAsync(uri, {
            time,
            quality: 0.8,
          });

          thumbs.push(result.uri);

          // 첫 번째 성공한 썸네일을 thumbnailUri로 저장
          if (!thumbnailUri) {
            setThumbnailUri(result.uri);
          }

          if (!orientationSet && result.width && result.height) {
            const thumbnailAspectRatio = result.width / result.height;
            const orientation = thumbnailAspectRatio > 1 ? 'landscape' : 'portrait';

            // 즉시 사용하기 위해 로컬 변수 orientation을 사용하고,
            // state에도 기록해 다음 렌더에서 사용 가능하게 함
            setActualVideoOrientation(orientation);
            setIsVideoReady(true);
            orientationSet = true;

            // correctedCropArea 계산 시 **로컬 orientation**을 바로 전달
            const correctedCropArea = convertCropAreaForServer(cropArea, videoDimensions, orientation);

            // cropRect를 계산할 때 픽셀 범위를 안전하게 클램프
            const originX = Math.round(correctedCropArea.x * result.width);
            const originY = Math.round(correctedCropArea.y * result.height);
            const cropW = Math.round(correctedCropArea.width * result.width);
            const cropH = Math.round(correctedCropArea.height * result.height);

            // bounds clamp: (manipulateAsync는 out-of-bounds에서 실패하기 쉬움)
            const clampedOriginX = Math.max(0, Math.min(result.width - 1, originX));
            const clampedOriginY = Math.max(0, Math.min(result.height - 1, originY));
            const clampedCropW = Math.max(1, Math.min(result.width - clampedOriginX, cropW));
            const clampedCropH = Math.max(1, Math.min(result.height - clampedOriginY, cropH));

            const cropRect = {
            }
          }
        } catch (err) {
          console.warn('⚠️ 썸네일 1개 생성 실패 (time ms:', time, '):', err);
          // 여기서는 그냥 스킵하고 다음 프레임으로 진행
        }
      }

      setThumbnails(thumbs);
    } catch (error) {
      console.error('❌ 전체 썸네일 생성 중 예상치 못한 에러:', error);
    } finally {
      // 썸네일 몇 개만 성공해도 크롭/트림 UI는 쓸 수 있게 true 처리
      setIsVideoReady(true);
    }
  }, []);

  useEffect(() => {
    player.currentTime = trimStart / 1000;
  }, [trimStart]);

  const handleConfirm = useCallback(async () => {
    if (!videoUri) return;

    // 최대 길이 제한 확인
    if (maxDuration && (trimEnd - trimStart) > maxDuration) {
      const maxSeconds = Math.floor(maxDuration / 1000);
      setAlertModal({
        visible: true,
        title: '비디오 길이 제한',
        message: `선택한 구간이 너무 깁니다.\n최대 ${maxSeconds}초까지 가능합니다.`,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    const correctedCropArea = convertCropAreaForServer(cropArea, videoDimensions, actualVideoOrientation);

    if (uploadService === 'feed') {
      // 피드 작성용: 로컬 편집 정보만 저장 (통합 업로드에서 처리)
      setFeedVideoEditResult({
        videoUri,
        editInfo: {
          trimStart,
          trimEnd,
          cropArea: correctedCropArea
        }
      });
      navigation.goBack();
    } else if (uploadService === 'post') {
      // 게시물 작성용: 로컬 편집 정보만 저장
      setPostVideoEditResult({
        videoUri,
        editInfo: {
          trimStart,
          trimEnd,
          cropArea: correctedCropArea
        }
      });
      navigation.goBack();
    } else if (uploadService === 'story') {
      try {
        setIsUploading(true);
        const storyResult = await StoryService.uploadStoryVideo(
          videoUri,
          trimStart,
          trimEnd,
          correctedCropArea
        );
        // 생성된 스토리의 ID로 DailyCutDetailScreen으로 이동 (자신의 스토리로 표시)
        navigation.replace('DailyCutDetail', {
          storyId: storyResult.id,
          isMyStory: true
        });
      } catch (error) {
        console.error('❌ 스토리 생성 실패:', error);
        setAlertModal({
          visible: true,
          title: '업로드 실패',
          message: '스토리 업로드에 실패했습니다. 다시 시도해주세요.',
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
        });
      } finally {
        setIsUploading(false);
      }
    } else if (uploadService === 'cuts') {
      // cut upload final screen navigation
      const result = {
        videoUri,
        trimStart,
        trimEnd,
        cropArea: correctedCropArea,
        thumbnailUri,
      };

      navigation.replace('CutUploadFinalize', result);
    } else {
      const result = {
        videoUri,
        trimStart,
        trimEnd,
        cropArea: correctedCropArea,
        duration: trimEnd - trimStart,
      };
      setAlertModal({
        visible: true,
        title: '편집 완료',
        message: `Trim: ${trimStart}ms ~ ${trimEnd}ms\nCrop: ${JSON.stringify(correctedCropArea)}`,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
  }, [videoUri, trimStart, trimEnd, cropArea, videoDimensions, actualVideoOrientation, maxDuration, uploadService, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CommonHeader
        title="영상 편집"
        onBackPress={() => navigation?.goBack()}
        rightComponent={
          <CommonHeaderButton
            title="완료"
            onPress={handleConfirm}
            loading={isUploading}
          />
        }
      />

      <View style={styles.videoContainer}>
        {videoUri ? (
          <>
            <View
              style={styles.video}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setActualVideoDimensions({ width, height });
              }}
            >
              <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                nativeControls={false}
              />
            </View>
            {(editMode === 'both' || editMode === 'crop') && isVideoReady && (
              <CropOverlay
                cropArea={cropArea}
                setCropArea={setCropArea}
                containerWidth={SCREEN_W - VIDEO_PADDING * 2}
                containerHeight={VIDEO_CONTAINER_HEIGHT - VIDEO_PADDING * 2}
                paddingOffset={{ x: VIDEO_PADDING, y: VIDEO_PADDING }}
                colors={colors}
                aspectRatio={aspectRatio}
                videoDimensions={videoDimensions}
                actualVideoDimensions={actualVideoDimensions}
                actualVideoOrientation={actualVideoOrientation}
              />
            )}
          </>
        ) : (
          <View style={styles.noVideo}>
            <Text style={styles.noVideoText}>비디오를 선택해주세요</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            if (isPlaying) {
              player.pause();
            } else {
              player.play();
            }
          }}
        >
          {isPlaying ? (
            <PauseIcon size={28} color={colors.WHITE} />
          ) : (
            <PlayIcon size={28} color={colors.WHITE} />
          )}
        </TouchableOpacity>
        <Text style={styles.timeText}>
          {formatTime(currentPosition)} / {formatTime(trimEnd - trimStart)}
        </Text>
      </View>

      {(editMode === 'both' || editMode === 'trim') && (
        <TrimBar
          duration={duration}
          trimStart={trimStart}
          trimEnd={trimEnd}
          currentPosition={currentPosition}
          thumbnails={thumbnails}
          timeLimitMessage={getTimeLimitMessage}
          onTrimChange={(start, end) => {
            setTrimStart(start);
            setTrimEnd(end);
          }}
          onSeek={(position) => {
            player.currentTime = position / 1000;
          }}
          colors={colors}
        />
      )}

      <LoadingOverlay
        visible={isUploading}
        message="비디오 편집 및 업로드를 진행중입니다..."
      />

      {/* Custom Alert Modal */}
      {alertModal && (
        <CustomAlertModal
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          buttons={alertModal.buttons}
          onClose={() => setAlertModal(null)}
        />
      )}
    </SafeAreaView>
  );
}

const CropOverlay: React.FC<{
  cropArea: { x: number; y: number; width: number; height: number };
  setCropArea: (area: { x: number; y: number; width: number; height: number }) => void;
  containerWidth: number;
  containerHeight: number;
  paddingOffset: { x: number; y: number };
  colors: Record<string, string>;
  aspectRatio?: string | null;
  videoDimensions?: { width: number; height: number } | null;
  actualVideoDimensions?: { width: number; height: number } | null;
  actualVideoOrientation?: 'landscape' | 'portrait' | null;
}> = ({ cropArea, setCropArea, containerWidth, containerHeight, paddingOffset, colors, aspectRatio, videoDimensions, actualVideoDimensions, actualVideoOrientation }) => {
  const styles = createStyles(colors);

  // Parse aspect ratio
  const targetRatio = useMemo(() => {
    if (!aspectRatio) return null;
    const parts = aspectRatio.split(':').map(Number);
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
      return parts[0] / parts[1];
    }
    return null;
  }, [aspectRatio]);

  // Calculate actual video rendering area (메모이제이션)
  const videoRenderArea = useMemo(() => {
    let videoRenderWidth = containerWidth;
    let videoRenderHeight = containerHeight;
    let videoOffsetX = 0;
    let videoOffsetY = 0;

    if (videoDimensions && actualVideoDimensions && actualVideoOrientation) {
      const rotationInfo = getVideoRotationInfo(videoDimensions, actualVideoOrientation);
      
      if (rotationInfo) {
        const containerAspectRatio = actualVideoDimensions.width / actualVideoDimensions.height;

        if (rotationInfo.effectiveAspectRatio > containerAspectRatio) {
          videoRenderWidth = actualVideoDimensions.width;
          videoRenderHeight = actualVideoDimensions.width / rotationInfo.effectiveAspectRatio;
          videoOffsetY = (actualVideoDimensions.height - videoRenderHeight) / 2;
        } else {
          videoRenderHeight = actualVideoDimensions.height;
          videoRenderWidth = actualVideoDimensions.height * rotationInfo.effectiveAspectRatio;
          videoOffsetX = (actualVideoDimensions.width - videoRenderWidth) / 2;
        }
      }
    }

    return { videoRenderWidth, videoRenderHeight, videoOffsetX, videoOffsetY };
  }, [videoDimensions, actualVideoDimensions, actualVideoOrientation, containerWidth, containerHeight]);

  const { videoRenderWidth, videoRenderHeight, videoOffsetX, videoOffsetY } = videoRenderArea;

  // Calculate initial crop size
  const initialCropArea = useMemo(() => {
    let initialWidth: number;
    let initialHeight: number;
    let initialX: number;
    let initialY: number;

    if (targetRatio && videoRenderWidth > 0 && videoRenderHeight > 0) {
      const videoRatio = videoRenderWidth / videoRenderHeight;
      if (targetRatio > videoRatio) {
        initialWidth = videoRenderWidth;
        initialHeight = videoRenderWidth / targetRatio;
      } else {
        initialHeight = videoRenderHeight;
        initialWidth = videoRenderHeight * targetRatio;
      }
      initialX = videoOffsetX + (videoRenderWidth - initialWidth) / 2;
      initialY = videoOffsetY + (videoRenderHeight - initialHeight) / 2;
    } else if (videoRenderWidth > 0 && videoRenderHeight > 0) {
      initialWidth = videoRenderWidth;
      initialHeight = videoRenderHeight;
      initialX = videoOffsetX;
      initialY = videoOffsetY;
    } else {
      initialWidth = containerWidth;
      initialHeight = containerHeight;
      initialX = 0;
      initialY = 0;
    }

    return { initialX, initialY, initialWidth, initialHeight };
  }, [targetRatio, videoRenderWidth, videoRenderHeight, videoOffsetX, videoOffsetY, containerWidth, containerHeight]);
  
  const translateX = useSharedValue(initialCropArea.initialX);
  const translateY = useSharedValue(initialCropArea.initialY);
  const width = useSharedValue(initialCropArea.initialWidth);
  const height = useSharedValue(initialCropArea.initialHeight);
  
  React.useEffect(() => {
    translateX.value = initialCropArea.initialX;
    translateY.value = initialCropArea.initialY;
    width.value = initialCropArea.initialWidth;
    height.value = initialCropArea.initialHeight;

    scheduleOnRN(updateCropArea,
      initialCropArea.initialX,
      initialCropArea.initialY,
      initialCropArea.initialWidth,
      initialCropArea.initialHeight
    );
  }, [initialCropArea.initialX, initialCropArea.initialY, initialCropArea.initialWidth, initialCropArea.initialHeight]);
  
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startWidth = useSharedValue(0);
  const startHeight = useSharedValue(0);

  const updateCropArea = useCallback((x: number, y: number, w: number, h: number) => {
    const relativeX = (x - videoOffsetX) / videoRenderWidth;
    const relativeY = (y - videoOffsetY) / videoRenderHeight;
    const relativeW = w / videoRenderWidth;
    const relativeH = h / videoRenderHeight;

    setCropArea({
      x: Math.max(0, Math.min(1, relativeX)),
      y: Math.max(0, Math.min(1, relativeY)),
      width: Math.max(0.2, Math.min(1, relativeW)),
      height: Math.max(0.2, Math.min(1, relativeH)),
    });
  }, [videoRenderWidth, videoRenderHeight, videoOffsetX, videoOffsetY, setCropArea]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const newX = Math.max(videoOffsetX, Math.min(videoOffsetX + videoRenderWidth - width.value, startX.value + e.translationX));
      const newY = Math.max(videoOffsetY, Math.min(videoOffsetY + videoRenderHeight - height.value, startY.value + e.translationY));
      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      scheduleOnRN(updateCropArea, translateX.value, translateY.value, width.value, height.value);
    });

  const createCornerGesture = useCallback((corner: 'tl' | 'tr' | 'bl' | 'br') => {
    return Gesture.Pan()
      .onBegin(() => {
        startX.value = translateX.value;
        startY.value = translateY.value;
        startWidth.value = width.value;
        startHeight.value = height.value;
      })
      .onUpdate((e) => {
        const MIN_SIZE = Math.min(videoRenderWidth, videoRenderHeight) * 0.2;
        
        if (corner === 'tl') {
          const newX = Math.max(videoOffsetX, Math.min(startX.value + startWidth.value - MIN_SIZE, startX.value + e.translationX));
          const newY = Math.max(videoOffsetY, Math.min(startY.value + startHeight.value - MIN_SIZE, startY.value + e.translationY));
          const newW = startX.value + startWidth.value - newX;
          const newH = startY.value + startHeight.value - newY;
          translateX.value = newX;
          translateY.value = newY;
          width.value = newW;
          height.value = newH;
        } else if (corner === 'tr') {
          const newY = Math.max(videoOffsetY, Math.min(startY.value + startHeight.value - MIN_SIZE, startY.value + e.translationY));
          const newW = Math.max(MIN_SIZE, Math.min(videoOffsetX + videoRenderWidth - startX.value, startWidth.value + e.translationX));
          const newH = startY.value + startHeight.value - newY;
          translateY.value = newY;
          width.value = newW;
          height.value = newH;
        } else if (corner === 'bl') {
          const newX = Math.max(videoOffsetX, Math.min(startX.value + startWidth.value - MIN_SIZE, startX.value + e.translationX));
          const newW = startX.value + startWidth.value - newX;
          const newH = Math.max(MIN_SIZE, Math.min(videoOffsetY + videoRenderHeight - startY.value, startHeight.value + e.translationY));
          translateX.value = newX;
          width.value = newW;
          height.value = newH;
        } else if (corner === 'br') {
          const newW = Math.max(MIN_SIZE, Math.min(videoOffsetX + videoRenderWidth - startX.value, startWidth.value + e.translationX));
          const newH = Math.max(MIN_SIZE, Math.min(videoOffsetY + videoRenderHeight - startY.value, startHeight.value + e.translationY));
          let adjustedW = newW;
          let adjustedH = newH;

          if (targetRatio) {
            const currentRatio = newW / newH;
            if (currentRatio > targetRatio) {
              adjustedW = newH * targetRatio;
            } else {
              adjustedH = newW / targetRatio;
            }
            const scaledMinSize = Math.sqrt(MIN_SIZE * MIN_SIZE * targetRatio);
            adjustedW = Math.max(scaledMinSize, adjustedW);
            adjustedH = Math.max(scaledMinSize / targetRatio, adjustedH);
            adjustedW = Math.min(adjustedW, videoOffsetX + videoRenderWidth - startX.value);
            adjustedH = Math.min(adjustedH, videoOffsetY + videoRenderHeight - startY.value);
          }

          width.value = adjustedW;
          height.value = adjustedH;
        }

        if (targetRatio) {
          if (corner === 'tl' || corner === 'tr' || corner === 'bl') {
            const currentRatio = width.value / height.value;
            if (currentRatio !== targetRatio) {
              if (currentRatio > targetRatio) {
                width.value = height.value * targetRatio;
              } else {
                height.value = width.value / targetRatio;
              }
            }
          }
        }
      })
      .onEnd(() => {
        scheduleOnRN(updateCropArea, translateX.value, translateY.value, width.value, height.value);
      });
  }, [targetRatio, videoOffsetX, videoOffsetY, videoRenderWidth, videoRenderHeight, updateCropArea]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    width: width.value,
    height: height.value,
  }));

  const animatedRectProps = useAnimatedProps(() => ({
    x: translateX.value + paddingOffset.x,
    y: translateY.value + paddingOffset.y,
    width: width.value,
    height: height.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Mask id="cropMask">
            <Rect x="0" y="0" width={containerWidth + paddingOffset.x * 2} height={containerHeight + paddingOffset.y * 2} fill="white" />
            <AnimatedRect
              animatedProps={animatedRectProps}
              fill="black"
            />
          </Mask>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={containerWidth + paddingOffset.x * 2}
          height={containerHeight + paddingOffset.y * 2}
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#cropMask)"
        />
        {/* 비디오 렌더링 영역 표시 (디버깅용 - 프로덕션에서는 제거) */}
        {__DEV__ && (
          <Rect
            x={videoOffsetX + paddingOffset.x}
            y={videoOffsetY + paddingOffset.y}
            width={videoRenderWidth}
            height={videoRenderHeight}
            stroke="#00FF00"
            strokeWidth={2}
            fill="none"
            strokeDasharray="5,5"
          />
        )}
      </Svg>
      
      <Animated.View style={[styles.cropFrameContainer, animatedStyle, { marginLeft: paddingOffset.x, marginTop: paddingOffset.y }]} pointerEvents="box-none">
        <GestureDetector gesture={panGesture}>
          <View style={styles.cropCenter} />
        </GestureDetector>

        <View style={styles.cropBorder} pointerEvents="none" />

        <View style={styles.gridContainer} pointerEvents="none">
          <View style={[styles.gridLine, styles.gridVertical1]} />
          <View style={[styles.gridLine, styles.gridVertical2]} />
          <View style={[styles.gridLine, styles.gridHorizontal1]} />
          <View style={[styles.gridLine, styles.gridHorizontal2]} />
        </View>

        <GestureDetector gesture={createCornerGesture('tl')}>
          <View style={[styles.cornerHandle, styles.cornerTL]}>
            <View style={[styles.cornerLineH, { top: 0, left: 0 }]} />
            <View style={[styles.cornerLineV, { top: 0, left: 0 }]} />
          </View>
        </GestureDetector>
        <GestureDetector gesture={createCornerGesture('tr')}>
          <View style={[styles.cornerHandle, styles.cornerTR]}>
            <View style={[styles.cornerLineH, { top: 0, right: 0 }]} />
            <View style={[styles.cornerLineV, { top: 0, right: 0 }]} />
          </View>
        </GestureDetector>
        <GestureDetector gesture={createCornerGesture('bl')}>
          <View style={[styles.cornerHandle, styles.cornerBL]}>
            <View style={[styles.cornerLineH, { bottom: 0, left: 0 }]} />
            <View style={[styles.cornerLineV, { bottom: 0, left: 0 }]} />
          </View>
        </GestureDetector>
        <GestureDetector gesture={createCornerGesture('br')}>
          <View style={[styles.cornerHandle, styles.cornerBR]}>
            <View style={[styles.cornerLineH, { bottom: 0, right: 0 }]} />
            <View style={[styles.cornerLineV, { bottom: 0, right: 0 }]} />
          </View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
};

const TrimBar: React.FC<{
  duration: number;
  trimStart: number;
  trimEnd: number;
  currentPosition: number;
  thumbnails: string[];
  timeLimitMessage: string;
  onTrimChange: (start: number, end: number) => void;
  onSeek: (position: number) => void;
  colors: Record<string, string>;
}> = ({ duration, trimStart, trimEnd, currentPosition, thumbnails, timeLimitMessage, onTrimChange, onSeek, colors }) => {
  const TRIM_WIDTH = SCREEN_W - SPACING.LG * 2;
  const HANDLE_WIDTH = 20;

  const leftHandleX = useSharedValue((trimStart / duration) * TRIM_WIDTH);
  const rightHandleX = useSharedValue((trimEnd / duration) * TRIM_WIDTH);

  const startLeft = useSharedValue(0);
  const startRight = useSharedValue(0);

  const lastSeekTime = useSharedValue(0);
  const SEEK_THROTTLE = 33; // 50ms throttle

  const updateTrimJS = useCallback((start: number, end: number) => {
    onTrimChange(start, end);
  }, [onTrimChange]);

  const seekJS = useCallback((pos: number) => {
    onSeek(pos);
  }, [onSeek]);

  const leftHandleGesture = Gesture.Pan()
    .onBegin(() => {
      startLeft.value = leftHandleX.value;
    })
    .onUpdate((e) => {
      const newX = Math.max(0, Math.min(rightHandleX.value - HANDLE_WIDTH * 2, startLeft.value + e.translationX));
      leftHandleX.value = newX;

      // 실시간 시크 (throttle 적용)
      const now = Date.now();
      if (now - lastSeekTime.value > SEEK_THROTTLE) {
        const newStart = Math.round((leftHandleX.value / TRIM_WIDTH) * duration);
        scheduleOnRN(seekJS, newStart);
        lastSeekTime.value = now;
      }
    })
    .onEnd(() => {
      const newStart = Math.round((leftHandleX.value / TRIM_WIDTH) * duration);
      const newEnd = Math.round((rightHandleX.value / TRIM_WIDTH) * duration);
      scheduleOnRN(updateTrimJS, newStart, newEnd);
      scheduleOnRN(seekJS, newEnd);
    });

  const rightHandleGesture = Gesture.Pan()
    .onBegin(() => {
      startRight.value = rightHandleX.value;
    })
    .onUpdate((e) => {
      const newX = Math.max(leftHandleX.value + HANDLE_WIDTH * 2, Math.min(TRIM_WIDTH, startRight.value + e.translationX));
      rightHandleX.value = newX;

      // 실시간 시크 (throttle 적용)
      const now = Date.now();
      if (now - lastSeekTime.value > SEEK_THROTTLE) {
        const newEnd = Math.round((rightHandleX.value / TRIM_WIDTH) * duration);
        scheduleOnRN(seekJS, newEnd);
        lastSeekTime.value = now;
      }
    })
    .onEnd(() => {
      const newStart = Math.round((leftHandleX.value / TRIM_WIDTH) * duration);
      const newEnd = Math.round((rightHandleX.value / TRIM_WIDTH) * duration);
      scheduleOnRN(updateTrimJS, newStart, newEnd);
      scheduleOnRN(seekJS, newEnd);
    });

  const timelineTapGesture = Gesture.Tap().onEnd((e) => {
    const ratio = e.x / TRIM_WIDTH;
    const position = Math.max(trimStart, Math.min(trimEnd, ratio * duration));
    scheduleOnRN(seekJS, position);
  });

  const leftAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: leftHandleX.value }] }));
  const rightAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: rightHandleX.value - HANDLE_WIDTH }] }));
  const selectionStyle = useAnimatedStyle(() => ({ left: leftHandleX.value, width: rightHandleX.value - leftHandleX.value }));
  const playheadStyle = useAnimatedStyle(() => {
    const ratio = (currentPosition - trimStart) / (trimEnd - trimStart);
    const x = leftHandleX.value + ratio * (rightHandleX.value - leftHandleX.value);
    return { transform: [{ translateX: Math.max(leftHandleX.value, Math.min(rightHandleX.value, x)) }] };
  });

  const leftDimStyle = useAnimatedStyle(() => ({
    width: leftHandleX.value,
  }));
  const rightDimStyle = useAnimatedStyle(() => ({
    left: rightHandleX.value,
    right: 0,
  }));

  const styles = createStyles(colors);

  return (
    <View style={styles.trimContainer}>
      <Text style={styles.trimLabel}>
        구간 선택 {timeLimitMessage}
      </Text>
      <GestureDetector gesture={timelineTapGesture}>
        <View style={styles.timeline}>
          {thumbnails.length > 0 ? (
            <View style={styles.thumbnailContainer}>
              {thumbnails.map((thumb, index) => (
                <Image
                  key={index}
                  source={{ uri: thumb }}
                  style={[styles.thumbnail, { width: TRIM_WIDTH / thumbnails.length }]}
                  resizeMode="cover"
                />
              ))}
            </View>
          ) : (
            <View style={styles.timelineTrack} />
          )}

          <Animated.View style={[styles.dimOverlay, styles.dimLeft, leftDimStyle]} />
          <Animated.View style={[styles.dimOverlay, styles.dimRight, rightDimStyle]} />

          <Animated.View style={[styles.selectedRange, selectionStyle]} />
          <GestureDetector gesture={leftHandleGesture}>
            <Animated.View style={[styles.trimHandle, leftAnimatedStyle]}>
              <View style={styles.handleBar} />
            </Animated.View>
          </GestureDetector>
          <GestureDetector gesture={rightHandleGesture}>
            <Animated.View style={[styles.trimHandle, rightAnimatedStyle]}>
              <View style={styles.handleBar} />
            </Animated.View>
          </GestureDetector>
          <Animated.View style={[styles.playhead, playheadStyle]} />
        </View>
      </GestureDetector>
      <View style={styles.trimTimeContainer}>
        <Text style={styles.trimTime}>{formatTime(trimStart)}</Text>
        <Text style={styles.trimTime}>{formatTime(trimEnd)}</Text>
      </View>
    </View>
  );
};

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  videoContainer: {
    height: VIDEO_CONTAINER_HEIGHT,
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
    padding: VIDEO_PADDING,
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  noVideo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideoText: {
    color: colors.GRAY_600,
    fontSize: 16,
  },
  controls: {
    backgroundColor: colors.WHITE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    gap: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    color: colors.GRAY_900,
    fontSize: 14,
  },
  cropFrameContainer: {
    position: 'absolute',
  },
  cropCenter: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  cropBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: colors.WHITE,
    borderRadius: 0,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: colors.WHITE,
    opacity: 0.4,
  },
  gridVertical1: {
    left: '33.33%',
    top: 0,
    bottom: 0,
    width: 0.5,
  },
  gridVertical2: {
    left: '66.66%',
    top: 0,
    bottom: 0,
    width: 0.5,
  },
  gridHorizontal1: {
    top: '33.33%',
    left: 0,
    right: 0,
    height: 0.5,
  },
  gridHorizontal2: {
    top: '66.66%',
    left: 0,
    right: 0,
    height: 0.5,
  },
  cornerHandle: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  cornerLineH: {
    position: 'absolute',
    width: 20,
    height: 3,
    backgroundColor: colors.PRIMARY,
  },
  cornerLineV: {
    position: 'absolute',
    width: 3,
    height: 20,
    backgroundColor: colors.PRIMARY,
  },
  cornerTL: {
    top: -1.5,
    left: -1.5,
  },
  cornerTR: {
    top: -1.5,
    right: -1.5,
  },
  cornerBL: {
    bottom: -1.5,
    left: -1.5,
  },
  cornerBR: {
    bottom: -1.5,
    right: -1.5,
  },
  trimContainer: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: colors.WHITE,
  },
  trimLabel: {
    color: colors.GRAY_900,
    fontSize: 14,
    marginBottom: SPACING.SM,
  },
  timeline: {
    height: 60,
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    backgroundColor: colors.GRAY_200,
  },
  thumbnail: {
    height: 60,
  },
  dimOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dimLeft: { left: 0 },
  dimRight: {},
  timelineTrack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.GRAY_200,
    borderRadius: 4,
  },
  selectedRange: {
    position: 'absolute',
    height: 60,
    backgroundColor: 'transparent',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.PRIMARY,
  },
  trimHandle: {
    position: 'absolute',
    width: 20,
    height: 60,
    backgroundColor: colors.WHITE,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.PRIMARY,
  },
  handleBar: {
    width: 3,
    height: 20,
    backgroundColor: colors.PRIMARY,
    borderRadius: 2,
  },
  playhead: {
    position: 'absolute',
    width: 2,
    height: 60,
    backgroundColor: colors.ACCENT,
  },
  trimTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.SM,
  },
  trimTime: {
    color: colors.GRAY_600,
    fontSize: 12,
  },
});
