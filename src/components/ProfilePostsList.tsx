import React from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import ProfilePostCard from './ProfilePostCard';
import type { ProfilePostItem } from '../types/profile';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';

export type ProfilePostsListProps = {
  data: ProfilePostItem[];
  loading?: boolean;
  onItemPress?: (item: ProfilePostItem) => void;
};

export default function ProfilePostsList({ data = [], loading = false, onItemPress }: ProfilePostsListProps) {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();

  const renderItem = ({ item }: { item: ProfilePostItem }) => (
    <ProfilePostCard
      post={item}
      onPress={() => {
        if (onItemPress) onItemPress(item);
        else navigation.navigate('PostDetail', { postId: item.id });
      }}
    />
  );

  const renderLoading = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  };

  if (!loading && (!data || data.length === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>등록된 게시글이 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      key="list-1"
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      numColumns={1}
      contentContainerStyle={styles.postsContainer}
      ListFooterComponent={renderLoading}
    />
  );
}

const styles = StyleSheet.create({
  postsContainer: {
    paddingBottom: SPACING.MD,
  },
  loadingContainer: {
    padding: SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.XS,
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.DISABLED,
    textAlign: 'center',
  },
});
