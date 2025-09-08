import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
import { COLORS, TEXT_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import type { UserSearchResult } from '../types/search';

export type PeopleTabProps = {
  data: UserSearchResult[];
  onItemPress?: (item: UserSearchResult) => void;
};

export default function PeopleTab({ data, onItemPress }: PeopleTabProps) {
  const renderItem = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={styles.personItem}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.personAvatar}>
        {item.profile_img ? (
          <Image source={{ uri: item.profile_img }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.nickname[0].toUpperCase()}</Text>
          </View>
        )}
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

const styles = StyleSheet.create({
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
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: COLORS.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  personInfo: {
    flex: 1,
  },
  personNickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginBottom: SPACING.XS,
  },
  followingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.PRIMARY, // 대표 색상 사용
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
    color: TEXT_COLORS.SECONDARY,
  },
});
