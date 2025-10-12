import { apiClient } from './apiClient';
import type {
  CreateStoryRequest,
  CreateStoryResponse,
  CreateStoryApiResponse,
  StoryListResponse,
  StoryListApiResponse
} from '../types/story';
import type { ApiResponse } from '../types/api';

// 스토리 관련 API 서비스
export class StoryService {
  // 스토리 생성 (파일 업로드)
  static async createStory(request: CreateStoryRequest): Promise<CreateStoryResponse> {
    try {
      // FormData 생성
      const formData = new FormData();

      // 파일 URI에서 파일명 추출
      const fileName = request.fileUri.split('/').pop() || `story_${Date.now()}`;

      // 파일 확장자로 MIME 타입 결정
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg'; // 기본값

      if (fileExtension) {
        // 이미지 MIME 타입
        if (['jpg', 'jpeg'].includes(fileExtension)) {
          mimeType = 'image/jpeg';
        } else if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'webp') {
          mimeType = 'image/webp';
        }
        // 비디오 MIME 타입
        else if (fileExtension === 'mp4') {
          mimeType = 'video/mp4';
        } else if (fileExtension === 'mov') {
          mimeType = 'video/quicktime';
        } else if (fileExtension === 'avi') {
          mimeType = 'video/x-msvideo';
        } else if (fileExtension === 'webm') {
          mimeType = 'video/webm';
        }
      }

      // 파일을 FormData에 추가 (field name: 'file')
      formData.append('file', {
        uri: request.fileUri,
        type: mimeType,
        name: fileName,
      } as any);

      // API 호출
      const response = await apiClient.postFormData<CreateStoryApiResponse>(
        '/stories',
        formData
      );

      return response.data!;
    } catch (error) {
      console.error('스토리 생성 실패:', error);
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
}
