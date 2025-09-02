import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { Comment } from '../types/post';
import { LikeIcon } from './PostIcons';

interface CommentListProps {
  comments: Comment[];
  onCommentLike?: (commentId: number) => void;
  onReplyPress?: (comment: Comment) => void;
  onEditComment?: (commentId: number) => void;
  onDeleteComment?: (commentId: number) => void;
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  onCommentLike?: (commentId: number) => void;
  onReplyPress?: (comment: Comment) => void;
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
const CommentItem = ({ comment, isReply = false, onCommentLike, onReplyPress, onEditComment, onDeleteComment }: CommentItemProps) => {
  // 프로필 이미지 렌더링
  const renderProfileImage = () => {
    // 삭제된 댓글의 경우 기본 프로필 이미지 표시
    if (comment.is_deleted || !comment.user.profile_img) {
      return (
        <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
          <Text style={styles.profileImageText}>
            {comment.is_deleted ? '?' : comment.user.nickname.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }
    return (
      <Image 
        source={{ uri: comment.user.profile_img }} 
        style={styles.profileImage}
      />
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
            <Text style={styles.username}>{comment.user.nickname}</Text>
            <Text style={styles.timeText}>{formatTime(comment.created_at)}</Text>
          </View>
          
          {renderCommentContent()}
          
          <View style={styles.commentActions}>
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={() => onCommentLike?.(comment.id)}
              activeOpacity={0.7}
            >
              <LikeIcon 
                size={14} 
                filled={comment.is_liked || false}
                color={comment.is_liked ? COLORS.ERROR : COLORS.GRAY_500}
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
            
            <TouchableOpacity 
              style={styles.replyButton}
              onPress={() => onReplyPress?.(comment)}
              activeOpacity={0.7}
            >
              <Text style={styles.replyText}>답글</Text>
            </TouchableOpacity>
            
            {comment.is_author && (
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
export default function CommentList({ comments, onCommentLike, onReplyPress, onEditComment, onDeleteComment }: CommentListProps) {
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
        <Text style={styles.title}>댓글 {comments.length}개</Text>
      </View>
      
      {comments.map((comment) => (
        <View key={comment.id}>
          <CommentItem
            comment={comment}
            onCommentLike={onCommentLike}
            onReplyPress={onReplyPress}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
          />
          
          {/* 대댓글 렌더링 */}
          {comment.replies && comment.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply={true}
                  onCommentLike={onCommentLike}
                  onReplyPress={onReplyPress}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
  },
  
  // 헤더
  header: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: TEXT_COLORS.PRIMARY,
  },
  
  // 댓글 컨테이너
  commentContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
  },
  replyContainer: {
    paddingLeft: SPACING.MD + 40 + SPACING.SM, // 프로필 이미지 크기 + 간격만큼 들여쓰기
    backgroundColor: COLORS.WHITE,
  },
  repliesContainer: {
    backgroundColor: COLORS.WHITE,
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
    backgroundColor: COLORS.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
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
    color: TEXT_COLORS.PRIMARY,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.SECONDARY,
  },
  commentText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.PRIMARY,
    lineHeight: 20,
    marginBottom: SPACING.SM,
  },
  mentionText: {
    color: COLORS.PRIMARY,
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
    color: TEXT_COLORS.SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  likedCount: {
    color: COLORS.ERROR,
  },
  replyButton: {
    paddingVertical: SPACING.XS,
  },
  replyText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  
  // 빈 상태
  emptyContainer: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.XL,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.SECONDARY,
    marginBottom: SPACING.XS,
  },
  emptySubText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.DISABLED,
  },
});
