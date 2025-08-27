import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { BG_COLORS } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';

// 컴포넌트 imports
import ProfileHeader from '../components/ProfileHeader';
import ProfileTabNavigation, { ProfileTabType } from '../components/ProfileTabNavigation';
import ProfileContentGrid from '../components/ProfileContentGrid';

// 서비스 imports
import { ProfileService } from '../services/profileService';

// 데이터 imports
import {
  MOCK_FEED_DATA,
  MOCK_VIDEOS_DATA,
  MOCK_CHARACTERS_DATA,
} from '../data/profileMockData';

export default function NewProfileTabScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTabType>('feed');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [postsData, setPostsData] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // 프로필 데이터 조회
  const fetchProfile = async () => {
    if (user?.id) {
      try {
        setLoading(true);
        const response = await ProfileService.getProfile(user.id);
        setProfileData(response.data);
      } catch (error) {
        console.error('프로필 조회 실패:', error);
                   // 에러 발생 시 기본값 사용
         setProfileData({
           nickname: user?.nickname || '사용자',
           profile_img: user?.profile_img || null,
           stats: {
             post_count: 0,
             feed_count: 0,
             follower_count: 0,
             following_count: 0,
           },
         });
      } finally {
        setLoading(false);
      }
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
  }, [user?.id]);

  // ProfileHeader에 전달할 데이터 변환
  const profileUser = profileData ? {
    nickname: profileData.nickname,
    profileImage: profileData.profile_img,
    postsCount: profileData.stats.post_count,
    feedsCount: profileData.stats.feed_count,
    followersCount: profileData.stats.follower_count,
    followingCount: profileData.stats.following_count,
  } : null;

  // 핸들러들
  const handleSettingsPress = () => {
    console.log('Settings pressed');
    // TODO: 설정 화면으로 이동
  };

  const handleCharacterLinkPress = () => {
    console.log('Character link pressed');
    // TODO: 캐릭터 연동 화면으로 이동
  };

  const handleEditProfilePress = () => {
    console.log('Edit profile pressed');
    // TODO: 프로필 편집 화면으로 이동
  };

  const handleTabChange = (tab: ProfileTabType) => {
    setActiveTab(tab);
    
    // posts 탭 선택 시 데이터 로딩
    if (tab === 'posts') {
      fetchPosts();
    }
  };

  const handleItemPress = (item: any) => {
    console.log('Item pressed:', item);
    if (activeTab === 'feed') {
      // TODO: 피드 상세 화면으로 이동
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
        onCharacterLinkPress={handleCharacterLinkPress}
        onEditProfilePress={handleEditProfilePress}
      />

      {/* 탭 네비게이션 */}
      <ProfileTabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* 콘텐츠 그리드 */}
      <View style={styles.contentContainer}>
        <ProfileContentGrid
          type={activeTab}
          feedData={MOCK_FEED_DATA}
          postsData={postsData}
          videosData={MOCK_VIDEOS_DATA}
          charactersData={MOCK_CHARACTERS_DATA}
          onItemPress={handleItemPress}
        />
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
