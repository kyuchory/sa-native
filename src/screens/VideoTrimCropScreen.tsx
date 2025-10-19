import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect, Defs, Mask } from 'react-native-svg';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useThemeStore } from '../stores/themeStore';
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import CommonHeader from '../components/CommonHeader';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// SVG Icons
const CheckIcon = ({ size = 24, color = '#FFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

type Props = {
  route?: { params?: { videoUri?: string; videoDuration?: number } };
  navigation?: any;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const VIDEO_CONTAINER_HEIGHT = SCREEN_H * 0.6;
const VIDEO_PADDING = 16;

export default function VideoTrimCropScreen({ route, navigation }: Props) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const videoUri = route?.params?.videoUri ?? null;
  const videoRef = useRef<Video>(null);

  const [duration, setDuration] = useState(route?.params?.videoDuration ?? 10000);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);

  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 1, height: 1 });

  const generateThumbnails = async (uri: string, dur: number) => {
    try {
      const thumbnailCount = 10;
      const interval = dur / thumbnailCount;
      const thumbs: string[] = [];

      for (let i = 0; i < thumbnailCount; i++) {
        const time = i * interval;
        const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(uri, {
          time,
          quality: 0.5,
        });
        thumbs.push(thumbnailUri);
      }
      
      setThumbnails(thumbs);
    } catch (error) {
      console.log('썸네일 생성 실패:', error);
    }
  };

  const onVideoLoad = (status: AVPlaybackStatus) => {
    if (status.isLoaded && videoUri) {
      const dur = status.durationMillis ?? 10000;
      setDuration(dur);
      setTrimEnd(dur);
      generateThumbnails(videoUri, dur);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);

      if (status.positionMillis >= trimEnd) {
        videoRef.current?.pauseAsync();
        videoRef.current?.setPositionAsync(trimStart);
      }
    }
  };

  const seekToTrimStart = async () => {
    await videoRef.current?.setPositionAsync(trimStart);
  };

  useEffect(() => {
    seekToTrimStart();
  }, [trimStart]);

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
      <CommonHeader
        title="영상 편집"
        onBackPress={() => navigation?.goBack()}
        rightComponent={
          <TouchableOpacity onPress={handleConfirm}>
            <CheckIcon size={24} color={colors.GRAY_700} />
          </TouchableOpacity>
        }
      />

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
              pointerEvents="none"
            />
            <CropOverlay
              cropArea={cropArea}
              setCropArea={setCropArea}
              containerWidth={SCREEN_W - VIDEO_PADDING * 2}
              containerHeight={VIDEO_CONTAINER_HEIGHT - VIDEO_PADDING * 2}
              paddingOffset={{ x: VIDEO_PADDING, y: VIDEO_PADDING }}
              colors={colors}
            />
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

      <TrimBar
        duration={duration}
        trimStart={trimStart}
        trimEnd={trimEnd}
        currentPosition={currentPosition}
        thumbnails={thumbnails}
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

const CropOverlay: React.FC<{
  cropArea: { x: number; y: number; width: number; height: number };
  setCropArea: (area: { x: number; y: number; width: number; height: number }) => void;
  containerWidth: number;
  containerHeight: number;
  paddingOffset: { x: number; y: number };
  colors: Record<string, string>;
}> = ({ cropArea, setCropArea, containerWidth, containerHeight, paddingOffset, colors }) => {
  const styles = createStyles(colors);
  
  const initialWidth = containerWidth;
  const initialHeight = containerHeight;
  const initialX = 0;
  const initialY = 0;
  
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const width = useSharedValue(initialWidth);
  const height = useSharedValue(initialHeight);
  
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startWidth = useSharedValue(0);
  const startHeight = useSharedValue(0);

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

  const createCornerGesture = (corner: 'tl' | 'tr' | 'bl' | 'br') => {
    return Gesture.Pan()
      .onBegin(() => {
        'worklet';
        startX.value = translateX.value;
        startY.value = translateY.value;
        startWidth.value = width.value;
        startHeight.value = height.value;
      })
      .onUpdate((e) => {
        'worklet';
        const MIN_SIZE = Math.min(containerWidth, containerHeight) * 0.2;
        
        if (corner === 'tl') {
          const newX = Math.max(0, Math.min(startX.value + startWidth.value - MIN_SIZE, startX.value + e.translationX));
          const newY = Math.max(0, Math.min(startY.value + startHeight.value - MIN_SIZE, startY.value + e.translationY));
          const newW = startX.value + startWidth.value - newX;
          const newH = startY.value + startHeight.value - newY;
          translateX.value = newX;
          translateY.value = newY;
          width.value = newW;
          height.value = newH;
        } else if (corner === 'tr') {
          const newY = Math.max(0, Math.min(startY.value + startHeight.value - MIN_SIZE, startY.value + e.translationY));
          const newW = Math.max(MIN_SIZE, Math.min(containerWidth - startX.value, startWidth.value + e.translationX));
          const newH = startY.value + startHeight.value - newY;
          translateY.value = newY;
          width.value = newW;
          height.value = newH;
        } else if (corner === 'bl') {
          const newX = Math.max(0, Math.min(startX.value + startWidth.value - MIN_SIZE, startX.value + e.translationX));
          const newW = startX.value + startWidth.value - newX;
          const newH = Math.max(MIN_SIZE, Math.min(containerHeight - startY.value, startHeight.value + e.translationY));
          translateX.value = newX;
          width.value = newW;
          height.value = newH;
        } else if (corner === 'br') {
          const newW = Math.max(MIN_SIZE, Math.min(containerWidth - startX.value, startWidth.value + e.translationX));
          const newH = Math.max(MIN_SIZE, Math.min(containerHeight - startY.value, startHeight.value + e.translationY));
          width.value = newW;
          height.value = newH;
        }
      })
      .onEnd(() => {
        'worklet';
        runOnJS(updateCropArea)(translateX.value, translateY.value, width.value, height.value);
      });
  };

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
  onTrimChange: (start: number, end: number) => void;
  onSeek: (position: number) => void;
  colors: Record<string, string>;
}> = ({ duration, trimStart, trimEnd, currentPosition, thumbnails, onTrimChange, onSeek, colors }) => {
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

  const leftAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: leftHandleX.value }] }));
  const rightAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: rightHandleX.value - HANDLE_WIDTH }] }));
  const selectionStyle = useAnimatedStyle(() => ({ left: leftHandleX.value, width: rightHandleX.value - leftHandleX.value }));
  const playheadStyle = useAnimatedStyle(() => {
    const ratio = (currentPosition - trimStart) / (trimEnd - trimStart);
    const x = leftHandleX.value + ratio * (rightHandleX.value - leftHandleX.value);
    return { transform: [{ translateX: Math.max(leftHandleX.value, Math.min(rightHandleX.value, x)) }] };
  });

  const styles = createStyles(colors);

  return (
    <View style={styles.trimContainer}>
      <Text style={styles.trimLabel}>구간 선택</Text>
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
          
          <View style={styles.dimOverlay} pointerEvents="none" />
          
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
  playButtonText: {
    fontSize: 20,
    color: colors.WHITE,
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
    borderWidth: 1.5,
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
    backgroundColor: colors.WHITE,
  },
  cornerLineV: {
    position: 'absolute',
    width: 3,
    height: 20,
    backgroundColor: colors.WHITE,
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
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