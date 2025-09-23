// 사용자 차단 관련 타입 정의
import { ApiResponse } from './api';

// 사용자 차단 요청 데이터
export interface BlockUserRequest {
  blocked_id: number;
}

// 사용자 차단 응답 데이터
export interface BlockUserResponse {
  block_id: number;
}

// 사용자 차단 API 응답
export type BlockUserApiResponse = ApiResponse<BlockUserResponse>;

// 차단된 사용자 정보
export interface BlockedUser {
  id: number;
  nickname: string;
  profile_img: string | null;
  blocked_at: string;
}

// 차단한 사용자 목록 조회 응답 데이터
export interface BlockedUsersListResponse {
  blocked_users: BlockedUser[];
  total_count: number;
  has_more: boolean;
}

// 차단한 사용자 목록 조회 API 응답
export type BlockedUsersListApiResponse = ApiResponse<BlockedUsersListResponse>;

// 사용자 차단 해제 응답 데이터
export interface UnblockUserResponse {
  success: boolean;
}

// 사용자 차단 해제 API 응답
export type UnblockUserApiResponse = ApiResponse<UnblockUserResponse>;
