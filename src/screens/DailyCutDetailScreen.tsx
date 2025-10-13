import 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, Image, TouchableWithoutFeedback, NativeSyntheticEvent, NativeTouchEvent } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { StoryService } from '../services/storyService';
import { StoryDetailResponse, UserStoryItem } from '../types/story';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DailyCutDetailScreenRouteProp = RouteProp<AuthStackParamList, 'DailyCutDetail'>;
type DailyCutDetailScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'DailyCutDetail'>;

interface Props {
  route: DailyCutDetailScreenRouteProp;
  navigation: DailyCutDetailScreenNavigationProp;
}

export default function DailyCutDetailScreen({ route }: Props) {
  const { storyId } = route.params;

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

  if (!storyData) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff' }}>스토리 로딩 중...</Text>
      </View>
    );
  }

  const currentStory = storyData.current_user_stories[currentIndex];

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={pan}>
        <TouchableWithoutFeedback
          onPressIn={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
          onPress={handlePress} // 좌/우 터치
        >
          <Animated.View style={[styles.storyContainer, animatedStyle]}>
            {currentStory.type === 'image' ? (
              <Image
                source={{ uri: currentStory.content_url }}
                style={styles.storyImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.storyVideo}>
                <Text style={{ color: '#fff' }}>
                  영상 재생: {currentStory.duration}s
                </Text>
              </View>
            )}
          </Animated.View>
        </TouchableWithoutFeedback>
      </GestureDetector>

      {/* 진행 표시 */}
      <View style={styles.dots}>
        {storyData.current_user_stories.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, idx === currentIndex && styles.activeDot]}
          />
        ))}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  storyContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  storyImage: { width: '100%', height: '100%' },
  storyVideo: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  dots: { position: 'absolute', top: 50, flexDirection: 'row', alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#444', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#fff', width: 16 },
});
