import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, FlatList, Text } from 'react-native';
import { Image } from 'expo-image';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - SPACING.MD * 2 - SPACING.XS * 2) / 3;

export type FeedItem = {
  id: number;
  preview_image: string;
};

export type FeedTabProps = {
  data: FeedItem[];
  onItemPress?: (item: FeedItem) => void;
};

export default function FeedTab({ data, onItemPress }: FeedTabProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const renderItem = ({ item }: { item: FeedItem }) => (
    <TouchableOpacity
      style={styles.feedItem}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.preview_image }} style={styles.feedImage} contentFit="cover" />
    </TouchableOpacity>
  );

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>피드가 없습니다.</Text>
        <Text style={styles.emptySubText}> 새로운 피드를 작성해보세요.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      numColumns={3}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
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
    backgroundColor: colors.GRAY_100, // COLORS.GRAY_100
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
  emptySubText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500, // TEXT_COLORS.DISABLED
    textAlign: 'center',
  },
});
