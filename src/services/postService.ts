import { apiClient } from './apiClient';
import type {
  CreatePostRequest,
  CreatePostResponse,
  Category,
  PostDetailResponse,
  PostDetail,
  CommentsResponse,
  Comment,
  PostListResponse,
  PostListItem,
  PostLikeResponse,
  PostBookmarkResponse,
  DeleteCommentRequest,
  DeletePostResponse,
  UpdatePostRequest,
  UpdatePostResponse,
  BookmarkPostListResponse,
  BookmarkPostListApiResponse,
  AnimalTypesResponse,
  AnimalTypeOption
} from '../types/post';
import type { ApiResponse } from '../types/api';

export class PostService {
  // 동물 타입 목록 조회
  static async getAnimalTypes(): Promise<AnimalTypeOption[]> {
    try {
      const response = await apiClient.get<ApiResponse<AnimalTypesResponse>>('/posts/animal-types');
      return response.data?.animal_types || [];
    } catch (error) {
      console.error('동물 타입 조회 실패:', error);
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

  // 게시글 목록 조회
  static async getPosts(params?: {
    categoryId?: number;
    subCategoryId?: number;
    animalType?: string;
    page?: number;
  }): Promise<PostListResponse> {
    try {
      console.log('📡 게시글 조회 파라미터:', params);

      const queryParams = new URLSearchParams();

      if (params?.categoryId) {
        queryParams.append('categoryId', params.categoryId.toString());
      }
      if (params?.subCategoryId) {
        queryParams.append('subCategoryId', params.subCategoryId.toString());
      }
      if (params?.animalType) {
        queryParams.append('animalType', params.animalType);
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }

      const endpoint = `/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🌐 최종 API 엔드포인트:', endpoint);

      const response = await apiClient.get<ApiResponse<PostListResponse>>(endpoint);

      return response.data!;
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
      throw error;
    }
  }

  // 게시물 작성 (기존)
  static async createPost(postData: CreatePostRequest): Promise<CreatePostResponse> {
    try {
      const response = await apiClient.post<ApiResponse<CreatePostResponse>>('/posts', postData);
      return response.data!;
    } catch (error) {
      console.error('게시물 작성 실패:', error);
      throw error;
    }
  }

  // 게시물 작성 (통합 파일 업로드)
  static async createPostWithFiles(formData: FormData): Promise<CreatePostResponse> {
    try {
      const response = await apiClient.postFormData<ApiResponse<CreatePostResponse>>(
        '/posts/create-with-files',
        formData
      );
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



  // === 댓글 관련 API ===

  // 댓글 목록 조회
  static async getComments(postId: number, cursor?: string, limit: number = 20): Promise<CommentsResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (cursor) {
        queryParams.append('cursor', cursor);
      }
      queryParams.append('limit', limit.toString());

      const response = await apiClient.get<ApiResponse<CommentsResponse>>(
        `/posts/${postId}/comments?${queryParams.toString()}`
      );
      return response.data!;
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

  // 북마크한 게시글 목록 조회 (커서 기반 페이지네이션)
  static async getBookmarkPosts(
    cursor?: string,
    limit: number = 20
  ): Promise<BookmarkPostListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (cursor) {
        queryParams.append('cursor', cursor);
      }
      queryParams.append('limit', limit.toString());

      const response = await apiClient.get<BookmarkPostListApiResponse>(
        `/posts/bookmarks?${queryParams.toString()}`
      );

      return response.data!;
    } catch (error) {
      console.error('북마크한 게시글 목록 조회 실패:', error);
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

  // 게시글 수정 (기존)
  static async updatePost(postId: number, updateData: UpdatePostRequest): Promise<void> {
    try {
      await apiClient.put<ApiResponse<UpdatePostResponse>>(`/posts/${postId}`, updateData);
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      throw error;
    }
  }

  // 게시글 수정 (통합 파일 업로드)
  static async updatePostWithFiles(postId: number, formData: FormData): Promise<void> {
    try {
      await apiClient.putFormData<ApiResponse<UpdatePostResponse>>(`/posts/${postId}/update-with-files`, formData);
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      throw error;
    }
  }
}
