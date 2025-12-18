import { apiClient } from './apiClient';
import {
  ProfileResponse,
  UpdateProfileRequest,
  UpdateProfileApiResponse,
  UpdateProfileVisibilityRequest,
  UpdateProfileVisibilityApiResponse,
  ProfilePostsResponse,
  ProfileFeedsResponse,
  ProfileShortsResponse,
  ProfileImageUploadResponse,
  UploadedImage,
} from '../types/profile';
import { ApiResponse } from '../types/api';

// 프로필 관련 API 서비스
export class ProfileService {
  // 프로필 기본 정보 조회
  static async getProfile(userId: number): Promise<ProfileResponse> {
    return apiClient.get<ProfileResponse>(`/profiles/${userId}`);
  }

  // 프로필 편집
  static async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileApiResponse> {
    return apiClient.patch<UpdateProfileApiResponse>('/profiles/me', data);
  }

  // 프로필 공개여부 수정
  static async updateProfileVisibility(data: UpdateProfileVisibilityRequest): Promise<UpdateProfileVisibilityApiResponse> {
    return apiClient.patch<UpdateProfileVisibilityApiResponse>('/profiles/me/visibility', data);
  }

  // 내가 작성한 게시판 글 목록
  static async getProfilePosts(
    userId: number,
    offset: number = 0,
    limit: number = 15
  ): Promise<ProfilePostsResponse> {
    const queryParams = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });
    
    return apiClient.get<ProfilePostsResponse>(`/profiles/${userId}/posts?${queryParams}`);
  }

  // 내가 작성한 피드 목록
  static async getProfileFeeds(
    userId: number,
    offset: number = 0,
    limit: number = 20
  ): Promise<ProfileFeedsResponse> {
    const queryParams = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });

    return apiClient.get<ProfileFeedsResponse>(`/profiles/${userId}/feeds?${queryParams}`);
  }

  // 내가 작성한 쇼츠 목록
  static async getProfileShorts(
    userId: number,
    cursor?: string,
    limit: number = 20
  ): Promise<ProfileShortsResponse> {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
    });

    if (cursor) {
      queryParams.append('cursor', cursor);
    }

    return apiClient.get<ProfileShortsResponse>(`/profiles/${userId}/shorts?${queryParams}`);
  }

  // 프로필 이미지 업로드
  static async uploadProfileImages(imageUris: string[]): Promise<ProfileImageUploadResponse[]> {
    try {
      // FormData 생성
      const formData = new FormData();

      imageUris.forEach((imageUri, index) => {
        const fileName = imageUri.split('/').pop() || `profile_image_${index}.jpg`;

        const fileData = {
          uri: imageUri,
          type: 'image/jpeg', // 기본값, 실제로는 asset.type 사용 권장
          name: fileName,
        } as any;

        formData.append('profile_image', fileData);
      });

      // API 호출
      const response = await apiClient.postFormData<ApiResponse<ProfileImageUploadResponse>>(
        '/profiles/upload/image',
        formData
      );

      return [response.data];
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error);
      throw error;
    }
  }

  // 단일 프로필 이미지 업로드 (편의 함수)
  static async uploadProfileImage(imageUri: string): Promise<ProfileImageUploadResponse> {
    const results = await this.uploadProfileImages([imageUri]);
    return results[0];
  }
}
