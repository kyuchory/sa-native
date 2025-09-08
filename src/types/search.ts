// 검색 관련 타입 정의
import type { ApiResponse } from './api';

// 사용자 검색 API 응답
export type UserSearchApiResponse = ApiResponse<UserSearchResponse>;

// 사용자 검색 결과 항목
export interface UserSearchResult {
  id: number;
  nickname: string;
  profile_img: string | null;
  is_following: boolean;
}

// 사용자 검색 응답
export interface UserSearchResponse {
  users: UserSearchResult[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    has_next: boolean;
  };
}

// 사용자 검색 요청 파라미터
export interface UserSearchParams {
  nickname: string; // 필수, 최소 2자
  offset?: number; // 선택, 기본값 0
  limit?: number; // 선택, 1-50, 기본값 20
}

// 검색 서비스 클래스에서 사용할 공통 타입
export type SearchPagination = {
  offset: number;
  limit: number;
  total: number;
  has_next: boolean;
};
