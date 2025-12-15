import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

// Components
import CommonHeader from '../components/CommonHeader';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';

// Services
import { getPopularPosts } from '../services/popularService';

// Types
import type { PopularPostsData } from '../types/popular';

type PopularPostScreenNavigationProp = StackNavigationProp<AuthStackParamList>;

export default function PopularPostScreen() {
  const navigation = useNavigation<PopularPostScreenNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const [posts, setPosts] = useState<PopularPostsData['posts']>([]);
  const [pagination, setPagination] = useState<PopularPostsData['pagination']>({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 데이터 로드 함수
  const loadPosts = useCallback(async (page: number = 1) => {
    try {
      setRefreshing(true);
      const response = await getPopularPosts(page, 10);
      setPosts(response.posts || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error('인기 게시물 로드 실패:', error);
      setPosts([]);
      setPagination({
        page,
        limit: 10,
        total: 0,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await loadPosts(1);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [loadPosts]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    loadPosts(page);
  };

  // 게시물 클릭 핸들러
  const handlePostPress = (post: any) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  // 댓글 클릭 핸들러
  const handleCommentPress = (post: any) => {
    // TODO CommentActionSheet나 댓글 화면으로 이동할 수 있도록 처리
  };

  // 작성자 클릭 핸들러
  const handleAuthorPress = (post: any) => {
    navigation.navigate('UserProfile', { userId: String(post.user.id) });
  };

  // 게시물 렌더링
  const renderPost = useCallback(({ item }: { item: any }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item)}
      onCommentPress={() => handleCommentPress(item)}
      onAuthorPress={() => handleAuthorPress(item)}
    />
  ), []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="인기 게시물" />

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.postList}
        showsVerticalScrollIndicator={false}
        refreshControl={undefined} // 새로고침 기능은 제거
        ListFooterComponent={
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        }
      />
    </View>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  postList: {
    paddingVertical: SPACING.SM,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
