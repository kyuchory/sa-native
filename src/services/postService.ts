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
  PostListItem,
  PostLikeResponse,
  PostBookmarkResponse,
  DeleteCommentRequest,
  DeletePostResponse,
  UpdatePostRequest,
  UpdatePostResponse
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
  static async createComment(
    postId: number, 
    content: string, 
    parentCommentId?: number, 
    mentionUserId?: number
  ): Promise<{ commentId: number }> {
    try {
      const requestData = {
        content,
        parent_comment_id: parentCommentId || null,
        mention_user_id: mentionUserId || null
      };
      
      const response = await apiClient.post<ApiResponse<{ commentId: number }>>(
        `/posts/${postId}/comments`, 
        requestData
      );
      
      return response.data!;
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      throw error;
    }
  }

  // 댓글 좋아요 토글
  static async toggleCommentLike(commentId: number): Promise<{ is_liked: boolean; like_count: number }> {
    try {
      const response = await apiClient.post<ApiResponse<{ is_liked: boolean; like_count: number }>>(
        `/comments/${commentId}/like`,
        {}
      );
      
      return response.data!;
    } catch (error) {
      console.error('댓글 좋아요 토글 실패:', error);
      throw error;
    }
  }

  // 댓글 수정
  static async updateComment(commentId: number, content: string): Promise<void> {
    try {
      const requestData = { content };
      await apiClient.put<ApiResponse<null>>(
        `/comments/${commentId}`, 
        requestData
      );
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      throw error;
    }
  }

  // 댓글 삭제 (소프트 삭제)
  static async deleteComment(commentId: number): Promise<void> {
    try {
      const requestData: DeleteCommentRequest = { is_deleted: true };
      await apiClient.patch<ApiResponse<null>>(
        `/comments/${commentId}/status`, 
        requestData
      );
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      throw error;
    }
  }

  // 답글 작성은 createComment와 동일한 API 사용 (parentCommentId와 mentionUserId 포함)

  // 게시글 좋아요 토글
  static async togglePostLike(postId: number): Promise<{ is_liked: boolean; like_count: number }> {
    try {
      const response = await apiClient.post<PostLikeResponse>(`/posts/${postId}/like`, {});
      return response.data;
    } catch (error) {
      console.error('게시글 좋아요 토글 실패:', error);
      throw error;
    }
  }

  // 게시글 북마크 토글
  static async togglePostBookmark(postId: number): Promise<{ is_bookmarked: boolean; bookmark_count: number }> {
    try {
      const response = await apiClient.post<PostBookmarkResponse>(`/posts/${postId}/bookmark`, {});
      return response.data;
    } catch (error) {
      console.error('게시글 북마크 토글 실패:', error);
      throw error;
    }
  }

  // 게시글 삭제
  static async deletePost(postId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<DeletePostResponse>>(`/posts/${postId}`);
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      throw error;
    }
  }

  // 게시글 수정
  static async updatePost(postId: number, updateData: UpdatePostRequest): Promise<void> {
    try {
      await apiClient.put<ApiResponse<UpdatePostResponse>>(`/posts/${postId}`, updateData);
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      throw error;
    }
  }
}
