import { apiClient } from './apiClient';
import { API_BASE_URL } from '../config/api';
import type { 
  CreatePostRequest, 
  CreatePostResponse, 
  CategoriesResponse, 
  Category,
  PostDetailResponse,
  PostDetail,
  PostListResponse,
  PostListItem,
  UpdatePostRequest,
  ImageUploadResponse,
  CommentsResponse,
  Comment
} from '../types/post';
import type { ApiResponse } from '../types/api';
import { MOCK_POST_DETAIL, MOCK_ITEM_POST_DETAIL } from '../data/postDetailMockData';
import { MOCK_COMMENTS, MOCK_ITEM_COMMENTS } from '../data/commentMockData';

export class PostService {
  // ==============================================
  // 🆕 새로운 API 명세에 맞는 메서드들
  // ==============================================

  // 게시글 목록 조회 (페이지네이션)
  static async getPosts(
    categoryId?: number, 
    subCategoryId?: number, 
    page: number = 1
  ): Promise<PostListResponse> {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId.toString());
      if (subCategoryId) params.append('subCategoryId', subCategoryId.toString());
      params.append('page', page.toString());

      const response = await apiClient.get<ApiResponse<PostListResponse>>(
        `/posts?${params.toString()}`
      );
      return response.data!;
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
      throw error;
    }
  }

  // 카테고리 목록 조회
  static async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
      return response.data || [];
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
      throw error;
    }
  }

  // 게시물 작성
  static async createPost(postData: CreatePostRequest): Promise<CreatePostResponse> {
    try {
      const response = await apiClient.post<ApiResponse<CreatePostResponse>>('/posts', postData);
      return response.data!;
    } catch (error) {
      console.error('게시물 작성 실패:', error);
      throw error;
    }
  }

  // 게시물 수정
  static async updatePost(postId: number, postData: UpdatePostRequest): Promise<void> {
    try {
      await apiClient.put<ApiResponse<null>>(`/posts/${postId}`, postData);
    } catch (error) {
      console.error('게시물 수정 실패:', error);
      throw error;
    }
  }

  // 게시물 삭제
  static async deletePost(postId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<null>>(`/posts/${postId}`);
    } catch (error) {
      console.error('게시물 삭제 실패:', error);
      throw error;
    }
  }

  // 게시물 좋아요
  static async likePost(postId: number): Promise<void> {
    try {
      await apiClient.post<ApiResponse<null>>(`/posts/${postId}/likes`, {});
    } catch (error) {
      console.error('게시물 좋아요 실패:', error);
      throw error;
    }
  }

  // 게시물 좋아요 취소
  static async unlikePost(postId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<null>>(`/posts/${postId}/likes`);
    } catch (error) {
      console.error('게시물 좋아요 취소 실패:', error);
      throw error;
    }
  }

  // 게시물 북마크
  static async bookmarkPost(postId: number): Promise<void> {
    try {
      await apiClient.post<ApiResponse<null>>(`/posts/${postId}/bookmarks`, {});
    } catch (error) {
      console.error('게시물 북마크 실패:', error);
      throw error;
    }
  }

  // 게시물 북마크 취소
  static async unbookmarkPost(postId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<null>>(`/posts/${postId}/bookmarks`);
    } catch (error) {
      console.error('게시물 북마크 취소 실패:', error);
      throw error;
    }
  }

  // 게시물 상세 조회
  static async getPostDetail(postId: number): Promise<PostDetail> {
    try {
      // TODO: 실제 API 연동 시 아래 주석 해제
      // const response = await apiClient.get<ApiResponse<PostDetail>>(`/posts/${postId}`);
      // return response.data!;

      // 임시 Mock 데이터 반환
      console.log(`게시물 상세 조회 - postId: ${postId}`);
      
      // postId에 따라 다른 mock 데이터 반환
      if (postId === 2) {
        return MOCK_ITEM_POST_DETAIL;
      }
      return MOCK_POST_DETAIL;
      
    } catch (error) {
      console.error('게시물 상세 조회 실패:', error);
      throw error;
    }
  }

  // 이미지 업로드 (새 API 명세에 맞게 수정)
  static async uploadImages(imageUris: string[]): Promise<ImageUploadResponse> {
    try {
      const formData = new FormData();
      
      imageUris.forEach((uri, index) => {
        formData.append('images', {
          uri: uri,
          type: 'image/jpeg',
          name: `image_${index}.jpg`,
        } as any);
      });

      // FormData 업로드를 위한 직접 fetch 호출
      const token = await import('@react-native-async-storage/async-storage').then(
        AsyncStorage => AsyncStorage.default.getItem('accessToken')
      );

      const response = await fetch(`${API_BASE_URL}/posts/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-platform': 'mobile',
          // FormData의 경우 Content-Type 자동 설정
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`이미지 업로드 실패: ${response.status}`);
      }

      const result = await response.json() as ApiResponse<ImageUploadResponse>;

      return result.data!;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      throw error;
    }
  }

  // 단일 이미지 업로드 (편의 메서드)
  static async uploadImage(imageUri: string): Promise<string> {
    try {
      const result = await this.uploadImages([imageUri]);
      return result.files[0]?.url || '';
    } catch (error) {
      console.error('단일 이미지 업로드 실패:', error);
      throw error;
    }
  }

  // === 댓글 관련 API ===

  // 댓글 목록 조회
  static async getComments(postId: number): Promise<Comment[]> {
    try {
      // TODO: 실제 API 연동 시 아래 주석 해제
      // const response = await apiClient.get<ApiResponse<Comment[]>>(`/posts/${postId}/comments`);
      // return response.data || [];

      // 임시 Mock 데이터 반환
      console.log(`댓글 목록 조회 - postId: ${postId}`);
      
      // postId에 따라 다른 mock 데이터 반환
      if (postId === 2) {
        return MOCK_ITEM_COMMENTS;
      }
      return MOCK_COMMENTS;
      
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error);
      throw error;
    }
  }

  // 댓글 작성
  static async createComment(postId: number, content: string, parentCommentId?: number): Promise<Comment> {
    try {
      // TODO: 실제 API 연동 시 아래 주석 해제
      // const requestData = {
      //   content,
      //   parent_comment_id: parentCommentId || null
      // };
      // const response = await apiClient.post<ApiResponse<Comment>>(`/posts/${postId}/comments`, requestData);
      // return response.data!;

      // 임시 Mock 데이터 반환
      console.log(`댓글 작성 - postId: ${postId}, content: ${content}, parentId: ${parentCommentId}`);
      
      const newComment: Comment = {
        id: Date.now(), // 임시 ID
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: 999, // 현재 사용자 ID (임시)
          nickname: '현재사용자',
          profile_img: 'https://picsum.photos/40/40?random=999'
        },
        parent_comment_id: parentCommentId || null,
        mention_user: null,
        like_count: 0,
        is_liked: false,
        replies: []
      };
      
      return newComment;
      
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      throw error;
    }
  }

  // 댓글 좋아요
  static async likeComment(commentId: number): Promise<void> {
    try {
      await apiClient.post<ApiResponse<null>>(`/comments/${commentId}/likes`, {});
    } catch (error) {
      console.error('댓글 좋아요 실패:', error);
      throw error;
    }
  }

  // 댓글 좋아요 취소
  static async unlikeComment(commentId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<null>>(`/comments/${commentId}/likes`);
    } catch (error) {
      console.error('댓글 좋아요 취소 실패:', error);
      throw error;
    }
  }

  // 댓글 좋아요 토글 (편의 메서드)
  static async toggleCommentLike(postId: number, commentId: number): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      // TODO: 실제 API 연동 시 아래 주석 해제하고 위의 likeComment/unlikeComment 사용
      // const response = await apiClient.post<ApiResponse<{ is_liked: boolean; like_count: number }>>(
      //   `/comments/${commentId}/likes`
      // );
      // return {
      //   isLiked: response.data!.is_liked,
      //   likeCount: response.data!.like_count
      // };

      // 임시 Mock 응답
      console.log(`댓글 좋아요 토글 - postId: ${postId}, commentId: ${commentId}`);
      
      // 임시로 랜덤하게 좋아요 상태 반환
      const isLiked = Math.random() > 0.5;
      const likeCount = Math.floor(Math.random() * 50) + 1;
      
      return { isLiked, likeCount };
      
    } catch (error) {
      console.error('댓글 좋아요 토글 실패:', error);
      throw error;
    }
  }

  // 댓글 수정
  static async updateComment(commentId: number, content: string): Promise<Comment> {
    try {
      // TODO: 실제 API 연동 시 아래 주석 해제
      // const requestData = { content };
      // const response = await apiClient.put<ApiResponse<Comment>>(
      //   `/comments/${commentId}`, 
      //   requestData
      // );
      // return response.data!;

      // 임시 Mock 데이터 반환
      console.log(`댓글 수정 - commentId: ${commentId}, content: ${content}`);
      
      const updatedComment: Comment = {
        id: commentId,
        content,
        created_at: '2024-01-15T10:35:00.000Z', // 원래 작성일
        updated_at: new Date().toISOString(), // 수정일
        user: {
          id: 999,
          nickname: '현재사용자',
          profile_img: 'https://picsum.photos/40/40?random=999'
        },
        parent_comment_id: null,
        mention_user: null,
        like_count: 5,
        is_liked: false,
        replies: []
      };
      
      return updatedComment;
      
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      throw error;
    }
  }

  // 댓글 삭제
  static async deleteComment(commentId: number): Promise<void> {
    try {
      // TODO: 실제 API 연동 시 아래 주석 해제
      // await apiClient.delete(`/comments/${commentId}`);

      // 임시 Mock 응답
      console.log(`댓글 삭제 - commentId: ${commentId}`);
      
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      throw error;
    }
  }

  // 답글 작성 (멘션 포함)
  static async createReply(
    postId: number, 
    parentCommentId: number, 
    content: string, 
    mentionUserId?: number
  ): Promise<Comment> {
    try {
      // TODO: 실제 API 연동 시 아래 주석 해제
      // const requestData = {
      //   content,
      //   parent_comment_id: parentCommentId,
      //   mention_user_id: mentionUserId || null
      // };
      // const response = await apiClient.post<ApiResponse<Comment>>(`/posts/${postId}/comments`, requestData);
      // return response.data!;

      // 임시 Mock 데이터 반환
      console.log(`답글 작성 - postId: ${postId}, parentId: ${parentCommentId}, content: ${content}, mentionId: ${mentionUserId}`);
      
      const newReply: Comment = {
        id: Date.now(),
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: 999,
          nickname: '현재사용자',
          profile_img: 'https://picsum.photos/40/40?random=999'
        },
        parent_comment_id: parentCommentId,
        mention_user: mentionUserId ? {
          id: mentionUserId,
          nickname: '멘션된사용자'
        } : null,
        like_count: 0,
        is_liked: false
      };
      
      return newReply;
      
    } catch (error) {
      console.error('답글 작성 실패:', error);
      throw error;
    }
  }
}
