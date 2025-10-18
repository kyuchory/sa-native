import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import Svg, { Path, Rect, Defs, Mask } from 'react-native-svg';
import { useThemeStore } from '../stores/themeStore';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import CommonHeader from '../components/CommonHeader';

// SVG Icons
const CheckIcon = ({ size = 24, color = '#FFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CloseIcon = ({ size = 24, color = '#FFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

type Props = {
  route?: { params?: { videoUri?: string; videoDuration?: number } };
  navigation?: any;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const VIDEO_CONTAINER_HEIGHT = SCREEN_H * 0.6;
const TIMELINE_HEIGHT = 60;

export default function VideoTrimCropScreen({ route, navigation }: Props) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const videoUri = route?.params?.videoUri ?? null;
  const videoRef = useRef<Video>(null);

  const [duration, setDuration] = useState(route?.params?.videoDuration ?? 10000); // ms
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0); // ms

  // Trim 상태 (ms)
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration);

  // Crop 상태 (비율 0~1)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 1, height: 1 });

  // Video 로드 완료
  const onVideoLoad = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      const dur = status.durationMillis ?? 10000;
      setDuration(dur);
      setTrimEnd(dur);
    }
  };

  // Video 재생 상태 업데이트
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);

      // Trim 끝에 도달하면 정지
      if (status.positionMillis >= trimEnd) {
        videoRef.current?.pauseAsync();
        videoRef.current?.setPositionAsync(trimStart);
      }
    }
  };

  // Trim 시작 위치로 이동
  const seekToTrimStart = async () => {
    await videoRef.current?.setPositionAsync(trimStart);
  };

  useEffect(() => {
    seekToTrimStart();
  }, [trimStart]);

  // 확인 버튼
  const handleConfirm = () => {
    const result = {
      videoUri,
      trimStart,
      trimEnd,
      cropArea,
      duration: trimEnd - trimStart,
    };
    console.log('편집 결과:', result);
    Alert.alert('편집 완료', `Trim: ${trimStart}ms ~ ${trimEnd}ms\nCrop: ${JSON.stringify(cropArea)}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <CommonHeader
        title="영상 편집"
        onBackPress={() => navigation?.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleConfirm}>
            <CheckIcon size={24} color={colors.GRAY_700} />
          </TouchableOpacity>
        }
      />

      {/* Video Container with Crop Overlay */}
      <View style={styles.videoContainer}>
        {videoUri ? (
          <>
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping={false}
              onLoad={onVideoLoad}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            />
            <CropOverlay
              cropArea={cropArea}
              setCropArea={setCropArea}
              containerWidth={SCREEN_W}
              containerHeight={VIDEO_CONTAINER_HEIGHT}
              colors={colors}
            />
          </>
        ) : (
          <View style={styles.noVideo}>
            <Text style={styles.noVideoText}>비디오를 선택해주세요</Text>
          </View>
        )}
      </View>

      {/* Playback Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            if (isPlaying) {
              videoRef.current?.pauseAsync();
            } else {
              videoRef.current?.playAsync();
            }
          }}
        >
          <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <Text style={styles.timeText}>
          {formatTime(currentPosition)} / {formatTime(trimEnd - trimStart)}
        </Text>
      </View>

      {/* Trim Bar */}
      <TrimBar
        duration={duration}
        trimStart={trimStart}
        trimEnd={trimEnd}
        currentPosition={currentPosition}
        onTrimChange={(start, end) => {
          setTrimStart(start);
          setTrimEnd(end);
        }}
        onSeek={(position) => {
          videoRef.current?.setPositionAsync(position);
        }}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// ✅ CropOverlay 전용 스타일 포함 버전
const CropOverlay: React.FC<{
  cropArea: { x: number; y: number; width: number; height: number };
  setCropArea: (area: { x: number; y: number; width: number; height: number }) => void;
  containerWidth: number;
  containerHeight: number;
  colors: Record<string, string>;
}> = ({ cropArea, setCropArea, containerWidth, containerHeight, colors }) => {
  const translateX = useSharedValue(cropArea.x * containerWidth);
  const translateY = useSharedValue(cropArea.y * containerHeight);
  const width = useSharedValue(cropArea.width * containerWidth);
  const height = useSharedValue(cropArea.height * containerHeight);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const updateCropArea = useCallback((x: number, y: number, w: number, h: number) => {
    setCropArea({
      x: Math.max(0, Math.min(1, x / containerWidth)),
      y: Math.max(0, Math.min(1, y / containerHeight)),
      width: Math.max(0.2, Math.min(1, w / containerWidth)),
      height: Math.max(0.2, Math.min(1, h / containerHeight)),
    });
  }, [containerWidth, containerHeight]);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      const newX = Math.max(0, Math.min(containerWidth - width.value, startX.value + e.translationX));
      const newY = Math.max(0, Math.min(containerHeight - height.value, startY.value + e.translationY));
      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      'worklet';
      runOnJS(updateCropArea)(translateX.value, translateY.value, width.value, height.value);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    width: width.value,
    height: height.value,
  }));

  const overlayStyles = StyleSheet.create({
    cropFrame: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: colors.WHITE,
      borderRadius: 8,
    },
    cropCorner: {
      position: 'absolute',
      top: -6,
      left: -6,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.WHITE,
    },
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Svg width={containerWidth} height={containerHeight} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="cropMask">
            <Rect x={0} y={0} width={containerWidth} height={containerHeight} fill="white" />
            <Rect x={translateX.value} y={translateY.value} width={width.value} height={height.value} fill="black" />
          </Mask>
        </Defs>
        <Rect x={0} y={0} width={containerWidth} height={containerHeight} fill="rgba(0,0,0,0.6)" mask="url(#cropMask)" />
      </Svg>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[overlayStyles.cropFrame, animatedStyle]}>
          <View style={overlayStyles.cropCorner} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ✅ TrimBar 전용 스타일 포함 버전
const TrimBar: React.FC<{
  duration: number;
  trimStart: number;
  trimEnd: number;
  currentPosition: number;
  onTrimChange: (start: number, end: number) => void;
  onSeek: (position: number) => void;
  colors: Record<string, string>;
}> = ({ duration, trimStart, trimEnd, currentPosition, onTrimChange, onSeek, colors }) => {
  const TRIM_WIDTH = SCREEN_W - SPACING.LG * 2;
  const HANDLE_WIDTH = 20;

  const leftHandleX = useSharedValue((trimStart / duration) * TRIM_WIDTH);
  const rightHandleX = useSharedValue((trimEnd / duration) * TRIM_WIDTH);

  const startLeft = useSharedValue(0);
  const startRight = useSharedValue(0);

  const updateTrimJS = useCallback((start: number, end: number) => {
    onTrimChange(start, end);
  }, [onTrimChange]);

  const seekJS = useCallback((pos: number) => {
    onSeek(pos);
  }, [onSeek]);

  // Left handle
  const leftHandleGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      startLeft.value = leftHandleX.value;
    })
    .onUpdate((e) => {
      'worklet';
      const newX = Math.max(0, Math.min(rightHandleX.value - HANDLE_WIDTH * 2, startLeft.value + e.translationX));
      leftHandleX.value = newX;
    })
    .onEnd(() => {
      'worklet';
      const newStart = Math.round((leftHandleX.value / TRIM_WIDTH) * duration);
      const newEnd = Math.round((rightHandleX.value / TRIM_WIDTH) * duration);
      runOnJS(updateTrimJS)(newStart, newEnd);
    });

  // Right handle
  const rightHandleGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      startRight.value = rightHandleX.value;
    })
    .onUpdate((e) => {
      'worklet';
      const newX = Math.max(leftHandleX.value + HANDLE_WIDTH * 2, Math.min(TRIM_WIDTH, startRight.value + e.translationX));
      rightHandleX.value = newX;
    })
    .onEnd(() => {
      'worklet';
      const newStart = Math.round((leftHandleX.value / TRIM_WIDTH) * duration);
      const newEnd = Math.round((rightHandleX.value / TRIM_WIDTH) * duration);
      runOnJS(updateTrimJS)(newStart, newEnd);
    });

  const timelineTapGesture = Gesture.Tap().onEnd((e) => {
    'worklet';
    const ratio = e.x / TRIM_WIDTH;
    const position = Math.max(trimStart, Math.min(trimEnd, ratio * duration));
    runOnJS(seekJS)(position);
  });

  const trimStyles = StyleSheet.create({
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
    timeline: { height: TIMELINE_HEIGHT, position: 'relative' },
    timelineTrack: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.GRAY_200, borderRadius: 4 },
    selectedRange: {
      position: 'absolute',
      height: TIMELINE_HEIGHT,
      backgroundColor: colors.PRIMARY,
      opacity: 0.5,
      borderRadius: 4,
    },
    trimHandle: {
      position: 'absolute',
      width: 20,
      height: TIMELINE_HEIGHT,
      backgroundColor: colors.GRAY_900,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    handleBar: { width: 4, height: 30, backgroundColor: colors.WHITE, borderRadius: 2 },
    playhead: { position: 'absolute', width: 2, height: TIMELINE_HEIGHT, backgroundColor: colors.ACCENT },
    trimTimeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.SM },
    trimTime: { color: colors.GRAY_600, fontSize: 12 },
  });

  const leftAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: leftHandleX.value }] }));
  const rightAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: rightHandleX.value - HANDLE_WIDTH }] }));
  const selectionStyle = useAnimatedStyle(() => ({ left: leftHandleX.value, width: rightHandleX.value - leftHandleX.value }));
  const playheadStyle = useAnimatedStyle(() => {
    const ratio = (currentPosition - trimStart) / (trimEnd - trimStart);
    const x = leftHandleX.value + ratio * (rightHandleX.value - leftHandleX.value);
    return { transform: [{ translateX: Math.max(leftHandleX.value, Math.min(rightHandleX.value, x)) }] };
  });

  return (
    <View style={trimStyles.trimContainer}>
      <Text style={trimStyles.trimLabel}>구간 선택</Text>
      <GestureDetector gesture={timelineTapGesture}>
        <View style={trimStyles.timeline}>
          <View style={trimStyles.timelineTrack} />
          <Animated.View style={[trimStyles.selectedRange, selectionStyle]} />
          <GestureDetector gesture={leftHandleGesture}>
            <Animated.View style={[trimStyles.trimHandle, leftAnimatedStyle]}>
              <View style={trimStyles.handleBar} />
            </Animated.View>
          </GestureDetector>
          <GestureDetector gesture={rightHandleGesture}>
            <Animated.View style={[trimStyles.trimHandle, rightAnimatedStyle]}>
              <View style={trimStyles.handleBar} />
            </Animated.View>
          </GestureDetector>
          <Animated.View style={[trimStyles.playhead, playheadStyle]} />
        </View>
      </GestureDetector>
      <View style={trimStyles.trimTimeContainer}>
        <Text style={trimStyles.trimTime}>{formatTime(trimStart)}</Text>
        <Text style={trimStyles.trimTime}>{formatTime(trimEnd)}</Text>
      </View>
    </View>
  );
};

// Utilities
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
    height: SCREEN_H * 0.6,
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  video: {
    width: '100%',
    height: '100%',
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
  playButtonText: {
    fontSize: 20,
    color: colors.WHITE,
  },
  timeText: {
    color: colors.GRAY_900,
    fontSize: 14,
  },
});
