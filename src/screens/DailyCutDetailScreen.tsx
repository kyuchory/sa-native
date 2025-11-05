// DailyCutDetailScreen.tsx
import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { AuthStackParamList } from '../types/navigation';
import { StoryService } from '../services/storyService';
import type { UserStoryDetailResponse } from '../types/story';
import { useThemeStore } from '../stores/themeStore';
import UserAvatar from '../components/UserAvatar';
import { formatRelativeTime } from '../utils/timeUtils';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS as THEME_SHADOWS, TEXT_COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTUAL_WIDTH = SCREEN_WIDTH;

// 폴백용 상수들 (pagination_info가 없을 때 사용)
const FALLBACK_TOTAL_USERS = 300;
const FALLBACK_CENTER_INDEX = Math.floor(FALLBACK_TOTAL_USERS / 2);

type DailyCutDetailScreenRouteProp = RouteProp<AuthStackParamList, 'DailyCutDetail'>;
type DailyCutDetailScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'DailyCutDetail'>;

interface Props {
  route: DailyCutDetailScreenRouteProp;
  navigation: DailyCutDetailScreenNavigationProp;
}

// ====== 타입 정의 ======
interface Story {
  id: number;
  user_id: number;
  username: string;
  profile_img: string;
  type: 'image' | 'video';
  content_url: string;
  thumbnail_url?: string | null;
  duration?: number | null;
  is_viewed: boolean;
  created_at: string;
}

interface UserStories {
  user_id: number;
  username: string;
  profile_img: string;
  stories: Story[];
}

interface NavigationInfo {
  next_user_id: number | null;
  prev_user_id: number | null;
  has_next: boolean;
  has_prev: boolean;
}

// ====== ProgressBar 컴포넌트 ======
const ProgressBar: React.FC<{
  isActive: boolean;
  isCompleted: boolean;
  isPaused: boolean;
  duration: number;
  segmentWidth: number;
  colors: Record<string, string>;
  onComplete: () => void;
}> = ({ isActive, isCompleted, isPaused, duration, segmentWidth, colors, onComplete }) => {
  const progress = useSharedValue(0);
  const pausedProgressRef = useRef<number>(0);

  useEffect(() => {
    if (isActive) {
      cancelAnimation(progress);
      progress.value = 0;
      pausedProgressRef.current = 0;
    } else if (!isCompleted) {
      cancelAnimation(progress);
      progress.value = 0;
      pausedProgressRef.current = 0;
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      if (isPaused) {
        pausedProgressRef.current = progress.value;
        cancelAnimation(progress);
      } else {
        const resumedProgress = pausedProgressRef.current;
        const remainingDuration = duration * (1 - resumedProgress);

        progress.value = resumedProgress;
        progress.value = withTiming(
          1,
          { duration: remainingDuration },
          (finished) => {
            'worklet';
            if (finished) {
              scheduleOnRN(onComplete);
            }
          }
        );
      }
    } else if (isCompleted) {
      progress.value = 1;
    }
  }, [isActive, isPaused, duration]);

  const progressAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      width: interpolate(progress.value, [0, 1], [0, segmentWidth], Extrapolation.CLAMP),
    };
  }, [segmentWidth]);

  const q = createProgressStyles(colors);

  return (
    <View style={[q.progressSegment, { width: segmentWidth }]}>
      <View style={q.progressTrack} />
      {(isCompleted || isActive) && (
        <Animated.View style={[q.progressFill, progressAnimatedStyle]} />
      )}
    </View>
  );
};

// ====== StorySegment 컴포넌트 ======
const StorySegment: React.FC<{
  story: Story;
  isActive: boolean;
  isPaused: boolean;
  colors: Record<string, string>;
  onVideoEnd: () => void;
}> = ({ story, isActive, isPaused, colors, onVideoEnd }) => {
  const [imageLoading, setImageLoading] = useState(true);

  const player = useVideoPlayer(
    story.type === 'video' && isActive ? story.content_url : '',
    (player) => {
      player.loop = false;
      if (isActive && !isPaused) {
        player.play();
      }
    }
  );

  useEffect(() => {
    if (story.type !== 'video' || !isActive) return;

    if (isPaused) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPaused, isActive, story.type]);

  useEffect(() => {
    if (story.type !== 'video' || !isActive) return;

    const subscription = player.addListener('playToEnd', onVideoEnd);
    return () => subscription.remove();
  }, [isActive, story.type]);

  if (!isActive) return null;

  const q = createSegmentStyles(colors);

  return (
    <View style={q.segmentContainer}>
      {story.type === 'image' ? (
        <>
          {imageLoading && (
            <View style={q.loadingContainer}>
              <ActivityIndicator size="large" color={colors.WHITE} />
            </View>
          )}
          <Image
            source={{ uri: story.content_url }}
            style={q.storyImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
        </>
      ) : (
        <VideoView
          player={player}
          style={q.storyVideo}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      )}
    </View>
  );
};

// ====== StoryView 컴포넌트 ======
const StoryView: React.FC<{
  userStories: UserStories;
  isActive: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}> = ({ userStories, isActive, onNext, onPrev, onClose, canGoNext, canGoPrev }) => {
  const { colors } = useThemeStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pressStartRef = useRef<number>(0);

  const currentStory = userStories.stories[currentIndex];
  const totalStories = userStories.stories.length;

  // isActive가 true로 변경될 때 currentIndex를 0으로 리셋
  useEffect(() => {
    if (isActive) {
      console.log(`[StoryView] 유저 활성화 - userId: ${userStories.user_id}, currentIndex 리셋`);
      setCurrentIndex(0);
    }
  }, [isActive, userStories.user_id]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalStories - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 마지막 스토리에서 다음으로 가려고 할 때
      if (canGoNext) {
        onNext();
      } else {
        // 더 이상 다음 유저가 없으면 닫기
        onClose();
      }
    }
  }, [currentIndex, totalStories, onNext, onClose, canGoNext]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      // 첫 번째 스토리에서 이전으로 가려고 할 때
      if (canGoPrev) {
        onPrev();
      }
      // 이전 유저가 없으면 아무것도 하지 않음 (첫 유저)
    }
  }, [currentIndex, onPrev, canGoPrev]);

  const handlePress = useCallback((x: number) => {
    const pressDuration = Date.now() - pressStartRef.current;
    if (pressDuration > 200) return;

    const halfWidth = ACTUAL_WIDTH / 2;
    if (x > halfWidth) {
      handleNext();
    } else {
      handlePrev();
    }
  }, [handlePrev, handleNext]);

  const segmentWidth =
    (ACTUAL_WIDTH - SPACING.MD * 2 - SPACING.XS * (totalStories - 1)) / totalStories;

  const q = createStoryViewStyles(colors);

  return (
    <View style={q.storyContainer}>
      {userStories.stories.map((story, index) => (
        <StorySegment
          key={story.id}
          story={story}
          isActive={index === currentIndex}
          isPaused={isPaused}
          colors={colors}
          onVideoEnd={handleNext}
        />
      ))}

      <Pressable
        style={q.touchOverlay}
        onPressIn={() => {
          pressStartRef.current = Date.now();
          setIsPaused(true);
        }}
        onPressOut={() => setIsPaused(false)}
        onPress={(e) => handlePress(e.nativeEvent.locationX)}
      />

      <View style={q.topOverlayContainer} pointerEvents="box-none">
        <View style={q.progressContainer}>
          {userStories.stories.map((story, idx) => {
            const isCompleted = idx < currentIndex;
            const isActiveBar = idx === currentIndex;

            return (
              <ProgressBar
                key={`${currentStory?.user_id}-${idx}`}
                isCompleted={isCompleted}
                isActive={isActiveBar && isActive}
                isPaused={isPaused}
                duration={story.type === 'video' ? (story.duration ?? 5) * 1000 : 5000}
                segmentWidth={segmentWidth}
                colors={colors}
                onComplete={handleNext}
              />
            );
          })}
        </View>

        <View style={q.overlayContent} pointerEvents="box-none">
          <View style={q.userOverlay}>
            <UserAvatar
              profileImg={currentStory?.profile_img}
              nickname={currentStory?.username || ''}
              size={32}
            />
            <Text style={q.userNickname}>{currentStory?.username}</Text>
            <Text style={q.userTime}>
              {currentStory?.created_at ? formatRelativeTime(currentStory.created_at) : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ====== 메인 컴포넌트 ======
export default function DailyCutDetailScreen({ route, navigation }: Props) {
  const { storyId } = route.params;
  const { colors } = useThemeStore();

  // 동적 상태 관리
  const [data, setData] = useState<Array<UserStories | null>>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [navigationInfo, setNavigationInfo] = useState<NavigationInfo | null>(null);

  // 로드된 유저 ID를 인덱스와 함께 추적
  const loadedIndexMap = useRef<Map<number, number>>(new Map()); // userId -> index
  const loadingUserIds = useRef<Set<string>>(new Set()); // userId-direction 조합

  const flatListRef = useRef<FlatList>(null);
  const isInitialMount = useRef(true);
  const currentUserIndexRef = useRef(0);

  // currentUserIndex 최신 값 유지
  useEffect(() => {
    currentUserIndexRef.current = currentUserIndex;
  }, [currentUserIndex]);

  // API 응답을 UserStories 배열로 변환
  const transformApiResponse = useCallback((response: UserStoryDetailResponse): {
    prevUser: UserStories | null;
    nextUser: UserStories | null;
  } => {
    console.log('[transformApiResponse] 변환 시작');
    
    let prevUser: UserStories | null = null;
    let nextUser: UserStories | null = null;

    // 이전 유저 변환
    if (response.prev_user_stories?.length > 0) {
      const first = response.prev_user_stories[0];
      prevUser = {
        user_id: first.user_id,
        username: first.username,
        profile_img: first.profile_img,
        stories: response.prev_user_stories,
      };
      console.log(`[transformApiResponse] prev_user 변환 - userId: ${first.user_id}, stories: ${response.prev_user_stories.length}개`);
    }

    // 다음 유저 변환
    if (response.next_user_stories?.length > 0) {
      const first = response.next_user_stories[0];
      nextUser = {
        user_id: first.user_id,
        username: first.username,
        profile_img: first.profile_img,
        stories: response.next_user_stories,
      };
      console.log(`[transformApiResponse] next_user 변환 - userId: ${first.user_id}, stories: ${response.next_user_stories.length}개`);
    }

    return { prevUser, nextUser };
  }, []);

  // 초기 로드
  const initializeStory = useCallback(async (storyId: number) => {
    console.log(`[initializeStory] 시작 - storyId: ${storyId}`);
    setLoading(true);

    try {
      // 1. 스토리 진입 정보 조회
      const entryResponse = await StoryService.getStoryEntry(storyId);
      const targetUserId = entryResponse.entry_user_id;
      console.log(`[initializeStory] 진입 유저 ID: ${targetUserId}`);

      // 2. 해당 유저의 스토리 상세 조회 (초기 조회 - direction 없음)
      const detailResponse = await StoryService.getUserStoryDetail(targetUserId);
      console.log('[initializeStory] API 응답:', {
        current: detailResponse.current_user_stories?.length || 0,
        next: detailResponse.next_user_stories?.length || 0,
        prev: detailResponse.prev_user_stories?.length || 0,
        nav: detailResponse.navigation_info
      });

      // 3. current_user_stories를 현재 유저로 변환
      let currentUser: UserStories | null = null;
      if (detailResponse.current_user_stories?.length > 0) {
        const first = detailResponse.current_user_stories[0];
        currentUser = {
          user_id: first.user_id,
          username: first.username,
          profile_img: first.profile_img,
          stories: detailResponse.current_user_stories,
        };
        console.log(`[initializeStory] current_user 변환 - userId: ${first.user_id}, stories: ${detailResponse.current_user_stories.length}개`);
      }

      // 4. next/prev 유저 변환
      const { prevUser, nextUser } = transformApiResponse(detailResponse);

      if (!currentUser) {
        throw new Error('현재 유저 스토리를 찾을 수 없습니다.');
      }

      // 5. pagination_info를 활용한 동적 초기 데이터 세팅
      let initialArray: Array<UserStories | null> = [];
      let baseIndex = 0;

      if (detailResponse.pagination_info) {
        // pagination_info가 있는 경우 (초기 조회)
        const { total_users, current_index } = detailResponse.pagination_info;

        // 동적 크기 배열 생성
        initialArray = Array(total_users).fill(null);
        baseIndex = current_index;

        // 현재 유저 배치
        initialArray[baseIndex] = currentUser;
        loadedIndexMap.current.set(currentUser.user_id, baseIndex);

        // prev/next 유저 배치
        if (prevUser) {
          initialArray[baseIndex - 1] = prevUser;
          loadedIndexMap.current.set(prevUser.user_id, baseIndex - 1);
        }

        if (nextUser) {
          initialArray[baseIndex + 1] = nextUser;
          loadedIndexMap.current.set(nextUser.user_id, baseIndex + 1);
        }

        console.log(`[initializeStory] pagination_info 활용 초기화 - total_users: ${total_users}, current_index: ${current_index}`);
        console.log(`[initializeStory] 초기 데이터 구성 완료 - baseIndex: ${baseIndex}`);
        console.log(`[initializeStory] loadedIndexMap:`, Array.from(loadedIndexMap.current.entries()));

        // 상태 설정
        setTotalUsers(total_users);
        setData(initialArray);
        setCurrentUserIndex(baseIndex);
        setNavigationInfo(detailResponse.navigation_info);
      } else {
        // pagination_info가 없는 경우 (예외 상황) - 기존 로직으로 폴백
        console.warn('[initializeStory] pagination_info가 없음 - 폴백 모드');
        initialArray = Array(FALLBACK_TOTAL_USERS).fill(null);
        baseIndex = FALLBACK_CENTER_INDEX;

        initialArray[baseIndex] = currentUser;
        loadedIndexMap.current.set(currentUser.user_id, baseIndex);

        if (prevUser) {
          initialArray[baseIndex - 1] = prevUser;
          loadedIndexMap.current.set(prevUser.user_id, baseIndex - 1);
        }

        if (nextUser) {
          initialArray[baseIndex + 1] = nextUser;
          loadedIndexMap.current.set(nextUser.user_id, baseIndex + 1);
        }

        setData(initialArray);
        setCurrentUserIndex(baseIndex);
        setNavigationInfo(detailResponse.navigation_info);
      }

      console.log('[initializeStory] 초기화 완료');

    } catch (error) {
      console.error('[initializeStory] 실패:', error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [transformApiResponse, navigation]);

  // 추가 유저 로드 (direction 기반)
  const loadAdditionalUser = useCallback(async (currentUserId: number, direction: 'next' | 'prev', targetIndex: number) => {
    console.log(`[loadAdditionalUser] 시작 - currentUserId: ${currentUserId}, direction: ${direction}, targetIndex: ${targetIndex}`);

    // 이미 해당 인덱스에 데이터가 있는지 확인
    if (data[targetIndex] !== null) {
      console.log(`[loadAdditionalUser] 타겟 인덱스에 이미 데이터 존재 - targetIndex: ${targetIndex}`);
      return;
    }

    // 로딩 중복 체크
    const loadKey = `${currentUserId}-${direction}`;
    if (loadingUserIds.current.has(loadKey)) {
      console.log(`[loadAdditionalUser] 이미 로딩 중 - key: ${loadKey}`);
      return;
    }

    try {
      loadingUserIds.current.add(loadKey);

      // direction 파라미터와 함께 API 호출
      const response = await StoryService.getUserStoryDetail(currentUserId, direction);
      console.log(`[loadAdditionalUser] API 응답 - direction: ${direction}`, {
        next: response.next_user_stories?.length || 0,
        prev: response.prev_user_stories?.length || 0,
        nav: response.navigation_info,
      });

      const { nextUser, prevUser } = transformApiResponse(response);

      setData(prev => {
        const newData = [...prev];
        
        if (direction === 'next' && nextUser) {
          // 해당 userId가 다른 인덱스에 이미 로드되어 있는지 확인
          const existingIndex = loadedIndexMap.current.get(nextUser.user_id);
          if (existingIndex !== undefined) {
            console.log(`[loadAdditionalUser] next 유저 이미 로드됨 - userId: ${nextUser.user_id}, existingIndex: ${existingIndex}`);
          } else {
            newData[targetIndex] = nextUser;
            loadedIndexMap.current.set(nextUser.user_id, targetIndex);
            console.log(`[loadAdditionalUser] next 유저 추가 - index: ${targetIndex}, userId: ${nextUser.user_id}`);
          }
        } else if (direction === 'prev' && prevUser) {
          // 해당 userId가 다른 인덱스에 이미 로드되어 있는지 확인
          const existingIndex = loadedIndexMap.current.get(prevUser.user_id);
          if (existingIndex !== undefined) {
            console.log(`[loadAdditionalUser] prev 유저 이미 로드됨 - userId: ${prevUser.user_id}, existingIndex: ${existingIndex}`);
          } else {
            newData[targetIndex] = prevUser;
            loadedIndexMap.current.set(prevUser.user_id, targetIndex);
            console.log(`[loadAdditionalUser] prev 유저 추가 - index: ${targetIndex}, userId: ${prevUser.user_id}`);
          }
        }
        
        return newData;
      });

      // navigation_info 업데이트
      if (response.navigation_info) {
        setNavigationInfo(response.navigation_info);
        console.log(`[loadAdditionalUser] navigationInfo 업데이트:`, response.navigation_info);
      }

    } catch (error) {
      console.error(`[loadAdditionalUser] 실패 - userId: ${currentUserId}, direction: ${direction}`, error);
    } finally {
      loadingUserIds.current.delete(loadKey);
    }
  }, [data, transformApiResponse]);

  // 초기 로드
  useEffect(() => {
    initializeStory(storyId);
  }, [storyId]);

  // 다음 유저로 이동
  const handleNextUser = useCallback(() => {
    if (!navigationInfo?.has_next) {
      console.log('[handleNextUser] 마지막 유저 — 더 이상 이동 불가');
      navigation.goBack();
      return;
    }

    const nextIndex = currentUserIndex + 1;

    // 전체 배열 범위 체크
    if (nextIndex >= totalUsers) {
      console.log('[handleNextUser] 배열 범위 초과 - 더 이상 이동 불가');
      navigation.goBack();
      return;
    }

    const nextUser = data[nextIndex];

    if (!nextUser) {
      console.log('[handleNextUser] 다음 유저 데이터 없음 - API 호출 필요');
      return;
    }

    // 다음다음 데이터 프리패칭 (nextIndex + 1이 배열 범위 내이고 비어있을 때만)
    const prefetchIndex = nextIndex + 1;
    if (prefetchIndex < totalUsers && !data[prefetchIndex] && navigationInfo?.has_next) {
      console.log(`[handleNextUser] 다음다음 유저 프리패칭 - userId: ${nextUser.user_id}`);
      loadAdditionalUser(nextUser.user_id, 'next', prefetchIndex);
    }

    // 이동
    console.log(`[handleNextUser] 이동 - ${currentUserIndex} → ${nextIndex}`);
    setCurrentUserIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [currentUserIndex, data, navigationInfo, loadAdditionalUser, navigation, totalUsers]);

  // 이전 유저로 이동
  const handlePrevUser = useCallback(() => {
    if (!navigationInfo?.has_prev) {
      console.log('[handlePrevUser] 첫 번째 유저 — 더 이상 이동 불가');
      return;
    }

    const prevIndex = currentUserIndex - 1;

    // 전체 배열 범위 체크
    if (prevIndex < 0) {
      console.log('[handlePrevUser] 배열 범위 초과 - 더 이상 이동 불가');
      return;
    }

    const prevUser = data[prevIndex];

    if (!prevUser) {
      console.log('[handlePrevUser] 이전 유저 데이터 없음 - API 호출 필요');
      return;
    }

    // 이전이전 데이터 프리패칭 (prevIndex - 1이 배열 범위 내이고 비어있을 때만)
    const prefetchIndex = prevIndex - 1;
    if (prefetchIndex >= 0 && !data[prefetchIndex] && navigationInfo?.has_prev) {
      console.log(`[handlePrevUser] 이전이전 유저 프리패칭 - userId: ${prevUser.user_id}`);
      loadAdditionalUser(prevUser.user_id, 'prev', prefetchIndex);
    }

    // 이동
    console.log(`[handlePrevUser] 이동 - ${currentUserIndex} → ${prevIndex}`);
    setCurrentUserIndex(prevIndex);
    flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  }, [currentUserIndex, data, navigationInfo, loadAdditionalUser, totalUsers]);

  // FlatList 뷰 변경 감지 - 범위 체크 추가
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && !isInitialMount.current) {
      const newIndex = viewableItems[0].index;

      // 전체 배열 범위를 벗어난 스크롤 시도 방지 (0 ~ totalUsers - 1)
      if (newIndex < 0 || newIndex >= totalUsers) {
        console.log(`[onViewableItemsChanged] 전체 범위 벗어남 감지 - 스크롤 복구: ${newIndex} → ${currentUserIndex}`);
        // 원래 위치로 강제 복귀
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: currentUserIndexRef.current,
            animated: false
          });
        }, 0);
        return;
      }

      if (newIndex !== currentUserIndex) {
        console.log(`[onViewableItemsChanged] 인덱스 변경: ${currentUserIndex} → ${newIndex}`);
        setCurrentUserIndex(newIndex);

        // 스와이프로 이동한 경우 프리패칭
        const currentUser = data[newIndex];
        if (currentUser) {
          // 다음 데이터 프리패칭
          const nextTargetIndex = newIndex + 1;
          if (nextTargetIndex < totalUsers && !data[nextTargetIndex] && navigationInfo?.has_next) {
            console.log(`[onViewableItemsChanged] 다음 유저 프리패칭 - currentUserId: ${currentUser.user_id}`);
            loadAdditionalUser(currentUser.user_id, 'next', nextTargetIndex);
          }

          // 이전 데이터 프리패칭
          const prevTargetIndex = newIndex - 1;
          if (prevTargetIndex >= 0 && !data[prevTargetIndex] && navigationInfo?.has_prev) {
            console.log(`[onViewableItemsChanged] 이전 유저 프리패칭 - currentUserId: ${currentUser.user_id}`);
            loadAdditionalUser(currentUser.user_id, 'prev', prevTargetIndex);
          }
        }
      }
    }
    isInitialMount.current = false;
  }, [currentUserIndex, data, navigationInfo, loadAdditionalUser, totalUsers]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const q = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={q.container} edges={['top', 'bottom']}>
        <View style={q.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={q.loadingText}>스토리 로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={q.container} edges={['bottom', 'top']}>
      <View style={q.contentContainer}>
        <FlatList
          ref={flatListRef}
          data={data}
          horizontal
          pagingEnabled
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={currentUserIndex}
          getItemLayout={(_, index) => ({
            length: ACTUAL_WIDTH,
            offset: ACTUAL_WIDTH * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(_, index) => `user_${index}`}
          renderItem={({ item, index }) =>
            item ? (
              <StoryView
                userStories={item}
                isActive={index === currentUserIndex}
                onNext={handleNextUser}
                onPrev={handlePrevUser}
                onClose={() => navigation.goBack()}
                canGoNext={!!navigationInfo?.has_next}
                canGoPrev={!!navigationInfo?.has_prev}
              />
            ) : (
              <View style={{ width: ACTUAL_WIDTH }} />
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ====== Styles ======
const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.GRAY_50,
    },
    contentContainer: {
      flex: 1,
      margin: 0,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: colors.BLACK,
      marginTop: SPACING.SM,
    },
  });

const createStoryViewStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    storyContainer: {
      width: ACTUAL_WIDTH,
      height: '100%',
      position: 'relative',
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
  });

const createProgressStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
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

const createSegmentStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    segmentContainer: {
      width: '100%',
      height: '100%',
      position: 'absolute',
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
    loadingContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -20 }, { translateY: -20 }],
      zIndex: 10,
    },
  });
