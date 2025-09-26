import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert as RNAlert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import { SettingsIcon, MenuIcon, FollowIcon, ChatIcon } from './ProfileIcons';
import { BackIcon, FollowersOnlyIcon } from './CommonIcons';
import { useThemeStore } from '../stores/themeStore';
import ProfileButton from './ProfileButton';
import UserAvatar from './UserAvatar';

// 타입 imports
import type { Profile } from '../types/profile';

interface ProfileHeaderProps {
  user: Pick<Profile, 'nickname' | 'profile_img' | 'bio' | 'stats' | 'relation' | 'profile_visibility'>;
  isOwnProfile: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onSettingsPress?: () => void;
  onEditProfilePress?: () => void;
  onMenuPress?: () => void;
  onFollowPress?: () => void;
  onChatPress?: () => void;
  onFollowRequestPress?: () => void; // 팔로우 요청 버튼 핸들러 추가
};

// 팔로우 버튼 상태 결정 헬퍼 함수들
const getFollowButtonTitle = (user: Pick<Profile, 'relation' | 'profile_visibility'>): string => {
  // 비공개 계정인 경우 팔로우 요청 시스템 사용
  if (user.profile_visibility === 'followers') {
    if (user.relation?.is_following) {
      return "언팔로우";
    }
    
    if (user.relation?.is_request_sent && user.relation?.request_status === 'pending') {
      return "요청됨";
    }
    
    if (user.relation?.is_request_sent && user.relation?.request_status === 'rejected') {
      return user.relation?.can_send_request ? "팔로우 요청" : "요청 거절됨";
    }
    
    if (user.relation?.is_request_received) {
      return "요청 수락";
    }
    
    return "팔로우 요청";
  }
  
  // 공개 계정인 경우 기존 팔로우 시스템 사용
  if (user.relation?.is_following) {
    return "언팔로우";
  }
  
  return "팔로우";
};

const getFollowButtonVariant = (user: Pick<Profile, 'relation' | 'profile_visibility'>): "primary" | "outline" | "secondary" => {
  // 비공개 계정인 경우 팔로우 요청 시스템 사용
  if (user.profile_visibility === 'followers') {
    if (user.relation?.is_following) {
      return "outline";
    }
    
    if (user.relation?.is_request_sent && user.relation?.request_status === 'pending') {
      return "secondary";
    }
    
    if (user.relation?.is_request_sent && user.relation?.request_status === 'rejected') {
      return user.relation?.can_send_request ? "primary" : "secondary";
    }
    
    return "primary";
  }
  
  // 공개 계정인 경우 기존 팔로우 시스템 사용
  if (user.relation?.is_following) {
    return "outline";
  }
  
  return "primary";
};

const getFollowButtonDisabled = (user: Pick<Profile, 'relation' | 'profile_visibility'>): boolean => {
  // 비공개 계정인 경우 팔로우 요청 시스템 사용
  if (user.profile_visibility === 'followers') {
    if (user.relation?.is_request_sent && user.relation?.request_status === 'pending') {
      return true;
    }
    
    if (user.relation?.is_request_sent && user.relation?.request_status === 'rejected') {
      return !user.relation?.can_send_request;
    }
    
    return false;
  }
  
  // 공개 계정인 경우 비활성화 없음
  return false;
};

const getFollowButtonIconColor = (user: Pick<Profile, 'relation' | 'profile_visibility'>, colors: Record<string, string>): string => {
  // 비공개 계정인 경우 팔로우 요청 시스템 사용
  if (user.profile_visibility === 'followers') {
    if (user.relation?.is_following) {
      return colors.PRIMARY;
    }
    
    if (user.relation?.is_request_sent && user.relation?.request_status === 'pending') {
      return colors.GRAY_600;
    }
    
    if (user.relation?.is_request_sent && user.relation?.request_status === 'rejected') {
      return user.relation?.can_send_request ? colors.WHITE : colors.GRAY_600;
    }
    
    return colors.WHITE;
  }
  
  // 공개 계정인 경우 기존 팔로우 시스템 사용
  if (user.relation?.is_following) {
    return colors.PRIMARY;
  }
  
  return colors.WHITE;
};

export default function ProfileHeader({
  user,
  isOwnProfile,
  showBackButton = false,
  onBackPress,
  onSettingsPress,
  onEditProfilePress,
  onMenuPress,
  onFollowPress,
  onChatPress,
  onFollowRequestPress
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
    const shouldTruncate = bioText.length > 55; // 프로필에서는 80자로 제한

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
          {bioText.substring(0, 55)}...
        </Text>
        <TouchableOpacity onPress={() => setBioExpanded(true)}>
          <Text style={styles.moreText}>더보기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 상단 닉네임 + 설정 */}
        <View style={styles.topSection}>
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress || (() => {
                  console.log('Back button pressed but no handler provided');
                })}
                activeOpacity={0.7}
              >
                <BackIcon size={24} color={colors.GRAY_700} />
              </TouchableOpacity>
            )}
            <Text style={styles.nickname}>{user.nickname}</Text>
            {user.profile_visibility === 'followers' && (
              <FollowersOnlyIcon size={20} color={colors.GRAY_600} />
            )}
          </View>
          <View style={styles.rightSection}>
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
                onPress={onMenuPress}
                activeOpacity={0.7}
              >
              <MenuIcon size={24} color={colors.GRAY_600} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* 프로필 정보 섹션 */}
        <View style={styles.profileSection}>
          {/* 프로필 이미지 */}
          <View style={styles.profileImageContainer}>
            <UserAvatar 
              profileImg={user.profile_img} 
              nickname={user.nickname}
              size={80}
            />
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
            // 자기 프로필인 경우
            <View style={styles.ownProfileButtons}>
              <ProfileButton
                title="프로필 편집"
                onPress={onEditProfilePress}
                variant="outline"
                size="medium"
                style={styles.button}
              />
              {/* 비공개 계정일 경우 팔로우 요청 버튼 추가 */}
              {user.profile_visibility === 'followers' && onFollowRequestPress && (
                <ProfileButton
                  title="팔로우 요청"
                  onPress={onFollowRequestPress}
                  variant="primary"
                  size="medium"
                  icon={<FollowIcon size={16} color={colors.WHITE} />}
                  style={styles.button}
                />
              )}
            </View>
          ) : !isOwnProfile && onFollowPress && onChatPress ? (
            // 타인 프로필인 경우
            <>
              <ProfileButton
                title={getFollowButtonTitle(user)}
                onPress={onFollowPress}
                variant={getFollowButtonVariant(user)}
                size="medium"
                disabled={getFollowButtonDisabled(user)}
                icon={<FollowIcon size={16} color={getFollowButtonIconColor(user, colors)} />}
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
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: SPACING.XS,
    marginRight: SPACING.SM,
  },
  backButtonIcon: {
    width: 24,
    height: 24,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.XL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
  },
  rightSection: {
    alignItems: 'flex-end',
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
  ownProfileButtons: {
    flexDirection: 'row',
    gap: SPACING.SM,
    flex: 1,
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