import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BG_COLORS, COLORS } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';

// 컴포넌트 imports
import FeedHeader from '../components/FeedHeader';
import StorySection from '../components/StorySection';
import FeedCard from '../components/FeedCard';

// 데이터 imports
import { FeedListItem } from '../types/feed';
import { FeedService } from '../services/feedService';
import { StoryUser } from '../data/storyMockData';

type FeedScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'MainApp'>;

export default function FeedScreen() {
  const navigation = useNavigation<FeedScreenNavigationProp>();
  
  // 상태 관리
  const [feeds, setFeeds] = useState<FeedListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [hasNext, setHasNext] = useState(true);
  const [notificationCount] = useState(5); // 예시 알림 개수

  // 컴포넌트 마운트 시 피드 로드
  useEffect(() => {
    loadInitialFeeds();
  }, []);

  // 초기 피드 로드
  const loadInitialFeeds = async () => {
    try {
      setLoading(true);
      const response = await FeedService.getFeeds(undefined, 20);
      setFeeds(response.feeds);
      setCursor(response.pagination.next_cursor || undefined);
      setHasNext(response.pagination.has_next);
    } catch (error) {
      console.error('피드 로드 실패:', error);
      Alert.alert('오류', '피드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 추가 피드 로드 (무한 스크롤)
  const loadMoreFeeds = async () => {
    if (loading || !hasNext) return;

    try {
      setLoading(true);
      const response = await FeedService.getFeeds(cursor, 20);
      setFeeds(prev => [...prev, ...response.feeds]);
      setCursor(response.pagination.next_cursor || undefined);
      setHasNext(response.pagination.has_next);
    } catch (error) {
      console.error('추가 피드 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setCursor(undefined);
      setHasNext(true);
      await loadInitialFeeds();
    } finally {
      setRefreshing(false);
    }
  };

  // 헤더 액션 핸들러들
  const handleNotificationPress = () => {
    console.log('알림 버튼 클릭');
    // TODO: 알림 화면으로 이동
  };

  const handleChatPress = () => {
    console.log('채팅 버튼 클릭');
    navigation.navigate('Chat');
  };

  // 스토리 액션 핸들러들
  const handleStoryPress = (user: StoryUser) => {
    console.log('스토리 보기:', user.nickname);
    // TODO: 스토리 상세 화면으로 이동
  };

  const handleAddStoryPress = () => {
    console.log('스토리 추가');
    // TODO: 스토리 추가 화면으로 이동
  };

  // 피드 액션 핸들러들
  const handleLikePress = (feedId: number) => {
    console.log('좋아요 클릭:', feedId);
    // TODO: 좋아요 API 호출
  };

  const handleCommentPress = (feedId: number) => {
    console.log('댓글 클릭:', feedId);
    // TODO: 댓글 화면으로 이동
  };

  const handleBookmarkPress = (feedId: number) => {
    console.log('북마크 클릭:', feedId);
    // TODO: 북마크 API 호출
  };

  const handleUserPress = (userId: number) => {
    console.log('사용자 프로필 클릭:', userId);
    navigation.navigate('UserProfile', { userId: String(userId) });
  };

  const handleImagePress = (feedId: number) => {
    console.log('피드 이미지 클릭:', feedId);
    navigation.navigate('FeedDetail', { feedId });
  };

  // 피드 렌더링
  const renderFeed = ({ item }: { item: FeedListItem }) => (
    <FeedCard
      feed={item}
      onLikePress={handleLikePress}
      onCommentPress={handleCommentPress}
      onBookmarkPress={handleBookmarkPress}
      onUserPress={handleUserPress}
      onImagePress={handleImagePress}
    />
  );

  // 리스트 헤더 (스토리 섹션)
  const renderListHeader = () => (
    <StorySection
      onStoryPress={handleStoryPress}
      onAddStoryPress={handleAddStoryPress}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <FeedHeader
        onNotificationPress={handleNotificationPress}
        onChatPress={handleChatPress}
        notificationCount={notificationCount}
      />

      {/* 피드 목록 */}
      <FlatList
        data={feeds}
        renderItem={renderFeed}
        keyExtractor={(item) => item.id.toString()}
        style={styles.feedList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.PRIMARY}
            colors={[COLORS.PRIMARY]}
          />
        }
        ListHeaderComponent={renderListHeader}
        onEndReached={loadMoreFeeds}
        onEndReachedThreshold={0.5}
        // 성능 최적화
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={3}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.SECONDARY,
  },
  feedList: {
    flex: 1,
  },
});
