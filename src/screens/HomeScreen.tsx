import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Text, TouchableOpacity, Modal } from 'react-native';
import CustomAlertModal from '../components/CustomAlertModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SPACING } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';
import usePostStore from '../stores/postStore';

import CategorySelector from '../components/CategorySelector';
import CategoryModal from '../components/CategoryModal';
import PostCard from '../components/PostCard';
import PostAdCard from '../components/PostAdCard';
import Pagination from '../components/Pagination';
import MainHeader from '../components/MainHeader';
import { BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

import { WriteIcon } from '../components/HomeHeaderIcons';
// CommentActionSheet 컴포넌트 import
import CommentActionSheet from '../components/CommentActionSheet';

// 서비스 imports
import { PostService } from '../services/postService';
import type { PostListItem, Category, AnimalType } from '../types/post';

// AdMob imports
import { NativeAd, TestIds } from 'react-native-google-mobile-ads';

type HomeNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const flatListRef = useRef<FlatList>(null);

  // 요청 ID 관리 (레이스 컨디션 방지)
  const reqIdRef = useRef(0);
  const adReqIdRef = useRef(0);
  const latestAdContextKeyRef = useRef<string>('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number>(0);
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true); // 초기 로딩 플래그


  // CommentActionSheet 상태 관리
  const [commentSheetVisible, setCommentSheetVisible] = useState(false);
  const [selectedCommentItem, setSelectedCommentItem] = useState<PostListItem | null>(null);

  // Custom Alert Modal 상태
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // Category Modal 상태
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  // 동물 타입 필터 드롭다운 상태
  const [isAnimalTypeFilterVisible, setIsAnimalTypeFilterVisible] = useState(false);

  const { shouldRefreshPosts, setShouldRefreshPosts, setAnimalTypes, selectedAnimalTypeFilter, setSelectedAnimalTypeFilter, animalTypes } = usePostStore();

  // 현재 화면에서 사용할 광고 상태 (카테고리/필터/페이지별 2개씩)
  const [currentAds, setCurrentAds] = useState<NativeAd[]>([]);
  const currentAdsRef = useRef<NativeAd[]>([]); // cleanup용 ref
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined); // 디바운스 타이머용 ref
  const [isAdLoading, setIsAdLoading] = useState(false);

  // 피드 아이템 상태 (포스트 + 광고 + 광고 로딩)
  const [feedItems, setFeedItems] = useState<Array<
    {type: 'post', data: PostListItem} |
    {type: 'ad', data: NativeAd, key: string} |
    {type: 'ad_loading', key: string}
  >>([]);

  // ---------- Helper: shallow compare pagination fields ----------
  const isSamePagination = (a: typeof pagination, b: Partial<typeof pagination>) => {
    // only compare keys that server returns (page, limit, total, total_pages, has_next, has_prev)
    return (
      a.page === (b.page ?? a.page) &&
      a.limit === (b.limit ?? a.limit) &&
      a.total === (b.total ?? a.total) &&
      a.total_pages === (b.total_pages ?? a.total_pages) &&
      a.has_next === (b.has_next ?? a.has_next) &&
      a.has_prev === (b.has_prev ?? a.has_prev)
    );
  };

  // ---------- postParams: 요청 파라미터를 메모이제이션하여 안정적인 deps 관리 ----------
  const postParams = React.useMemo(() => ({
    categoryId: selectedCategoryId,
    subCategoryId: selectedSubcategoryId,
    animalType: selectedAnimalTypeFilter ?? undefined
  }), [selectedCategoryId, selectedSubcategoryId, selectedAnimalTypeFilter]);

  // ---------- adContext: 광고 컨텍스트를 메모이제이션하여 안정적인 deps 관리 ----------
  const adContext = React.useMemo(() => ({
    categoryId: selectedCategoryId,
    subCategoryId: selectedSubcategoryId,
    animalType: selectedAnimalTypeFilter ?? 'all',
    page: pagination.page
  }), [selectedCategoryId, selectedSubcategoryId, selectedAnimalTypeFilter, pagination.page]);

  // ---------- adContextKey: 광고 컨텍스트 키 생성 ----------
  const adContextKey = React.useMemo(() =>
    `${adContext.categoryId}-${adContext.subCategoryId}-${adContext.animalType}-${adContext.page}`,
    [adContext]
  );

  // ---------- loadAdsForContext: 컨텍스트 기반 광고 로드 (reqId + contextKey 가드) ----------
  const loadAdsForContext = useCallback(async (contextKey: string) => {
    // 요청 ID 할당 (레이스 컨디션 방지)
    const myAdReqId = ++adReqIdRef.current;

    try {
      setCurrentAds(prev => {
        prev.forEach(ad => ad?.destroy?.());
        return [];
      }); // 기존 광고 클리어 + destroy

      // contextKey 업데이트
      latestAdContextKeyRef.current = contextKey;

      // 2개 광고 로드 (목표: 카테고리/필터/페이지마다 새로운 2개 광고)
      const adPromises = [];
      for (let i = 0; i < 2; i++) {
        adPromises.push(
          NativeAd.createForAdRequest(TestIds.NATIVE, {
            aspectRatio: 1,
            adChoicesPlacement: 0,
            startVideoMuted: true,
          })
        );
      }

      const loadedAds = await Promise.all(adPromises);

      // 최신 요청인지 확인 (늦게 도착한 광고들 정리)
      if (myAdReqId !== adReqIdRef.current) {
        loadedAds.forEach(ad => ad?.destroy?.());
        return;
      }

      // contextKey가 최신인지 확인 (늦게 도착한 응답 방지)
      if (contextKey !== latestAdContextKeyRef.current) {
        loadedAds.forEach(ad => ad?.destroy?.());
        return;
      }

      // 성공: 상태 업데이트 (이전 광고들 정리)
      setCurrentAds(prev => {
        prev.forEach(ad => ad?.destroy?.());
        return loadedAds;
      });
      console.log('광고 로드 성공:', loadedAds.length, '컨텍스트:', contextKey);

    } catch (error) {
      // 최신 요청인지 확인
      if (myAdReqId !== adReqIdRef.current) return;

      // contextKey가 최신인지 확인
      if (contextKey !== latestAdContextKeyRef.current) return;

      console.error('광고 로드 실패:', error);
      setCurrentAds(prev => {
        prev.forEach(ad => ad?.destroy?.());
        return [];
      }); // 실패 시 빈 배열 + 기존 광고 정리

    } finally {
      // 최신 요청인지 확인
      if (myAdReqId === adReqIdRef.current) {
        setIsAdLoading(false);
      }
    }
  }, []);

  // ---------- 디바운스된 광고 로드 ----------
  const debouncedLoadAds = useCallback(
    (() => {
      return (contextKey: string) => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
        timeoutIdRef.current = setTimeout(() => {
          loadAdsForContext(contextKey);
        }, 300); // 300ms 디바운스
      };
    })(),
    [loadAdsForContext]
  );

  // ---------- loadPosts: page 필수 + animalType 자동 적용 ----------
  const loadPosts = useCallback(async (opts: { page: number; categoryId?: number; subCategoryId?: number; animalType?: string }) => {
    const { page } = opts; // page 필수
    const categoryId = opts.categoryId ?? selectedCategoryId;
    const subCategoryId = opts.subCategoryId ?? selectedSubcategoryId;
    const animalType = opts.animalType ?? selectedAnimalTypeFilter ?? undefined;

    // 요청 ID 할당 (레이스 컨디션 방지)
    const myReqId = ++reqIdRef.current;

    try {
      setIsLoading(true);
      const response = await PostService.getPosts({
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
        animalType,
        page,
      });

      // 최신 요청인지 확인
      if (myReqId !== reqIdRef.current) return;

      setPosts(response.posts ?? []);

      // 서버에서 내려준 pagination이 실제로 다를 때만 상태 업데이트 (prev 기반 비교로 클로저 이슈 해결)
      setPagination(prev => {
        if (!isSamePagination(prev, response.pagination)) {
          return { ...prev, ...response.pagination };
        }
        return prev;
      });

      // 최초 로딩 완료 플래그 설정
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    } catch (error) {
      // 최신 요청인지 확인 (에러도)
      if (myReqId !== reqIdRef.current) return;

      console.error('게시글 로드 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '게시글을 불러오는데 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });

      // 에러라도 최초 로딩은 완료된 것으로 판단
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
    } finally {
      // 최신 요청인지 확인 (finally도)
      if (myReqId === reqIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedCategoryId, selectedSubcategoryId, selectedAnimalTypeFilter]);

  // ---------- focus 기반 새로고침 (안정적으로 loadPosts 호출) ----------
  useFocusEffect(
    useCallback(() => {
      if (shouldRefreshPosts) {
        // 현재 페이지로 새로고침
        loadPosts({ page: pagination.page });
        setShouldRefreshPosts(false);
      }
    }, [shouldRefreshPosts, setShouldRefreshPosts, loadPosts, pagination.page])
  );

  // ---------- 컴포넌트 마운트 시: 카테고리와 동물 타입 로드 (의존성 없음) ----------
  useEffect(() => {
    // loadCategories는 별도 함수로 정의하고 내부에서 setCategories 한다
    const init = async () => {
      try {
        // 카테고리 로드
        const categoriesData = await PostService.getCategories();
        const normalized = categoriesData.map(cat => ({
          ...cat,
          id: Number(cat.id),
          subCategories: (cat.subCategories || []).map((sc: any) => ({ ...sc, id: Number(sc.id) })),
        }));
        setCategories(normalized);

        // 동물 타입 로드
        const animalTypesData = await PostService.getAnimalTypes();
        setAnimalTypes(animalTypesData);

      } catch (err) {
        console.error('초기 데이터 로드 실패:', err);
        setAlertModal({
          visible: true,
          title: '오류',
          message: '데이터를 불러오는데 실패했습니다.',
          buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
        });
      }
    };

    init();

    // cleanup: 언마운트 시 광고 리소스 정리 (setState 금지)
    return () => {
      currentAdsRef.current.forEach(ad => ad?.destroy?.());
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
    // 빈 deps -> 마운트 시 1회만 실행, 로드는 category effect에서 담당
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  // ---------- 광고 위치 계산 함수 ----------
  const getAdPositions = (postCount: number): number[] => {
    if (postCount <= 3) {
      // 3개 이하 게시물일 땐 광고 없음
      return [];
    }

    if (postCount >= 4 && postCount <= 7) {
      // 4~7개 게시물일 땐
      // 1번째 게시물 뒤(0), 2번째 뒤(1), ..., 마지막 바로 전 게시물 뒤(postCount - 2) 까지 광고 삽입
      const positions = [];
      for (let i = 0; i <= postCount - 2; i++) {
        positions.push(i);
      }
      return positions;
    }

    if (postCount >= 8 && postCount <= 9) {
      // 8~9개 게시물일 땐 광고 1개
      // 7번째 게시물 뒤 (인덱스 6)
      return [6];
    }

    if (postCount >= 10) {
      // 10개 이상 게시물일 땐 광고 2개
      // 7번째 게시물 뒤(6), 마지막 게시물 뒤(postCount -1)
      return [6, postCount - 1];
    }

    return [];
  };

  // ---------- currentAds와 ref 동기화 ----------
  useEffect(() => {
    currentAdsRef.current = currentAds;
  }, [currentAds]);

  // ---------- 피드 아이템 생성 (포스트 + 광고) ----------
  useEffect(() => {
    const createFeedItems = () => {
      const items: Array<
        {type: 'post', data: PostListItem} |
        {type: 'ad', data: NativeAd, key: string} |
        {type: 'ad_loading', key: string}
      > = [];
      const postCount = posts.length;

      const adPositions = getAdPositions(postCount);

      let adIndex = 0;

      for (let i = 0; i < postCount; i++) {
        items.push({
          type: 'post',
          data: posts[i],
        });

        if (adPositions.includes(i)) {
          // 광고 로딩 중이거나 광고 아직 없으면 스켈레톤 표시
          if (isAdLoading || currentAds.length === 0) {
            items.push({
              type: 'ad_loading',
              key: `ad-loading-${adContextKey}-${adIndex}`,
            });
          } else {
            // 광고 있으면 실제 표시
            const adData = currentAds[adIndex % currentAds.length];
            items.push({
              type: 'ad',
              data: adData,
              key: `ad-${adContextKey}-${adIndex}`,
            });
          }
          adIndex++;
        }
      }

      setFeedItems(items);
    };

    createFeedItems();
  }, [posts, currentAds, isAdLoading]);

  // ---------- 광고 컨텍스트 변경: debouncedLoadAds 통합 호출 ----------
  useEffect(() => {
    if (categories.length === 0) return; // 카테고리 로드 전까지 대기

    setIsAdLoading(true); // 즉시 스켈레톤 표시
    debouncedLoadAds(adContextKey);
  }, [adContextKey, categories.length, debouncedLoadAds]);

  // ---------- 카테고리/소분류/동물 타입 변경: loadPosts 통합 호출 ----------
  useEffect(() => {
    if (categories.length === 0) return;
    if (shouldRefreshPosts) return; // focus refresh가 우선이면 여기선 스킵

    setPagination(prev => prev.page === 1 ? prev : { ...prev, page: 1 });

    loadPosts({ page: 1 });
  }, [postParams, categories.length, loadPosts, shouldRefreshPosts]);

  // ---------- 페이지 변경 핸들러: 사용자가 버튼 등으로 페이지 바꿀 때 직접 loadPosts 호출 ----------
  const handlePageChange = (page: number) => {
    // 빠른 연타 방지: 같은 페이지면 무시
    if (page === pagination.page) return;

    // 로컬 상태 업데이트 (UI용)
    setPagination(prev => ({ ...prev, page }));

    // 서버에서 해당 페이지 바로 로드 (명시적 호출 -> effect에 의존하지 않음)
    loadPosts({ page });
  };

  // ---------- 새로고침 ----------
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPosts({ page: pagination.page });
    } finally {
      setRefreshing(false);
    }
  };

  // ---------- interactions ----------
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(0);
  };

  const handleSubcategorySelect = (subcategoryId: number) => {
    setSelectedSubcategoryId(subcategoryId);
  };

  const handlePostPress = useCallback((post: PostListItem) => {
    navigation.navigate('PostDetail', { postId: post.id });
  }, [navigation]);

  const handleCommentPress = useCallback((post: PostListItem) => {
    setSelectedCommentItem(post);
    setCommentSheetVisible(true);
  }, []);

  const handleAuthorPress = useCallback((post: PostListItem) => {
    navigation.navigate('UserProfile', { userId: String(post.user.id) });
  }, [navigation]);

  const handleWritePress = () => navigation.navigate('CreatePost');

  // CommentActionSheet 핸들러
  const handleCommentSheetClose = useCallback(() => {
    setCommentSheetVisible(false);
    setSelectedCommentItem(null);
  }, []);

  const handleCommentCountUpdate = useCallback((postId: number, newCount: number) => {
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, comment_count: newCount } : post
    ));
  }, []);

  const handleAuthorPressFromSheet = useCallback(() => {
    if (selectedCommentItem) {
      navigation.navigate('UserProfile', { userId: String(selectedCommentItem.user.id) });
    }
    setCommentSheetVisible(false);
  }, [selectedCommentItem, navigation]);

  // Category Modal 핸들러
  const handleMenuPress = () => {
    setIsCategoryModalVisible(true);
  };

  const handleCategoryModalClose = () => {
    setIsCategoryModalVisible(false);
  };

  const handleCategoryModalSelect = (categoryId: number, subcategoryId?: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(subcategoryId || 0);
    setIsCategoryModalVisible(false);
  };

  // 동물 타입 필터 핸들러
  const handleFilterPress = () => {
    setIsAnimalTypeFilterVisible(!isAnimalTypeFilterVisible);
  };

  const handleAnimalTypeFilterClose = () => {
    setIsAnimalTypeFilterVisible(false);
  };

  const handleAnimalTypeSelect = (animalType: AnimalType | null) => {
    setSelectedAnimalTypeFilter(animalType);
    setIsAnimalTypeFilterVisible(false);
    // 필터 변경 시 게시글 새로고침 - useEffect에서 자동 처리
  };

  const headerRightButtons = [
    { key: 'write', onPress: handleWritePress, IconComponent: WriteIcon },
  ];

  // 선택된 카테고리와 서브카테고리 찾기
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const selectedSubcategory = selectedCategory?.subCategories.find(sub => sub.id === selectedSubcategoryId);

  // 설명 컨테이너 렌더링
  const renderDescriptionHeader = () => {
    let description = null;

    if (selectedSubcategory && selectedSubcategory.description && selectedSubcategoryId !== 0) {
      // 서브카테고리 설명
      description = selectedSubcategory.description;
    } else if (selectedCategory && selectedCategory.description && (!selectedSubcategoryId || selectedSubcategoryId === 0)) {
      // 대분류 카테고리 설명 (전체 선택 시)
      description = selectedCategory.description;
    }

    if (!description) return null;

    return (
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>
          {description}
        </Text>
      </View>
    );
  };

  const renderFeedItem = useCallback(({ item }: { item: typeof feedItems[0] }) => {
    if (item.type === 'post') {
      return (
        <PostCard
          post={item.data}
          onPress={() => handlePostPress(item.data)}
          onCommentPress={() => handleCommentPress(item.data)}
          onAuthorPress={() => handleAuthorPress(item.data)}
        />
      );
    } else if (item.type === 'ad') {
      return <PostAdCard nativeAd={item.data} />;
    } else if (item.type === 'ad_loading') {
      return <PostAdCardSkeleton />;
    }
    return null;
  }, [handlePostPress, handleCommentPress, handleAuthorPress]);

  return (
    <View style={styles.container}>
      <MainHeader rightButtons={headerRightButtons} />

      <CategorySelector
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onCategorySelect={handleCategorySelect}
        onSubcategorySelect={handleSubcategorySelect}
        onMenuPress={handleMenuPress}
        onFilterPress={handleFilterPress}
        selectedAnimalTypeFilter={selectedAnimalTypeFilter}
        isFilterOpen={isAnimalTypeFilterVisible}
        animalTypes={animalTypes}
      />

      {isLoading ? (
        <View style={[styles.postList, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={feedItems}
          renderItem={renderFeedItem}
          keyExtractor={(item, index) => {
            if (item.type === 'post') {
              return item.data.id.toString();
            } else {
              return item.key;
            }
          }}
          style={styles.postList}
          contentContainerStyle={styles.postListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.PRIMARY}
              colors={[colors.PRIMARY]}
            />
          )}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
          ListHeaderComponent={renderDescriptionHeader()}
          ListFooterComponent={(
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
          ListEmptyComponent={
            !isFirstLoad && !isLoading && posts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>게시글이 없습니다.</Text>
                <Text style={styles.emptySubText}>새로운 게시글을 작성해보세요!</Text>
                <TouchableOpacity style={styles.writeButton} onPress={handleWritePress}>
                  <WriteIcon size={20} color={colors.WHITE} />
                  <Text style={styles.buttonText}>게시글 작성하기</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* CommentActionSheet */}
      {selectedCommentItem && (
        <CommentActionSheet
          visible={commentSheetVisible}
          onClose={handleCommentSheetClose}
          item={selectedCommentItem}
          type="post"
          onCommentCountUpdate={handleCommentCountUpdate}
          onAuthorPress={handleAuthorPressFromSheet}
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

      {/* Category Modal */}
      <CategoryModal
        visible={isCategoryModalVisible}
        onClose={handleCategoryModalClose}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onCategorySelect={handleCategoryModalSelect}
      />

      {/* 동물 타입 필터 드롭다운 */}
      {isAnimalTypeFilterVisible && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={handleAnimalTypeFilterClose}
        >
          <TouchableOpacity
            style={styles.dropdownContainer}
            activeOpacity={1}
            onPress={() => {}} // 컨테이너 터치는 무시
          >
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => handleAnimalTypeSelect(null)}
            >
              <Text style={selectedAnimalTypeFilter === null ? styles.dropdownOptionSelected : styles.dropdownOptionText}>
                전체
              </Text>
            </TouchableOpacity>

            {animalTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.dropdownOption}
                onPress={() => handleAnimalTypeSelect(type.value)}
              >
                <Text style={[
                  styles.dropdownOptionText,
                  selectedAnimalTypeFilter === type.value && styles.dropdownOptionSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

// PostAdCardSkeleton 컴포넌트
const PostAdCardSkeleton = () => {
  const { colors } = useThemeStore();
  const skeletonStyles = createSkeletonStyles(colors);

  return (
    <View style={skeletonStyles.container}>
      {/* 상단: 작성자 정보 스켈레톤 */}
      <View style={skeletonStyles.header}>
        <View style={skeletonStyles.authorInfo}>
          <View style={skeletonStyles.profileImageSkeleton} />
          <View style={skeletonStyles.authorDetails}>
            <View style={skeletonStyles.authorNameSkeleton} />
            <View style={skeletonStyles.adMetaSkeleton} />
          </View>
        </View>
        <View style={skeletonStyles.categorySkeleton} />
      </View>

      {/* 본문 영역 스켈레톤 */}
      <View style={skeletonStyles.content}>
        <View style={skeletonStyles.textContent}>
          <View style={skeletonStyles.titleSkeleton} />
          <View style={skeletonStyles.contentSkeleton} />
        </View>
        <View style={skeletonStyles.imageSkeleton} />
      </View>

      {/* 하단: 상호작용 버튼들 스켈레톤 */}
      <View style={skeletonStyles.footer}>
        <View style={skeletonStyles.interactionButtons}>
          <View style={skeletonStyles.interactionSkeleton} />
          <View style={skeletonStyles.interactionSkeleton} />
          <View style={skeletonStyles.interactionSkeleton} />
        </View>
      </View>
    </View>
  );
};

// 스켈레톤 스타일 생성 함수
const createSkeletonStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    marginHorizontal: SPACING.SM,
    marginVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.GRAY_200,
  },
  authorDetails: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  authorNameSkeleton: {
    height: 14,
    backgroundColor: colors.GRAY_200,
    borderRadius: 7,
    marginBottom: 4,
    width: '60%',
  },
  adMetaSkeleton: {
    height: 12,
    backgroundColor: colors.GRAY_200,
    borderRadius: 6,
    width: '40%',
  },
  categorySkeleton: {
    height: 12,
    backgroundColor: colors.GRAY_200,
    borderRadius: 6,
    width: 80,
  },
  content: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  textContent: {
    flex: 1,
    marginRight: SPACING.SM,
  },
  titleSkeleton: {
    height: 16,
    backgroundColor: colors.GRAY_200,
    borderRadius: 8,
    marginBottom: SPACING.XS,
    width: '90%',
  },
  contentSkeleton: {
    height: 14,
    backgroundColor: colors.GRAY_200,
    borderRadius: 7,
    width: '70%',
  },
  imageSkeleton: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.GRAY_200,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    paddingTop: SPACING.SM,
  },
  interactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  interactionSkeleton: {
    height: 20,
    backgroundColor: colors.GRAY_200,
    borderRadius: 10,
    width: 40,
  },
});

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50, // BG_COLORS.SECONDARY
  },
  postList: {
    flex: 1,
  },
  postListContent: {
    paddingVertical: SPACING.SM,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  // 설명 컨테이너 스타일 (PostCard와 동일한 스타일)
  descriptionContainer: {
    backgroundColor: colors.WHITE,
    marginHorizontal: SPACING.SM,
    marginBottom: SPACING.XS,
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    ...SHADOWS.SMALL,
  },
  descriptionText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.REGULAR,
    color: colors.GRAY_500,
    lineHeight: TYPOGRAPHY.SIZE.MD + 4,
  },

  // 드롭다운 스타일
  dropdownOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  dropdownContainer: {
    position: 'absolute' as const,
    top: 150, // 필터 버튼 바로 아래에 위치
    right: SPACING.SM,
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    paddingVertical: SPACING.SM,
    minWidth: 120,
    ...SHADOWS.MEDIUM,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  dropdownOption: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  dropdownOptionText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.REGULAR,
    color: colors.GRAY_700,
  },
  dropdownOptionSelected: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.PRIMARY,
  },

});
