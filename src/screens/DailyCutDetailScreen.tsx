import 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, Image, TouchableWithoutFeedback, NativeSyntheticEvent, NativeTouchEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { StoryService } from '../services/storyService';
import { StoryDetailResponse, UserStoryItem } from '../types/story';
import { useThemeStore } from '../stores/themeStore';
import { useNavigation } from '@react-navigation/native';
import UserAvatar from '../components/UserAvatar';
import { formatRelativeTime } from '../utils/timeUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const translateX = useSharedValue(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /** API 호출 */
  const fetchStoryDetail = async (id: number) => {
    try {
      const res = await StoryService.getStoryDetail(id);
      setStoryData(res); // 여기서 res.data 사용
      setCurrentIndex(0);
    } catch (error) {
      console.error('스토리 불러오기 실패', error);
    }
  };

  useEffect(() => {
    fetchStoryDetail(storyId);
  }, [storyId]);

  /** 자동 진행 */
  useEffect(() => {
    if (!storyData) return;
    const currentStory: UserStoryItem | undefined = storyData.current_user_stories[currentIndex];
    if (!currentStory || isPaused) return;

    const duration =
      currentStory.type === 'video'
        ? (currentStory.duration ?? 5) * 1000
        : 5000;

    timerRef.current = setTimeout(() => {
      goToNext();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [storyData, currentIndex, isPaused]);

  /** 다음 스토리 */
  const goToNext = () => {
    if (!storyData) return;
    const total = storyData.current_user_stories.length;
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (storyData.next_user_stories?.length) {
      fetchStoryDetail(storyData.next_user_stories[0].id);
    } else {
      console.log('마지막 스토리입니다.');
    }
  };

  /** 이전 스토리 */
  const goToPrev = () => {
    if (!storyData) return;
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (storyData.prev_user_stories?.length) {
      fetchStoryDetail(storyData.prev_user_stories[0].id);
    }
  };

  /** 화면 좌/우 터치 처리 */
  const handlePress = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    const touchX = event.nativeEvent.locationX;
    const halfWidth = SCREEN_WIDTH / 2;

    setIsPaused(true);

    if (!storyData) return;
    const total = storyData.current_user_stories.length;

    if (touchX > halfWidth) {
      // 오른쪽 터치 → 다음 스토리
      if (currentIndex < total - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (storyData.next_user_stories?.length) {
        fetchStoryDetail(storyData.next_user_stories[0].id);
      }
    } else {
      // 왼쪽 터치 → 이전 스토리
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (storyData.prev_user_stories?.length) {
        fetchStoryDetail(storyData.prev_user_stories[0].id);
      }
    }
  };

  /** 사용자 단위 스와이프 */
  const pan = Gesture.Pan().onEnd((e) => {
    const SWIPE_THRESHOLD = 50;
    const shouldGoNext = e.translationX < -SWIPE_THRESHOLD;
    const shouldGoPrev = e.translationX > SWIPE_THRESHOLD;

    if (shouldGoNext && storyData?.next_user_stories?.length) {
      fetchStoryDetail(storyData.next_user_stories[0].id);
    } else if (shouldGoPrev && storyData?.prev_user_stories?.length) {
      fetchStoryDetail(storyData.prev_user_stories[0].id);
    }
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

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
    <SafeAreaView style={q.container} edges={['bottom','top']}>
      <GestureHandlerRootView style={q.gestureRoot}>
        <GestureDetector gesture={pan}>
          <TouchableWithoutFeedback
            onPressIn={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
            onPress={handlePress} // 좌/우 터치
          >
            <Animated.View style={[q.storyContainer, animatedStyle]}>
              {currentStory.type === 'image' ? (
                <Image
                  source={{ uri: currentStory.content_url }}
                  style={q.storyImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={q.storyVideo}>
                  <Text style={q.videoText}>
                    영상 재생: {currentStory.duration}s
                  </Text>
                </View>
              )}

              {/* 사용자 정보 오버레이 */}
              <View style={q.topOverlayContainer}>
                <View style={q.overlayContent}>
                  <TouchableWithoutFeedback
                    onPress={() => navigation.navigate('UserProfile', { userId: String(currentStory.user_id) })}
                  >
                    <View style={q.userOverlay}>
            <UserAvatar
              profileImg={currentStory.profile_img}
              nickname={currentStory.username}
              size={36}
            />
            <Text style={q.userNickname}>{currentStory.username}</Text>
                      <Text style={q.userTime}>{formatRelativeTime(currentStory.created_at)}</Text>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </GestureDetector>

        {/* 진행 표시 */}
        <View style={q.dots}>
          {storyData.current_user_stories.map((_, idx) => (
            <View
              key={idx}
              style={[q.dot, idx === currentIndex && q.activeDot]}
            />
          ))}
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS as THEME_SHADOWS, BG_COLORS, TEXT_COLORS } from '../constants/theme';

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50, // 스토리 스크린 배경 ( 다른 스크린처럼 LIGHT/DARK 적용)
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
    color: colors.BLACK, // 다크모드에서 WHITE
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
  dots: {
    position: 'absolute',
    top: 50,
    flexDirection: 'row',
    alignSelf: 'center'
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.GRAY_500,
    marginHorizontal: 4
  },
  activeDot: {
    backgroundColor: colors.WHITE,
    width: 16
  },
  topOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  overlayContent: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    borderTopRightRadius: BORDER_RADIUS.XL,
    borderTopLeftRadius: BORDER_RADIUS.XL,
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
});
