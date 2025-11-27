import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, ActivityIndicator, Text } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SPACING } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';
import usePostStore from '../stores/postStore';

// 컴포넌트 imports
import CategorySelector from '../components/CategorySelector';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';
import MainHeader from '../components/MainHeader';
import { WriteIcon } from '../components/HomeHeaderIcons';

// 서비스 imports
import { PostService } from '../services/postService';
import type { PostListItem, Category } from '../types/post';

type HomeNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const flatListRef = useRef<FlatList>(null);

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

  const { shouldRefreshPosts, setShouldRefreshPosts } = usePostStore();

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

  // ---------- loadPosts: accept explicit page to avoid closure issues ----------
  const loadPosts = useCallback(async (opts?: { page?: number; categoryId?: number; subCategoryId?: number }) => {
    const pageToLoad = opts?.page ?? pagination.page;
    const categoryId = opts?.categoryId ?? selectedCategoryId;
    const subCategoryId = opts?.subCategoryId ?? selectedSubcategoryId;

    try {
      setIsLoading(true);
      const response = await PostService.getPosts({
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
        page: pageToLoad,
      });

      setPosts(response.posts ?? []);

      // 서버에서 내려준 pagination이 실제로 다를 때만 상태 업데이트 (참조 변경으로 인한 불필요한 재호출 방지)
      if (!isSamePagination(pagination, response.pagination)) {
        setPagination(prev => ({ ...prev, ...response.pagination }));
      }
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      Alert.alert('오류', '게시글을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination, selectedCategoryId, selectedSubcategoryId]);

  // ---------- focus 기반 새로고침 (안정적으로 loadPosts 호출) ----------
  useFocusEffect(
    useCallback(() => {
      if (shouldRefreshPosts) {
        console.log('게시물 목록 새로고침 필요 - 포커스 시 로드');
        // 현재 페이지로 새로고침
        loadPosts({ page: pagination.page, categoryId: selectedCategoryId, subCategoryId: selectedSubcategoryId });
        setShouldRefreshPosts(false);
      }
    }, [shouldRefreshPosts, setShouldRefreshPosts, loadPosts, pagination.page, selectedCategoryId, selectedSubcategoryId])
  );

  // ---------- 컴포넌트 마운트 시: 카테고리 로드만 (의존성 없음) ----------
  useEffect(() => {
    // loadCategories는 별도 함수로 정의하고 내부에서 setCategories 한다
    const init = async () => {
      try {
        const categoriesData = await PostService.getCategories();
        const normalized = categoriesData.map(cat => ({
          ...cat,
          id: Number(cat.id),
          subCategories: (cat.subCategories || []).map((sc: any) => ({ ...sc, id: Number(sc.id) })),
        }));
        setCategories(normalized);
      } catch (err) {
        console.error('카테고리 로드 실패:', err);
        Alert.alert('오류', '카테고리를 불러오는데 실패했습니다.');
      }
    };

    init();
    // 빈 deps -> 마운트 시 1회만 실행, 로드는 category effect에서 담당
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- 카테고리/소분류 변경: 페이지를 1로 리셋하고 1페이지 로드 ----------
  useEffect(() => {
    if (categories.length === 0) return;

    // 만약 이미 page가 1이면 바로 로드 (페이지 값이 그대로면 setPagination 호출을 안함)
    if (pagination.page === 1) {
      loadPosts({ page: 1, categoryId: selectedCategoryId, subCategoryId: selectedSubcategoryId });
    } else {
      // page가 1이 아니면 상태를 1로 바꾸고(이후 다른 effect에 의존시키지 않음), 바로 1페이지 로드
      setPagination(prev => ({ ...prev, page: 1 }));
      loadPosts({ page: 1, categoryId: selectedCategoryId, subCategoryId: selectedSubcategoryId });
    }
    // 의존성: 카테고리 선택 값과 categories 존재여부
  }, [selectedCategoryId, selectedSubcategoryId, categories.length]); // loadPosts는 내부에서 사용하되 deps에서 제외해 재실행 루프 방지

  // ---------- 페이지 변경 핸들러: 사용자가 버튼 등으로 페이지 바꿀 때 직접 loadPosts 호출 ----------
  const handlePageChange = (page: number) => {
    // 빠른 연타 방지: 같은 페이지면 무시
    if (page === pagination.page) return;

    // 로컬 상태 업데이트 (UI용)
    setPagination(prev => ({ ...prev, page }));

    // 서버에서 해당 페이지 바로 로드 (명시적 호출 -> effect에 의존하지 않음)
    loadPosts({ page, categoryId: selectedCategoryId, subCategoryId: selectedSubcategoryId });
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
    console.log('Comment pressed:', post.title);
    // TODO
  }, []);

  const handleAuthorPress = useCallback((post: PostListItem) => {
    navigation.navigate('UserProfile', { userId: String(post.user.id) });
  }, [navigation]);

  const handleWritePress = () => navigation.navigate('CreatePost');

  const headerRightButtons = [
    { key: 'write', onPress: handleWritePress, IconComponent: WriteIcon },
  ];

  const renderPost = useCallback(({ item }: { item: PostListItem }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item)}
      onCommentPress={() => handleCommentPress(item)}
      onAuthorPress={() => handleAuthorPress(item)}
    />
  ), [handlePostPress, handleCommentPress, handleAuthorPress]);

  return (
    <View style={styles.container}>
      <MainHeader rightButtons={headerRightButtons} />

      <CategorySelector
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onCategorySelect={handleCategorySelect}
        onSubcategorySelect={handleSubcategorySelect}
      />

      {isLoading ? (
        <View style={[styles.postList, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
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
          getItemLayout={(data, index) => ({
            length: 200,
            offset: 200 * index,
            index,
          })}
          ListFooterComponent={(
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>게시글이 없습니다.</Text>
                <Text style={styles.emptySubText}>새로운 게시글을 작성해보세요!</Text>
              </View>
            ) : null
          }
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
    padding: SPACING.MD,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    marginBottom: SPACING.SM,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY
  },
});
