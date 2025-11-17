import { apiClient } from './apiClient';
import {
  ShortsFeedResponse,
  ShortLikeResponse,
  ShortCommentsResponse,
  CreateShortCommentRequest,
  ShortUploadRequest,
  ShortUploadApiResponse,
  ShortUploadResponse,
} from '../types/cut';
import type { ApiResponse } from '../types/api';

// 컷(세로형 쇼츠) 관련 API 서비스
export class CutService {
  // 컷츠 업로드
  static async uploadShorts(shortData: ShortUploadRequest): Promise<ShortUploadResponse> {
    try {
      const formData = new FormData();

      // 파일 추가
      if (shortData.file) {
        const fileName = shortData.file.name || `short_${Date.now()}.${shortData.type === 'video' ? 'mp4' : 'jpg'}`;
        const fileType = shortData.type === 'video' ? 'video/mp4' : 'image/jpeg';

        formData.append('file', {
          uri: shortData.file.uri || shortData.file,
          type: shortData.file.type || fileType,
          name: shortData.file.name || fileName,
        } as any);
      }

      // 필수 파라미터들
      formData.append('type', shortData.type);

      // 카테고리 ID 배열
      shortData.category_ids.forEach(id => {
        formData.append('category_ids', id.toString());
      });

      // 선택 파라미터들
      if (shortData.description) {
        formData.append('description', shortData.description);
      }

      // 태그 ID 배열 (선택)
      if (shortData.tag_ids && shortData.tag_ids.length > 0) {
        shortData.tag_ids.forEach(id => {
          formData.append('tag_ids[]', id.toString());
        });
      }

      // 비디오 전용 파라미터들
      if (shortData.type === 'video') {
        if (shortData.trimStart !== undefined) {
          formData.append('trimStart', shortData.trimStart.toString());
        }
        if (shortData.trimEnd !== undefined) {
          formData.append('trimEnd', shortData.trimEnd.toString());
        }
        if (shortData.cropArea) {
          formData.append('cropArea', JSON.stringify(shortData.cropArea));
        }
      }

      const response = await apiClient.postFormData<ShortUploadApiResponse>(
        '/shorts',
        formData
      );

      return response.data!;
    } catch (error) {
      console.error('컷츠 업로드 실패:', error);
      throw error;
    }
  }

  // 쇼츠 피드 조회 (커서 기반 페이지네이션)
  static async getShortsFeed(
    cursor?: string,
    limit: number = 4 // 쇼츠 피드 기본 limit = 4
  ): Promise<ShortsFeedResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (cursor) {
        queryParams.append('cursor', cursor);
      }
      queryParams.append('limit', limit.toString());
      queryParams.append('recommended', 'true'); // 기본적으로 추천 모드

      const response = await apiClient.get<ShortsFeedResponse>(
        `/shorts/feed?${queryParams.toString()}`
      );

      return response;
    } catch (error) {
      console.error('쇼츠 피드 조회 실패:', error);
      throw error;
    }
  }

  // 쇼츠 좋아요 토글
  static async toggleShortLike(shortId: number): Promise<ShortLikeResponse> {
    try {
      const response = await apiClient.post<ShortLikeResponse>(`/shorts/${shortId}/like`, {});
      return response;
    } catch (error) {
      console.error('쇼츠 좋아요 토글 실패:', error);
      throw error;
    }
  }

  // 쇼츠 댓글 목록 조회
  static async getShortComments(shortId: number): Promise<ShortCommentsResponse> {
    try {
      const response = await apiClient.get<ShortCommentsResponse>(`/shorts/${shortId}/comments`);
      return response;
    } catch (error) {
      console.error('쇼츠 댓글 목록 조회 실패:', error);
      throw error;
    }
  }

  // 쇼츠 댓글 작성
  static async createShortComment(
    shortId: number,
    commentData: CreateShortCommentRequest
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        `/shorts/${shortId}/comments`,
        commentData
      );
      return response;
    } catch (error) {
      console.error('쇼츠 댓글 작성 실패:', error);
      throw error;
    }
  }
}
