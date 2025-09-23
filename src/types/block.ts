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
