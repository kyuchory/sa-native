import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, FlatList, Text, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SPACING, BORDER_RADIUS, COLORS, TEXT_COLORS, TYPOGRAPHY } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import type { ProfileShortItem } from '../types/profile';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = screenWidth / 3;
const imageHeight = imageSize * 1.5; // 인스타그램 스타일로 세로 더 길게

export type ProfileCutGridProps = {
  data: ProfileShortItem[];
  loading?: boolean;
  onItemPress?: (item: ProfileShortItem) => void;
  onEndReached?: () => void;
  canViewContent?: boolean;
};

export default function ProfileCutGrid({ data = [], loading = false, onItemPress, onEndReached, canViewContent = true }: ProfileCutGridProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const renderItem = ({ item, index }: { item: ProfileShortItem; index: number }) => {
    // 아주 작은 마진 계산 (아이템 사이에만 적용)
    const columnIndex = index % 3;
    const itemMargin = 0.5; // 아주 작은 마진 (px)

    const itemStyle = {
      ...styles.cutItem,
      marginLeft: columnIndex === 0 ? 0 : itemMargin, // 왼쪽 아이템은 좌측 마진 없음
      marginRight: columnIndex === 2 ? 0 : itemMargin, // 오른쪽 아이템은 우측 마진 없음
      marginTop: itemMargin,
      marginBottom: itemMargin,
    };

    return (
      <TouchableOpacity style={itemStyle} onPress={() => onItemPress?.(item)} activeOpacity={0.8}>
        {item.thumbnail_url && (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.cutImage}
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
        <Text style={styles.emptyText}>
          {canViewContent ? '등록된 컷이 없습니다.' : '사용자에 의해 비공개되었습니다.'}
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
      onEndReachedThreshold={0}
      ListFooterComponent={renderLoading}
    />
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  gridContainer: {
    paddingHorizontal: 0, // 좌우 마진 제거하여 꽉 채움
    paddingBottom: SPACING.MD,
  },
  cutItem: {
    width: imageSize,
    height: imageHeight,
    margin: 0, // 아이템 간 마진 제거하여 꽉 채움
    position: 'relative',
  },
  cutImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0, // 테두리 둥글기 제거
    backgroundColor: colors.WHITE,
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
