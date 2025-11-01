import 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableWithoutFeedback,
  NativeSyntheticEvent,
  NativeTouchEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { StoryService } from '../services/storyService';
import { StoryDetailResponse, UserStoryItem } from '../types/story';
import { useThemeStore } from '../stores/themeStore';
import UserAvatar from '../components/UserAvatar';
import { formatRelativeTime } from '../utils/timeUtils';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS as THEME_SHADOWS, TEXT_COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTUAL_WIDTH = SCREEN_WIDTH - SPACING.SM * 2;
const LONG_PRESS_DURATION = 200; // 200ms 이상 눌렀을 때 길게 누르기로 간주

type DailyCutDetailScreenRouteProp = RouteProp<AuthStackParamList, 'DailyCutDetail'>;
type DailyCutDetailScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'DailyCutDetail'>;

interface Props {
  route: DailyCutDetailScreenRouteProp;
  navigation: DailyCutDetailScreenNavigationProp;
}

export default function DailyCutDetailScreen({ route, navigation }: Props) {
  const { storyId } = route.params;
  const { colors } = useThemeStore();

  const [storyData, setStoryData] = useState<StoryDetailResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTime = useRef<number>(0);

  // 현재 스토리
  const currentStory = storyData?.current_user_stories[currentIndex];
  const isVideo = currentStory?.type === 'video';

  // VideoPlayer 생성 (비디오일 때만)
  const player = useVideoPlayer(
    isVideo ? currentStory.content_url : '',
    (player) => {
      player.loop = false;
      player.play();
    }
  );

  /** 스토리 상세 호출 */
  const fetchStoryDetail = useCallback(async (id: number) => {
    try {
      const res = await StoryService.getStoryDetail(id);
      setStoryData(res);
      setCurrentIndex(0);
      setIsPaused(false); // 새 스토리 로드 시 일시정지 해제
    } catch (error) {
      console.error('스토리 불러오기 실패', error);
    }
  }, []);

  useEffect(() => {
    fetchStoryDetail(storyId);
  }, [storyId, fetchStoryDetail]);

  /** 비디오 일시정지/재생 제어 */
  useEffect(() => {
    if (!isVideo || !player) return;
    
    if (isPaused) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPaused, isVideo, player]);

  /** 다음 스토리로 이동 */
  const goToNext = useCallback(() => {
    if (!storyData) return;
    const total = storyData.current_user_stories.length;

    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (storyData.next_user_stories?.length) {
      fetchStoryDetail(storyData.next_user_stories[0].id);
    } else {
      console.log('마지막 스토리입니다.');
    }
  }, [storyData, currentIndex, fetchStoryDetail]);

  /** 이전 스토리로 이동 */
  const goToPrev = useCallback(() => {
    if (!storyData) return;
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (storyData.prev_user_stories?.length) {
      fetchStoryDetail(storyData.prev_user_stories[0].id);
    }
  }, [storyData, currentIndex, fetchStoryDetail]);

   /** 비디오 종료 감지 - playToEnd 이벤트 사용 */
  useEffect(() => {
    if (!isVideo || !player) return;

    const subscription = player.addListener('playToEnd', () => {
      goToNext();
    });

    return () => {
      subscription.remove();
    };
  }, [isVideo, player, goToNext]);

  /** 화면 좌/우 터치 */
  const handlePress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    const pressDuration = Date.now() - pressStartTime.current;

    // 길게 누르기(200ms 초과)일 때는 페이지 이동하지 않음
    if (pressDuration > LONG_PRESS_DURATION) {
      return;
    }

    const touchX = event.nativeEvent.locationX;
    const halfWidth = SCREEN_WIDTH / 2;

    if (!storyData) return;
    if (touchX > halfWidth) goToNext();
    else goToPrev();
  };

  /** 다음 유저 스토리로 이동 */
  const handleNextUser = useCallback(() => {
    if (storyData?.next_user_stories?.length) {
      fetchStoryDetail(storyData.next_user_stories[0].id);
    }
  }, [storyData, fetchStoryDetail]);

  /** 이전 유저 스토리로 이동 */
  const handlePrevUser = useCallback(() => {
    if (storyData?.prev_user_stories?.length) {
      fetchStoryDetail(storyData.prev_user_stories[0].id);
    }
  }, [storyData, fetchStoryDetail]);

  /** 사용자 단위 스와이프 */
  const pan = Gesture.Pan().onEnd((e) => {
    const SWIPE_THRESHOLD = 50;
    const shouldGoNext = e.translationX < -SWIPE_THRESHOLD;
    const shouldGoPrev = e.translationX > SWIPE_THRESHOLD;
    if (shouldGoNext) {
      scheduleOnRN(handleNextUser);
    } else if (shouldGoPrev) {
      scheduleOnRN(handlePrevUser);
    }
  });

  const q = createStyles(colors);

  if (!storyData) {
    return (
      <SafeAreaView style={q.container} edges={['bottom']}>
        <View style={q.loadingContainer}>
          <Text style={q.loadingText}>스토리 로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={q.container} edges={['bottom', 'top']}>
      <View style={q.contentContainer}>
        <GestureDetector gesture={pan}>
          <View style={q.storyContainer}>
            {/* 이미지 또는 비디오 렌더링 */}
            {currentStory?.type === 'image' ? (
              <Image 
                source={{ uri: currentStory.content_url }} 
                style={q.storyImage} 
                contentFit="cover" 
                cachePolicy={'memory-disk'} 
                transition={200}
              />
            ) : (
              <VideoView
                player={player}
                style={q.storyVideo}
                contentFit="cover"
                nativeControls={false}
                allowsPictureInPicture={false}
              />
            )}

            {/* 터치 오버레이 - VideoView 위에 배치하여 터치 이슈 해결 */}
            <TouchableWithoutFeedback
              onPressIn={() => {
                pressStartTime.current = Date.now();
                setIsPaused(true);
              }}
              onPressOut={() => setIsPaused(false)}
              onPress={handlePress}
            >
              <View style={q.touchOverlay} />
            </TouchableWithoutFeedback>

            {/* 상단 오버레이 (프로그레스바, 유저정보) */}
            <View style={q.topOverlayContainer} pointerEvents="box-none">
              {/* Progress Bars */}
              <View style={q.progressContainer}>
                {storyData.current_user_stories.map((story, idx) => {
                  const isCompleted = idx < currentIndex;
                  const isActive = idx === currentIndex;
                  const segmentWidth =
                    (ACTUAL_WIDTH - SPACING.MD * 2 - SPACING.XS * (storyData.current_user_stories.length - 1)) /
                    storyData.current_user_stories.length;

                  return (
                    <ProgressBar
                      key={idx}
                      isCompleted={isCompleted}
                      isActive={isActive}
                      isPaused={isPaused}
                      duration={
                        story.type === 'video'
                          ? (story.duration ?? 5) * 1000
                          : 5000
                      }
                      segmentWidth={segmentWidth}
                      colors={colors}
                      onComplete={goToNext}
                    />
                  );
                })}
              </View>

              <View style={q.overlayContent} pointerEvents="box-none">
                <TouchableWithoutFeedback
                  onPress={() => navigation.navigate('UserProfile', { userId: String(currentStory?.user_id) })}
                >
                  <View style={q.userOverlay}>
                    <UserAvatar 
                      profileImg={currentStory?.profile_img} 
                      nickname={currentStory?.username || ''} 
                      size={32} 
                    />
                    <Text style={q.userNickname}>{currentStory?.username}</Text>
                    <Text style={q.userTime}>{currentStory?.created_at ? formatRelativeTime(currentStory.created_at) : ''}</Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>
          </View>
        </GestureDetector>
      </View>
    </SafeAreaView>
  );
}

/** ✅ ProgressBar 컴포넌트 - UI 즉시 초기화 적용 */
const ProgressBar = ({
  isCompleted,
  isActive,
  isPaused,
  duration,
  segmentWidth,
  colors,
  onComplete,
}: {
  isCompleted: boolean;
  isActive: boolean;
  isPaused: boolean;
  duration: number;
  segmentWidth: number;
  colors: Record<string, string>;
  onComplete: () => void;
}) => {
  const progress = useSharedValue(0);
  const pausedProgressRef = useRef<number>(0);
  const q = createStyles(colors);

  /** ✅ isActive 변경 시 즉시 초기화 */
  useEffect(() => {
    if (isActive) {
      // 활성화될 때 즉시 0으로 리셋
      cancelAnimation(progress);
      progress.value = 0;
      pausedProgressRef.current = 0;
    } else if (!isCompleted) {
      // 비활성화되고 완료되지 않은 경우 즉시 0으로 리셋
      cancelAnimation(progress);
      progress.value = 0;
      pausedProgressRef.current = 0;
    }
  }, [isActive]);

  /** 애니메이션 시작/정지 제어 */
  useEffect(() => {
    if (isActive) {
      if (isPaused) {
        // 일시정지 시 현재 progress 값 저장
        pausedProgressRef.current = progress.value;
        cancelAnimation(progress);
      } else {
        // 재개 시: 저장된 진행 상태부터 시작
        const resumedProgress = pausedProgressRef.current;
        const remainingDuration = duration * (1 - resumedProgress);

        progress.value = resumedProgress;
        progress.value = withTiming(1, { duration: remainingDuration }, (finished) => {
          if (finished) scheduleOnRN(onComplete);
        });
      }
    } else if (isCompleted) {
      progress.value = 1;
    }
  }, [isActive, isPaused, duration, onComplete]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, segmentWidth], Extrapolate.CLAMP),
  }));

  return (
    <View style={[q.progressSegment, { width: segmentWidth }]}>
      <View style={[q.progressTrack]} />
      {(isCompleted || isActive) && (
        <Animated.View style={[q.progressFill, { backgroundColor: colors.WHITE }, progressAnimatedStyle]} />
      )}
    </View>
  );
};

/** ✅ 스타일 */
const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.GRAY_50,
    },
    contentContainer: {
      flex: 1,
      margin: SPACING.SM,
      ...THEME_SHADOWS.SMALL,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: colors.BLACK,
    },
    storyContainer: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    storyImage: {
      width: '100%',
      height: '100%',
      borderRadius: BORDER_RADIUS.XL,
    },
    storyVideo: {
      width: '100%',
      height: '100%',
      borderRadius: BORDER_RADIUS.XL,
    },
    touchOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
      zIndex: 1,
    },
    topOverlayContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      zIndex: 2,
    },
    overlayContent: {
      paddingVertical: SPACING.SM,
      paddingHorizontal: SPACING.MD,
    },
    userOverlay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.SM,
      borderRadius: BORDER_RADIUS.XL,
    },
    userNickname: {
      color: TEXT_COLORS.INVERSE,
      fontSize: TYPOGRAPHY.SIZE.MD,
      fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    },
    userTime: {
      color: colors.WHITE_50,
      fontSize: TYPOGRAPHY.SIZE.SM,
      fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.XS,
      paddingHorizontal: SPACING.MD,
      paddingVertical: SPACING.SM,
    },
    progressSegment: {
      height: 2,
      position: 'relative',
    },
    progressTrack: {
      height: '100%',
      backgroundColor: colors.GRAY_400,
      borderRadius: 1,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.WHITE,
      borderRadius: 1,
      position: 'absolute',
      left: 0,
    },
  });
