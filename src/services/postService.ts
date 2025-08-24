import { apiClient } from './apiClient';
import type { 
  CreatePostRequest, 
  CreatePostResponse, 
  CategoriesResponse, 
  Category,
  PostDetailResponse,
  PostDetail,
  CommentsResponse,
  Comment,
  ImageUploadResponse,
  UploadedImage,
  PostListResponse,
  PostListItem
} from '../types/post';
import type { ApiResponse } from '../types/api';
import { MOCK_POST_DETAIL, MOCK_ITEM_POST_DETAIL } from '../data/postDetailMockData';

export class PostService {
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

  // 게시글 목록 조회
  static async getPosts(params?: {
    categoryId?: number;
    subCategoryId?: number;
    page?: number;
  }): Promise<PostListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.categoryId) {
        queryParams.append('categoryId', params.categoryId.toString());
      }
      if (params?.subCategoryId) {
        queryParams.append('subCategoryId', params.subCategoryId.toString());
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }

      const endpoint = `/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<ApiResponse<PostListResponse>>(endpoint);
      
      return response.data!;
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
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

  // 게시물 상세 조회
  static async getPostDetail(postId: number): Promise<PostDetail> {
    try {
      const response = await apiClient.get<ApiResponse<PostDetail>>(`/posts/${postId}`);
      return response.data!;
    } catch (error) {
      console.error('게시물 상세 조회 실패:', error);
      throw error;
    }
  }

  // 이미지 업로드
  static async uploadImages(imageUris: string[]): Promise<UploadedImage[]> {
    try {
      // FormData 생성
      const formData = new FormData();
      
      imageUris.forEach((imageUri, index) => {
        const fileName = imageUri.split('/').pop() || `image_${index}.jpg`;
        
        formData.append('images', {
          uri: imageUri,
          type: 'image/jpeg', // 기본값, 실제로는 asset.type 사용 권장
          name: fileName,
        } as any);
      });

      // API 호출
      const response = await apiClient.postFormData<ApiResponse<ImageUploadResponse>>(
        '/posts/upload/images', 
        formData
      );

      return response.data.files || [];
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      throw error;
    }
  }

  // 단일 이미지 업로드 (편의 함수)
  static async uploadImage(imageUri: string): Promise<UploadedImage> {
    const results = await this.uploadImages([imageUri]);
    return results[0];
  }

  // 비디오 업로드 (임시 - 추후 구현)
  static async uploadVideo(videoUri: string): Promise<string> {
    try {
      // TODO: 실제 비디오 업로드 구현
      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video.mp4',
      } as any);

      const response = await apiClient.post<ApiResponse<{ videoUrl: string }>>('/upload/video', formData);

      return response.data?.videoUrl || '';
    } catch (error) {
      console.error('비디오 업로드 실패:', error);
      throw error;
    }
  }

  // === 댓글 관련 API ===

  // 댓글 목록 조회
  static async getComments(postId: number): Promise<Comment[]> {
    try {
      const response = await apiClient.get<ApiResponse<Comment[]>>(`/posts/${postId}/comments`);
      return response.data || [];
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

  // 댓글 좋아요 토글
  static async toggleCommentLike(postId: number, commentId: number): Promise<{ isLiked: boolean; likeCount: number }> {
    try {
      // TODO: 실제 API 연동 시 아래 주석 해제
      // const response = await apiClient.post<ApiResponse<{ is_liked: boolean; like_count: number }>>(
      //   `/posts/${postId}/comments/${commentId}/like`
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
  static async updateComment(postId: number, commentId: number, content: string): Promise<Comment> {
    try {
      // TODO: 실제 API 연동 시 아래 주석 해제
      // const requestData = { content };
      // const response = await apiClient.put<ApiResponse<Comment>>(
      //   `/posts/${postId}/comments/${commentId}`, 
      //   requestData
      // );
      // return response.data!;

      // 임시 Mock 데이터 반환
      console.log(`댓글 수정 - postId: ${postId}, commentId: ${commentId}, content: ${content}`);
      
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
  static async deleteComment(postId: number, commentId: number): Promise<void> {
    try {
      // TODO: 실제 API 연동 시 아래 주석 해제
      // await apiClient.delete(`/posts/${postId}/comments/${commentId}`);

      // 임시 Mock 응답
      console.log(`댓글 삭제 - postId: ${postId}, commentId: ${commentId}`);
      
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
