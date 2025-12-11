import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import UserAvatar from './UserAvatar';
import { PopularIcons } from './PopularIcons';
import type { PopularUserItem } from '../types/popular';

export type PopularUsersSectionProps = {
  users: PopularUserItem[];
  onUserPress?: (user: PopularUserItem) => void;
  onSeeMorePress?: () => void;
};

export default function PopularUsersSection({
  users,
  onUserPress,
  onSeeMorePress
}: PopularUsersSectionProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 100000) / 10}M`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}K`;
    return num.toString();
  };

  const renderItem = ({ item }: { item: PopularUserItem }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => onUserPress?.(item)}
      activeOpacity={0.8}
    >
      <View style={styles.avatarContainer}>
        <UserAvatar
          profileImg={item.profile_img}
          nickname={item.nickname}
          size={60}
        />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.nickname} numberOfLines={1}>
          {item.nickname}
        </Text>
        <Text style={styles.followerText}>
          팔로워 {formatNumber(item.follower_count)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!users || users.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>인기 사용자</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>사용자가 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <PopularIcons.UsersIcon size={20} />
          <Text style={styles.title}>인기 사용자</Text>
        </View>
        {onSeeMorePress && (
          <TouchableOpacity onPress={onSeeMorePress}>
            <Text style={styles.seeMoreText}>더보기 ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 사용자 리스트 */}
      <FlatList
        data={users.slice(0, 8)} // 최대 8개 표시
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.usersContainer}
        pagingEnabled={false}
      />
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    marginVertical: SPACING.MD,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    paddingLeft: SPACING.XS,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_900,
  },
  seeMoreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.PRIMARY,
  },

  // 사용자 컨테이너
  usersContainer: {
    paddingVertical: SPACING.SM,
    gap: SPACING.MD,
  },
  userItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  avatarContainer: {
    marginBottom: SPACING.XS,
  },
  userInfo: {
    alignItems: 'center',
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    textAlign: 'center',
    marginBottom: 2,
  },
  followerText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    textAlign: 'center',
  },

  // 빈 상태
  emptyContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
    textAlign: 'center',
  },
});
