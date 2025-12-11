import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList, Image } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { EmptyHeartIcon, CommentIcon } from './PostCardIcons';
import UserAvatar from './UserAvatar';
import { PopularIcons } from './PopularIcons';
import type { PopularFeedItem } from '../types/popular';

// Fallback image for feeds without preview
const DEFAULT_FEED_IMAGE = require('../../assets/MomTalk_app_icon.png');

const { width: screenWidth } = Dimensions.get('window');
const imageSize = screenWidth / 2.5; // 그리드 스타일이므로 살짝 크게

export type PopularFeedsSectionProps = {
  feeds: PopularFeedItem[];
  onFeedPress?: (feed: PopularFeedItem) => void;
  onUserPress?: (userId: number) => void;
  onSeeMorePress?: () => void;
};

export default function PopularFeedsSection({
  feeds,
  onFeedPress,
  onUserPress,
  onSeeMorePress
}: PopularFeedsSectionProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 100000) / 10}M`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}K`;
    return num.toString();
  };

  const renderItem = ({ item }: { item: PopularFeedItem }) => (
    <TouchableOpacity
      style={styles.feedItem}
      onPress={() => onFeedPress?.(item)}
      activeOpacity={0.8}
    >
      {/* 프로필 영역 (이미지 위) */}
      <TouchableOpacity
        style={styles.profileContainer}
        onPress={() => onUserPress?.(item.user.id)}
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

      {/* 미디어 영역 */}
      <View style={styles.mediaContainer}>
        <Image
          source={item.preview_image ? { uri: item.preview_image } : DEFAULT_FEED_IMAGE}
          style={styles.feedImage}
          resizeMode="cover"
        />
        {/* 미디어 타입 표시 (선택적) */}
        {item.preview_content_type === 'video' && (
          <View style={styles.videoBadge}>
            <Text style={styles.videoBadgeText}>▶</Text>
          </View>
        )}
      </View>

      {/* 통계 영역 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <EmptyHeartIcon size={12} color={colors.GRAY_400} />
          <Text style={styles.statText}>{formatNumber(item.like_count)}</Text>
        </View>
        <View style={styles.statItem}>
          <CommentIcon size={12} color={colors.GRAY_400} />
          <Text style={styles.statText}>{formatNumber(item.comment_count)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!feeds || feeds.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>인기 피드</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>피드가 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <PopularIcons.FeedsIcon size={20} />
          <Text style={styles.title}>인기 피드</Text>
        </View>
        {onSeeMorePress && (
          <TouchableOpacity onPress={onSeeMorePress}>
            <Text style={styles.seeMoreText}>더보기 ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 피드 리스트 */}
      <FlatList
        data={feeds.slice(0, 10)} // 최대 6개 표시
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.feedsContainer}
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

  // 피드 컨테이너
  feedsContainer: {
    paddingVertical: SPACING.SM,
    gap: SPACING.MD,
  },
  feedItem: {
    width: imageSize,
  },

  // 프로필 영역 (이미지 위)
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
  mediaContainer: {
    position: 'relative',
    marginBottom: SPACING.XS,
  },
  feedImage: {
    width: '100%',
    height: imageSize,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.GRAY_100,
  },
  videoBadge: {
    position: 'absolute',
    top: SPACING.XS,
    right: SPACING.XS,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BORDER_RADIUS.SM,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadgeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: 'white',
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },

  // 통계 (인기 컷츠처럼 간단하게)
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: SPACING.XS,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.XS,
  },
  statText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginLeft: SPACING.XS,
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
