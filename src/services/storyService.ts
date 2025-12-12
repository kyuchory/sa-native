import { apiClient } from './apiClient';
import type {
  UploadStoryImageRequest,
  UploadStoryImageResponse,
  UploadStoryImageApiResponse,
  UploadStoryVideoRequest,
  UploadStoryVideoResponse,
  UploadStoryVideoApiResponse,
  StoryListResponse,
  StoryListApiResponse,
  StoryDetailResponse,
  StoryDetailApiResponse,
  StoryEntryResponse,
  StoryEntryApiResponse,
  UserStoryDetailResponse,
  UserStoryDetailApiResponse,
  MyStoryDetailResponse,
  MyStoryDetailApiResponse,
  StoryViewResponse,
  StoryViewApiResponse
} from '../types/story';
import type { ApiResponse } from '../types/api';

// 스토리 관련 API 서비스
export class StoryService {
  // 스토리 이미지 업로드
  static async uploadStoryImage(imageUri: string): Promise<UploadStoryImageResponse> {
    try {
      const formData = new FormData();

      // 이미지 URI를 FormData에 추가
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `story_${Date.now()}.jpg`,
      } as any);

      // API 호출
      const response = await apiClient.postFormData<UploadStoryImageApiResponse>(
        '/stories/images',
        formData
      );

      return response.data!;
    } catch (error) {
      console.error('스토리 이미지 업로드 실패:', error);
      throw error;
    }
  }

  // 스토리 비디오 업로드
  static async uploadStoryVideo(
    videoUri: string,
    trimStart?: number,
    trimEnd?: number,
    cropArea?: { x: number; y: number; width: number; height: number }
  ): Promise<UploadStoryVideoResponse> {
    try {
      const formData = new FormData();

      // 비디오 파일 추가
      formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: `story_${Date.now()}.mp4`,
      } as any);

      // 편집 파라미터 추가 (선택적)
      if (trimStart !== undefined) {
        formData.append('trimStart', trimStart.toString());
      }
      if (trimEnd !== undefined) {
        formData.append('trimEnd', trimEnd.toString());
      }
      if (cropArea) {
        formData.append('cropArea', JSON.stringify(cropArea));
      }

      // API 호출
      const response = await apiClient.postFormData<UploadStoryVideoApiResponse>(
        '/stories/videos',
        formData
      );

      return response.data!;
    } catch (error) {
      console.error('스토리 비디오 업로드 실패:', error);
      throw error;
    }
  }

  // 스토리 목록 조회 (팔로우한 사용자들의 최신 스토리)
  static async getStories(): Promise<StoryListResponse> {
    try {
      const response = await apiClient.get<StoryListApiResponse>('/stories');
      return response.data!;
    } catch (error) {
      console.error('스토리 목록 조회 실패:', error);
      throw error;
    }
  }

  // 스토리 상세 조회 (기존 storyId 기반 - deprecated)
  static async getStoryDetail(storyId: number, direction?: 'next' | 'prev'): Promise<StoryDetailResponse> {
    try {
      const params = new URLSearchParams();
      if (direction) {
        params.append('direction', direction);
      }

      const queryString = params.toString();
      const url = `/stories/${storyId}/detail${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<StoryDetailApiResponse>(url);
      return response.data!;
    } catch (error) {
      console.error('스토리 상세 조회 실패:', error);
      throw error;
    }
  }

  // 스토리 진입 정보 조회 (새로운 userId 기반 구조의 브릿지)
  static async getStoryEntry(storyId: number): Promise<StoryEntryResponse> {
    try {
      const response = await apiClient.get<StoryEntryApiResponse>(`/stories/${storyId}/entry`);
      return response.data!;
    } catch (error) {
      console.error('스토리 진입 정보 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 스토리 상세 조회 (새로운 userId 기반 구조)
  static async getUserStoryDetail(userId: number, direction?: 'next' | 'prev'): Promise<UserStoryDetailResponse> {
    try {
      const params = new URLSearchParams();
      if (direction) {
        params.append('direction', direction);
      }

      const queryString = params.toString();
      const url = `/stories/user/${userId}/detail${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<UserStoryDetailApiResponse>(url);
      return response.data!;
    } catch (error) {
      console.error('사용자 스토리 상세 조회 실패:', error);
      throw error;
    }
  }

  // 자신의 스토리 상세 조회
  static async getMyStoryDetail(storyId: number, direction?: 'next' | 'prev'): Promise<MyStoryDetailResponse> {
    try {
      const params = new URLSearchParams();
      if (direction) {
        params.append('direction', direction);
      }

      const queryString = params.toString();
      const url = `/stories/my/${storyId}/detail${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<MyStoryDetailApiResponse>(url);
      return response.data!;
    } catch (error) {
      console.error('자신의 스토리 상세 조회 실패:', error);
      throw error;
    }
  }

  // 스토리 읽음 처리
  static async viewStory(storyId: number): Promise<StoryViewResponse> {
    try {
      const response = await apiClient.post<StoryViewApiResponse>(`/stories/${storyId}/view`, {});
      return response.data!;
    } catch (error) {
      console.error('스토리 읽음 처리 실패:', error);
      throw error;
    }
  }
}
