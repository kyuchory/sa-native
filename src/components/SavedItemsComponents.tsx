import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, FlatList, Text, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SPACING, BORDER_RADIUS, COLORS, TEXT_COLORS, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AuthStackParamList } from '../types/navigation';
import { VideoIcon } from './PostIcons';
import { BookmarkFeedListItem } from '../types/feed';
import { BookmarkPostListItem } from '../types/post';
import { BookmarkShortListItem } from '../types/cut';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = screenWidth / 3;
const cutsImageHeight = imageSize * 1.5; // 컷츠는 세로로 긴 비율

// Bookmarked Feeds Grid Component
export type SavedItemsFeedGridProps = {
  data: BookmarkFeedListItem[];
  loading?: boolean;
  onEndReached?: () => void;
  hasNext?: boolean;
};

export function SavedItemsFeedGrid({ data = [], loading = false, onEndReached, hasNext }: SavedItemsFeedGridProps) {
  const { colors } = useThemeStore();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const styles = createStyles(colors);

  const renderItem = ({ item, index }: { item: BookmarkFeedListItem; index: number }) => {
    const columnIndex = index % 3;
    const itemMargin = 0.5;

    const itemStyle = {
      ...styles.feedItem,
      marginLeft: columnIndex === 0 ? 0 : itemMargin,
      marginRight: columnIndex === 2 ? 0 : itemMargin,
      marginTop: itemMargin,
      marginBottom: itemMargin,
    };

    return (
      <TouchableOpacity
        style={itemStyle}
        onPress={() => (navigation as any).navigate('FeedDetail', { feedId: item.id })}
        activeOpacity={0.8}
      >
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
  };

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
        <Text style={styles.emptyText}>저장된 피드가 없습니다.</Text>
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
      onEndReached={hasNext ? onEndReached : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderLoading}
    />
  );
}

// Bookmarked Posts List Component
export type SavedItemsPostsListProps = {
  data: BookmarkPostListItem[];
  loading?: boolean;
  onEndReached?: () => void;
  hasNext?: boolean;
};

export function SavedItemsPostsList({ data = [], loading = false, onEndReached, hasNext }: SavedItemsPostsListProps) {
  const { colors } = useThemeStore();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const styles = createStyles(colors);

  const renderItem = ({ item }: { item: BookmarkPostListItem }) => {
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => (navigation as any).navigate('PostDetail', { postId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.postContent}>
          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.preview_image && (
            <Image
              source={{ uri: item.preview_image }}
              style={styles.postImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          )}
          <Text style={styles.postMeta}>
            {item.comment_count}개의 댓글 · 북마크 {item.bookmark_count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.emptyText}>저장된 게시물이 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      onEndReached={hasNext ? onEndReached : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderLoading}
    />
  );
}

// Bookmarked Shorts Grid Component
export type SavedItemsShortsGridProps = {
  data: BookmarkShortListItem[];
  loading?: boolean;
  onEndReached?: () => void;
  hasNext?: boolean;
};

export function SavedItemsShortsGrid({ data = [], loading = false, onEndReached, hasNext }: SavedItemsShortsGridProps) {
  const { colors } = useThemeStore();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const styles = createStyles(colors);

  const renderItem = ({ item, index }: { item: BookmarkShortListItem; index: number }) => {
    const columnIndex = index % 3;
    const itemMargin = 0.5;

    const itemStyle = {
      ...styles.shortsItem,
      marginLeft: columnIndex === 0 ? 0 : itemMargin,
      marginRight: columnIndex === 2 ? 0 : itemMargin,
      marginTop: itemMargin,
      marginBottom: itemMargin,
    };

    return (
      <TouchableOpacity
        style={itemStyle}
        onPress={() => (navigation as any).navigate('CutDetail', { shortId: item.short_id })}
        activeOpacity={0.8}
      >
        {item.thumbnail_url && (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.feedImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
        )}
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.emptyText}>저장된 쇼츠가 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      key="grid-3"
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.short_id.toString()}
      numColumns={3}
      contentContainerStyle={styles.gridContainer}
      onEndReached={hasNext ? onEndReached : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderLoading}
    />
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  gridContainer: {
    paddingHorizontal: 0,
    paddingBottom: SPACING.MD,
  },
  listContainer: {
    paddingBottom: SPACING.MD,
  },
  feedItem: {
    width: imageSize,
    height: imageSize,
    margin: 0,
    position: 'relative',
  },
  shortsItem: {
    width: imageSize,
    height: cutsImageHeight,
    margin: 0,
    position: 'relative',
  },
  feedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    backgroundColor: colors.WHITE,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postItem: {
    backgroundColor: colors.WHITE,
    marginBottom: 1,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
  },
  postContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginRight: SPACING.SM,
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.SM,
  },
  postMeta: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    borderRadius: 4,
  },
  loadingContainer: {
    padding: SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.XS,
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_500,
    textAlign: 'center',
  },
});
