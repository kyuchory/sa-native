import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import UserAvatar from './UserAvatar';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { CommentItem as FeedComment } from '../types/feed';
import { Comment } from '../types/post';
import { LikeIcon } from './PostIcons';
import { useThemeStore } from '../stores/themeStore';

// 스타일 생성 함수 (컴포넌트 외부에서 정의하여 재사용)
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
  },

  // 헤더
  header: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
  },

  // 댓글 컨테이너
  commentContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_100,
  },
  replyContainer: {
    paddingLeft: SPACING.MD + 40 + SPACING.SM, // 프로필 이미지 크기 + 간격만큼 들여쓰기
    backgroundColor: colors.WHITE,
  },
  repliesContainer: {
    backgroundColor: colors.WHITE,
  },

  // 댓글 헤더
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.SM,
  },
  profileImagePlaceholder: {
    backgroundColor: colors.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },

  // 댓글 내용
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
    gap: SPACING.SM,
  },
  username: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
  },
  commentText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_900,
    lineHeight: 20,
    marginBottom: SPACING.SM,
  },
  mentionText: {
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },

  // 댓글 액션
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    paddingVertical: SPACING.XS,
  },
  likeCount: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  likedCount: {
    color: colors.ERROR,
  },
  replyButton: {
    paddingVertical: SPACING.XS,
  },
  replyText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 빈 상태
  emptyContainer: {
    backgroundColor: colors.WHITE,
    paddingVertical: SPACING.XL,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
    marginBottom: SPACING.XS,
  },
  emptySubText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_400,
  },

  // 더 불러오기
  loadMoreContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderWidth: 1,
    borderColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
  },
  loadMoreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
});

interface CommentListProps {
  comments: (FeedComment | Comment)[];
  totalCount?: number;
  hasNextPage?: boolean;
  onCommentLike?: (commentId: number) => void;
  onReplyPress?: (comment: FeedComment | Comment) => void;
  onEditComment?: (commentId: number) => void;
  onDeleteComment?: (commentId: number) => void;
  onLoadMore?: () => void;
}

interface CommentItemProps {
  comment: FeedComment;
  isReply?: boolean;
  onCommentLike?: (commentId: number) => void;
  onReplyPress?: (comment: FeedComment) => void;
  onEditComment?: (commentId: number) => void;
  onDeleteComment?: (commentId: number) => void;
}

// 시간 포맷팅 함수
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}일 전`;

  return date.toLocaleDateString('ko-KR');
};

// 개별 댓글 컴포넌트
const CommentItem = ({
  comment,
  isReply = false,
  onCommentLike,
  onReplyPress,
  onEditComment,
  onDeleteComment
}: CommentItemProps) => {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 사용자 프로필로 이동하는 함수
  const handleProfilePress = () => {
    if (!comment.is_deleted) {
      // @ts-ignore
      navigation.navigate('UserProfile' as never, { userId: String(comment.user.id) });
    }
  };

  // 프로필 이미지 렌더링
  const renderProfileImage = () => {
    // 삭제된 댓글의 경우 기본 프로필 이미지 표시
    if (comment.is_deleted || !comment.user.profile_img) {
      return (
        <TouchableOpacity
          onPress={handleProfilePress}
          activeOpacity={0.7}
          disabled={comment.is_deleted}
        >
          <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
            <Text style={styles.profileImageText}>
              {comment.is_deleted ? '?' : comment.user.nickname.charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        onPress={handleProfilePress}
        activeOpacity={0.7}
        style={{ marginRight: SPACING.SM }}
      >
        <UserAvatar
          profileImg={comment.user.profile_img}
          nickname={comment.user.nickname}
          size={32}
        />
      </TouchableOpacity>
    );
  };

  // 회원 이름 렌더링 (터치 가능)
  const renderUsername = () => {
    const username = comment.user.nickname;

    return (
      <TouchableOpacity
        onPress={handleProfilePress}
        activeOpacity={0.7}
        disabled={comment.is_deleted}
      >
        <Text style={styles.username}>
          {username}
        </Text>
      </TouchableOpacity>
    );
  };

  // 멘션 처리된 댓글 내용
  const renderCommentContent = () => {
    if (comment.mention_user) {
      const mentionText = `@${comment.mention_user.nickname}`;
      const content = comment.content;

      // 멘션된 사용자가 있으면 항상 @닉네임을 앞에 표시
      return (
        <Text style={styles.commentText}>
          <Text style={styles.mentionText}>{mentionText} </Text>
          <Text>{content}</Text>
        </Text>
      );
    }

    return <Text style={styles.commentText}>{comment.content}</Text>;
  };

  return (
    <View style={[styles.commentContainer, isReply && styles.replyContainer]}>
      <View style={styles.commentHeader}>
        {renderProfileImage()}
        <View style={styles.commentContent}>
          <View style={styles.commentMeta}>
            {renderUsername()}
            <Text style={styles.timeText}>
              {formatTime(comment.created_at)}
              {comment.created_at !== comment.updated_at && ' (수정됨)'}
            </Text>
          </View>

          {renderCommentContent()}

          <View style={styles.commentActions}>
            {!comment.is_deleted && (
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => onCommentLike?.(comment.id)}
                activeOpacity={0.7}
              >
                <LikeIcon
                  size={14}
                  filled={comment.is_liked || false}
                  color={comment.is_liked ? colors.ERROR : colors.GRAY_500}
                />
                {comment.like_count > 0 && (
                  <Text style={[
                    styles.likeCount,
                    comment.is_liked && styles.likedCount
                  ]}>
                    {comment.like_count}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {!comment.is_deleted && (
              <TouchableOpacity
                style={styles.replyButton}
                onPress={() => onReplyPress?.(comment)}
                activeOpacity={0.7}
              >
                <Text style={styles.replyText}>답글</Text>
              </TouchableOpacity>
            )}

            {comment.is_author && !comment.is_deleted && (
              <>
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => onEditComment?.(comment.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.replyText}>수정</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => onDeleteComment?.(comment.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.replyText}>삭제</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

// 댓글 리스트 메인 컴포넌트
export default function CommentList({
  comments,
  totalCount,
  hasNextPage = false,
  onCommentLike,
  onReplyPress,
  onEditComment,
  onDeleteComment,
  onLoadMore
}: CommentListProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  if (comments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>아직 댓글이 없습니다.</Text>
        <Text style={styles.emptySubText}>첫 번째 댓글을 남겨보세요!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>댓글 {totalCount || comments.length}개</Text>
      </View>

      {comments.map((comment) => (
        <View key={comment.id}>
          <CommentItem
            comment={comment as FeedComment}
            onCommentLike={onCommentLike}
            onReplyPress={(replyComment) => onReplyPress?.(replyComment as any)}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
          />

          {/* 대댓글 렌더링 */}
          {comment.replies && comment.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply as FeedComment}
                  isReply={true}
                  onCommentLike={onCommentLike}
                  onReplyPress={(replyComment) => onReplyPress?.(replyComment as any)}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                />
              ))}
            </View>
          )}
        </View>
      ))}

      {/* 더 불러오기 버튼 */}
      {hasNextPage && (
        <View style={styles.loadMoreContainer}>
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={onLoadMore}
            activeOpacity={0.7}
          >
            <Text style={styles.loadMoreText}>댓글 불러오기</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
