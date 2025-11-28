import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
} from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import useProfileStore from '../stores/profileStore';
import { AuthStackParamList } from '../types/navigation';
import { ShortItem, RecordShortViewRequest } from '../types/cut';
import { CutService } from '../services/cutService';
import CutCommentActionSheet from '../components/CutCommentActionSheet';
import { ShortItemComponent } from '../components/ShortItemComponent';
import MenuActionSheet from '../components/MenuActionSheet';
import { DeleteIcon, ReportIcon } from '../components/CommonIcons';

// Components
import {
  BackIcon,
  MoreVerticalIcon,
  CutEmptyIcon,
} from '../components/CutIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CutScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

export default function CutScreen() {
  const navigation = useNavigation<CutScreenNavigationProp>();
  const isFocused = useIsFocused();

  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const ITEM_HEIGHT = containerHeight ?? SCREEN_HEIGHT;

  // Zustand에서 colors만 선택적으로 가져옴 (최적화)
  const { colors } = useThemeStore();

  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [commentSheetVisible, setCommentSheetVisible] = useState(false);
  const [selectedShort, setSelectedShort] = useState<ShortItem | null>(null);
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fetchMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const LIMIT = 4;
  const PREFETCH_OFFSET = 1;

  // 초기 로딩
  const fetchInitial = async () => {
    try {
      setIsInitialLoading(true);
      setError(null);

      const response = await CutService.getShortsFeed(undefined, LIMIT);

      setShorts(response.data.items);
      setNextCursor(response.data.next_cursor);
      setCurrentIndex(0);
    } catch (e) {
      console.error('❌ 컷츠 피드 초기 로딩 실패:', e);
      setError('컷츠를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 추가 페이지 불러오기 - 중복 데이터 필터링 추가
  const fetchMore = async () => {
    const currentNextCursor = nextCursor;
    if (!currentNextCursor || isFetchingMore) {
      return;
    }

    try {
      setIsFetchingMore(true);

      const response = await CutService.getShortsFeed(currentNextCursor, LIMIT);

      // 중복 제거: 기존 shorts의 ID와 비교해서 중복된 아이템 필터링
      setShorts((prev) => {
        const existingIds = new Set(prev.map(short => short.id));

        const newItems = response.data.items.filter(item => !existingIds.has(item.id));

        const updated = [...prev, ...newItems];

        return updated;
      });

      setNextCursor(response.data.next_cursor);
    } catch (e) {
      console.warn('❌ 컷츠 추가 로딩 실패:', e);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // 프리패칭 로직 - 디바운싱 추가
  useEffect(() => {
    if (!nextCursor) return;
    if (isFetchingMore) return;
    if (shorts.length === 0) return;

    if (currentIndex >= shorts.length - 1 - PREFETCH_OFFSET) {
      // 이전 타임아웃 클리어 (디바운싱)
      if (fetchMoreTimeoutRef.current) {
        clearTimeout(fetchMoreTimeoutRef.current);
      }

      // 300ms 디바운싱 후 fetchMore 호출
      fetchMoreTimeoutRef.current = setTimeout(() => {
        fetchMore();
      }, 300);
    }

    // cleanup function
    return () => {
      if (fetchMoreTimeoutRef.current) {
        clearTimeout(fetchMoreTimeoutRef.current);
      }
    };
  }, [currentIndex, shorts.length, nextCursor, isFetchingMore]);

  useEffect(() => {
    fetchInitial();
  }, []);

  // Pull to refresh 데이터 리프레시 함수
  const onRefresh = useCallback(async () => {
    if (currentIndex !== 0) return;
    try {
      setRefreshing(true);
      setError(null);

      const response = await CutService.getShortsFeed(undefined, LIMIT);
      setShorts(response.data.items);
      setNextCursor(response.data.next_cursor);
      setCurrentIndex(0);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (e) {
      console.error('컷츠 리프레시 실패:', e);
      setError('컷츠를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  }, [currentIndex, LIMIT]);

  // Tab re-press 이벤트 핸들러 - 첫 번째 쇼츠로 스크롤
  const handleTabRePress = useCallback(() => {
    setCurrentIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Tab re-press 이벤트 리스너
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('CutTab:rePress', handleTabRePress);
    return () => subscription.remove();
  }, [handleTabRePress]);

  // 댓글 보기
  const handleComment = useCallback((shortId: number) => {
    const short = shorts.find(s => s.id === shortId);
    if (short) {
      setSelectedShort(short);
      setCommentSheetVisible(true);
    }
  }, [shorts]);

  // 공유하기
  const handleShare = useCallback((shortId: number) => {
    const short = shorts.find(s => s.id === shortId);
    Alert.alert('공유하기', '기능 준비중입니다.', [
      // { text: '취소', style: 'cancel' },
      // { text: '카카오톡', onPress: () => console.log('카카오톡 공유:', shortId) },
      // { text: '인스타그램', onPress: () => console.log('인스타그램 공유:', shortId) },
      // { text: '링크 복사', onPress: () => console.log('링크 복사:', shortId, short?.content_url) },
    ]);
  }, [shorts]);

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 업로드 버튼 클릭
  const handleUpload = useCallback(() => {
    navigation.navigate('CutUploadSelect');
  }, [navigation]);

  // 메뉴 버튼 핸들러
  const handleMorePress = useCallback(() => {
    setMenuActionSheetVisible(true);
  }, []);

  // 컷 삭제 핸들러
  const handleDeleteCut = useCallback(async () => {
    const currentShort = shorts[currentIndex];
    if (!currentShort) return;

    Alert.alert(
      '컷 삭제',
      '정말 이 컷츠를 삭제하시겠습니까? 삭제된 컷츠는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setMenuActionSheetVisible(false);
              await CutService.deleteShort(currentShort.id);

              // 삭제 성공: 쇼츠 배열에서 제거하고 현재 인덱스 조정
              const updatedShorts = shorts.filter(short => short.id !== currentShort.id);
              setShorts(updatedShorts);

              // 만약 마지막 쇼츠가 삭제되었거나 배열이 비었다면 인덱스 리셋
              if (updatedShorts.length === 0) {
                setCurrentIndex(0);
              } else if (currentIndex >= updatedShorts.length) {
                setCurrentIndex(updatedShorts.length - 1);
              }

              // 프로필 쇼츠 목록 갱신을 위한 플래그 설정
              useProfileStore.getState().setShouldRefreshProfileShorts(true);

              Alert.alert('성공', '컷츠가 삭제되었습니다.');
            } catch (error) {
              console.error('컷 삭제 실패:', error);
              const errorMessage = error instanceof Error ? error.message : '삭제에 실패했습니다.';
              Alert.alert('오류', errorMessage);
            }
          }
        }
      ]
    );
  }, [shorts, currentIndex]);

  // 컷 신고 핸들러
  const handleReportCut = useCallback(() => {
    const currentShort = shorts[currentIndex];
    if (currentShort) {
      console.log('컷 신고 터치:', currentShort.id);
      setMenuActionSheetVisible(false);
    }
  }, [shorts, currentIndex]);

  // 메뉴 액션 배열 (동적 생성)
  const menuActions = useCallback(() => {
    const currentShort = shorts[currentIndex];
    if (!currentShort) return [];

    const actions = [
      {
        id: 'report',
        title: '컷 신고',
        icon: <ReportIcon size={20} color={colors.ERROR} />,
        color: colors.ERROR,
        onPress: handleReportCut,
      },
    ];

    // 내가 소유자인 경우에만 삭제 메뉴 추가
    if (currentShort.is_owner) {
      actions.unshift({
        id: 'delete',
        title: '컷 삭제',
        icon: <DeleteIcon size={20} color={colors.ERROR} />,
        color: colors.ERROR,
        onPress: handleDeleteCut,
      });
    }

    return actions;
  }, [shorts, currentIndex, colors, handleDeleteCut, handleReportCut]);

  // 시청 기록 저장 핸들러 (로깅 추가)
  const handleViewComplete = useCallback(async (
    shortId: number,
    viewData: RecordShortViewRequest
  ) => {
    // console.log(`📊 시청 기록 전송 시작 - 쇼츠 ID: ${shortId}`);
    // console.log('📊 전송 데이터:', viewData);

    // 3초 이상 시청한 경우에만 기록
    if (viewData.watched_seconds < 3) {
      // console.log(`⏭️ 시청 시간이 3초 미만으로 기록 건너뜀 - 쇼츠 ID: ${shortId} (${viewData.watched_seconds}초)`);
      return;
    }

    try {
      await CutService.recordShortView(shortId, viewData);
      // console.log(`✅ 시청 기록 저장 성공 - 쇼츠 ID: ${shortId}`);
    } catch (error) {
      console.error(`❌ 시청 기록 저장 실패 - 쇼츠 ID: ${shortId}:`, error);
    }
  }, []);

  // 프로필 이동 핸들러
  const handleProfilePress = useCallback((userId: string) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  // FlatList 뷰어빌리티 설정
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderShortItem = useCallback(
    ({ item, index }: { item: ShortItem; index: number }) => (
      <View style={{ height: ITEM_HEIGHT }}>
        <ShortItemComponent
          item={item}
          isActive={isFocused && index === currentIndex}
          onComment={handleComment}
          onShare={handleShare}
          onUpload={handleUpload}
          onViewComplete={handleViewComplete}
          onProfilePress={handleProfilePress}
        />
      </View>
    ),
    [ITEM_HEIGHT, isFocused, currentIndex, handleComment, handleShare, handleUpload, handleViewComplete, handleProfilePress]
  );

  // 로딩 중
  if (isInitialLoading) {
    return (
      <View
        style={styles.container}
        onLayout={e => {
          const { height } = e.nativeEvent.layout;
          setContainerHeight(height);
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={styles.loadingText}>컷츠 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <View
        style={styles.container}
        onLayout={e => {
          const { height } = e.nativeEvent.layout;
          setContainerHeight(height);
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>🎬</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInitial}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 빈 상태 처리
  if (!isInitialLoading && shorts.length === 0) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.WHITE }]}
        onLayout={e => {
          const { height } = e.nativeEvent.layout;
          setContainerHeight(height);
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.8}>
            <BackIcon size={24} color={colors.GRAY_900} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.GRAY_900 }]}>Cuts</Text>
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.8}>
            <MoreVerticalIcon size={32} color={colors.GRAY_900} />
          </TouchableOpacity>
        </View>

        <View style={[styles.emptyContainer, { flex: 1 }]}>
          <CutEmptyIcon size={64} color={colors.GRAY_600} />
          <Text style={[styles.emptyTitle, { color: colors.GRAY_900 }]}>시청 가능한 컷츠가 없습니다</Text>
          <Text style={[styles.emptyMessage, { color: colors.GRAY_500 }]}>첫 번째 컷츠를 올려보세요!</Text>
          <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.PRIMARY }]} onPress={handleUpload}>
            <Text style={[styles.emptyButtonText, { color: colors.WHITE }]}>컷츠 제작하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const { height } = e.nativeEvent.layout;
        setContainerHeight(height);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.8}>
          <BackIcon size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuts</Text>
        <TouchableOpacity style={styles.moreButton} onPress={handleMorePress} activeOpacity={0.8}>
          <MoreVerticalIcon size={32} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={shorts}
        renderItem={renderShortItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={fetchMore}
        onEndReachedThreshold={0.5}
        getItemLayout={(data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.PRIMARY]}
            tintColor={colors.PRIMARY}
          />
        }
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.WHITE} />
              <Text style={styles.footerLoaderText}>더 많은 컷츠 불러오는 중...</Text>
            </View>
          ) : null
        }
      />

      {selectedShort && (
        <CutCommentActionSheet
          visible={commentSheetVisible}
          onClose={() => {
            setCommentSheetVisible(false);
            setSelectedShort(null);
          }}
          short={selectedShort}
          onAuthorPress={() => navigation.navigate('UserProfile', { userId: String(selectedShort.user_id) })}
        />
      )}

      {/* 메뉴 액션 시트 */}
      <MenuActionSheet
        visible={menuActionSheetVisible}
        onClose={() => setMenuActionSheetVisible(false)}
        title={'컷츠'}
        actions={menuActions()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: (StatusBar.currentHeight || 44) + SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.BLACK,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.GRAY_800,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  errorText: {
    fontSize: 48,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.PRIMARY,
  },
  retryText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },

  footerLoader: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    gap: SPACING.SM,
  },
  footerLoaderText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    opacity: 0.8,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.LG,
    paddingHorizontal: SPACING.XL,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SIZE.XL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
    marginTop: SPACING.MD,
  },
  emptyButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
});
