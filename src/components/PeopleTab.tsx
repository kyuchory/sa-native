import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import type { UserSearchResult } from '../types/search';
import UserAvatar from './UserAvatar';

export type PeopleTabProps = {
  data: UserSearchResult[];
  onItemPress?: (item: UserSearchResult) => void;
};

export default function PeopleTab({ data, onItemPress }: PeopleTabProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const renderItem = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={styles.personItem}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.personAvatar}>
        <UserAvatar 
          profileImg={item.profile_img} 
          nickname={item.nickname}
          size={50}
        />
      </View>
      <View style={styles.personInfo}>
        <Text style={styles.personNickname}>{item.nickname}</Text>
        {item.is_following && (
          <Text style={styles.followingText}>팔로잉</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      showsVerticalScrollIndicator={false}
    />
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    marginHorizontal: SPACING.MD,
  },
  personAvatar: {
    width: 48,
    height: 48,
    marginRight: SPACING.MD,
  },
  personInfo: {
    flex: 1,
  },
  personNickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginBottom: SPACING.XS,
  },
  followingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600, // TEXT_COLORS.SECONDARY
  },
});
