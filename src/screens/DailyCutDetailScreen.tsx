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
  TouchableOpacity,
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
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { AuthStackParamList } from '../types/navigation';
import { StoryService } from '../services/storyService';
import type { UserStoryDetailResponse } from '../types/story';
import { useThemeStore } from '../stores/themeStore';
import useStoryStore from '../stores/storyStore';
import UserAvatar from '../components/UserAvatar';
import { formatRelativeTime } from '../utils/timeUtils';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS as THEME_SHADOWS, TEXT_COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTUAL_WIDTH = SCREEN_WIDTH;

// Modern SVG Icons
const CloseIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

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
  duration: number;
  segmentWidth: number;
  colors: Record<string, string>;
  isPaused: boolean;
  onComplete: () => void;
}> = ({ isActive, isCompleted, duration, segmentWidth, colors, isPaused, onComplete }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isPaused && isActive) {
      // Pause: cancel animation but keep current progress
      cancelAnimation(progress);
    } else if (isActive && !isPaused && !isCompleted) {
      // Active story: start or continue animation
      const currentProgress = progress.value;
      if (currentProgress >= 1) {
        // Previously completed story visited again: restart from 0
        progress.value = 0;
        progress.value = withTiming(
          1,
          { duration },
          (finished) => {
            'worklet';
            if (finished) {
              scheduleOnRN(onComplete);
            }
          }
        );
      } else if (currentProgress < 1) {
        // Continue from current progress (paused case)
        const remainingDuration = duration * (1 - currentProgress);
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
    } else {
      progress.value = 0;
    }
  }, [isActive, isPaused, isCompleted, duration]);

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
  colors: Record<string, string>;
  onVideoEnd: () => void;
  isPaused: boolean;
}> = ({ story, isActive, colors, onVideoEnd, isPaused }) => {
  const { setShouldRefreshStories } = useStoryStore();
  const [imageLoading, setImageLoading] = useState(true);

  const player = useVideoPlayer(
    story.type === 'video' && isActive ? story.content_url : '',
    (player) => {
      player.loop = false;
      if (isActive) {
        player.play();
      }
    }
  );

  useEffect(() => {
    if (story.type !== 'video' || !isActive) return;

    const subscription = player.addListener('playToEnd', onVideoEnd);
    return () => subscription.remove();
  }, [isActive, story.type]);

  // 스토리 읽음 처리
  useEffect(() => {
    if (isActive && !story.is_viewed) {
      StoryService.viewStory(story.id)
        .then(response => {
          // 스토리 읽음 처리 성공 시 리프레시 플래그 설정
          setShouldRefreshStories(true);
        })
        .catch(error => {
          console.error('스토리 읽음 처리 실패:', error);
        });
    }
  }, [isActive, story.id, story.is_viewed, setShouldRefreshStories]);

  // 비디오 일시 정지 제어
  useEffect(() => {
    if (story.type === 'video' && isActive) {
      if (isPaused) {
        player.pause();
      } else {
        player.play();
      }
    }
  }, [isPaused, isActive, story.type, player]);

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
  isScrolling: boolean;
  isScrollingRef: React.MutableRefObject<boolean>;
  lastScrollTimeRef: React.MutableRefObject<number>;
}> = ({ userStories, isActive, onNext, onPrev, onClose, canGoNext, canGoPrev, isScrolling, isScrollingRef, lastScrollTimeRef }) => {
  const { colors } = useThemeStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [longPressDetected, setLongPressDetected] = useState(false);
  const touchStartTimeRef = useRef<number>(0);

  const currentStory = userStories.stories[currentIndex];
  const totalStories = userStories.stories.length;

  // isActive가 true로 변경될 때 currentIndex를 0으로 리셋
  useEffect(() => {
    if (isActive) {
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
          colors={colors}
          onVideoEnd={handleNext}
          isPaused={longPressDetected || isScrolling}
        />
      ))}

      <Pressable
        style={q.touchOverlay}
        delayLongPress={150}
        onPressIn={() => {
          touchStartTimeRef.current = Date.now();
        }}
        onLongPress={() => setLongPressDetected(true)}
        onPressOut={(e) => {
          const touchDuration = Date.now() - touchStartTimeRef.current;
          const isCurrentlyScrolling = isScrollingRef.current;
          const timeSinceLastScroll = Date.now() - lastScrollTimeRef.current;
          const isQuickTap = touchDuration < 50; // 50ms 이하의 매우 짧은 터치는 무시

          // 여러 조건 중 하나라도 참이면 탭 이벤트 무시
          if (isCurrentlyScrolling || isScrolling || timeSinceLastScroll < 200 || longPressDetected || isQuickTap) {
            setLongPressDetected(false);
            return;
          }

          if (!longPressDetected) {
            // 긴 터치가 아니었다면 좌우 이동 처리
            handlePress(e.nativeEvent.locationX);
          }
          setLongPressDetected(false);
        }}
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
                duration={story.type === 'video' ? (story.duration ?? 5) * 1000 : 5000}
                segmentWidth={segmentWidth}
                colors={colors}
                isPaused={longPressDetected || isScrolling}
                onComplete={handleNext}
              />
            );
          })}
        </View>

        <View style={q.overlayContent} pointerEvents="box-none">
          <View style={q.infoContainer}>
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
            <TouchableOpacity onPress={onClose} style={q.closeButton}>
              <CloseIcon size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// ====== 메인 컴포넌트 ======
export default function DailyCutDetailScreen({ route, navigation }: Props) {
  const { storyId, isMyStory = false } = route.params;
  const { colors } = useThemeStore();

  // 동적 상태 관리
  const [data, setData] = useState<Array<UserStories | null>>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [navigationInfo, setNavigationInfo] = useState<NavigationInfo | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // 로드된 유저 ID를 인덱스와 함께 추적
  const loadedIndexMap = useRef<Map<number, number>>(new Map()); // userId -> index
  const loadingUserIds = useRef<Set<string>>(new Set()); // userId-direction 조합

  const flatListRef = useRef<FlatList>(null);
  const isInitialMount = useRef(true);
  const currentUserIndexRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const lastScrollTimeRef = useRef<number>(0);

  // currentUserIndex 최신 값 유지
  useEffect(() => {
    currentUserIndexRef.current = currentUserIndex;
  }, [currentUserIndex]);

  // 컴포넌트 언마운트 시 타이머 클리어
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // API 응답을 UserStories 배열로 변환
  const transformApiResponse = useCallback((response: UserStoryDetailResponse): {
    prevUser: UserStories | null;
    nextUser: UserStories | null;
  } => {
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
    }

    return { prevUser, nextUser };
  }, []);

  // 초기 로드
  const initializeStory = useCallback(async (storyId: number, isMyStory: boolean) => {
    setLoading(true);

    try {
      if (isMyStory) {
        // 자신의 스토리인 경우
        // 자신의 스토리 상세 조회
        const detailResponse = await StoryService.getMyStoryDetail(storyId);

        if (!detailResponse.current_user_stories || detailResponse.current_user_stories.length === 0) {
          throw new Error('자신의 스토리를 찾을 수 없습니다.');
        }

        // 자신의 스토리 데이터를 UserStories 형식으로 변환
        const myStories: UserStories = {
          user_id: detailResponse.current_user_stories[0].user_id,
          username: detailResponse.current_user_stories[0].username,
          profile_img: detailResponse.current_user_stories[0].profile_img,
          stories: detailResponse.current_user_stories,
        };

        // 자신의 스토리만 표시 (인덱스 0에 배치)
        const initialArray: Array<UserStories | null> = [myStories];
        setData(initialArray);
        setCurrentUserIndex(0);
        setTotalUsers(1);
        setNavigationInfo(null); // 내비게이션 정보 없음
      } else {
        // 다른 유저의 스토리인 경우 (기존 로직)
        // 1. 스토리 진입 정보 조회
        const entryResponse = await StoryService.getStoryEntry(storyId);
        const targetUserId = entryResponse.entry_user_id;

        // 2. 해당 유저의 스토리 상세 조회 (초기 조회 - direction 없음)
        const detailResponse = await StoryService.getUserStoryDetail(targetUserId);

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

          // 상태 설정
          setTotalUsers(total_users);
          setData(initialArray);
          setCurrentUserIndex(baseIndex);
          setNavigationInfo(detailResponse.navigation_info);
        } else {
          // pagination_info가 없는 경우 (예외 상황) - 기존 로직으로 폴백
          // console.warn('[initializeStory] pagination_info가 없음 - 폴백 모드');
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
      }
    } catch (error) {
      console.error(error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [transformApiResponse, navigation]);

  // 추가 유저 로드 (direction 기반)
  const loadAdditionalUser = useCallback(async (currentUserId: number, direction: 'next' | 'prev', targetIndex: number) => {
    // 이미 해당 인덱스에 데이터가 있는지 확인
    if (data[targetIndex] !== null) {
      return;
    }

    // 로딩 중복 체크
    const loadKey = `${currentUserId}-${direction}`;
    if (loadingUserIds.current.has(loadKey)) {
      return;
    }

    try {
      loadingUserIds.current.add(loadKey);

      // direction 파라미터와 함께 API 호출
      const response = await StoryService.getUserStoryDetail(currentUserId, direction);

      const { nextUser, prevUser } = transformApiResponse(response);

      setData(prev => {
        const newData = [...prev];

        if (direction === 'next' && nextUser) {
          // 해당 userId가 다른 인덱스에 이미 로드되어 있는지 확인
          const existingIndex = loadedIndexMap.current.get(nextUser.user_id);
          if (existingIndex === undefined) {
            newData[targetIndex] = nextUser;
            loadedIndexMap.current.set(nextUser.user_id, targetIndex);
          }
        } else if (direction === 'prev' && prevUser) {
          // 해당 userId가 다른 인덱스에 이미 로드되어 있는지 확인
          const existingIndex = loadedIndexMap.current.get(prevUser.user_id);
          if (existingIndex === undefined) {
            newData[targetIndex] = prevUser;
            loadedIndexMap.current.set(prevUser.user_id, targetIndex);
          }
        }

        return newData;
      });

      // navigation_info 업데이트
      if (response.navigation_info) {
        setNavigationInfo(response.navigation_info);
      }

    } catch (error) {
      console.error(`loadAdditionalUser failed: userId: ${currentUserId}, direction: ${direction}`, error);
    } finally {
      loadingUserIds.current.delete(loadKey);
    }
  }, [data, transformApiResponse]);

  // 초기 로드
  useEffect(() => {
    initializeStory(storyId, isMyStory);
  }, [storyId, isMyStory]);

  // 다음 유저로 이동
  const handleNextUser = useCallback(() => {
    if (!navigationInfo?.has_next) {
      navigation.goBack();
      return;
    }

    const nextIndex = currentUserIndex + 1;

    // 전체 배열 범위 체크
    if (nextIndex >= totalUsers) {
      navigation.goBack();
      return;
    }

    const nextUser = data[nextIndex];

    if (!nextUser) {
      return;
    }

    // 다음다음 데이터 프리패칭 (nextIndex + 1이 배열 범위 내이고 비어있을 때만)
    const prefetchIndex = nextIndex + 1;
    if (prefetchIndex < totalUsers && !data[prefetchIndex] && navigationInfo?.has_next) {
      loadAdditionalUser(nextUser.user_id, 'next', prefetchIndex);
    }

    // 이동 준비: 프로그래매틱 스크롤 시 탭 이벤트 방지
    isScrollingRef.current = true;
    setIsScrolling(true);

    // 이동
    setCurrentUserIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [currentUserIndex, data, navigationInfo, loadAdditionalUser, navigation, totalUsers]);

  // 이전 유저로 이동
  const handlePrevUser = useCallback(() => {
    if (!navigationInfo?.has_prev) {
      return;
    }

    const prevIndex = currentUserIndex - 1;

    // 전체 배열 범위 체크
    if (prevIndex < 0) {
      return;
    }

    const prevUser = data[prevIndex];

    if (!prevUser) {
      return;
    }

    // 이전이전 데이터 프리패칭 (prevIndex - 1이 배열 범위 내이고 비어있을 때만)
    const prefetchIndex = prevIndex - 1;
    if (prefetchIndex >= 0 && !data[prefetchIndex] && navigationInfo?.has_prev) {
      loadAdditionalUser(prevUser.user_id, 'prev', prefetchIndex);
    }

    // 이동 준비: 프로그래매틱 스크롤 시 탭 이벤트 방지
    isScrollingRef.current = true;
    setIsScrolling(true);

    // 이동
    setCurrentUserIndex(prevIndex);
    flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  }, [currentUserIndex, data, navigationInfo, loadAdditionalUser, totalUsers]);

  // FlatList 뷰 변경 감지 - 범위 체크 추가
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && !isInitialMount.current) {
      const newIndex = viewableItems[0].index;

      // 전체 배열 범위를 벗어난 스크롤 시도 방지 (0 ~ totalUsers - 1)
      if (newIndex < 0 || newIndex >= totalUsers) {
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
        setCurrentUserIndex(newIndex);

        // 스와이프로 이동한 경우 프리패칭
        const currentUser = data[newIndex];
        if (currentUser) {
          // 다음 데이터 프리패칭
          const nextTargetIndex = newIndex + 1;
          if (nextTargetIndex < totalUsers && !data[nextTargetIndex] && navigationInfo?.has_next) {
            loadAdditionalUser(currentUser.user_id, 'next', nextTargetIndex);
          }

          // 이전 데이터 프리패칭
          const prevTargetIndex = newIndex - 1;
          if (prevTargetIndex >= 0 && !data[prevTargetIndex] && navigationInfo?.has_prev) {
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
          onScrollBeginDrag={() => {
            // 기존 타이머 클리어
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }
            // 마지막 스크롤 시간 기록
            lastScrollTimeRef.current = Date.now();
            // Ref 먼저 업데이트 (동기)
            isScrollingRef.current = true;
            // State 업데이트 (비동기)
            setIsScrolling(true);
          }}
          onScrollEndDrag={() => {
            // 250ms 지연 후 isScrolling 해제
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
              isScrollingRef.current = false;
              setIsScrolling(false);
            }, 250);
          }}
          onMomentumScrollEnd={() => {
            // 모멘텀 스크롤도 고려해서 타이머 재설정
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
              isScrollingRef.current = false;
              setIsScrolling(false);
            }, 150);
          }}
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
                canGoNext={isMyStory ? false : !!navigationInfo?.has_next}
                canGoPrev={isMyStory ? false : !!navigationInfo?.has_prev}
                isScrolling={isScrolling}
                isScrollingRef={isScrollingRef}
                lastScrollTimeRef={lastScrollTimeRef}
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
    infoContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    closeButton: {
      padding: SPACING.XS,
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
