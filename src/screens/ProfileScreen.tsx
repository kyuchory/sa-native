import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Alert } from 'react-native';
import { useFocusEffect, useNavigation, NavigationProp, RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../types/navigation';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';

// 컴포넌트 imports
import CommonHeader from '../components/CommonHeader';
import ProfileHeader from '../components/ProfileHeader';
import ProfileTabNavigation, { ProfileTabType } from '../components/ProfileTabNavigation';
import ProfileFeedGrid from '../components/ProfileFeedGrid';
import ProfilePostsList from '../components/ProfilePostsList';

// 서비스 imports
import { ProfileService } from '../services/profileService';
import { FollowService } from '../services/followService';

// 타입 imports
import type { Profile, ProfileFeedItem, ProfilePostItem, ProfilePagination } from '../types/profile';

export default function ProfileScreen({ route }: { route: RouteProp<AuthStackParamList, 'UserProfile'> }) {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const userId = route.params?.userId;
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = !userId || userId === String(currentUser?.id);
  const targetUserId = userId ? parseInt(userId) : currentUser?.id;

  //상태 관리
  const { user: authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTabType>('feed');
  const [profileData, setProfileData] = useState<Profile | null>(null);
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
    if (targetUserId) {
      try {
        if (showLoading) setLoading(true);
        const response = await ProfileService.getProfile(targetUserId);
        setProfileData(response.data);
      } catch (error) {
        console.error('프로필 조회 실패:', error);
        // 에러 발생 시 기본값 사용
        setProfileData({
          id: targetUserId,
          nickname: authUser?.nickname || '사용자',
          profile_img: authUser?.profile_img || null,
          bio: authUser?.bio || '',
          created_at: new Date().toISOString(),
          stats: {
            post_count: 0,
            feed_count: 0,
            follower_count: 0,
            following_count: 0,
          },
          relation: {
            is_me: userId === String(authUser?.id),
            is_following: false,
            is_followed_by: false,
          },
        });
      } finally {
        if (showLoading) setLoading(false);
      }
    }
  };

  // 피드 데이터 조회
  const fetchFeeds = async (reset = false) => {
    if (!targetUserId) return;

    try {
      setFeedsLoading(true);
      const currentOffset = reset ? 0 : feedsPagination.offset;
      const response = await ProfileService.getProfileFeeds(targetUserId, currentOffset, 20);

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
    if (targetUserId) {
      try {
        setPostsLoading(true);
        const response = await ProfileService.getProfilePosts(targetUserId);
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
  }, [targetUserId]);

  // 화면에 다시 포커스될 때 프로필과 피드 데이터 리프레시
  useFocusEffect(
    useCallback(() => {
      // 프로필 데이터를 로딩 없이 다시 가져와서 최신 상태로 유지
      fetchProfile(false);

      if (activeTab === 'feed') {
        fetchFeeds(true);
      }
      return () => {};
    }, [activeTab, targetUserId])
  );

  // ProfileHeader에 전달할 데이터 - API 응답 구조 그대로 사용
  const profileUser = profileData ? {
    nickname: profileData.nickname,
    profile_img: profileData.profile_img,
    stats: profileData.stats,
    bio: profileData.bio,
    relation: profileData.relation,
  } : null;

  // 핸들러들
  const handleSettingsPress = () => {
    navigation.navigate('Settings');
    // TODO: 설정 화면으로 이동
  };

  const handleEditProfilePress = () => {
    console.log('Edit profile pressed');
    navigation.navigate('ProfileEdit');
  };

  const handleMenuPress = () => {
    console.log('Menu pressed');
  };

  const handleFollowPress = async () => {
    if (!profileData?.id) return;

    try {
      const isCurrentlyFollowing = profileData.relation?.is_following;

      // 낙관적 UI 업데이트
      setProfileData(prev => prev ? {
        ...prev,
        relation: {
          ...prev.relation!,
          is_following: !isCurrentlyFollowing,
        }
      } : null);

      if (isCurrentlyFollowing) {
        // 언팔로우
        await FollowService.unfollowUser(profileData.id);
      } else {
        // 팔로우
        await FollowService.followUser(profileData.id);
      }

    } catch (error) {
      console.error('팔로우/언팔로우 실패:', error);

      // 실패 시 원래 상태로 롤백
      setProfileData(prev => prev ? {
        ...prev,
        relation: {
          ...(prev.relation || { is_me: false, is_following: false, is_followed_by: false }),
          is_following: profileData?.relation?.is_following || false,
        }
      } : null);

      // 사용자에게 에러 메시지 표시
      Alert.alert('오류', '팔로우 처리에 실패했습니다.');
    }
  };

  const handleChatPress = () => {
    console.log('Chat pressed');
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
      navigation.navigate('PostDetail', { postId: item.id });
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
      {/* 헤더 - 본인/타인에 따라 다르게 표시 */}
      {!userId ? (
        // 본인 프로필 (tabs에서 접근): 기존 ProfileHeader 사용
        <ProfileHeader
          user={profileUser}
          isOwnProfile={isOwnProfile}
          onSettingsPress={handleSettingsPress}
          onEditProfilePress={handleEditProfilePress}
        />
      ) : (
        // 타인 프로필 (다른 화면에서 userId로 접근): CommonHeader + 기존 ProfileHeader (메뉴 버튼과 팔로우/채팅 버튼 사용)
        <>
          {/* CommonHeader for back button */}
          <CommonHeader title={profileUser.nickname} />
          {/* 프로필 정보 (ProfileHeader 사용) */}
          <View style={styles.otherProfileHeader}>
            <ProfileHeader
              user={profileUser}
              isOwnProfile={isOwnProfile}
              onMenuPress={handleMenuPress}
              onFollowPress={handleFollowPress}
              onChatPress={handleChatPress}
            />
          </View>
        </>
      )}

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

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50, // BG_COLORS.SECONDARY
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
    color: colors.GRAY_600, // Dynamic text color
  },
  otherProfileHeader: {
    // 약간의 패딩으로 프로필 헤더를 감싸기
    paddingHorizontal: 0,
  },
});
