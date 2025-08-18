import { PostService } from '../services/postService';
import { Comment } from '../types/post';

/**
 * 댓글 관련 유틸리티 함수들
 * 실제 API 연동 시 사용할 수 있는 헬퍼 함수들
 */

// 댓글 목록을 계층 구조로 정렬
export const organizeCommentsInHierarchy = (comments: Comment[]): Comment[] => {
  const commentMap = new Map<number, Comment>();
  const rootComments: Comment[] = [];

  // 모든 댓글을 Map에 저장
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // 계층 구조 생성
  comments.forEach(comment => {
    if (comment.parent_comment_id === null) {
      // 최상위 댓글
      const rootComment = commentMap.get(comment.id);
      if (rootComment) {
        rootComments.push(rootComment);
      }
    } else {
      // 답글
      const parentComment = commentMap.get(comment.parent_comment_id);
      const replyComment = commentMap.get(comment.id);
      if (parentComment && replyComment) {
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(replyComment);
      }
    }
  });

  return rootComments;
};

// 댓글 총 개수 계산 (답글 포함)
export const getTotalCommentCount = (comments: Comment[]): number => {
  let count = 0;
  
  const countReplies = (comment: Comment): number => {
    let replyCount = 1; // 자기 자신
    if (comment.replies) {
      comment.replies.forEach(reply => {
        replyCount += countReplies(reply);
      });
    }
    return replyCount;
  };

  comments.forEach(comment => {
    count += countReplies(comment);
  });

  return count;
};

// 멘션 텍스트 파싱
export const parseMentions = (content: string): { text: string; mentions: string[] } => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return {
    text: content,
    mentions
  };
};

// 댓글 작성 시간 기반 정렬
export const sortCommentsByTime = (comments: Comment[], ascending: boolean = false): Comment[] => {
  return [...comments].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return ascending ? timeA - timeB : timeB - timeA;
  });
};

// 댓글 검색
export const searchComments = (comments: Comment[], searchTerm: string): Comment[] => {
  const term = searchTerm.toLowerCase();
  
  const searchInComment = (comment: Comment): boolean => {
    // 내용에서 검색
    if (comment.content.toLowerCase().includes(term)) {
      return true;
    }
    // 작성자 닉네임에서 검색
    if (comment.user.nickname.toLowerCase().includes(term)) {
      return true;
    }
    // 답글에서 검색
    if (comment.replies) {
      return comment.replies.some(reply => searchInComment(reply));
    }
    return false;
  };

  return comments.filter(comment => searchInComment(comment));
};

// 실제 API 호출 래퍼 함수들 (현재는 Mock 데이터 사용)
export class CommentAPI {
  // 댓글 목록 로드
  static async loadComments(postId: number): Promise<Comment[]> {
    try {
      const comments = await PostService.getComments(postId);
      return organizeCommentsInHierarchy(comments);
    } catch (error) {
      console.error('댓글 로드 실패:', error);
      throw new Error('댓글을 불러오는데 실패했습니다.');
    }
  }

  // 댓글/답글 작성
  static async writeComment(
    postId: number, 
    content: string, 
    parentCommentId?: number,
    mentionUserId?: number
  ): Promise<Comment> {
    try {
      if (parentCommentId && mentionUserId) {
        // 답글 작성 (멘션 포함)
        return await PostService.createReply(postId, parentCommentId, content, mentionUserId);
      } else if (parentCommentId) {
        // 답글 작성
        return await PostService.createComment(postId, content, parentCommentId);
      } else {
        // 일반 댓글 작성
        return await PostService.createComment(postId, content);
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      throw new Error('댓글 작성에 실패했습니다.');
    }
  }

  // 댓글 좋아요 토글
  static async toggleLike(postId: number, commentId: number): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      return await PostService.toggleCommentLike(postId, commentId);
    } catch (error) {
      console.error('댓글 좋아요 실패:', error);
      throw new Error('좋아요 처리에 실패했습니다.');
    }
  }

  // 댓글 수정
  static async editComment(postId: number, commentId: number, content: string): Promise<Comment> {
    try {
      return await PostService.updateComment(postId, commentId, content);
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      throw new Error('댓글 수정에 실패했습니다.');
    }
  }

  // 댓글 삭제
  static async removeComment(postId: number, commentId: number): Promise<void> {
    try {
      await PostService.deleteComment(postId, commentId);
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      throw new Error('댓글 삭제에 실패했습니다.');
    }
  }
}
