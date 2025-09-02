import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, FlatList, Text, ActivityIndicator } from 'react-native';
import { SPACING, BORDER_RADIUS, COLORS, TEXT_COLORS, TYPOGRAPHY } from '../constants/theme';
import type { ProfileFeedItem } from '../types/profile';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - SPACING.MD * 2 - SPACING.XS * 2) / 3;

export type ProfileFeedGridProps = {
  data: ProfileFeedItem[];
  loading?: boolean;
  onItemPress?: (item: ProfileFeedItem) => void;
  onEndReached?: () => void;
};

export default function ProfileFeedGrid({ data = [], loading = false, onItemPress, onEndReached }: ProfileFeedGridProps) {
  const renderItem = ({ item }: { item: ProfileFeedItem }) => (
    <TouchableOpacity style={styles.feedItem} onPress={() => onItemPress?.(item)} activeOpacity={0.8}>
      <Image source={{ uri: item.preview_image }} style={styles.feedImage} />
    </TouchableOpacity>
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
        <Text style={styles.emptyText}>등록된 피드가 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      key="grid-3"
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      numColumns={3}
      contentContainerStyle={styles.gridContainer}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderLoading}
    />
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  },
  feedItem: {
    width: imageSize,
    height: imageSize,
    margin: SPACING.XS / 2,
  },
  feedImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: COLORS.GRAY_100,
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
