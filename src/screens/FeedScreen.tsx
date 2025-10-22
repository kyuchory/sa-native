import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SPACING } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';
import useFeedStore from '../stores/feedStore';
import useStoryStore from '../stores/storyStore';

  // 컴포넌트 imports
import MainHeader from '../components/MainHeader';
import StorySection from '../components/StorySection';
import FeedCard from '../components/FeedCard';
import { WriteIcon } from '../components/HomeHeaderIcons';

// 데이터 imports
import { FeedListItem } from '../types/feed';
import { FeedService } from '../services/feedService';

type FeedScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

export default function FeedScreen() {
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 상태 관리 - 통합된 feedState로 변경하여 불필요한 리렌더링 방지
  const [feedState, setFeedState] = useState({
    feeds: [] as FeedListItem[],
    cursor: undefined as number | undefined,
    hasNext: true,
    loading: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  // 비디오 가시성 상태 관리 - 화면에 보이는 피드 아이템 추적
  const [visibleVideoFeeds, setVisibleVideoFeeds] = useState<Set<number>>(new Set());

  // Zustand 스토어 상태 및 액션들
  const { shouldRefreshFeeds, setShouldRefreshFeeds } = useFeedStore();
  const { stories, loading: storyLoading, loadStories } = useStoryStore();

  // 컴포넌트 마운트 시 피드와 스토리 로드
  useEffect(() => {
    loadInitialFeeds();
    loadStories();
  }, []);

  // 스마트한 포커스 기반 새로고침
  useFocusEffect(
    useCallback(() => {
      if (shouldRefreshFeeds) {
        loadInitialFeeds();
        setShouldRefreshFeeds(false); // 플래그 초기화
      }
    }, [shouldRefreshFeeds, setShouldRefreshFeeds])
  );

  // 초기 피드 로드
  const loadInitialFeeds = async () => {
    try {
      setFeedState(prev => ({ ...prev, loading: true }));
      const response = await FeedService.getFeeds(undefined, 10);
      setFeedState({
        feeds: response.feeds,
        cursor: response.pagination.next_cursor || undefined,
        hasNext: response.pagination.has_next,
        loading: false,
      });
    } catch (error) {
      console.error('피드 로드 실패:', error);
      Alert.alert('오류', '피드를 불러오는데 실패했습니다.');
      setFeedState(prev => ({ ...prev, loading: false }));
    }
  };

  // 추가 피드 로드 (무한 스크롤)
  const loadMoreFeeds = async () => {
    if (feedState.loading || !feedState.hasNext) return;

    try {
      setFeedState(prev => ({ ...prev, loading: true }));
      const response = await FeedService.getFeeds(feedState.cursor, 10);
      setFeedState(prev => ({
        feeds: [...prev.feeds, ...response.feeds],
        cursor: response.pagination.next_cursor || undefined,
        hasNext: response.pagination.has_next,
        loading: false,
      }));
    } catch (error) {
      console.error('추가 피드 로드 실패:', error);
      setFeedState(prev => ({ ...prev, loading: false }));
    }
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const [feedsResponse] = await Promise.all([
        FeedService.getFeeds(undefined, 10),
        loadStories()
      ]);

      setFeedState({
        feeds: feedsResponse.feeds,
        cursor: feedsResponse.pagination.next_cursor || undefined,
        hasNext: feedsResponse.pagination.has_next,
        loading: false,
      });
    } catch (error) {
      console.error('새로고침 실패:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 헤더 액션 핸들러들
  const handleFeedPress = useCallback(() => {
    console.log('피드 작성 버튼 클릭');
    navigation.navigate('CreateFeed');
  }, [navigation]);

  // 헤더 버튼들 설정 (알림 버튼은 MainHeader가 자동으로 제공하므로 제외)
  const headerRightButtons = useMemo(() => [
    {
      key: 'feed',
      onPress: handleFeedPress,
      IconComponent: WriteIcon,
    },
  ], [handleFeedPress]);

  // 스토리 액션 핸들러들
  const handleStoryPress = useCallback((user: any, storyId?: number) => {
    if (storyId) {
      navigation.navigate('DailyCutDetail', { storyId });
    }
  }, [navigation]);

  const handleAddStoryPress = useCallback(() => {
    console.log('데일리 컷 추가');
    navigation.navigate('DailyCutAdd');
  }, [navigation]);

  // 피드 액션 핸들러들
  const handleLikePress = (feedId: number) => {
    console.log('좋아요 클릭:', feedId);
    // TODO: 좋아요 API 호출
  };

  const handleCommentPress = (feedId: number) => {
    console.log('댓글 클릭:', feedId);
    // TODO: 댓글 화면으로 이동
  };

  const handleBookmarkPress = (feedId: number) => {
    console.log('북마크 클릭:', feedId);
    // TODO: 북마크 API 호출
  };

  const handleUserPress = (userId: number) => {
    console.log('사용자 프로필 클릭:', userId);
    navigation.navigate('UserProfile', { userId: String(userId) });
  };

  const handleImagePress = (feedId: number) => {
    console.log('피드 이미지 클릭:', feedId);
    navigation.navigate('FeedDetail', { feedId });
  };

  // 피드 렌더링 - 가시성 상태 전달
  const renderFeed = ({ item }: { item: FeedListItem }) => {
    // 해당 피드가 비디오를 포함하고, 화면에 보이는지 확인
    const hasVideo = item.content_blocks.some(block => block.type === 'video');
    const isVideoVisible = hasVideo && visibleVideoFeeds.has(item.id);

    return (
      <FeedCard
        feed={item}
        onLikePress={handleLikePress}
        onCommentPress={handleCommentPress}
        onBookmarkPress={handleBookmarkPress}
        onUserPress={handleUserPress}
        onImagePress={handleImagePress}
        isVisible={hasVideo ? isVideoVisible : true} // 비디오가 있으면 visibility 제어, 없으면 항상 true
      />
    );
  };

  // 비디오 가시성 변경 핸들러 - 화면에 보이는 영상만 재생
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    const visibleFeeds = new Set<number>();
    viewableItems.forEach((item: any) => {
      // 해당 피드가 비디오를 포함하는지 확인
      const feed = feedState.feeds.find(f => f.id === item.item.id);
      if (feed) {
        const hasVideo = feed.content_blocks.some(block => block.type === 'video');
        if (hasVideo) {
          visibleFeeds.add(feed.id);
        }
      }
    });
    setVisibleVideoFeeds(visibleFeeds);
  }, [feedState.feeds]);

  // FlatList viewability 설정 - 화면에 50% 이상 보이는 아이템 감지
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50, // 아이템의 50% 이상이 화면에 보일 때
    minimumViewTime: 300, // 최소 300ms 동안 보여야 인식
  }), []);

  // 리스트 헤더 (스토리 섹션) - 메모이제이션으로 불필요한 리렌더링 방지
  const listHeader = useMemo(() => (
    <StorySection
      stories={stories}
      loading={storyLoading}
      onStoryPress={handleStoryPress}
      onAddStoryPress={handleAddStoryPress}
    />
  ), [stories, storyLoading, handleStoryPress, handleAddStoryPress]);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <MainHeader rightButtons={headerRightButtons} />

      {/* 피드 목록 */}
      <FlatList
        data={feedState.feeds}
        renderItem={renderFeed}
        keyExtractor={(item) => `feed-${String(item.id)}`}
        style={styles.feedList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.PRIMARY}
            colors={[colors.PRIMARY]}
          />
        }
        ListHeaderComponent={listHeader}
        onEndReached={loadMoreFeeds}
        onEndReachedThreshold={0.5}
        // 비디오 가시성 제어 - 화면에 보이는 영상만 재생
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // 성능 최적화
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={3}
      />
    </View>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50, // BG_COLORS.SECONDARY
  },
  feedList: {
    flex: 1,
  },
});
