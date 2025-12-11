import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, COLORS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import UserAvatar from './UserAvatar';
import { EmptyHeartIcon, CommentIcon } from './PostCardIcons';
import { BookmarkIcon } from './PostIcons';
import type { PopularPostItem } from '../types/popular';

export type PopularPostCardProps = {
  post: PopularPostItem;
  onPress?: (post: PopularPostItem) => void;
  onUserPress?: (userId: number) => void;
};

export default function PopularPostCard({ post, onPress, onUserPress }: PopularPostCardProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 100000) / 10}M`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}K`;
    return num.toString();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(post)}
      activeOpacity={0.95}
    >
      {/* 전체를 가로로 배치 */}
      <View style={styles.cardLayout}>
        {/* 왼쪽: 텍스트 정보들 */}
        <View style={styles.leftArea}>
          {/* 프로필 + 닉네임 + 시간 + 제목 + 내용 + 통계 */}
          {/* 프로필 이미지 + 닉네임 */}
          <TouchableOpacity
            style={styles.header}
            onPress={() => onUserPress?.(post.user.id)}
            activeOpacity={0.8}
          >
            <UserAvatar
              profileImg={post.user.profile_img}
              nickname={post.user.nickname}
              size={29}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.authorName} numberOfLines={1}>
                {post.user.nickname}
              </Text>
              <Text style={styles.timeText}>{formatTimeAgo(post.created_at)}</Text>
            </View>
          </TouchableOpacity>

          {/* 제목 */}
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>

          {/* 내용 - 1줄로 줄임 */}
          <Text style={styles.contentText} numberOfLines={1}>
            {post.content}
          </Text>

          {/* 통계 (좋아요/댓글/북마크) */}
          <View style={styles.statsInline}>
            <View style={styles.statItem}>
              <EmptyHeartIcon size={16} color={colors.GRAY_400} />
              <Text style={styles.statText}>{formatNumber(post.like_count)}</Text>
            </View>
            <View style={[styles.statItem, styles.marginLeft]}>
              <CommentIcon size={16} color={colors.GRAY_400} />
              <Text style={styles.statText}>{formatNumber(post.comment_count)}</Text>
            </View>
            <View style={[styles.statItem, styles.marginLeft]}>
              <BookmarkIcon size={16} filled={false} color={colors.GRAY_400} />
              <Text style={styles.statText}>{formatNumber(post.bookmark_count)}</Text>
            </View>
          </View>
        </View>

        {/* 오른쪽: 카테고리 태그 + 이미지 */}
        <View style={styles.rightArea}>
          {/* 카테고리 태그 */}
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>
              {`${post.sub_category.category.name} > ${post.sub_category.name}`}
            </Text>
          </View>

          {/* 이미지 */}
          <View style={styles.imageArea}>
            {post.preview_image ? (
              <Image
                source={{ uri: post.preview_image }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../../assets/MomTalk_app_icon.png')}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.SM,
    marginVertical: SPACING.XS,
    shadowColor: colors.GRAY_900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // 전체 카드 레이아웃 (가로 배치)
  cardLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // 왼쪽 영역 (텍스트 정보들)
  leftArea: {
    flex: 1,
    marginRight: SPACING.SM,
  },

  // 헤더: 프로필 이미지 + 닉네임 + 날짜
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },

  // 헤더 왼쪽 정보 (닉네임 + 날짜)
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
  },

  // 닉네임
  authorName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: 1,
  },

  // 시간
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500,
  },

  // 제목
  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.XS,
    lineHeight: 20,
  },

  // 통계 인라인
  statsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },

  // 통계 아이템들
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 통계 텍스트
  statText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginLeft: 2,
  },

  // 아이템간 마진
  marginLeft: {
    marginLeft: SPACING.SM,
  },

  // 내용 (통계 아래)
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    lineHeight: 18,
    marginBottom: SPACING.SM,
  },

  // 오른쪽 영역 (카테고리 + 이미지)
  rightArea: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  // 카테고리 태그
  categoryTag: {
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.SM,
    paddingHorizontal: SPACING.XS,
    // paddingVertical: 2,
    marginBottom: SPACING.XS,
    alignSelf: 'flex-end',
  },

  // 카테고리 텍스트
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_700,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 오른쪽 이미지 영역
  imageArea: {
    alignSelf: 'flex-start',
  },

  // 정방형 이미지
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.GRAY_100,
  },

  // 이미지 플레이스홀더
  imagePlaceholder: {
    backgroundColor: colors.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 플레이스홀더 텍스트
  imagePlaceholderText: {
    fontSize: 32, // 이미지 크기의 40%
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },
});
