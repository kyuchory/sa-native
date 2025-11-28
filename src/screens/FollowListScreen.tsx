import React, { useState, useEffect, useCallback } from 'react';
import useFeedStore from '../stores/feedStore';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { SPACING, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { AuthStackParamList } from '../types/navigation';

// 컴포넌트 imports
import CommonHeader from '../components/CommonHeader';
import SearchInput, { SearchInputRef } from '../components/SearchInput';
import FollowTabNavigation from '../components/FollowTabNavigation';
import FollowUserItem from '../components/FollowUserItem';

// 서비스 imports
import { FollowService } from '../services/followService';
import { handleApiError } from '../services/apiClient';

// 타입 imports
import type { FollowUser } from '../types/follow';

type FollowTabType = 'followers' | 'following';

export default function FollowListScreen() {
  const route = useRoute<RouteProp<AuthStackParamList, 'FollowList'>>();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  const { userId, initialTab } = route.params;
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 상태 관리
  const [activeTab, setActiveTab] = useState<FollowTabType>(initialTab || 'followers');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followersData, setFollowersData] = useState<FollowUser[]>([]);
  const [followingData, setFollowingData] = useState<FollowUser[]>([]);
  const [filteredData, setFilteredData] = useState<FollowUser[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoadedFollowers, setHasLoadedFollowers] = useState(false);
  const [hasLoadedFollowing, setHasLoadedFollowing] = useState(false);

  // 헤더 타이틀 설정
  const getHeaderTitle = () => {
    if (activeTab === 'followers') {
      return '팔로워';
    } else {
      return '팔로잉';
    }
  };

  // 현재 탭 데이터 로드
  const fetchCurrentTabData = useCallback(async (cursor?: number, append = false) => {
    try {
      const options = cursor ? { cursor, limit: 20 } : { limit: 20 };

      let response;
      if (activeTab === 'followers') {
        response = await FollowService.getUserFollowerList(userId, options);
      } else {
        response = await FollowService.getUserFollowingList(userId, options);
      }

      const { followers, following, next_cursor, has_more } = response;

      if (append) {
        if (activeTab === 'followers') {
          setFollowersData(prev => [...prev, ...(followers || [])]);
        } else {
          setFollowingData(prev => [...prev, ...(following || [])]);
        }
      } else {
        if (activeTab === 'followers') {
          setFollowersData(followers || []);
        } else {
          setFollowingData(following || []);
        }
      }

      setNextCursor(next_cursor);
      setHasMore(has_more);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      const errorMessage = handleApiError(error);
      Alert.alert('오류', errorMessage);
    }
  }, [activeTab, userId]);

  // 검색 필터 적용
  const applySearchFilter = useCallback((data: FollowUser[], search: string) => {
    if (!search.trim()) {
      return data;
    }

    return data.filter(user =>
      user.nickname.toLowerCase().includes(search.toLowerCase())
    );
  }, []);

  // 검색 시 서버 API 호출 (2글자 이상)
  const performSearch = useCallback(async (query: string) => {
    if (query.length >= 2) {
      setIsSearchMode(true);
      try {
        const options = { search: query, limit: 50 };

        let response;
        if (activeTab === 'followers') {
          response = await FollowService.getUserFollowerList(userId, options);
        } else {
          response = await FollowService.getUserFollowingList(userId, options);
        }

        const { followers, following } = response;
        const searchData = activeTab === 'followers' ? (followers || []) : (following || []);
        setFilteredData(searchData);
      } catch (error) {
        console.error('검색 실패:', error);
        setFilteredData([]);
      }
    } else if (query.length === 0) {
      // 검색어가 완전히 비었을 때는 검색 모드 해제
      setIsSearchMode(false);
      setFilteredData([]);
    } else {
      // 검색어가 1글자 이하면 아무것도 하지 않음 (최소 2글자 요구)
      setIsSearchMode(false);
      setFilteredData([]);
    }
  }, [activeTab, userId]);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      const isFollowersTab = activeTab === 'followers';
      const hasAlreadyLoaded = isFollowersTab ? hasLoadedFollowers : hasLoadedFollowing;

      // 이미 로드된 데이터가 있으면 재호출하지 않음
      if (hasAlreadyLoaded) {
        return;
      }

      setLoading(true);
      await fetchCurrentTabData();

      // 로드 완료 플래그 설정
      if (isFollowersTab) {
        setHasLoadedFollowers(true);
      } else {
        setHasLoadedFollowing(true);
      }

      setLoading(false);
    };

    loadInitialData();
  }, [activeTab, hasLoadedFollowers, hasLoadedFollowing]);

  // 검색어 변경 시 기존 검색 상태 관리 (이제 자동 호출에 맡김)
  useEffect(() => {
    // 데바운스가 있는 검색 컴포넌트는 자동으로 호출되므로 별도 처리가 필요 없음
  }, [searchText, activeTab, userId]);

  // 탭 변경 핸들러
  const handleTabChange = (tab: FollowTabType) => {
    setActiveTab(tab);
    setSearchText('');
    setFilteredData([]);
    setIsSearchMode(false);
  };

  // 검색 핸들러
  const handleSearchDebounce = useCallback((debouncedText: string) => {
    performSearch(debouncedText);
  }, [performSearch]);

  // 사용자 아이템 터치 핸들러
  const handleUserPress = (user: FollowUser) => {
    navigation.navigate('UserProfile', { userId: user.id.toString() });
  };

  // 팔로우 버튼 핸들러
  const handleFollowPress = async (user: FollowUser) => {
    try {
      if (user.is_following) {
        await FollowService.unfollowUser(user.id);
      } else {
        await FollowService.followUser(user.id);
      }

      // 피드 새로고침 플래그 설정 - 팔로우/언팔로우 성공 시 피드 업데이트
      useFeedStore.getState().setShouldRefreshFeeds(true);
      // 낙관적 UI 업데이트
      const updateUserData = (data: FollowUser[]) =>
        data.map(u => u.id === user.id ? { ...u, is_following: !u.is_following } : u);

      if (activeTab === 'followers') {
        setFollowersData(updateUserData);
        // 검색 중이면 필터드 데이터도 업데이트
        if (searchText.length >= 2) {
          setFilteredData(prevFiltered =>
            prevFiltered.map(u => u.id === user.id ? { ...u, is_following: !u.is_following } : u)
          );
        }
      } else {
        setFollowingData(updateUserData);
        // 검색 중이면 필터드 데이터도 업데이트
        if (searchText.length >= 2) {
          setFilteredData(prevFiltered =>
            prevFiltered.map(u => u.id === user.id ? { ...u, is_following: !u.is_following } : u)
          );
        }
      }
    } catch (error) {
      console.error('팔로우/언팔로우 실패:', error);
      const errorMessage = handleApiError(error);
      Alert.alert('오류', errorMessage);
    }
  };

  // 무한 스크롤 핸들러
  const handleEndReached = () => {
    // 검색 중이 아닐 때만 무한 스크롤
    if (!loadingMore && hasMore && nextCursor && searchText.length < 2) {
      setLoadingMore(true);
      fetchCurrentTabData(nextCursor, true).finally(() => {
        setLoadingMore(false);
      });
    }
  };

  // 리프레시 핸들러
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCurrentTabData();
    setRefreshing(false);
  };

  // 빈 상태 렌더링
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchText.trim() ? '검색 결과가 없습니다.' : getHeaderTitle() + '가 없습니다.'}
      </Text>
    </View>
  );

  // 로딩 상태 렌더링
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>로딩 중...</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title={getHeaderTitle()} />
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title={getHeaderTitle()} />

      <FollowTabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        followerCount={followersData.length}
        followingCount={followingData.length}
      />

      <SearchInput
        value={searchText}
        onChangeText={setSearchText}
        placeholder="닉네임 검색"
        onDebounce={handleSearchDebounce}
        debounceDelay={300}
      />

      <FlatList
        data={isSearchMode ? filteredData : (activeTab === 'followers' ? followersData : followingData)}
        renderItem={({ item }) => (
          <FollowUserItem
            user={item}
            onUserPress={handleUserPress}
            onFollowPress={handleFollowPress}
            showFollowingStatus={activeTab === 'followers'}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredData.length === 0 && !loading && styles.contentContainer}
        style={{ marginBottom: insets.bottom }}
      />
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  contentContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700,
  },
});
