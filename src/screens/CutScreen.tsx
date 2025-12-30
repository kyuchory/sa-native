import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
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
import { ReportTargetType } from '../types/report';
import { CutService } from '../services/cutService';
import { ReportService } from '../services/reportService';
import CutCommentActionSheet from '../components/CutCommentActionSheet';
import { ShortItemComponent } from '../components/ShortItemComponent';
import { ShortItemAdComponent } from '../components/ShortItemAdComponent';
import MenuActionSheet from '../components/MenuActionSheet';
import ReportModal from '../components/ReportModal';
import { DeleteIcon, ReportIcon } from '../components/CommonIcons';
import CustomAlertModal from '../components/CustomAlertModal';

// Components
import {
  BackIcon,
  MoreVerticalIcon,
  CutEmptyIcon,
  ShareIcon,
} from '../components/CutIcons';

// AdMob imports
import { NativeAd, TestIds } from 'react-native-google-mobile-ads';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CutScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

export default function CutScreen() {
  const navigation = useNavigation<CutScreenNavigationProp>();
  const isFocused = useIsFocused();

  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const ITEM_HEIGHT = containerHeight ?? SCREEN_HEIGHT;

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
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);
  
  // 🔥 리프레시 키 추가 - 리프레시 시마다 변경하여 컴포넌트 강제 재마운트
  const [refreshKey, setRefreshKey] = useState(0);

  // 광고 상태
  const [ads, setAds] = useState<NativeAd[]>([]);

  // 숏츠 + 광고 아이템 상태
  const [items, setItems] = useState<Array<{type: 'short', data: ShortItem} | {type: 'ad', data: NativeAd}>>([]);

  const flatListRef = useRef<any>(null);
  const fetchMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const LIMIT = 6;
  const PREFETCH_OFFSET = 3;

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

  // 추가 페이지 불러오기
  const fetchMore = async () => {
    const currentNextCursor = nextCursor;
    if (!currentNextCursor || isFetchingMore) {
      return;
    }

    try {
      setIsFetchingMore(true);

      const response = await CutService.getShortsFeed(currentNextCursor, LIMIT);

      setShorts((prev) => {
        const existingIds = new Set(prev.map(short => short.id));
        const newItems = response.data.items.filter(item => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });

      setNextCursor(response.data.next_cursor);
    } catch (e) {
      console.warn('❌ 컷츠 추가 로딩 실패:', e);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // 프리패칭 로직
  useEffect(() => {
    if (!nextCursor) return;
    if (isFetchingMore) return;
    if (shorts.length === 0) return;

    if (currentIndex >= shorts.length - 1 - PREFETCH_OFFSET) {
      if (fetchMoreTimeoutRef.current) {
        clearTimeout(fetchMoreTimeoutRef.current);
      }

      fetchMoreTimeoutRef.current = setTimeout(() => {
        fetchMore();
      }, 300);
    }

    return () => {
      if (fetchMoreTimeoutRef.current) {
        clearTimeout(fetchMoreTimeoutRef.current);
      }
    };
  }, [currentIndex, shorts.length, nextCursor, isFetchingMore]);

  useEffect(() => {
    fetchInitial();
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
        console.log('컷츠 광고 로드 성공:', loadedAds.length);
      } catch (error) {
        console.error('컷츠 광고 로드 실패:', error);
        setAds([]);
      }
    };

    loadAds();
  }, []);

  // ---------- 숏츠 + 광고 아이템 생성 ----------
  useEffect(() => {
    const createItems = () => {
      const newItems: Array<{type: 'short', data: ShortItem} | {type: 'ad', data: NativeAd}> = [];
      const shortCount = shorts.length;

      if (shortCount < 6) {
        // 6개 미만: 숏츠만
        newItems.push(...shorts.map(short => ({ type: 'short' as const, data: short })));
      } else {
        // 6개 이상: 광고 삽입 (6번째마다)
        let adIndex = 0;
        for (let i = 0; i < shortCount; i++) {
          newItems.push({ type: 'short', data: shorts[i] });

        if ((i + 1) % 6 === 0 && ads.length > 0) {
          newItems.push({ type: 'ad', data: ads[adIndex % ads.length] });
          adIndex++;
        }
        }
      }

      setItems(newItems);
    };

    createItems();
  }, [shorts, ads]);

  // 🔥 Pull to refresh - 수정된 버전
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      // 🔥 1. 먼저 currentIndex를 0으로 설정
      setCurrentIndex(0);

      // 🔥 2. 데이터 fetch
      const response = await CutService.getShortsFeed(undefined, LIMIT);
      
      // 🔥 3. refreshKey 증가로 모든 ShortItemComponent 강제 재마운트
      setRefreshKey(prev => prev + 1);
      
      // 🔥 4. 데이터 업데이트
      setShorts(response.data.items);
      setNextCursor(response.data.next_cursor);
      
      // 🔥 5. 스크롤을 맨 위로 (약간의 지연 후)
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 100);
      
    } catch (e) {
      console.error('컷츠 리프레시 실패:', e);
      setError('컷츠를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  }, [LIMIT]);

  const onCommentRef = useRef<(short: ShortItem) => void>(() => {});
  const onShareRef = useRef<(short: ShortItem) => void>(() => {});
  const onUploadRef = useRef<() => void>(() => {});
  const onViewCompleteRef = useRef<(shortId: number, data: RecordShortViewRequest) => void>(() => {});
  const onProfilePressRef = useRef<(userId: string) => void>(() => {});

  const handleTabRePress = useCallback(() => {
    setCurrentIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('CutTab:rePress', handleTabRePress);
    return () => subscription.remove();
  }, [handleTabRePress]);

  const handleComment = useCallback((short: ShortItem) => {
    setSelectedShort(short);
    setCommentSheetVisible(true);
  }, []);

  const handleShare = useCallback((short: ShortItem) => {
    setAlertModal({
      visible: true,
      title: '공유하기',
      message: '기능 준비중입니다.',
      buttons: [{
        text: '취소',
        style: 'cancel',
        onPress: () => setAlertModal(null)
      }]
    });
  }, []);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleUpload = useCallback(() => {
    navigation.navigate('CutUploadSelect');
  }, [navigation]);

  const handleMorePress = useCallback(() => {
    setMenuActionSheetVisible(true);
  }, []);

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

  const handleDeleteCut = useCallback(async () => {
    const currentShort = shorts[currentIndex];
    if (!currentShort) return;

    setAlertModal({
      visible: true,
      title: '컷츠 삭제',
      message: '정말 이 컷츠를 삭제하시겠습니까? 삭제된 컷츠는 복구할 수 없습니다.',
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
              setMenuActionSheetVisible(false);
              setAlertModal(null);
              await CutService.deleteShort(currentShort.id);

              const updatedShorts = shorts.filter(short => short.id !== currentShort.id);
              setShorts(updatedShorts);

              if (updatedShorts.length === 0) {
                setCurrentIndex(0);
              } else if (currentIndex >= updatedShorts.length) {
                setCurrentIndex(updatedShorts.length - 1);
              }

              useProfileStore.getState().setShouldRefreshProfileShorts(true);

              setAlertModal({
                visible: true,
                title: '성공',
                message: '컷츠가 삭제되었습니다.',
                buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
              });
            } catch (error) {
              console.error('컷 삭제 실패:', error);
              const errorMessage = error instanceof Error ? error.message : '삭제에 실패했습니다.';
              setAlertModal({
                visible: true,
                title: '오류',
                message: errorMessage,
                buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
              });
            }
          }
        }
      ]
    });
  }, [shorts, currentIndex, colors]);

  const handleReportCut = useCallback(() => {
    setMenuActionSheetVisible(false);
    setReportModalVisible(true);
  }, []);

  const menuActions = useCallback(() => {
    const currentShort = shorts[currentIndex];
    if (!currentShort) return [];

    const actions = [
      {
        id: 'share',
        title: '공유하기',
        icon: <ShareIcon size={20} color={colors.GRAY_700} />,
        color: colors.GRAY_700,
        onPress: () => {
          setMenuActionSheetVisible(false);
          handleShare(currentShort);
        },
      },
      {
        id: 'report',
        title: '컷츠 신고',
        icon: <ReportIcon size={20} color={colors.ERROR} />,
        color: colors.ERROR,
        onPress: handleReportCut,
      },
    ];

    if (currentShort.is_owner) {
      actions.unshift({
        id: 'delete',
        title: '컷츠 삭제',
        icon: <DeleteIcon size={20} color={colors.ERROR} />,
        color: colors.ERROR,
        onPress: handleDeleteCut,
      });
    }

    return actions;
  }, [shorts, currentIndex, colors, handleDeleteCut, handleReportCut, handleShare]);

  const handleViewComplete = useCallback(async (
    shortId: number,
    viewData: RecordShortViewRequest
  ) => {
    if (viewData.watched_seconds < 3) {
      return;
    }

    try {
      await CutService.recordShortView(shortId, viewData);
    } catch (error) {
      console.error(`❌ 시청 기록 저장 실패 - 쇼츠 ID: ${shortId}:`, error);
    }
  }, []);

  const handleProfilePress = useCallback((userId: string) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  useEffect(() => {
    onCommentRef.current = handleComment;
    onShareRef.current = handleShare;
    onUploadRef.current = handleUpload;
    onViewCompleteRef.current = handleViewComplete;
    onProfilePressRef.current = handleProfilePress;
  }, [handleComment, handleShare, handleUpload, handleViewComplete, handleProfilePress]);

  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: {
        itemVisiblePercentThreshold: 80,
      },
      onViewableItemsChanged: ({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
          setCurrentIndex(viewableItems[0].index ?? 0);
        }
      },
    },
  ]);

  const itemContainerStyle = useMemo(() => ({ height: ITEM_HEIGHT }), [ITEM_HEIGHT]);

  // 🔥 keyExtractor에 refreshKey 포함
  const keyExtractor = useCallback(
    (item: ShortItem) => `${item.id}-${refreshKey}`,
    [refreshKey]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: {type: 'short', data: ShortItem} | {type: 'ad', data: NativeAd}; index: number }) => (
      <View style={itemContainerStyle}>
        {item.type === 'short' ? (
          <ShortItemComponent
            key={`${item.data.id}-${refreshKey}`}
            item={item.data}
            isActive={isFocused && index === currentIndex}
            onComment={(short) => onCommentRef.current(short)}
            onShare={(short) => onShareRef.current(short)}
            onUpload={() => onUploadRef.current()}
            onViewComplete={(id, data) => onViewCompleteRef.current(id, data)}
            onProfilePress={(userId) => onProfilePressRef.current(userId)}
          />
        ) : (
          <ShortItemAdComponent
            nativeAd={item.data}
            onComment={() => {}}
            onShare={() => {}}
            onUpload={() => {}}
          />
        )}
      </View>
    ),
    [itemContainerStyle, isFocused, currentIndex, refreshKey]
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

      <FlashList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => {
          if (item.type === 'short') {
            return `${item.data.id}-${refreshKey}`;
          } else {
            return `ad-${index}`;
          }
        }}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        //@ts-ignore
        estimatedItemSize={ITEM_HEIGHT}
        drawDistance={ITEM_HEIGHT * 1.5} // 🔥 오프스크린 렌더링 거리 제한으로 메모리 최적화
        maxToRenderPerBatch={3} // 🔥 배치 렌더링 수 제한으로 부드러운 스크롤 유도
        updateCellsBatchingPeriod={150} // 🔥 셀 업데이트 간격 조정으로 반응성 향상
        windowSize={3} // 🔥 윈도우 크기 제한 (현재 + 위아래 2개씩 = 총 5개)
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

      <MenuActionSheet
        visible={menuActionSheetVisible}
        onClose={() => setMenuActionSheetVisible(false)}
        title={'컷츠'}
        actions={menuActions()}
      />

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
      <ReportModal
        visible={reportModalVisible}
        targetType={ReportTargetType.SHORT}
        targetId={shorts[currentIndex]?.id || 0}
        onSubmit={handleReportSubmit}
        onClose={() => setReportModalVisible(false)}
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
