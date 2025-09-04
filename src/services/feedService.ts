import { apiClient } from './apiClient';
import {
  FeedListApiResponse,
  FeedListResponse,
  CreateFeedRequest,
  CreateFeedApiResponse,
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
  DeleteCommentApiResponse
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
}
