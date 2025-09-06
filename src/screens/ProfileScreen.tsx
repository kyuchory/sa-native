import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../types/navigation';
import { BG_COLORS } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';

// 컴포넌트 imports
import ProfileHeader from '../components/ProfileHeader';
import ProfileTabNavigation, { ProfileTabType } from '../components/ProfileTabNavigation';
import ProfileFeedGrid from '../components/ProfileFeedGrid';
import ProfilePostsList from '../components/ProfilePostsList';

// 서비스 imports
import { ProfileService } from '../services/profileService';

// 타입 imports
import type { ProfileFeedItem, ProfilePostItem, ProfilePagination } from '../types/profile';

export default function NewProfileTabScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  //상태 관리
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTabType>('feed');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [postsData, setPostsData] = useState<ProfilePostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [feedsData, setFeedsData] = useState<ProfileFeedItem[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(false);
  const [feedsPagination, setFeedsPagination] = useState<ProfilePagination>({
    offset: 0,
    limit: 20,
    total: 0,
    has_next: false,
  });

  // 프로필 데이터 조회
  const fetchProfile = async (showLoading = true) => {
    if (user?.id) {
      try {
        if (showLoading) setLoading(true);
        const response = await ProfileService.getProfile(user.id);
        setProfileData(response.data);
      } catch (error) {
        console.error('프로필 조회 실패:', error);
        // 에러 발생 시 기본값 사용
        setProfileData({
          nickname: user?.nickname || '사용자',
          profile_img: user?.profile_img || null,
          bio: user?.bio || '',
          stats: {
            post_count: 0,
            feed_count: 0,
            follower_count: 0,
            following_count: 0,
          },
        });
      } finally {
        if (showLoading) setLoading(false);
      }
    }
  };

  // 피드 데이터 조회
  const fetchFeeds = async (reset = false) => {
    if (!user?.id) return;
    
    try {
      setFeedsLoading(true);
      const currentOffset = reset ? 0 : feedsPagination.offset;
      const response = await ProfileService.getProfileFeeds(user.id, currentOffset, 20);
      
      if (reset) {
        setFeedsData(response.data.feeds);
      } else {
        setFeedsData(prev => [...prev, ...response.data.feeds]);
      }
      
      setFeedsPagination({
        ...response.data.pagination,
        offset: currentOffset + response.data.feeds.length,
      });
    } catch (error) {
      console.error('피드 조회 실패:', error);
    } finally {
      setFeedsLoading(false);
    }
  };

  // 피드 무한 스크롤 핸들러
  const handleFeedsEndReached = () => {
    if (!feedsLoading && feedsPagination.has_next) {
      fetchFeeds(false);
    }
  };

  // posts 데이터 조회
  const fetchPosts = async () => {
    if (user?.id) {
      try {
        setPostsLoading(true);
        const response = await ProfileService.getProfilePosts(user.id);
        setPostsData(response.data.posts);
      } catch (error) {
        console.error('게시글 목록 조회 실패:', error);
        setPostsData([]);
      } finally {
        setPostsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
    // 초기 로드 시 피드 데이터도 함께 조회
    if (activeTab === 'feed') {
      fetchFeeds(true);
    }
  }, [user?.id]);

  // 화면에 다시 포커스될 때 프로필과 피드 데이터 리프레시
  useFocusEffect(
    useCallback(() => {
      // 프로필 데이터를 로딩 없이 다시 가져와서 최신 상태로 유지
      fetchProfile(false);

      if (activeTab === 'feed') {
        fetchFeeds(true);
      }
      return () => {};
    }, [activeTab, user?.id])
  );

  // ProfileHeader에 전달할 데이터 변환
  const profileUser = profileData ? {
    nickname: profileData.nickname,
    profileImage: profileData.profile_img,
    postsCount: profileData.stats.post_count,
    feedsCount: profileData.stats.feed_count,
    followersCount: profileData.stats.follower_count,
    followingCount: profileData.stats.following_count,
    bio: profileData.bio,
  } : null;

  // 핸들러들
  const handleSettingsPress = () => {
    console.log('Settings pressed');
    // TODO: 설정 화면으로 이동
  };

  const handleEditProfilePress = () => {
    console.log('Edit profile pressed');
    navigation.navigate('ProfileEdit');
  };

  const handleTabChange = (tab: ProfileTabType) => {
    setActiveTab(tab);
    
    // 피드 탭으로 변경 시 데이터 로드
    if (tab === 'feed' && feedsData.length === 0) {
      fetchFeeds(true);
    }
    // posts 탭 선택 시 데이터 로딩
    if (tab === 'posts') {
      fetchPosts();
    }
  };

  const handleItemPress = (item: any) => {
    console.log('Item pressed:', item);
    if (activeTab === 'feed') {
      navigation.navigate('FeedDetail', { feedId: item.id });
    } else if (activeTab === 'posts') {
      // TODO: 게시물 상세 화면으로 이동
    } else if (activeTab === 'videos') {
      // TODO: 비디오 재생 화면으로 이동
    } else if (activeTab === 'character') {
      // TODO: 캐릭터 상세 화면으로 이동
    }
  };

  // 로딩 중이거나 프로필 데이터가 없으면 기본값 사용
  if (loading || !profileUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>프로필을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 프로필 헤더 */}
      <ProfileHeader
        user={profileUser}
        onSettingsPress={handleSettingsPress}
        onEditProfilePress={handleEditProfilePress}
      />

      {/* 탭 네비게이션 */}
      <ProfileTabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* 콘텐츠 영역 */}
      <View style={styles.contentContainer}>
        {activeTab === 'feed' && (
          <ProfileFeedGrid
            data={feedsData}
            loading={feedsLoading}
            onItemPress={handleItemPress}
            onEndReached={handleFeedsEndReached}
          />
        )}
        {activeTab === 'posts' && (
          <ProfilePostsList
            data={postsData}
            loading={postsLoading}
            onItemPress={handleItemPress}
          />
        )}
        {(activeTab === 'videos' || activeTab === 'character') && (
          <ProfileFeedGrid
            data={feedsData}
            loading={feedsLoading}
            onItemPress={handleItemPress}
            onEndReached={handleFeedsEndReached}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.SECONDARY,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
