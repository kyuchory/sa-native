import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, TouchableOpacity, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SPACING, TYPOGRAPHY } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';
import useFeedStore from '../stores/feedStore';
import useProfileStore from '../stores/profileStore';
import useStoryStore from '../stores/storyStore';

import CustomAlertModal from '../components/CustomAlertModal';
import ReportModal from '../components/ReportModal';
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
import { ReportTargetType } from '../types/report';
import { FeedService } from '../services/feedService';
import { CutService } from '../services/cutService';
import { ReportService } from '../services/reportService';

// AdMob imports
import { NativeAd, TestIds } from 'react-native-google-mobile-ads';
import { AdUnits } from '../constants/adUnits';

type FeedScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

// 피드 상태 타입 정의
type FeedStateType = {
  feeds: FeedListItem[];
  cursor: number | undefined;
  hasNext: boolean;
  loading: boolean;
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
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // 삽입 슬롯 상태 - 광고/추천/컷츠 삽입 위치 관리
  const [insertSlots, setInsertSlots] = useState<Array<{
    afterFeedId?: number;
    type: 'ad' | 'random_feed' | 'cut';
    key: string;
    data?: any;
  }>>([]);

  // 빈 상태 전용 슬롯 - afterFeedId 없이 렌더링되는 슬롯들
  const [emptySlots, setEmptySlots] = useState<Array<{
    type: 'ad' | 'random_feed' | 'cut';
    key: string;
    data?: any;
  }>>([]);

  // insertSlots ref로 stale state 방지
  const insertSlotsRef = useRef(insertSlots);
  useEffect(() => { insertSlotsRef.current = insertSlots; }, [insertSlots]);

  // emptySlots ref로 stale state 방지
  const emptySlotsRef = useRef(emptySlots);
  useEffect(() => { emptySlotsRef.current = emptySlots; }, [emptySlots]);
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

  // 신고 모달 상태
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState<{type: ReportTargetType, id: number} | null>(null);

  // feeds 참조로 viewability 핸들러 최적화
  const feedsRef = useRef<FeedListItem[]>([]);
  useEffect(() => { feedsRef.current = feedState.feeds; }, [feedState.feeds]);

  // FlatList ref for tab re-press scroll to top
  const flatListRef = useRef<any>(null);





  // 광고 생성 프로미스 재사용
  const adPromiseRef = useRef<Promise<any> | null>(null);

  // 광고 destroy 관리 (WeakSet으로 중복 destroy 방지)
  const destroyedAdsRef = useRef(new WeakSet<any>());

  const destroyAdIfNeeded = (ad: any) => {
    if (!ad?.destroy) return;
    if (destroyedAdsRef.current.has(ad)) return;
    destroyedAdsRef.current.add(ad);
    ad.destroy();
  };

  type SlotType = 'ad' | 'random_feed' | 'cut';

  type SlotBase = {
    type: SlotType;
    key: string;
    data?: any;
    afterFeedId?: number;
  };

  const destroyAdsInSlots = (slots: SlotBase[]) => {
    for (const s of slots) {
      if (s.type === 'ad') destroyAdIfNeeded(s.data);
    }
  };

  // Zustand 스토어 상태 및 액션들
  const { shouldRefreshFeeds, setShouldRefreshFeeds } = useFeedStore();
  const { setShouldRefreshProfileFeeds } = useProfileStore();
  const { stories, loading: storyLoading, loadStories, shouldRefreshStories, setShouldRefreshStories } = useStoryStore();

  // ---------- 광고 생성 함수 (프로미스 재사용) ----------
  const createAd = async () => {
    if (adPromiseRef.current) return adPromiseRef.current;

    adPromiseRef.current = NativeAd.createForAdRequest(AdUnits.POST_LIST, {
      aspectRatio: 1,
      adChoicesPlacement: 0,
      startVideoMuted: true,
    })
      .catch(err => {
        console.error('광고 로드 실패:', err);
        return null;
      })
      .finally(() => {
        adPromiseRef.current = null;
      });

    return adPromiseRef.current;
  };

  // 탭 재터치 시 상단 스크롤
  const handleTabRePress = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('FeedTab:rePress', handleTabRePress);
    return () => subscription.remove();
  }, [handleTabRePress]);

  // 피드 아이템은 useMemo로 계산 (성능 최적화)

  // 컴포넌트 마운트 시 피드와 스토리 로드 (개발환경 이중 호출 방지)
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadInitialFeeds();
    loadStories();
  }, []);

  // 컴포넌트 언마운트 시 광고 리소스 정리 (WeakSet으로 중복 destroy 방지)
  useEffect(() => {
    return () => {
      destroyAdsInSlots([...insertSlotsRef.current, ...emptySlotsRef.current]);
    };
  }, []);

  // 슬롯 생성 requestId (최신 요청만 유효하게)
  const slotsReqIdRef = useRef(0);

  // ---------- 슬롯 생성 함수들 ----------
  const createSlotsForNewFeeds = async (
    newFeeds: FeedListItem[],
    opts?: { allowEmptyState?: boolean } // 기본 false
  ) => {
    const reqId = ++slotsReqIdRef.current;

    const allowEmptyState = opts?.allowEmptyState === true;

    // 무한스크롤에서 빈 페이지(0개)가 오면 슬롯 생성하지 않음
    if (newFeeds.length === 0 && !allowEmptyState) return;

    const isEmptyState = newFeeds.length === 0;

    // 진입 시점에 로컬 excludeIds 계산 (슬롯 기반으로 중복 방지 강화 + 피드 본문 중복 방지)
    const excludeFeedIds = new Set([
      ...feedsRef.current.map(f => f.id),
      ...newFeeds.map(f => f.id), // ✅ 이번에 막 받은 newFeeds와도 겹치지 않게
      ...insertSlotsRef.current.filter(s => s.type === 'random_feed' && s.data?.id).map(s => s.data.id),
      ...emptySlotsRef.current.filter(s => s.type === 'random_feed' && s.data?.id).map(s => s.data.id),
    ]);
    const excludeCutIds = new Set([
      ...insertSlotsRef.current.filter(s => s.type === 'cut' && s.data?.id).map(s => s.data.id),
      ...emptySlotsRef.current.filter(s => s.type === 'cut' && s.data?.id).map(s => s.data.id),
    ]);

    // 광고/추천/컷츠를 병렬로 로드
    const needAd = newFeeds.length >= 3 || isEmptyState;
    const [ad, randomFeed, cut] = await Promise.all([
      needAd ? createAd() : Promise.resolve(null),
      FeedService.getRandomFeed([...excludeFeedIds]),
      CutService.getRandomCut([...excludeCutIds]),
    ]);

    // 최신 요청인지 확인 (이전 요청들은 폐기)
    if (reqId !== slotsReqIdRef.current) {
      // 더 최신 요청이 생겼으면 광고 정리 후 폐기
      destroyAdIfNeeded(ad);
      return;
    }

    // 슬롯 생성
    if (isEmptyState) {
      // 빈 상태: emptySlots에 추가
      const newEmptySlots: Array<{
        type: 'ad' | 'random_feed' | 'cut';
        key: string;
        data?: any;
      }> = [];

      if (ad) {
        newEmptySlots.push({
          type: 'ad',
          key: `ad-${Date.now()}`,
          data: ad,
        });
      }
      if (randomFeed) {
        newEmptySlots.push({
          type: 'random_feed',
          key: `random-feed-${randomFeed.id}`,
          data: randomFeed,
        });
      }
      if (cut) {
        newEmptySlots.push({
          type: 'cut',
          key: `cut-${cut.id}`,
          data: cut,
        });
      }

      setEmptySlots(newEmptySlots);
    } else {
      // 피드 있는 경우: insertSlots에 추가
      const newSlots: Array<{
        afterFeedId?: number;
        type: 'ad' | 'random_feed' | 'cut';
        key: string;
        data?: any;
      }> = [];

      if (ad && newFeeds.length >= 3) {
        newSlots.push({
          afterFeedId: newFeeds[2].id,
          type: 'ad',
          key: `ad-${Date.now()}`,
          data: ad,
        });
      }
      if (randomFeed) {
        newSlots.push({
          afterFeedId: newFeeds.length >= 5 ? newFeeds[4].id : newFeeds[newFeeds.length - 1].id,
          type: 'random_feed',
          key: `random-feed-${randomFeed.id}`,
          data: randomFeed,
        });
      }
      if (cut) {
        newSlots.push({
          afterFeedId: newFeeds.length >= 7 ? newFeeds[6].id : newFeeds[newFeeds.length - 1].id,
          type: 'cut',
          key: `cut-${cut.id}`,
          data: cut,
        });
      }

      setInsertSlots(prev => [...prev, ...newSlots]);
    }
  };

  // ---------- 피드 아이템 생성 (피드 + 슬롯 기반 삽입) - useMemo로 성능 최적화 ----------
  const feedItems = useMemo(() => {
    const items: Array<
      {type: 'feed', data: FeedListItem} |
      {type: 'ad', data: NativeAd, key: string} |
      {type: 'cut', data: ShortItem, key: string} |
      {type: 'random_feed', data: FeedListItem, key: string} |
      {type: 'empty_prompt'}
    > = [];

    const feeds = feedState.feeds;
    const feedCount = feeds.length;

    // 성능 최적화: slotsByAfterId Map 생성 (O(N) → O(1))
    const slotsByAfterId = new Map<number, typeof insertSlots>();
    insertSlots.forEach(s => {
      if (typeof s.afterFeedId === 'number') {
        const arr = slotsByAfterId.get(s.afterFeedId) ?? [];
        arr.push(s);
        slotsByAfterId.set(s.afterFeedId, arr);
      }
    });

    if (feedCount === 0 && !feedState.loading) {
      // 빈 상태: 유도화면 + emptySlots에서 추천 콘텐츠
      items.push({ type: 'empty_prompt' });

      // emptySlots에서 추천 콘텐츠 추가
      emptySlots.forEach(slot => {
        if (slot.type === 'random_feed' && slot.data) {
          items.push({
            type: 'random_feed',
            data: slot.data,
            key: slot.key,
          });
        } else if (slot.type === 'cut' && slot.data) {
          items.push({
            type: 'cut',
            data: slot.data,
            key: slot.key,
          });
        } else if (slot.type === 'ad' && slot.data) {
          items.push({
            type: 'ad',
            data: slot.data,
            key: slot.key,
          });
        }
      });
    } else if (feedCount > 0) {
      // 피드가 있는 경우: 피드 순회하며 슬롯 삽입 (Map으로 O(1) 접근)
      feeds.forEach(feed => {
        items.push({
          type: 'feed',
          data: feed,
        });

        // 해당 피드 뒤에 삽입할 슬롯들 찾기 (O(1) Map 접근)
        const slotsAfterFeed = slotsByAfterId.get(feed.id) ?? [];
        slotsAfterFeed.forEach(slot => {
          if (slot.type === 'random_feed' && slot.data) {
            items.push({
              type: 'random_feed',
              data: slot.data,
              key: slot.key,
            });
          } else if (slot.type === 'cut' && slot.data) {
            items.push({
              type: 'cut',
              data: slot.data,
              key: slot.key,
            });
          } else if (slot.type === 'ad' && slot.data) {
            items.push({
              type: 'ad',
              data: slot.data,
              key: slot.key,
            });
          }
        });
      });
    }

    return items;
  }, [feedState.feeds, feedState.loading, insertSlots, emptySlots]);

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
      // 1) 기존 광고 리소스 정리 (WeakSet으로 중복 방지)
      destroyAdsInSlots([...insertSlotsRef.current, ...emptySlotsRef.current]);

      // 2) 슬롯 초기화 (ref는 effect에 맡김)
      setInsertSlots([]);
      setEmptySlots([]);

      setFeedState(prev => ({ ...prev, loading: true }));

      // 1. 피드 먼저 로드
      const feedsResponse = await FeedService.getFeeds(undefined, 10);

      setFeedState(prev => ({
        ...prev,
        feeds: feedsResponse.feeds,
        cursor: feedsResponse.pagination.next_cursor || undefined,
        hasNext: feedsResponse.pagination.has_next,
        loading: false,
      }));

      // 2. 빈 상태가 아니면 슬롯 생성 및 추천 로드
      if (feedsResponse.feeds.length > 0) {
        await createSlotsForNewFeeds(feedsResponse.feeds);
      } else {
        // 빈 상태에서도 추천/광고 1개씩 로드
        await createSlotsForNewFeeds([], { allowEmptyState: true }); // 빈 배열로 호출하여 추천/광고만 로드
      }
    } catch (error) {
      console.error('피드 로드 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '피드를 불러오는데 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      setFeedState(prev => ({ ...prev, loading: false }));
    }
  };

  // 추천 콘텐츠 로드 함수 (더 이상 사용하지 않음 - createSlotsForNewFeeds로 대체)

  // 추가 피드 로드 (무한 스크롤)
  const loadMoreFeeds = async () => {
    if (isFetchingMore || !feedState.hasNext) return;

    setIsFetchingMore(true);
    try {
      // 추가 피드 로드
      const feedsResponse = await FeedService.getFeeds(feedState.cursor, 10);

      setFeedState(prev => ({
        ...prev,
        feeds: [...prev.feeds, ...feedsResponse.feeds],
        cursor: feedsResponse.pagination.next_cursor || undefined,
        hasNext: feedsResponse.pagination.has_next,
      }));

      // 피드 추가 로드 성공 시 슬롯 생성 (추천/광고 1개씩 로드)
      await createSlotsForNewFeeds(feedsResponse.feeds);
    } catch (error) {
      console.error('추가 피드 로드 실패:', error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      // 1) 기존 광고 리소스 정리 (WeakSet으로 중복 방지)
      destroyAdsInSlots([...insertSlotsRef.current, ...emptySlotsRef.current]);

      // 2) 슬롯 초기화 (ref는 effect에 맡김)
      setInsertSlots([]);
      setEmptySlots([]);

      const feedsResponse = await FeedService.getFeeds(undefined, 10);

      await loadStories(); // 따로 await하여 Promise.all 결과 개수 불일치 수정

      setFeedState(prev => ({
        ...prev,
        feeds: feedsResponse.feeds,
        cursor: feedsResponse.pagination.next_cursor || undefined,
        hasNext: feedsResponse.pagination.has_next,
        loading: false,
      }));

      // 새 피드 기반 슬롯 생성
      if (feedsResponse.feeds.length > 0) {
        await createSlotsForNewFeeds(feedsResponse.feeds);
      } else {
        await createSlotsForNewFeeds([], { allowEmptyState: true });
      }
    } catch (error) {
      console.error('새로고침 실패:', error);
      setFeedState(prev => ({ ...prev, loading: false }));
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

  // 컷츠 댓글 수 업데이트 핸들러 (슬롯 기반으로 변경)
  const handleCutCommentCountUpdate = useCallback((cutId: number, newCount: number) => {
    // insertSlots 업데이트
    setInsertSlots(prev => prev.map(slot =>
      slot.type === 'cut' && slot.data?.id === cutId
        ? { ...slot, data: { ...slot.data, comment_count: newCount } }
        : slot
    ));

    // emptySlots 업데이트
    setEmptySlots(prev => prev.map(slot =>
      slot.type === 'cut' && slot.data?.id === cutId
        ? { ...slot, data: { ...slot.data, comment_count: newCount } }
        : slot
    ));
  }, []);

  // 컷츠 댓글 핸들러 (ref 기반으로 최적화)
  const handleCutCommentPress = useCallback((cutId: number) => {
    const insert = insertSlotsRef.current;
    const empty = emptySlotsRef.current;

    let cut = insert.find(s => s.type === 'cut' && s.data?.id === cutId)?.data
              ?? empty.find(s => s.type === 'cut' && s.data?.id === cutId)?.data;

    if (cut) {
      setSelectedCut(cut);
      setCutCommentSheetVisible(true);
    }
  }, []);

  const handleUserPress = (userId: number) => {
    navigation.navigate('UserProfile', { userId: String(userId) });
  };

  // 신고 제출 핸들러
  const handleReportSubmit = async (reportData: any) => {
    try {
      await ReportService.createReport({
        target_type: reportData.targetType,
        target_id: reportData.targetId,
        category: reportData.category,
        reason: reportData.reason,
      });

      // 성공 메시지 표시
      setAlertModal({
        visible: true,
        title: '신고 완료',
        message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } catch (error) {
      // 에러는 ReportModal 내부에서 처리됨
      throw error;
    }
  };

  // 신고 메뉴 핸들러
  const handleReportPress = (targetType: ReportTargetType, targetId: number) => {
    setReportTarget({ type: targetType, id: targetId });
    setReportModalVisible(true);
    setMenuActionSheetVisible(false);
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
        ref={flatListRef}
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
            return (item as any).key || `ad-${index}`;
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
        onEndReached={feedState.feeds.length > 0 && feedState.hasNext && !isFetchingMore ? loadMoreFeeds : undefined}
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
              if (selectedFeed) {
                handleReportPress(ReportTargetType.FEED_POST, selectedFeed.id);
              }
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

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          visible={reportModalVisible}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onSubmit={handleReportSubmit}
          onClose={() => {
            setReportModalVisible(false);
            setReportTarget(null);
          }}
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
