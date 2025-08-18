import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { BG_COLORS } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';

// 컴포넌트 imports
import ProfileHeader from '../components/ProfileHeader';
import ProfileTabNavigation, { ProfileTabType } from '../components/ProfileTabNavigation';
import ProfileContentGrid from '../components/ProfileContentGrid';

// 데이터 imports
import {
  MOCK_PROFILE_USER,
  MOCK_FEED_DATA,
  MOCK_PROFILE_POSTS,
  MOCK_VIDEOS_DATA,
  MOCK_CHARACTERS_DATA,
} from '../data/profileMockData';

export default function NewProfileTabScreen() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProfileTabType>('feed');

  // 실제 사용자 정보와 목 데이터 결합
  const profileUser = {
    ...MOCK_PROFILE_USER,
    nickname: user?.nickname || MOCK_PROFILE_USER.nickname,
    profileImage: user?.profile_img || MOCK_PROFILE_USER.profileImage,
  };

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
          postsData={MOCK_PROFILE_POSTS}
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
});
