import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, RefreshControl, Alert, ActivityIndicator, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, BG_COLORS, SPACING, TEXT_COLORS } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';

// 컴포넌트 imports
import HomeHeader from '../components/HomeHeader';
import CategorySelector from '../components/CategorySelector';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';

// 서비스 imports
import { PostService } from '../services/postService';
import type { PostListItem, Category } from '../types/post';

type HomeNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  
  // 상태 관리
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
  const [notificationCount] = useState(3); // 예시 알림 개수

  // 컴포넌트 마운트 시 카테고리와 게시글 로드
  useEffect(() => {
    loadCategories();
    loadPosts();
  }, []);

  // 카테고리 변경 시 게시글 다시 로드
  useEffect(() => {
    if (categories.length > 0) {
      setPagination(prev => ({ ...prev, page: 1 })); // 페이지 초기화
      loadPosts();
    }
  }, [selectedCategoryId, selectedSubcategoryId]);

  // 페이지 변경 시 게시글 다시 로드
  useEffect(() => {
    if (categories.length > 0) {
      loadPosts();
    }
  }, [pagination.page]);

  // 카테고리 로드
  const loadCategories = async () => {
    try {
      const categoriesData = await PostService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      Alert.alert('오류', '카테고리를 불러오는데 실패했습니다.');
    }
  };

  // 게시글 로드
  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const response = await PostService.getPosts({
        categoryId: selectedCategoryId || undefined,
        subCategoryId: selectedSubcategoryId || undefined,
        page: pagination.page,
      });
      
      setPosts(response.posts);
      setPagination(response.pagination);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      Alert.alert('오류', '게시글을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // 카테고리 선택 핸들러
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(0); // 대분류 변경시 소분류 초기화
  };

  const handleSubcategorySelect = (subcategoryId: number) => {
    setSelectedSubcategoryId(subcategoryId);
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPosts();
    } finally {
      setRefreshing(false);
    }
  };

  // 게시물 상호작용 핸들러들
  const handlePostPress = (post: PostListItem) => {
    console.log('Post pressed:', post.title);
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const handleLikePress = (post: PostListItem) => {
    console.log('Like pressed:', post.title);
    // TODO: 좋아요 API 호출
  };

  const handleCommentPress = (post: PostListItem) => {
    console.log('Comment pressed:', post.title);
    // TODO: 댓글 화면으로 이동
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // TODO: 알림 화면으로 이동
  };

  // 게시물 렌더링
  const renderPost = ({ item }: { item: PostListItem }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item)}
      onLikePress={() => handleLikePress(item)}
      onCommentPress={() => handleCommentPress(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <HomeHeader
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />

      {/* 카테고리 선택 */}
      <CategorySelector
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onCategorySelect={handleCategorySelect}
        onSubcategorySelect={handleSubcategorySelect}
      />

      {/* 게시물 목록 */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        style={styles.postList}
        contentContainerStyle={styles.postListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.PRIMARY}
            colors={[COLORS.PRIMARY]}
          />
        }
        // 성능 최적화
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
        getItemLayout={(data, index) => ({
          length: 200, // 예상 아이템 높이
          offset: 200 * index,
          index,
        })}
        ListFooterComponent={
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={COLORS.PRIMARY} style={styles.loadingIndicator} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>게시글이 없습니다.</Text>
              <Text style={styles.emptySubText}>새로운 게시글을 작성해보세요!</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.SECONDARY,
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
    color: TEXT_COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  emptySubText: {
    fontSize: 14,
    color: TEXT_COLORS.SECONDARY,
  },
});
