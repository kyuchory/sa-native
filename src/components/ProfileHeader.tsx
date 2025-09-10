import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image, Alert as RNAlert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import { SettingsIcon, MenuIcon, FollowIcon, ChatIcon } from './ProfileIcons';
import { useThemeStore } from '../stores/themeStore';
import ProfileButton from './ProfileButton';

// 타입 imports
import type { Profile } from '../types/profile';

interface ProfileHeaderProps {
  user: Pick<Profile, 'nickname' | 'profile_img' | 'bio' | 'stats' | 'relation'>;
  isOwnProfile: boolean;
  onSettingsPress?: () => void;
  onEditProfilePress?: () => void;
  onMenuPress?: () => void;
  onFollowPress?: () => void;
  onChatPress?: () => void;
};

export default function ProfileHeader({
  user,
  isOwnProfile,
  onSettingsPress,
  onEditProfilePress,
  onMenuPress,
  onFollowPress,
  onChatPress
}: ProfileHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const [bioExpanded, setBioExpanded] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 100000) / 10}M`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}K`;
    return num.toString();
  };



  // Bio 텍스트 렌더링 (FeedDetailScreen 방식)
  const renderBio = () => {
    if (!user.bio) return null;

    const bioText = user.bio;
    const shouldTruncate = bioText.length > 80; // 프로필에서는 80자로 제한

    if (!shouldTruncate) {
      return <Text style={styles.bioText}>{bioText}</Text>;
    }

    if (bioExpanded) {
      return (
        <View>
          <Text style={styles.bioText}>{bioText}</Text>
          <TouchableOpacity onPress={() => setBioExpanded(false)}>
            <Text style={styles.moreText}>접기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.bioText}>
          {bioText.substring(0, 80)}...
        </Text>
        <TouchableOpacity onPress={() => setBioExpanded(true)}>
          <Text style={styles.moreText}>더보기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.WHITE} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 상단 닉네임 + 설정 */}
        <View style={styles.topSection}>
          <Text style={styles.nickname}>{user.nickname}</Text>
          {isOwnProfile && onSettingsPress ? (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={onSettingsPress}
              activeOpacity={0.7}
            >
              <SettingsIcon size={24} color={colors.GRAY_600} />
            </TouchableOpacity>
          ) : !isOwnProfile && onMenuPress ? (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                RNAlert.alert(
                  '옵션',
                  '',
                  [
                    {
                      text: '차단',
                      onPress: () => console.log('차단'),
                      style: 'destructive'
                    },
                    {
                      text: '신고',
                      onPress: () => console.log('신고'),
                      style: 'destructive'
                    },
                    {
                      text: '취소',
                      style: 'cancel'
                    }
                  ]
                );
              }}
              activeOpacity={0.7}
            >
            <MenuIcon size={24} color={colors.GRAY_600} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 프로필 정보 섹션 */}
        <View style={styles.profileSection}>
          {/* 프로필 이미지 */}
          <View style={styles.profileImageContainer}>
            {user.profile_img ? (
              <Image source={{ uri: user.profile_img }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Text style={styles.profileImageText}>
                  {user.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* 통계 정보 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatNumber(user.stats.post_count)}</Text>
              <Text style={styles.statLabel}>게시물</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatNumber(user.stats.feed_count)}</Text>
              <Text style={styles.statLabel}>피드</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatNumber(user.stats.follower_count)}</Text>
              <Text style={styles.statLabel}>팔로워</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatNumber(user.stats.following_count)}</Text>
              <Text style={styles.statLabel}>팔로잉</Text>
            </View>
          </View>
        </View>

        {/* Bio 섹션 */}
        {user.bio && (
          <View style={styles.bioSection}>
            {renderBio()}
          </View>
        )}

        {/* 버튼 섹션 */}
        <View style={styles.buttonSection}>
          {isOwnProfile && onEditProfilePress ? (
            <ProfileButton
              title="프로필 편집"
              onPress={onEditProfilePress}
              variant="outline"
              size="medium"
              style={styles.button}
            />
          ) : !isOwnProfile && onFollowPress && onChatPress ? (
            <>
              <ProfileButton
                title={user.relation?.is_following ? "언팔로우" : "팔로우"}
                onPress={onFollowPress}
                variant={user.relation?.is_following ? "outline" : "primary"}
                size="medium"
              icon={<FollowIcon size={16} color={user.relation?.is_following ? colors.PRIMARY : colors.WHITE} />}
              style={styles.button}
            />
            <ProfileButton
              title="채팅"
              onPress={onChatPress}
              variant="outline"
              size="medium"
              icon={<ChatIcon size={16} color={colors.PRIMARY} />}
                style={styles.button}
              />
            </>
          ) : null}
        </View>
      </View>
    </>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
    ...SHADOWS.SMALL,
  },

  // 상단 섹션
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.XL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
  },
  settingsButton: {
    padding: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },

  // 프로필 섹션
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.MD,
  },
  profileImageContainer: {
    marginRight: SPACING.LG,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    backgroundColor: colors.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.XXL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },

  // 통계 섹션
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 버튼 섹션
  buttonSection: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  button: {
    flex: 1,
  },

  // Bio 섹션
  bioSection: {
    marginVertical: SPACING.SM,
    paddingHorizontal: SPACING.XS,
  },
  bioText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    lineHeight: 20,
  },
  moreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY
    marginTop: SPACING.XS,
  },
});
