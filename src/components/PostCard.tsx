import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

// 게시물 타입 정의
export interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
  imageUrl?: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  categoryId: string;
  subcategoryId?: string;
}

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLikePress?: () => void;
  onCommentPress?: () => void;
}

export default function PostCard({ 
  post, 
  onPress, 
  onLikePress, 
  onCommentPress 
}: PostCardProps) {
  
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
      {/* 상단: 작성자 정보 */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View style={styles.profileImageContainer}>
            {post.author.profileImage ? (
              <Image 
                source={{ uri: post.author.profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Text style={styles.profileImageText}>
                  {post.author.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{post.author.nickname}</Text>
            <Text style={styles.timeText}>{formatTime(post.createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* 본문 영역 */}
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
          <Text style={styles.contentText} numberOfLines={3}>
            {post.content}
          </Text>
        </View>

        {/* 썸네일 이미지 */}
        {post.imageUrl && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: post.imageUrl }} 
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      {/* 하단: 상호작용 버튼들 */}
      <View style={styles.footer}>
        <View style={styles.stats}>
          <TouchableOpacity 
            style={styles.statButton}
            onPress={onLikePress}
          >
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statText}>{formatNumber(post.likeCount)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statButton}
            onPress={onCommentPress}
          >
            <Text style={styles.statIcon}>💬</Text>
            <Text style={styles.statText}>{formatNumber(post.commentCount)}</Text>
          </TouchableOpacity>

          <View style={styles.statButton}>
            <Text style={styles.statIcon}>👁️</Text>
            <Text style={styles.statText}>{formatNumber(post.viewCount)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
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
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileImagePlaceholder: {
    backgroundColor: COLORS.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: COLORS.WHITE,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: TEXT_COLORS.PRIMARY,
    marginBottom: 1,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.DISABLED,
  },
  
  // 본문 내용
  content: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  textContent: {
    flex: 1,
    marginRight: post => post.imageUrl ? SPACING.SM : 0,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: TEXT_COLORS.PRIMARY,
    marginBottom: SPACING.XS,
    lineHeight: 22,
  },
  contentText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
    lineHeight: 20,
  },
  
  // 썸네일 이미지
  imageContainer: {
    width: 80,
    height: 80,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.GRAY_100,
  },
  
  // 하단 통계
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
    paddingTop: SPACING.SM,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.MD,
    paddingVertical: SPACING.XS,
  },
  statIcon: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    marginRight: SPACING.XS,
  },
  statText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.DISABLED,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
