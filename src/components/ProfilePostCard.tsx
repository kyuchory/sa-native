import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { EmptyHeartIcon, FilledHeartIcon, CommentIcon } from './PostCardIcons';
import type { ProfilePostItem } from '../types/profile';

interface ProfilePostCardProps {
  post: ProfilePostItem;
  onPress?: () => void;
  onLikePress?: () => void;
  onCommentPress?: () => void;
}

export default function ProfilePostCard({
  post,
  onPress,
  onLikePress,
  onCommentPress
}: ProfilePostCardProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  
  // 로컬 좋아요 상태 관리
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count);

  // post prop이 변경될 때 상태 초기화
  useEffect(() => {
    setIsLiked(post.is_liked || false);
    setLikeCount(post.like_count);
  }, [post.is_liked, post.like_count]);

  // 좋아요 토글 핸들러
  const handleLikeToggle = () => {
    const newLikeState = !isLiked;
    setIsLiked(newLikeState);
    
    // 좋아요 수 업데이트
    if (newLikeState) {
      setLikeCount(prev => prev + 1);
    } else {
      setLikeCount(prev => Math.max(0, prev - 1));
    }
    
    // 부모 컴포넌트에 알림
    onLikePress?.();
  };
  
  // 시간 포맷팅 함수
  const formatTime = (dateString: string) => {
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

  // 숫자 포맷팅 함수 (1000 -> 1K)
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 100000) / 10}M`;
    if (num >= 1000) return `${Math.floor(num / 100) / 10}K`;
    return num.toString();
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* 상단: 카테고리 정보 및 시간 */}
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryText}>
            {post.sub_category.category.name} • {post.sub_category.name}
          </Text>
          <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
        </View>
      </View>

      {/* 본문 영역 */}
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
        </View>

        {/* 이미지가 있는 경우 */}
        {post.preview_image && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: post.preview_image }} 
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      {/* 하단: 상호작용 버튼들 */}
      <View style={styles.footer}>
        <View style={styles.interactionButtons}>
          <TouchableOpacity 
            style={styles.interactionButton}
            onPress={handleLikeToggle}
            activeOpacity={0.7}
          >
            {isLiked ? (
              <FilledHeartIcon size={18} color={colors.ERROR} />
            ) : (
              <EmptyHeartIcon size={18} color={colors.GRAY_400} />
            )}
            <Text style={styles.interactionText}>{formatNumber(likeCount)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.interactionButton}
            onPress={onCommentPress}
            activeOpacity={0.7}
          >
            <CommentIcon size={18} color={colors.GRAY_400} />
            <Text style={styles.interactionText}>{formatNumber(post.comment_count)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },

  // 헤더 (카테고리 정보)
  header: {
    marginBottom: SPACING.SM,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
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
    marginRight: SPACING.SM,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    marginBottom: SPACING.XS,
    lineHeight: 22,
  },

  // 썸네일 이미지
  imageContainer: {
    width: 80,
    height: 80,
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
    marginHorizontal: SPACING.XS,
    paddingVertical: SPACING.XS,
  },
  interactionText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginLeft: SPACING.XS,
  },
});
