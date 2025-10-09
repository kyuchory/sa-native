// 팔로우 관련 타입 정의 (API 명세 기반)
import { ApiResponse } from './api';

// 팔로우 사용자 정보
export interface FollowUser {
  id: number;
  nickname: string;
  profile_img: string | null;
  is_following: boolean;
  created_at: string;
}

// 페이지네이션 데이터
export interface PaginationData<T> {
  next_cursor: number | null;
  has_more: boolean;
  following?: T[]; // 팔로잉 목록
  followers?: T[]; // 팔로워 목록
}

// 팔로잉 목록 조회 응답
export interface FollowingListResponse extends ApiResponse<PaginationData<FollowUser>> {}

// 팔로워 목록 조회 응답
export interface FollowerListResponse extends ApiResponse<PaginationData<FollowUser>> {}

// 팔로우/언팔로우 응답
export interface FollowActionResponse extends ApiResponse<{
  is_following: boolean;
  is_request_sent?: boolean; // 팔로우 요청을 보냈는지 여부
  message: string;
}> {}

// 팔로우 상태 조회 응답
export interface FollowStatusResponse extends ApiResponse<{
  is_following: boolean;  // 내가 상대방을 팔로우하고 있는지
  is_followed_by: boolean; // 상대방이 나를 팔로우하고 있는지 (맞팔)
}> {}

// 페이지네이션 옵션
export interface PaginationOptions {
  cursor?: number;
  limit?: number;
  search?: string;
}

// 팔로우 요청 정보
export interface FollowRequest {
  id: number;
  requester_id: number;
  target_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester: {
    id: number;
    nickname: string;
    profile_img: string | null;
  };
}

// 팔로우 요청 목록 응답
export interface FollowRequestListResponse extends ApiResponse<{
  requests: FollowRequest[];
  next_cursor: number | null;
  has_more: boolean;
}> {}

// 팔로우 요청 액션 응답
export interface FollowRequestActionResponse extends ApiResponse<{
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
}> {}
