import { apiClient } from './apiClient';
import {
  ProfileResponse,
  UpdateProfileRequest,
  UpdateProfileApiResponse,
  ProfilePostsResponse,
  ProfileFeedsResponse,
} from '../types/profile';

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

  // 내가 작성한 게시판 글 목록
  static async getProfilePosts(
    userId: number,
    offset: number = 0,
    limit: number = 20
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
}
