import 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  NativeSyntheticEvent,
  NativeTouchEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

import { RouteProp, useNavigation } from '@react-navigation/native';
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

  /** 화면 좌/우 터치 */
  const handlePress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
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
    'worklet';
    const SWIPE_THRESHOLD = 50;
    const shouldGoNext = e.translationX < -SWIPE_THRESHOLD;
    const shouldGoPrev = e.translationX > SWIPE_THRESHOLD;
    if (shouldGoNext) {
      runOnJS(handleNextUser)();
    } else if (shouldGoPrev) {
      runOnJS(handlePrevUser)();
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

  const currentStory = storyData.current_user_stories[currentIndex];

  return (
    <SafeAreaView style={q.container} edges={['bottom', 'top']}>
      <GestureHandlerRootView style={q.gestureRoot}>
        <GestureDetector gesture={pan}>
          <TouchableWithoutFeedback
            onPressIn={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
            onPress={handlePress}
          >
            <View style={q.storyContainer}>
              {currentStory.type === 'image' ? (
                <Image source={{ uri: currentStory.content_url }} style={q.storyImage} resizeMode="cover" />
              ) : (
                <View style={q.storyVideo}>
                  <Text style={q.videoText}>영상 재생: {currentStory.duration}s</Text>
                </View>
              )}

              {/* 오버레이 */}
              <View style={q.topOverlayContainer}>
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

                <View style={q.overlayContent}>
                  <TouchableWithoutFeedback
                    onPress={() => navigation.navigate('UserProfile', { userId: String(currentStory.user_id) })}
                  >
                    <View style={q.userOverlay}>
                      <UserAvatar profileImg={currentStory.profile_img} nickname={currentStory.username} size={36} />
                      <Text style={q.userNickname}>{currentStory.username}</Text>
                      <Text style={q.userTime}>{formatRelativeTime(currentStory.created_at)}</Text>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </GestureDetector>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

/** ✅ ProgressBar 컴포넌트 */
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
  const q = createStyles(colors);

  /** 애니메이션 시작/정지 제어 */
  useEffect(() => {
    if (isActive) {
      if (isPaused) {
        cancelAnimation(progress);
      } else {
        // 항상 0부터 시작하도록 수정 (이전 스토리 돌아갈 때 duration 제대로 적용)
        progress.value = 0;
        progress.value = withTiming(1, { duration: duration }, (finished) => {
          if (finished) runOnJS(onComplete)();
        });
      }
    } else if (isCompleted) {
      progress.value = 1;
    } else {
      progress.value = 0;
    }
  }, [isActive, isPaused, duration]);

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
    gestureRoot: {
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    storyImage: {
      width: '100%',
      height: '100%',
      borderRadius: BORDER_RADIUS.XL,
    },
    storyVideo: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: BORDER_RADIUS.XL,
    },
    videoText: {
      color: colors.WHITE,
    },
    topOverlayContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
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