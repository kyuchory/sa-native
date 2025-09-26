// 팔로우 API 서비스 (새로운 API 명세 기반)

import { apiClient } from './apiClient';
import { 
  FollowUser, 
  FollowingListResponse,
  FollowerListResponse,
  FollowActionResponse,
  FollowStatusResponse,
  FollowRequest,
  FollowRequestListResponse,
  FollowRequestActionResponse,
  PaginationOptions,
  PaginationData
} from '../types/follow';

/**
 * 팔로우 서비스 클래스
 * 새로운 API 명세에 맞게 구현
 */
export class FollowService {
  // 팔로잉 목록 조회 (내가 팔로우하는 사용자들)
  static async getFollowingList(options: PaginationOptions = {}): Promise<PaginationData<FollowUser>> {
    const { cursor, limit = 20 } = options;
    const queryParams = new URLSearchParams();
    
    if (cursor) queryParams.append('cursor', cursor.toString());
    queryParams.append('limit', limit.toString());
    
    const endpoint = `/users/me/following?${queryParams.toString()}`;
    const response = await apiClient.get<FollowingListResponse>(endpoint);
    return response.data;
  }

  // 팔로워 목록 조회 (나를 팔로우하는 사용자들)
  static async getFollowerList(options: PaginationOptions = {}): Promise<PaginationData<FollowUser>> {
    const { cursor, limit = 20 } = options;
    const queryParams = new URLSearchParams();
    
    if (cursor) queryParams.append('cursor', cursor.toString());
    queryParams.append('limit', limit.toString());
    
    const endpoint = `/users/me/followers?${queryParams.toString()}`;
    const response = await apiClient.get<FollowerListResponse>(endpoint);
    return response.data;
  }

  // 특정 사용자의 팔로잉 목록 조회
  static async getUserFollowingList(userId: number, options: PaginationOptions = {}): Promise<PaginationData<FollowUser>> {
    const { cursor, limit = 20 } = options;
    const queryParams = new URLSearchParams();
    
    if (cursor) queryParams.append('cursor', cursor.toString());
    queryParams.append('limit', limit.toString());
    
    const endpoint = `/users/${userId}/following?${queryParams.toString()}`;
    const response = await apiClient.get<FollowingListResponse>(endpoint);
    return response.data;
  }

  // 특정 사용자의 팔로워 목록 조회
  static async getUserFollowerList(userId: number, options: PaginationOptions = {}): Promise<PaginationData<FollowUser>> {
    const { cursor, limit = 20 } = options;
    const queryParams = new URLSearchParams();
    
    if (cursor) queryParams.append('cursor', cursor.toString());
    queryParams.append('limit', limit.toString());
    
    const endpoint = `/users/${userId}/followers?${queryParams.toString()}`;
    const response = await apiClient.get<FollowerListResponse>(endpoint);
    return response.data;
  }

  // 사용자 팔로우
  static async followUser(userId: number): Promise<{ is_following: boolean; message: string }> {
    const response = await apiClient.post<FollowActionResponse>(`/users/${userId}/follow`, {});
    return response.data;
  }

  // 사용자 언팔로우
  static async unfollowUser(userId: number): Promise<{ is_following: boolean; message: string }> {
    const response = await apiClient.delete<FollowActionResponse>(`/users/${userId}/follow`);
    return response.data;
  }

  // 팔로우 상태 조회
  static async getFollowStatus(userId: number): Promise<{ is_following: boolean; is_followed_by: boolean }> {
    const response = await apiClient.get<FollowStatusResponse>(`/users/${userId}/follow/status`);
    return response.data;
  }

  // 편의 함수: 팔로잉 목록에서 사용자 배열만 추출
  static async getFollowingUsers(options: PaginationOptions = {}): Promise<FollowUser[]> {
    const data = await this.getFollowingList(options);
    return data.following || [];
  }

  // 편의 함수: 팔로워 목록에서 사용자 배열만 추출
  static async getFollowerUsers(options: PaginationOptions = {}): Promise<FollowUser[]> {
    const data = await this.getFollowerList(options);
    return data.followers || [];
  }

  // 팔로우 요청 보내기
  static async sendFollowRequest(userId: number): Promise<{ is_following: boolean; is_request_sent?: boolean; message: string }> {
    const response = await apiClient.post<FollowActionResponse>(`/users/${userId}/follow/request`, {});
    return response.data;
  }

  // 팔로우 요청 수락
  static async acceptFollowRequest(requestId: number): Promise<{ message: string; status: string }> {
    const response = await apiClient.post<FollowRequestActionResponse>(`/users/follow-requests/${requestId}/accept`, {});
    return response.data;
  }

  // 팔로우 요청 거절
  static async rejectFollowRequest(requestId: number): Promise<{ message: string; status: string }> {
    const response = await apiClient.post<FollowRequestActionResponse>(`/users/follow-requests/${requestId}/reject`, {});
    return response.data;
  }

  // 팔로우 요청 목록 조회
  static async getFollowRequests(options: PaginationOptions = {}): Promise<{ requests: FollowRequest[]; next_cursor: number | null; has_more: boolean }> {
    const { cursor, limit = 20 } = options;
    const queryParams = new URLSearchParams();
    
    if (cursor) queryParams.append('cursor', cursor.toString());
    queryParams.append('limit', limit.toString());
    
    const endpoint = `/users/follow-requests?${queryParams.toString()}`;
    const response = await apiClient.get<FollowRequestListResponse>(endpoint);
    return response.data;
  }
}
