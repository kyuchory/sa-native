import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';
import useFeedStore from '../stores/feedStore';
import useProfileStore from '../stores/profileStore';
import useStoryStore from '../stores/storyStore';

  // 컴포넌트 imports
import MainHeader from '../components/MainHeader';
import StorySection from '../components/StorySection';
import FeedCard from '../components/FeedCard';
import MenuActionSheet from '../components/MenuActionSheet';
import CommentActionSheet from '../components/CommentActionSheet';
import { WriteIcon } from '../components/HomeHeaderIcons';
import { EditIcon, DeleteIcon, ReportIcon } from '../components/CommonIcons';

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
  // 비디오 가시성 상태 관리 - 가장 중앙에 있는 비디오 피드만 추적
  const [visibleVideoFeed, setVisibleVideoFeed] = useState<number | null>(null);

  // 메뉴 관련 상태
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<FeedListItem | null>(null);

  // 댓글 액션 시트 관련 상태
  const [commentActionSheetVisible, setCommentActionSheetVisible] = useState(false);
  const [selectedFeedForComments, setSelectedFeedForComments] = useState<FeedListItem | null>(null);

  // feeds 참조로 viewability 핸들러 최적화
  const feedsRef = useRef<FeedListItem[]>([]);
  useEffect(() => { feedsRef.current = feedState.feeds; }, [feedState.feeds]);

  // Zustand 스토어 상태 및 액션들
  const { shouldRefreshFeeds, setShouldRefreshFeeds } = useFeedStore();
  const { setShouldRefreshProfileFeeds } = useProfileStore();
  const { stories, loading: storyLoading, loadStories, shouldRefreshStories, setShouldRefreshStories } = useStoryStore();

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

      // 스토리 리프레시 플래그 감지
      if (shouldRefreshStories) {
        loadStories();
        setShouldRefreshStories(false); // 플래그 초기화
      }
    }, [shouldRefreshFeeds, setShouldRefreshFeeds, shouldRefreshStories, setShouldRefreshStories, loadStories])
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
  const handleStoryPress = useCallback((user: any, storyId?: number, isMyStory?: boolean) => {
    if (storyId) {
      navigation.navigate('DailyCutDetail', {
        storyId,
        isMyStory: isMyStory || false
      });
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
    // 댓글 액션 시트 열기 위해 피드 찾기
    const feed = feedState.feeds.find(f => f.id === feedId);
    if (feed) {
      setSelectedFeedForComments(feed);
      setCommentActionSheetVisible(true);
    }
  };

  const handleBookmarkPress = (feedId: number) => {
    console.log('북마크 클릭:', feedId);
    // TODO: 북마크 API 호출
  };

  // 댓글 수 업데이트 핸들러
  const handleCommentCountUpdate = useCallback((feedId: number, newCount: number) => {
    setFeedState(prev => ({
      ...prev,
      feeds: prev.feeds.map(feed =>
        feed.id === feedId
          ? { ...feed, comment_count: newCount }
          : feed
      ),
    }));
  }, []);

  const handleUserPress = (userId: number) => {
    console.log('사용자 프로필 클릭:', userId);
    navigation.navigate('UserProfile', { userId: String(userId) });
  };



  const handleMenuPress = (feed: FeedListItem) => {
    setSelectedFeed(feed);
    setMenuActionSheetVisible(true);
  };

  const handleDeleteFeed = async () => {
    if (!selectedFeed) return;

    Alert.alert(
      '피드 삭제',
      '피드를 삭제하시겠습니까? 삭제된 피드는 복구할 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // API 호출
              await FeedService.deleteFeed(selectedFeed.id);

              // 목록 새로고침 플래그 설정
              setShouldRefreshFeeds(true);
              setShouldRefreshProfileFeeds(true);

              // 메뉴 닫기
              setMenuActionSheetVisible(false);
              setSelectedFeed(null);

              // 삭제 완료 알림
              Alert.alert('삭제 완료', '피드가 삭제되었습니다.');
            } catch (error) {
              Alert.alert('오류', '피드 삭제에 실패했습니다.');
              console.error('피드 삭제 실패:', error);
            }
          },
        },
      ]
    );
  };

  // 피드 렌더링 - 가시성 상태 전달 및 메모이제이션
  const renderFeed = useCallback(({ item }: { item: FeedListItem }) => {
    const hasVideo = item.content_blocks.some(block => block.type === 'video');
    const isVideoVisible = hasVideo && visibleVideoFeed === item.id;

    return (
      <FeedCard
        feed={item}
        onLikePress={handleLikePress}
        onCommentPress={handleCommentPress}
        onBookmarkPress={handleBookmarkPress}
        onUserPress={handleUserPress}
        onMenuPress={handleMenuPress}
        isVisible={hasVideo ? isVideoVisible : true}
      />
    );
  }, [
    visibleVideoFeed,
    handleLikePress,
    handleCommentPress,
    handleBookmarkPress,
    handleUserPress,
    handleMenuPress,
  ]);

  // 비디오 가시성 변경 핸들러 - 가장 중앙에 있는 비디오만 재생 (useRef로 안정화)
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    // viewable items 중 비디오가 있는 피드들 찾기
    const videoFeedsWithIndex = viewableItems
      .map((item: any) => {
        const feed = feedsRef.current.find(f => f.id === item.item.id);
        return feed && feed.content_blocks.some((block: any) => block.type === 'video')
          ? { id: feed.id, index: item.index }
          : null;
      })
      .filter(Boolean);

    if (videoFeedsWithIndex.length === 0) {
      setVisibleVideoFeed(null);
      return;
    }

    // viewable items의 평균 인덱스 계산하여 가장 중앙에 있는 비디오 선택
    const avgIndex = viewableItems.reduce((sum: number, item: any) => sum + item.index, 0) / viewableItems.length;

    const mostCentralVideo = videoFeedsWithIndex.reduce((prev: { id: number; index: number }, curr: { id: number; index: number }) =>
      Math.abs(curr.index - avgIndex) < Math.abs(prev.index - avgIndex) ? curr : prev
    );

    setVisibleVideoFeed(mostCentralVideo!.id);
  }).current;

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

      {/* 메뉴 액션 시트 */}
      <MenuActionSheet
        visible={menuActionSheetVisible}
        onClose={() => {
          setMenuActionSheetVisible(false);
          setSelectedFeed(null);
        }}
        title="피드"
        actions={[
          // 작성자인 경우 수정/삭제 메뉴 추가
          ...(selectedFeed?.is_author ? [
            {
              id: 'edit',
              title: '피드 수정',
              icon: <EditIcon size={20} color={colors.GRAY_700} />,
              color: colors.GRAY_700,
              onPress: () => {
                if (selectedFeed) {
                  navigation.navigate('EditFeed', { feedId: selectedFeed.id });
                }
                setMenuActionSheetVisible(false);
              },
            },
            {
              id: 'delete',
              title: '피드 삭제',
              icon: <DeleteIcon size={20} color={colors.ERROR} />,
              color: colors.ERROR,
              onPress: handleDeleteFeed,
            },
          ] : []),
          // 신고는 모든 사용자에게 표시
          {
            id: 'report',
            title: '피드 신고',
            icon: <ReportIcon size={20} color={colors.ERROR} />,
            color: colors.ERROR,
            onPress: () => {
              Alert.alert('신고', '피드 신고 기능이 구현 예정입니다.');
              setMenuActionSheetVisible(false);
            },
          },
        ]}
      />

      {/* 댓글 액션 시트 - 피드가 선택된 경우에만 렌더링 */}
      {selectedFeedForComments && (
        <CommentActionSheet
          visible={commentActionSheetVisible}
          onClose={() => {
            setCommentActionSheetVisible(false);
            setSelectedFeedForComments(null);
          }}
          feed={selectedFeedForComments}
          onCommentCountUpdate={handleCommentCountUpdate}
          onAuthorPress={() => handleUserPress(selectedFeedForComments.user.id)}
        />
      )}
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
