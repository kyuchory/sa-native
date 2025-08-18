import React, { useState } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, BG_COLORS, SPACING } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';

// 컴포넌트 imports
import HomeHeader from '../components/HomeHeader';
import CategorySelector from '../components/CategorySelector';
import PostCard from '../components/PostCard';

// 데이터 imports
import { MOCK_CATEGORIES, STABLE_MOCK_POSTS as MOCK_POSTS, filterPostsByCategory, sortPostsByLatest } from '../data/stableMockData';
import type { Post } from '../components/PostCard';

type HomeNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount] = useState(3); // 예시 알림 개수

  // 필터링된 게시물 목록
  const filteredPosts = sortPostsByLatest(
    filterPostsByCategory(MOCK_POSTS, selectedCategoryId, selectedSubcategoryId)
  );

  // 카테고리 선택 핸들러
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(0); // 대분류 변경시 소분류 초기화
  };

  const handleSubcategorySelect = (subcategoryId: number) => {
    setSelectedSubcategoryId(subcategoryId);
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    setRefreshing(true);
    // 실제 앱에서는 여기서 API 호출
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // 게시물 상호작용 핸들러들
  const handlePostPress = (post: Post) => {
    console.log('Post pressed:', post.title);
    // 게시물 상세 화면으로 이동 (postId는 mock data에서 id를 string에서 number로 변환)
    const postId = parseInt(post.id);
    navigation.navigate('PostDetail', { postId });
  };

  const handleLikePress = (post: Post) => {
    console.log('Like pressed:', post.title);
    // TODO: 좋아요 API 호출
  };

  const handleCommentPress = (post: Post) => {
    console.log('Comment pressed:', post.title);
    // TODO: 댓글 화면으로 이동
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // TODO: 알림 화면으로 이동
  };

  // handleWritePress 제거 - HomeHeader가 기본 네비게이션을 처리하도록 함

  // 게시물 렌더링
  const renderPost = ({ item }: { item: Post }) => (
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
        categories={MOCK_CATEGORIES}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onCategorySelect={handleCategorySelect}
        onSubcategorySelect={handleSubcategorySelect}
      />

      {/* 게시물 목록 */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
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
});
