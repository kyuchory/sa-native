import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SPACING, TYPOGRAPHY } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';
import useFeedStore from '../stores/feedStore';
import useProfileStore from '../stores/profileStore';
import useStoryStore from '../stores/storyStore';

import CustomAlertModal from '../components/CustomAlertModal';
import CutCommentActionSheet from '../components/CutCommentActionSheet';

// 컴포넌트 imports
import MainHeader from '../components/MainHeader';
import StorySection from '../components/StorySection';
import FeedCard from '../components/FeedCard';
import FeedAdCard from '../components/FeedAdCard';
import FeedCutCard from '../components/FeedCutCard';
import MenuActionSheet from '../components/MenuActionSheet';
import CommentActionSheet from '../components/CommentActionSheet';
import { WriteIcon } from '../components/HomeHeaderIcons';
import { EditIcon, DeleteIcon, ReportIcon } from '../components/CommonIcons';

// 데이터 imports
import { FeedListItem } from '../types/feed';
import { ShortItem } from '../types/cut';
import { FeedService } from '../services/feedService';
import { CutService } from '../services/cutService';

// AdMob imports
import { NativeAd, TestIds } from 'react-native-google-mobile-ads';

type FeedScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

// 피드 상태 타입 정의
type FeedStateType = {
  feeds: FeedListItem[];
  cursor: number | undefined;
  hasNext: boolean;
  loading: boolean;
  cuts: ShortItem[];
  randomFeeds: FeedListItem[];
};

export default function FeedScreen() {
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const isFocused = useIsFocused(); // CutScreen 방식 추가
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 상태 관리 - 명시적 타입 지정으로 타입 에러 해결
  const [feedState, setFeedState] = useState<FeedStateType>({
    feeds: [],
    cursor: undefined,
    hasNext: true,
    loading: false,
    cuts: [], // 랜덤 Cut들 저장
    randomFeeds: [], // 랜덤 추천 피드들 저장
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  // 비디오 가시성 상태 관리 - 가장 중앙에 있는 비디오 아이템만 추적 (피드, 컷츠, 추천 피드)
  const [visibleVideoItem, setVisibleVideoItem] = useState<{type: 'feed' | 'cut' | 'random_feed', id: number} | null>(null);

  // 메뉴 관련 상태
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<FeedListItem | null>(null);

  // 댓글 액션 시트 관련 상태
  const [commentActionSheetVisible, setCommentActionSheetVisible] = useState(false);
  const [selectedFeedForComments, setSelectedFeedForComments] = useState<FeedListItem | null>(null);

  // 컷츠 댓글 액션 시트 관련 상태
  const [cutCommentSheetVisible, setCutCommentSheetVisible] = useState(false);
  const [selectedCut, setSelectedCut] = useState<ShortItem | null>(null);

  // Custom Alert Modal 상태
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // feeds 참조로 viewability 핸들러 최적화
  const feedsRef = useRef<FeedListItem[]>([]);
  useEffect(() => { feedsRef.current = feedState.feeds; }, [feedState.feeds]);

  // Zustand 스토어 상태 및 액션들
  const { shouldRefreshFeeds, setShouldRefreshFeeds } = useFeedStore();
  const { setShouldRefreshProfileFeeds } = useProfileStore();
  const { stories, loading: storyLoading, loadStories, shouldRefreshStories, setShouldRefreshStories } = useStoryStore();

  // 광고 상태
  const [ads, setAds] = useState<NativeAd[]>([]);

  // 피드 아이템은 useMemo로 계산 (성능 최적화)

  // 컴포넌트 마운트 시 피드와 스토리 로드
  useEffect(() => {
    loadInitialFeeds();
    loadStories();
  }, []);

  // ---------- 광고 로드 ----------
  useEffect(() => {
    const loadAds = async () => {
      try {
        const adPromises = [];
        for (let i = 0; i < 8; i++) {
          adPromises.push(
            NativeAd.createForAdRequest(TestIds.NATIVE, {
              aspectRatio: 1,
              adChoicesPlacement: 0,
              startVideoMuted: true,
            })
          );
        }
        const loadedAds = await Promise.all(adPromises);
        setAds(loadedAds);
        console.log('피드 광고 로드 성공:', loadedAds.length);
      } catch (error) {
        console.error('피드 광고 로드 실패:', error);
        setAds([]);
      }
    };

    loadAds();
  }, []);

  // ---------- 광고 위치 계산 함수 ----------
  const getAdPositions = (feedCount: number) => {
    const positions: number[] = [];

    if (feedCount < 4) return positions;

    // 첫 광고: 4번째 뒤 (index 3)
    positions.push(3);

    // 이후 광고: 5개마다
    let next = 8; // 4 + 5 - 1 (0-based)
    while (next < feedCount) {
      positions.push(next);
      next += 5;
    }

    return positions;
  };

  // ---------- 피드 아이템 생성 (피드 + 광고 + Cut + 추천 피드 + 빈 상태 프롬프트) - useMemo로 성능 최적화 ----------
  const feedItems = useMemo(() => {
    const items: Array<
      {type: 'feed', data: FeedListItem} |
      {type: 'ad', data: NativeAd} |
      {type: 'cut', data: ShortItem} |
      {type: 'random_feed', data: FeedListItem} |
      {type: 'empty_prompt'}
    > = [];

    const feeds = feedState.feeds;
    const cuts = feedState.cuts;
    const randomFeeds = feedState.randomFeeds;
    const feedCount = feeds.length;

    if (feedCount === 0 && !feedState.loading) {
      // 피드 로드 완료 후 실제 피드가 없는 경우: 피드 작성 유도 + 추천 콘텐츠
      items.push({ type: 'empty_prompt' });

      // 추천 피드 추가
      if (randomFeeds.length > 0) {
        items.push({
          type: 'random_feed',
          data: randomFeeds[0],
        });
      }

      // 추천 컷츠 추가
      if (cuts.length > 0) {
        items.push({
          type: 'cut',
          data: cuts[0],
        });
      }

      // 광고 추가
      if (ads.length > 0) {
        items.push({
          type: 'ad',
          data: ads[0],
        });
      }
    } else if (feedCount > 0) {
      // 피드가 있는 경우: 기존 로직 (피드 + 삽입된 추천 피드/컷츠/광고)
      const adPositions = getAdPositions(feedCount);
      let adIndex = 0;
      let cutIndex = 0;
      let randomFeedIndex = 0;

      for (let i = 0; i < feedCount; i++) {
        items.push({
          type: 'feed',
          data: feeds[i],
        });

        // 광고 삽입
        if (adPositions.includes(i) && ads.length > 0) {
          items.push({
            type: 'ad',
            data: ads[adIndex % ads.length],
          });
          adIndex++;
        }

        // 추천 피드 삽입 (랜덤 위치: 피드 개수의 1/4 지점)
        const randomFeedInsertPosition = Math.floor(feedCount * (1/4));
        if (i === randomFeedInsertPosition && randomFeedIndex < randomFeeds.length) {
          items.push({
            type: 'random_feed',
            data: randomFeeds[randomFeedIndex],
          });
          randomFeedIndex++;
        }

        // Cut 삽입 (랜덤 위치: 피드 개수의 1/2 지점)
        const cutInsertPosition = Math.floor(feedCount * (1/2));
        if (i === cutInsertPosition && cutIndex < cuts.length) {
          items.push({
            type: 'cut',
            data: cuts[cutIndex],
          });
          cutIndex++;
        }
      }
    }

    return items;
  }, [feedState.feeds, feedState.cuts, feedState.randomFeeds, feedState.loading, ads]);

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

  // 초기 피드 로드 (피드 우선)
  const loadInitialFeeds = async () => {
    try {
      setFeedState(prev => ({ ...prev, loading: true }));

      // 1. 피드 먼저 로드
      const feedsResponse = await FeedService.getFeeds(undefined, 10);

      setFeedState({
        feeds: feedsResponse.feeds,
        cursor: feedsResponse.pagination.next_cursor || undefined,
        hasNext: feedsResponse.pagination.has_next,
        loading: false,
        cuts: [], // 초기에는 빈 배열
        randomFeeds: [], // 초기에는 빈 배열
      });

      // 2. 피드 로드 완료 후 항상 추천 콘텐츠 로드
      await loadRecommendedContent();
    } catch (error) {
      console.error('피드 로드 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '피드를 불러오는데 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      setFeedState(prev => ({ ...prev, loading: false, cuts: [], randomFeeds: [] }));
    }
  };

  // 추천 콘텐츠 로드 함수 (피드 성공 시에만 호출)
  const loadRecommendedContent = async () => {
    try {
      // 현재 로드된 컷츠 ID들과 추천 피드 ID들을 제외하고 새로운 콘텐츠 요청
      const currentCutIds = feedState.cuts.map(cut => cut.id);
      const currentRandomFeedIds = feedState.randomFeeds.map(f => f.id);

      const [cutResponse, randomFeedResponse] = await Promise.all([
        CutService.getRandomCut(currentCutIds),
        FeedService.getRandomFeed(currentRandomFeedIds)
      ]);

      setFeedState(prev => ({
        ...prev,
        cuts: cutResponse ? [...prev.cuts, cutResponse] : prev.cuts,
        randomFeeds: randomFeedResponse ? [...prev.randomFeeds, randomFeedResponse] : prev.randomFeeds,
      }));
    } catch (error) {
      console.error('추천 콘텐츠 로드 실패:', error);
      // 추천 콘텐츠 로드 실패해도 피드에는 영향 없음
    }
  };

  // 추가 피드 로드 (무한 스크롤)
  const loadMoreFeeds = async () => {
    if (feedState.loading || !feedState.hasNext) return;

    try {
      setFeedState(prev => ({ ...prev, loading: true }));

      // 추가 피드 로드
      const feedsResponse = await FeedService.getFeeds(feedState.cursor, 10);

      setFeedState(prev => ({
        feeds: [...prev.feeds, ...feedsResponse.feeds],
        cursor: feedsResponse.pagination.next_cursor || undefined,
        hasNext: feedsResponse.pagination.has_next,
        loading: false,
        cuts: prev.cuts, // cuts는 그대로 유지 (필요시 loadRecommendedContent로 추가)
        randomFeeds: prev.randomFeeds, // randomFeeds도 그대로 유지
      }));

      // 피드 추가 로드 성공 시 추천 콘텐츠도 로드
      await loadRecommendedContent();
    } catch (error) {
      console.error('추가 피드 로드 실패:', error);
      setFeedState(prev => ({ ...prev, loading: false }));
    }
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const [feedsResponse, cutResponse, randomFeedResponse] = await Promise.all([
        FeedService.getFeeds(undefined, 10),
        CutService.getRandomCut(),
        FeedService.getRandomFeed([]), // 새로고침 시 새로운 추천 피드 로드
        loadStories()
      ]);

      setFeedState({
        feeds: feedsResponse.feeds,
        cursor: feedsResponse.pagination.next_cursor || undefined,
        hasNext: feedsResponse.pagination.has_next,
        loading: false,
        cuts: cutResponse ? [cutResponse] : [],
        randomFeeds: randomFeedResponse ? [randomFeedResponse] : [], // 새로고침 시 새로운 추천 피드
      });
    } catch (error) {
      console.error('새로고침 실패:', error);
      setFeedState(prev => ({ ...prev, loading: false, cuts: [], randomFeeds: [] }));
    } finally {
      setRefreshing(false);
    }
  };

  // 헤더 액션 핸들러들
  const handleFeedPress = useCallback(() => {
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
    navigation.navigate('DailyCutAdd');
  }, [navigation]);

  // 피드 액션 핸들러들
  const handleLikePress = (feedId: number) => {
    // TODO: 좋아요 API 호출
  };

  const handleCommentPress = (feedId: number) => {
    // 댓글 액션 시트 열기 위해 피드 찾기
    const feed = feedState.feeds.find(f => f.id === feedId);
    if (feed) {
      setSelectedFeedForComments(feed);
      setCommentActionSheetVisible(true);
    }
  };

  const handleBookmarkPress = (feedId: number) => {
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

  // 컷츠 댓글 수 업데이트 핸들러
  const handleCutCommentCountUpdate = useCallback((cutId: number, newCount: number) => {
    setFeedState(prev => ({
      ...prev,
      cuts: prev.cuts.map(cut =>
        cut.id === cutId
          ? { ...cut, comment_count: newCount }
          : cut
      ),
    }));
  }, []);

  // 컷츠 댓글 핸들러
  const handleCutCommentPress = useCallback((cutId: number) => {
    const cut = feedState.cuts.find(c => c.id === cutId);
    if (cut) {
      setSelectedCut(cut);
      setCutCommentSheetVisible(true);
    }
  }, [feedState.cuts]);

  const handleUserPress = (userId: number) => {
    navigation.navigate('UserProfile', { userId: String(userId) });
  };



  const handleMenuPress = (feed: FeedListItem) => {
    setSelectedFeed(feed);
    setMenuActionSheetVisible(true);
  };

  const handleDeleteFeed = async () => {
    if (!selectedFeed) return;

    setAlertModal({
      visible: true,
      title: '피드 삭제',
      message: '피드를 삭제하시겠습니까? 삭제된 피드는 복구할 수 없습니다.',
      buttons: [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => setAlertModal(null)
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

              // 삭제 완료 알림 - 모달을 완료로 감추고 성공 메시지를 표시
              setAlertModal({
                visible: true,
                title: '삭제 완료',
                message: '피드가 삭제되었습니다.',
                buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
              });
            } catch (error) {
              setAlertModal({
                visible: true,
                title: '오류',
                message: '피드 삭제에 실패했습니다.',
                buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
              });
              console.error('피드 삭제 실패:', error);
            }
          },
        },
      ]
    });
  };

  // 피드 아이템 렌더링 - 피드와 광고, Cut, 추천 피드, 빈 상태 프롬프트 분기
  const renderFeedItem = useCallback(({ item }: { item: {type: 'feed', data: FeedListItem} | {type: 'ad', data: NativeAd} | {type: 'cut', data: ShortItem} | {type: 'random_feed', data: FeedListItem} | {type: 'empty_prompt'} }) => {
    if (item.type === 'feed') {
      const hasVideo = item.data.content_blocks.some(block => block.type === 'video');
      const isVideoVisible = hasVideo && visibleVideoItem?.type === 'feed' && visibleVideoItem.id === item.data.id;

      return (
        <FeedCard
          feed={item.data}
          onLikePress={handleLikePress}
          onCommentPress={handleCommentPress}
          onBookmarkPress={handleBookmarkPress}
          onUserPress={handleUserPress}
          onMenuPress={handleMenuPress}
          isVisible={hasVideo ? (isVideoVisible && isFocused) : true} // CutScreen 방식 적용
        />
      );
    } else if (item.type === 'ad') {
      return <FeedAdCard nativeAd={item.data} />;
    } else if (item.type === 'cut') {
      // Cut 아이템 - 비디오 가시성 제어 적용
      const hasVideo = item.data.type === 'video';
      const isVideoVisible = hasVideo && visibleVideoItem?.type === 'cut' && visibleVideoItem.id === item.data.id;

      return (
        <FeedCutCard
          cut={item.data}
          onLikePress={() => {}}
          onCommentPress={handleCutCommentPress}
          onBookmarkPress={() => {}}
          onUserPress={handleUserPress}
          onMenuPress={() => {}}
          onCutPress={() => {}}
          isVisible={hasVideo ? (isVideoVisible && isFocused) : true} // CutScreen 방식 적용
        />
      );
    } else if (item.type === 'random_feed') {
      // 추천 피드 아이템 - 일반 피드와 동일하게 렌더링하되 추천 표시 추가 필요
      const hasVideo = item.data.content_blocks.some(block => block.type === 'video');
      const isVideoVisible = hasVideo && visibleVideoItem?.type === 'random_feed' && visibleVideoItem.id === item.data.id;

      return (
        <FeedCard
          feed={item.data}
          isRecommended={true} // 추천 표시 활성화
          onLikePress={handleLikePress}
          onCommentPress={handleCommentPress}
          onBookmarkPress={handleBookmarkPress}
          onUserPress={handleUserPress}
          onMenuPress={handleMenuPress}
          isVisible={hasVideo ? (isVideoVisible && isFocused) : true} // CutScreen 방식 적용
        />
      );
    } else if (item.type === 'empty_prompt') {
      // 빈 상태 프롬프트
      return (
        <View style={styles.emptyPromptContainer}>
          <Text style={styles.emptyPromptTitle}>첫 피드를 작성해보세요!</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleFeedPress}>
            <Text style={styles.createButtonText}>피드 작성하기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Fallback (실제로 도달하지 않음)
    return null;
  }, [
    visibleVideoItem,
    isFocused, // 의존성 추가
    handleLikePress,
    handleCommentPress,
    handleBookmarkPress,
    handleUserPress,
    handleMenuPress,
    handleFeedPress,
    styles,
  ]);

  // 비디오 가시성 변경 핸들러 - 가장 중앙에 있는 비디오만 재생 (useRef로 안정화)
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    // viewable items 중 비디오가 있는 아이템들 찾기 (피드, 컷츠, 추천 피드 모두)
    const videoItemsWithIndex = viewableItems
      .map((item: any) => {
        // 피드인 경우
        if (item.item.type === 'feed') {
          const feed = feedsRef.current.find(f => f.id === item.item.data.id);
          const hasVideo = feed && feed.content_blocks.some((block: any) => block.type === 'video');
          return hasVideo ? { type: 'feed', id: feed.id, index: item.index } : null;
        }
        // 추천 피드인 경우
        else if (item.item.type === 'random_feed') {
          const hasVideo = item.item.data.content_blocks.some((block: any) => block.type === 'video');
          return hasVideo ? { type: 'random_feed', id: item.item.data.id, index: item.index } : null;
        }
        // 컷츠인 경우
        else if (item.item.type === 'cut') {
          const hasVideo = item.item.data.type === 'video';
          return hasVideo ? { type: 'cut', id: item.item.data.id, index: item.index } : null;
        }
        return null;
      })
      .filter(Boolean);

    if (videoItemsWithIndex.length === 0) {
      setVisibleVideoItem(null);
      return;
    }

    // viewable items의 평균 인덱스 계산하여 가장 중앙에 있는 비디오 선택
    const avgIndex = viewableItems.reduce((sum: number, item: any) => sum + item.index, 0) / viewableItems.length;

    const mostCentralVideo = videoItemsWithIndex.reduce((prev: any, curr: any) =>
      Math.abs(curr.index - avgIndex) < Math.abs(prev.index - avgIndex) ? curr : prev
    );

    setVisibleVideoItem({ type: mostCentralVideo.type, id: mostCentralVideo.id });
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
        data={feedItems}
        renderItem={renderFeedItem}
        keyExtractor={(item, index) => {
          if (item.type === 'feed') {
            return `feed-${String(item.data.id)}`;
          } else if (item.type === 'cut') {
            return `cut-${String(item.data.id)}`;
          } else if (item.type === 'random_feed') {
            return `random-feed-${String(item.data.id)}`;
          } else if (item.type === 'empty_prompt') {
            return `empty-prompt`;
          } else {
            return `ad-${index}`;
          }
        }}
        style={styles.feedList}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.PRIMARY}
            colors={[colors.PRIMARY]}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !feedState.loading && feedState.feeds.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>피드가 없습니다.</Text>
              <Text style={styles.emptySubText}>새로운 피드를 올려보세요!</Text>
              <TouchableOpacity style={styles.writeButton} onPress={() => navigation.navigate('CreateFeed')}>
                <WriteIcon size={20} color={colors.WHITE} />
                <Text style={styles.buttonText}>피드 작성하기</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        onEndReached={feedState.feeds.length > 0 && feedState.hasNext ? loadMoreFeeds : undefined}
        onEndReachedThreshold={feedState.feeds.length > 0 && feedState.hasNext ? 0.5 : undefined}
        ListFooterComponent={
          feedState.feeds.length > 0 && isFetchingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.WHITE} />
              <Text style={styles.footerLoaderText}>더 많은 피드 불러오는 중...</Text>
            </View>
          ) : null
        }
        // 비디오 가시성 제어 - 화면에 보이는 영상만 재생
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // 성능 최적화
        removeClippedSubviews={false} //원래 true였으나, 화면 떨림 문제로인해 false로 변경
        collapsable={false} // 원래 없었으나, 화면 떨림 문제로인해 추가
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }} // 원래 없었으나, 화면 떨림 문제로인해 추가
        maxToRenderPerBatch={3}
        updateCellsBatchingPeriod={50}
        windowSize={11}
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
              setMenuActionSheetVisible(false);
              setAlertModal({
                visible: true,
                title: '피드 신고',
                message: '이 피드를 신고하시겠습니까?',
                buttons: [
                  {
                    text: '취소',
                    style: 'cancel',
                    onPress: () => setAlertModal(null)
                  },
                  {
                    text: '신고',
                    style: 'destructive',
                    onPress: () => {
                      setAlertModal({
                        visible: true,
                        title: '신고 완료',
                        message: '피드가 신고되었습니다.',
                        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
                      });
                    }
                  }
                ]
              });
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
          item={selectedFeedForComments}
          type="feed"
          onCommentCountUpdate={handleCommentCountUpdate}
          onAuthorPress={() => handleUserPress(selectedFeedForComments.user.id)}
        />
      )}

      {/* 컷츠 댓글 액션 시트 */}
      {selectedCut && (
        <CutCommentActionSheet
          visible={cutCommentSheetVisible}
          onClose={() => {
            setCutCommentSheetVisible(false);
            setSelectedCut(null);
          }}
          short={selectedCut}
          onCommentCountUpdate={handleCutCommentCountUpdate}
          onAuthorPress={() => handleUserPress(selectedCut.user_id)}
        />
      )}

      {/* Custom Alert Modal */}
      {alertModal && (
        <CustomAlertModal
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          buttons={alertModal.buttons}
          onClose={() => setAlertModal(null)}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyText: {
    fontSize: 16,
    color: colors.GRAY_500,
    fontWeight: '400',
  },
  emptySubText: {
    fontSize: 14,
    color: colors.GRAY_400,
    fontWeight: '400',
    marginTop: SPACING.SM,
    marginBottom: SPACING.LG,
  },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.PRIMARY,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 25,
    gap: SPACING.SM,
    minHeight: 44,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.WHITE,
  },
  emptyPromptContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
  },
  emptyPromptTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.MD,
  },
  createButton: {
    backgroundColor: colors.PRIMARY,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.LG,
    borderRadius: 25,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },
  footerLoader: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    gap: SPACING.SM,
  },
  footerLoaderText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.WHITE,
    opacity: 0.8,
  },
});
