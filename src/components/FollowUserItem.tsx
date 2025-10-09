import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import UserAvatar from './UserAvatar';
import ProfileButton from './ProfileButton';
import { FollowIcon } from './ProfileIcons';
import { formatMessageDate } from '../utils/timeUtils';
import type { FollowUser } from '../types/follow';

interface FollowUserItemProps {
  user: FollowUser;
  onUserPress?: (user: FollowUser) => void;
  onFollowPress?: (user: FollowUser) => void;
  showFollowingStatus?: boolean; // 팔로잉 상태 표시 여부 (팔로잉 탭에서는 false)
}

export default function FollowUserItem({
  user,
  onUserPress,
  onFollowPress,
  showFollowingStatus = true
}: FollowUserItemProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const formattedDate = formatMessageDate(user.created_at);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onUserPress?.(user)}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        <UserAvatar
          profileImg={user.profile_img}
          nickname={user.nickname}
          size={50}
        />
        <View style={styles.userDetails}>
          <Text style={styles.nickname}>{user.nickname}</Text>
          {user.is_following && showFollowingStatus && (
            <Text style={styles.followingText}>팔로잉</Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {formattedDate && (
          <Text style={styles.dateText}>{formattedDate}</Text>
        )}
        {!user.is_following && onFollowPress && (
          <ProfileButton
            title="팔로우"
            onPress={() => onFollowPress(user)}
            variant="primary"
            size="small"
            icon={<FollowIcon size={14} color={colors.WHITE} />}
            style={styles.followButton}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: SPACING.MD,
    flex: 1,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginBottom: 2,
  },
  followingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    marginBottom: SPACING.XS,
  },
  followButton: {
    minWidth: 80,
  },
});
