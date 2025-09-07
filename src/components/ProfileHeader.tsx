import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import { SettingsIcon } from './ProfileIcons';
import ProfileButton from './ProfileButton';

// 타입 imports
import type { Profile, ProfileStats } from '../types/profile';

// 타입 imports 추가
interface ProfileHeaderProps {
  user: Pick<Profile, 'nickname' | 'profile_img' | 'bio' | 'stats'>;
  onSettingsPress: () => void;
  onEditProfilePress: () => void;
}

export default function ProfileHeader({
  user,
  onSettingsPress,
  onEditProfilePress,
}: ProfileHeaderProps) {
  const insets = useSafeAreaInsets();
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.WHITE} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 상단 닉네임 + 설정 */}
        <View style={styles.topSection}>
          <Text style={styles.nickname}>{user.nickname}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={onSettingsPress}
            activeOpacity={0.7}
          >
            <SettingsIcon size={24} color={COLORS.GRAY_600} />
          </TouchableOpacity>
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
          <ProfileButton
            title="프로필 편집"
            onPress={onEditProfilePress}
            variant="outline"
            size="medium"
            style={styles.button}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
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
    color: TEXT_COLORS.PRIMARY,
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
    backgroundColor: COLORS.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.XXL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
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
    color: TEXT_COLORS.PRIMARY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
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
    color: TEXT_COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    lineHeight: 20,
  },
  moreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
    marginTop: SPACING.XS,
  },
});
