import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList, Image } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { EmptyHeartIcon, CommentIcon, ViewIcon } from './PostCardIcons';
import UserAvatar from './UserAvatar';
import { PopularIcons } from './PopularIcons';
import type { PopularShortItem } from '../types/popular';

const { width: screenWidth } = Dimensions.get('window');
// 프로필 화면 컷츠 그리드 사이즈 참고
const imageSize = screenWidth / 3;
const imageHeight = imageSize * 1.5; // 인스타그램 스타일로 세로 더 길게

export type PopularCutsSectionProps = {
  cuts: PopularShortItem[];
  onCutPress?: (cut: PopularShortItem) => void;
  onUserPress?: (user: { id: number; nickname: string }) => void;
  onSeeMorePress?: () => void;
};

export default function PopularCutsSection({
  cuts,
  onCutPress,
  onUserPress,
  onSeeMorePress
}: PopularCutsSectionProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 100000) / 10}M`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}K`;
    return num.toString();
  };

  const renderItem = ({ item }: { item: PopularShortItem }) => (
    <TouchableOpacity
      style={styles.cutItem}
      onPress={() => onCutPress?.(item)}
      activeOpacity={0.8}
    >
      {/* 프로필 영역 (이미지 위) */}
      <TouchableOpacity
        style={styles.profileContainer}
        onPress={() => onUserPress?.({ id: item.user.id, nickname: item.user.nickname })}
        activeOpacity={0.8}
      >
        <UserAvatar
          profileImg={item.user.profile_img}
          nickname={item.user.nickname}
          size={24}
        />
        <Text style={styles.nickname} numberOfLines={1}>
          {item.user.nickname}
        </Text>
      </TouchableOpacity>

      <Image
        source={{ uri: item.thumbnail_url || item.content_url }}
        style={styles.cutImage}
        resizeMode="cover"
      />

      {/* 통계 영역 (좋아요/댓글/조회수) */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <EmptyHeartIcon size={12} color={colors.GRAY_400} />
          <Text style={styles.statText}>{formatNumber(item.like_count)}</Text>
        </View>
        <View style={[styles.statItem, styles.marginLeft]}>
          <CommentIcon size={12} color={colors.GRAY_400} />
          <Text style={styles.statText}>{formatNumber(item.comment_count)}</Text>
        </View>
        <View style={[styles.statItem, styles.marginLeft]}>
          <ViewIcon size={12} color={colors.GRAY_400} />
          <Text style={styles.statText}>{formatNumber(item.view_count)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!cuts || cuts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>인기 컷츠</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>컷츠가 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <PopularIcons.CutsIcon size={20} />
          <Text style={styles.title}>인기 컷츠</Text>
        </View>
        {onSeeMorePress && (
          <TouchableOpacity onPress={onSeeMorePress}>
            <Text style={styles.seeMoreText}>더보기 ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 컷츠 리스트 */}
      <FlatList
        data={cuts.slice(0, 5)} // 최대 5개만 표시
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cutsContainer}
        pagingEnabled={false} // 자연스러운 스크롤
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

  // 컷츠 컨테이너
  cutsContainer: {
    paddingVertical: SPACING.SM,
    gap: SPACING.SM,
  },
  cutItem: {
    width: imageSize,
    marginRight: SPACING.SM,
  },
  cutImage: {
    width: '100%',
    height: imageHeight,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: colors.GRAY_100,
  },

  // 프로필 영역 (UserAvatar + 닉네임)
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
    gap: SPACING.XS,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
    flex: 1,
  },

  // 통계 영역 (좋아요/댓글/조회수)
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: SPACING.XS,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
  },
  statText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginLeft: 2,
  },
  marginLeft: {
    marginLeft: SPACING.SM,
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
