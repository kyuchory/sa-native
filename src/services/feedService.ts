import { apiClient } from './apiClient';
import {
  FeedListApiResponse,
  FeedListResponse,
  FeedListItem,
  CreateFeedRequest,
  CreateFeedApiResponse,
  CreateFeedWithFilesApiResponse,
  UpdateFeedWithFilesApiResponse,
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
  CommentListResponse,
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
  BookmarkFeedListResponse,
  BookmarkFeedListApiResponse,
  DeleteFeedResponse
} from '../types/feed';
import type { ApiResponse } from '../types/api';

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

  // 피드 작성 (통합 파일 업로드)
  static async createFeedWithFiles(formData: FormData): Promise<CreateFeedResponse> {
    try {
      const response = await apiClient.postFormData<CreateFeedWithFilesApiResponse>(
        '/feeds/create-with-files',
        formData
      );
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

  // 피드 수정 (통합 파일 업로드)
  static async updateFeedWithFiles(feedId: number, formData: FormData): Promise<{ feedId: number }> {
    try {
      const response = await apiClient.putFormData<UpdateFeedWithFilesApiResponse>(
        `/feeds/${feedId}/update-with-files`,
        formData
      );
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
  static async getComments(feedId: number, cursor?: string, limit: number = 20): Promise<CommentListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (cursor) {
        queryParams.append('cursor', cursor);
      }
      queryParams.append('limit', limit.toString());

      const response = await apiClient.get<CommentListApiResponse>(
        `/feeds/${feedId}/comments?${queryParams.toString()}`
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

  // 북마크한 피드 목록 조회 (오프셋 기반 페이지네이션)
  static async getBookmarkFeeds(
    offset: number = 0,
    limit: number = 20
  ): Promise<BookmarkFeedListResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('offset', offset.toString());
      queryParams.append('limit', limit.toString());

      const response = await apiClient.get<BookmarkFeedListApiResponse>(
        `/feeds/bookmarks?${queryParams.toString()}`
      );

      return response.data!;
    } catch (error) {
      console.error('북마크한 피드 목록 조회 실패:', error);
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

  // 랜덤 인기 피드 조회
  static async getRandomFeed(excludeIds: number[] = []): Promise<FeedListItem | null> {
    try {
      const queryParams = new URLSearchParams();

      if (excludeIds.length > 0) {
        queryParams.append('exclude_ids', excludeIds.join(','));
      }

      const queryString = queryParams.toString();
      const url = queryString ? `/feeds/random?${queryString}` : '/feeds/random';

      const response = await apiClient.get<{
        code: number;
        message: string;
        data: FeedListItem | null;
      }>(url);

      return response.data;
    } catch (error) {
      console.error('랜덤 인기 피드 조회 실패:', error);
      throw error;
    }
  }
}
