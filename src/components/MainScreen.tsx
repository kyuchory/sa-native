import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { SPACING } from '../constants/theme';

// 섹션 컴포넌트들
import PopularPostsSection from '../components/PopularPostsSection';
import PopularCutsSection from '../components/PopularCutsSection';
import PopularUsersSection from '../components/PopularUsersSection';
import PopularFeedsSection from '../components/PopularFeedsSection';

// API 서비스
import { getPopular } from '../services/popularService';

import type { PopularPostItem, PopularShortItem, PopularUserItem, PopularFeedItem } from '../types/popular';

type MainScreenNavigationProp = StackNavigationProp<AuthStackParamList>;

interface MainScreenProps {
  refreshTrigger?: number;
}

export default function MainScreen({ refreshTrigger }: MainScreenProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const navigation = useNavigation<MainScreenNavigationProp>();

  // 데이터 상태 관리
  const [posts, setPosts] = useState<PopularPostItem[]>([]);
  const [cuts, setCuts] = useState<PopularShortItem[]>([]);
  const [users, setUsers] = useState<PopularUserItem[]>([]);
  const [feeds, setFeeds] = useState<PopularFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // API로 데이터 로드
  const loadPopularData = async () => {
    try {
      setRefreshing(true); // refresh시에도 로딩 표시가 필요할 수 있음
      const data = await getPopular();
      setPosts(data.popular_posts);
      setCuts(data.popular_shorts);
      setUsers(data.popular_users);
      setFeeds(data.popular_feeds);
    } catch (error) {
      console.error('인기 데이터 로드 실패:', error);
      // TODO: 에러 처리 (토스트 메시지나 빈 상태 표시)
      setPosts([]);
      setCuts([]);
      setUsers([]);
      setFeeds([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await loadPopularData();
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Pull to Refresh 관련 useEffect
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadPopularData();
    }
  }, [refreshTrigger]);

  // 네비게이션 핸들러들
  const handlePostPress = (post: PopularPostItem) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const handleCutPress = (cut: PopularShortItem) => {
    // 컷츠 상세 화면으로 이동
    navigation.navigate('CutDetail', { shortId: cut.id });
  };

  const handleUserPress = (user: PopularUserItem | number) => {
    const userId = typeof user === 'number' ? user : user.id;
    navigation.navigate('UserProfile', { userId: String(userId) });
  };

  const handleFeedPress = (feed: PopularFeedItem) => {
    // 피드 상세 화면으로 이동
    navigation.navigate('FeedDetail', { feedId: feed.id });
  };

  const handleSeeMorePosts = () => {
    // 인기 게시물 전용 화면으로 이동 (존재하지 않으면 전체 게시물로)
    console.log('See more posts');
    navigation.navigate('MainApp'); // 임시로 MainApp으로 이동
  };

  const handleSeeMoreCuts = () => {
    // CutTab으로 탭 변경
    navigation.navigate('CutTab' as any);
  };

  const handleSeeMoreUsers = () => {
    console.log('See more users');
  };

  const handleSeeMoreFeeds = () => {
    console.log('See more feeds');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
      <PopularPostsSection
        posts={posts}
        onPostPress={handlePostPress}
        onUserPress={(userId) => handleUserPress(userId)}
        onSeeMorePress={handleSeeMorePosts}
      />
      <PopularCutsSection
        cuts={cuts}
        onCutPress={handleCutPress}
        onUserPress={(user) => handleUserPress(user.id)}
        onSeeMorePress={handleSeeMoreCuts}
      />
      <PopularFeedsSection
        feeds={feeds}
        onFeedPress={handleFeedPress}
        onUserPress={(userId) => handleUserPress(userId)}
        onSeeMorePress={handleSeeMoreFeeds}
      />
      <PopularUsersSection
        users={users}
        onUserPress={handleUserPress}
        onSeeMorePress={handleSeeMoreUsers}
      />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.SM,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.GRAY_50,
  },
});
