import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, FlatList, Text, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SPACING, BORDER_RADIUS, COLORS, TEXT_COLORS, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { VideoIcon } from './PostIcons';
import type { ProfileFeedItem } from '../types/profile';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - SPACING.MD * 2 - SPACING.XS * 2) / 3;

export type ProfileFeedGridProps = {
  data: ProfileFeedItem[];
  loading?: boolean;
  onItemPress?: (item: ProfileFeedItem) => void;
  onEndReached?: () => void;
  canViewContent?: boolean;
};

export default function ProfileFeedGrid({ data = [], loading = false, onItemPress, onEndReached, canViewContent = true }: ProfileFeedGridProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const renderItem = ({ item }: { item: ProfileFeedItem }) => (
    <TouchableOpacity style={styles.feedItem} onPress={() => onItemPress?.(item)} activeOpacity={0.8}>
      {item.preview_image && (
        <Image
          source={{ uri: item.preview_image }}
          style={styles.feedImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      )}
      {item.preview_image && item.preview_content_type === 'video' && (
        <View style={styles.videoIndicator}>
          <VideoIcon size={12} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderLoading = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.PRIMARY} />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  };

  if (!loading && (!data || data.length === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {canViewContent ? '등록된 피드가 없습니다.' : '사용자에 의해 비공개되었습니다.'}
        </Text>
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

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  gridContainer: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
  },
  feedItem: {
    width: imageSize,
    height: imageSize,
    margin: SPACING.XS / 2,
    position: 'relative',
  },
  feedImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: colors.WHITE,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BORDER_RADIUS.SM,
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.XS,
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_500, // TEXT_COLORS.DISABLED
    textAlign: 'center',
  },
});
