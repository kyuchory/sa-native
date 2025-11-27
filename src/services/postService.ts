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
  VideoUploadResponse,
  UploadedVideo,
  UploadedThumbnail,
  PostListResponse,
  PostListItem,
  PostLikeResponse,
  PostBookmarkResponse,
  DeleteCommentRequest,
  DeletePostResponse,
  UpdatePostRequest,
  UpdatePostResponse,
  PostVideoEditUploadResponse,
  PostVideoEditUploadApiResponse,
  BookmarkPostListResponse,
  BookmarkPostListApiResponse
} from '../types/post';
import type { ApiResponse } from '../types/api';

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

  // 비디오 업로드
  static async uploadVideo(videoUri: string): Promise<{ video: UploadedVideo; thumbnail: UploadedThumbnail | null }> {
    try {
      // FormData 생성
      const formData = new FormData();

      // 파일명 추출 (URI에서 마지막 부분)
      const fileName = videoUri.split('/').pop() || `video_${Date.now()}.mp4`;

      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4', // 기본값, 실제로는 asset.type 사용 권장
        name: fileName,
      } as any);

      // API 호출
      const response = await apiClient.postFormData<ApiResponse<VideoUploadResponse>>(
        '/posts/upload/video',
        formData
      );

      return {
        video: response.data.video,
        thumbnail: response.data.thumbnail
      };
    } catch (error) {
      console.error('비디오 업로드 실패:', error);
      throw error;
    }
  }

  // 게시글 비디오 편집 업로드 (trim + crop)
  static async uploadVideoEdit(
    videoUri: string,
    trimStart: number,
    trimEnd: number,
    cropArea: { x: number; y: number; width: number; height: number }
  ): Promise<PostVideoEditUploadResponse> {
    try {
      const formData = new FormData();

      // 비디오 파일 추가
      const fileName = videoUri.split('/').pop() || `video_edit_${Date.now()}.mp4`;
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: fileName,
      } as any);

      // 편집 파라미터들 추가
      formData.append('trimStart', trimStart.toString());
      formData.append('trimEnd', trimEnd.toString());

      // cropArea JSON으로 추가 (API 명세에 따라)
      formData.append('cropArea', JSON.stringify(cropArea));

      const response = await apiClient.postFormData<PostVideoEditUploadApiResponse>(
        '/posts/upload/video/edit',
        formData
      );

      return response.data!;
    } catch (error) {
      console.error('게시글 비디오 편집 업로드 실패:', error);
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
