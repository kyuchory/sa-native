import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { EmptyHeartIcon, CommentIcon } from './PostCardIcons';
import { useThemeStore } from '../stores/themeStore';
import type { PostSearchResult } from '../types/search';
import UserAvatar from './UserAvatar';

export type PostItem = PostSearchResult;

export type PostTabProps = {
  data: PostItem[];
  onItemPress?: (item: PostItem) => void;
};

// 시간 포맷팅 함수
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  if (diffInHours < 24) return `${diffInHours}시간 전`;
  if (diffInDays < 7) return `${diffInDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric'
  });
};

// 숫자 포맷팅 함수
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${Math.floor(num / 100000) / 10}M`;
  if (num >= 1000) return `${Math.floor(num / 100) / 10}K`;
  return num.toString();
};

export default function PostTab({ data, onItemPress }: PostTabProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const renderItem = ({ item }: { item: PostItem }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.95}
    >
      {/* 상단: 작성자 정보 */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View style={styles.profileImageContainer}>
            <UserAvatar 
              profileImg={item.user.profile_img} 
              nickname={item.user.nickname}
              size={40}
            />
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{item.user.nickname}</Text>
            <Text style={styles.timeText}>{formatTimeAgo(item.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* 본문 영역 */}
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.contentText} numberOfLines={3}>
            {item.content}
          </Text>
        </View>

        {/* 이미지가 있는 경우 */}
        {item.preview_image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.preview_image }} style={styles.postImage} />
          </View>
        )}
      </View>

      {/* 하단: 상호작용 버튼들 */}
      <View style={styles.footer}>
        <View style={styles.interactionButtons}>
          <View style={styles.interactionButton}>
            <EmptyHeartIcon size={18} color={colors.GRAY_400} />
            <Text style={styles.interactionText}>{formatNumber(item.like_count)}</Text>
          </View>
          <View style={styles.interactionButton}>
            <CommentIcon size={18} color={colors.GRAY_400} />
            <Text style={styles.interactionText}>{formatNumber(item.comment_count)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>게시글이 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  listContent: {
    paddingVertical: SPACING.SM,
  },
  postCard: {
    backgroundColor: colors.WHITE,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },

  // 헤더 (작성자 정보)
  header: {
    marginBottom: SPACING.SM,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: SPACING.SM,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    marginBottom: 1,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500, // TEXT_COLORS.DISABLED
  },

  // 본문 내용
  content: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    marginBottom: SPACING.XS,
    lineHeight: 22,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
    lineHeight: 20,
  },

  // 썸네일 이미지
  imageContainer: {
    width: 80,
    height: 80,
    marginLeft: SPACING.SM,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.GRAY_100,
  },

  // 하단 통계
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    paddingTop: SPACING.SM,
  },
  interactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.XS,
  },
  interactionText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginLeft: SPACING.XS,
  },

  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
    marginHorizontal: SPACING.MD,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
    textAlign: 'center',
  },
});
