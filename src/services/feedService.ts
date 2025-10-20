import { apiClient } from './apiClient';
import {
  FeedListApiResponse,
  FeedListResponse,
  CreateFeedRequest,
  CreateFeedApiResponse,
  UpdateFeedRequest,
  UpdateFeedApiResponse,
  UpdateFeedResponse,
  ToggleLikeResponse,
  ToggleLikeApiResponse,
  FeedDetailApiResponse,
  FeedDetailResponse,
  CreateFeedCommentRequest,
  CreateFeedCommentApiResponse,
  CreateFeedCommentResponse,
  CreateFeedResponse,
  CommentListApiResponse,
  CommentItem,
  ToggleCommentLikeResponse,
  ToggleCommentLikeApiResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
  UpdateCommentApiResponse,
  DeleteCommentResponse,
  DeleteCommentApiResponse,
  ToggleBookmarkResponse,
  ToggleBookmarkApiResponse,
  DeleteFeedResponse,
  FeedImageUploadResponse,
  FeedImageUploadApiResponse,
  FeedVideoUploadResponse,
  FeedVideoUploadApiResponse,
  FeedVideoEditUploadResponse,
  FeedVideoEditUploadApiResponse
} from '../types/feed';
import type { ApiResponse } from '../types/api';
import type { UploadedImage, ImageUploadResponse } from '../types/post';

// 피드 관련 API 서비스
export class FeedService {
  // 피드 목록 조회 (커서 기반 페이지네이션)
  static async getFeeds(
    cursor?: number,
    limit: number = 20
  ): Promise<FeedListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (cursor !== undefined) {
        queryParams.append('cursor', cursor.toString());
      }
      queryParams.append('limit', limit.toString());

      const response = await apiClient.get<FeedListApiResponse>(
        `/feeds?${queryParams.toString()}`
      );
      
      return response.data!;
    } catch (error) {
      console.error('피드 목록 조회 실패:', error);
      throw error;
    }
  }

  // 피드 작성
  static async createFeed(feedData: CreateFeedRequest): Promise<CreateFeedResponse> {
    try {
      const response = await apiClient.post<CreateFeedApiResponse>('/feeds', feedData);
      return response.data!;
    } catch (error) {
      console.error('피드 작성 실패:', error);
      throw error;
    }
  }

  // 피드 수정
  static async updateFeed(feedId: number, feedData: UpdateFeedRequest): Promise<UpdateFeedResponse> {
    try {
      const response = await apiClient.put<UpdateFeedApiResponse>(`/feeds/${feedId}`, feedData);
      return response.data!;
    } catch (error) {
      console.error('피드 수정 실패:', error);
      throw error;
    }
  }

  // 피드 상세 조회
  static async getFeed(feedId: number): Promise<FeedDetailResponse> {
    try {
      const response = await apiClient.get<FeedDetailApiResponse>(`/feeds/${feedId}`);
      return response.data!;
    } catch (error) {
      console.error('피드 상세 조회 실패:', error);
      throw error;
    }
  }

  // 댓글 목록 조회
  static async getComments(feedId: number): Promise<CommentItem[]> {
    try {
      const response = await apiClient.get<CommentListApiResponse>(
        `/feeds/${feedId}/comments`
      );
      return response.data!;
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error);
      throw error;
    }
  }

  // 댓글 작성
  static async createComment(
    feedId: number,
    commentData: CreateFeedCommentRequest
  ): Promise<CreateFeedCommentResponse> {
    try {
      const response = await apiClient.post<CreateFeedCommentApiResponse>(
        `/feeds/${feedId}/comments`,
        commentData
      );
      return response.data!;
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      throw error;
    }
  }

  // 피드 좋아요 토글
  static async toggleLike(feedId: number): Promise<ToggleLikeResponse> {
    try {
      const response = await apiClient.post<ToggleLikeApiResponse>(`/feeds/${feedId}/like`, {});
      return response.data!;
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      throw error;
    }
  }

  // 피드 북마크 토글
  static async toggleBookmark(feedId: number): Promise<ToggleBookmarkResponse> {
    try {
      const response = await apiClient.post<ToggleBookmarkApiResponse>(`/feeds/${feedId}/bookmark`, {});
      return response.data!;
    } catch (error) {
      console.error('북마크 토글 실패:', error);
      throw error;
    }
  }

  // 피드 댓글 좋아요 토글
  static async toggleCommentLike(feedId: number, commentId: number): Promise<ToggleCommentLikeResponse> {
    try {
      const response = await apiClient.post<ToggleCommentLikeApiResponse>(
        `/feeds/${feedId}/comments/${commentId}/like`, {}
      );
      return response.data!;
    } catch (error) {
      console.error('댓글 좋아요 토글 실패:', error);
      throw error;
    }
  }

  // 피드 댓글 수정
  static async updateComment(feedId: number, commentId: number, commentData: UpdateCommentRequest): Promise<UpdateCommentResponse> {
    try {
      const response = await apiClient.patch<UpdateCommentApiResponse>(
        `/feeds/${feedId}/comments/${commentId}`,
        commentData
      );
      return response.data!;
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      throw error;
    }
  }

  // 피드 댓글 삭제 (소프트 삭제)
  static async deleteComment(feedId: number, commentId: number): Promise<DeleteCommentResponse> {
    try {
      const response = await apiClient.delete<DeleteCommentApiResponse>(
        `/feeds/${feedId}/comments/${commentId}`
      );
      return response.data!;
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      throw error;
    }
  }

  // 피드 삭제
  static async deleteFeed(feedId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<DeleteFeedResponse>>(`/feeds/${feedId}`);
    } catch (error) {
      console.error('피드 삭제 실패:', error);
      throw error;
    }
  }

  // 피드 이미지 업로드
  static async uploadImages(imageUris: string[]): Promise<FeedImageUploadResponse> {
    try {
      const formData = new FormData();
      
      // 이미지 URI들을 FormData에 추가
      imageUris.forEach((uri, index) => {
        formData.append('images', {
          uri,
          type: 'image/jpeg',
          name: `image_${Date.now()}_${index}.jpg`,
        } as any);
      });

      const response = await apiClient.postFormData<FeedImageUploadApiResponse>(
        '/feeds/upload/images',
        formData
      );
      
      return response.data!;
    } catch (error) {
      console.error('피드 이미지 업로드 실패:', error);
      throw error;
    }
  }

  // 피드 비디오 업로드
  static async uploadVideo(videoUri: string): Promise<FeedVideoUploadResponse> {
    try {
      const formData = new FormData();
      
      // 비디오 URI를 FormData에 추가
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: `video_${Date.now()}.mp4`,
      } as any);

      const response = await apiClient.postFormData<FeedVideoUploadApiResponse>(
        '/feeds/upload/video',
        formData
      );
      
      return response.data!;
    } catch (error) {
      console.error('피드 비디오 업로드 실패:', error);
      throw error;
    }
  }

  // 피드 비디오 편집 업로드 (trim + crop)
  static async uploadVideoEdit(
    videoUri: string,
    trimStart: number,
    trimEnd: number,
    cropArea: { x: number; y: number; width: number; height: number }
  ): Promise<FeedVideoEditUploadResponse> {
    try {
      const formData = new FormData();

      // 비디오 파일 추가
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: `video_edit_${Date.now()}.mp4`,
      } as any);

      // 편집 파라미터들 추가
      formData.append('trimStart', trimStart.toString());
      formData.append('trimEnd', trimEnd.toString());

      // cropArea JSON으로 추가 (API 명세에 따라)
      formData.append('cropArea', JSON.stringify(cropArea));

      const response = await apiClient.postFormData<FeedVideoEditUploadApiResponse>(
        '/feeds/upload/video/edit',
        formData
      );

      return response.data!;
    } catch (error) {
      console.error('피드 비디오 편집 업로드 실패:', error);
      throw error;
    }
  }
}
