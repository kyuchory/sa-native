// 검색 관련 타입 정의
import type { ApiResponse } from './api';

// 게시글 검색 API 응답
export type PostSearchApiResponse = ApiResponse<PostSearchResponse>;

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

// 게시글 검색 결과 아이템
export interface PostSearchResult {
  id: number;
  title: string;
  content: string;
  created_at: string;
  user: {
    id: number;
    nickname: string;
    profile_img: string | null;
  };
  sub_category: {
    id: number;
    name: string;
    category: {
      id: number;
      name: string;
    };
  };
  like_count: number;
  comment_count: number;
  preview_image: string | null;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

// 게시글 검색 응답
export interface PostSearchResponse {
  posts: PostSearchResult[];
  pagination: SearchPagination;
}

// 게시글 검색 요청 파라미터
export interface PostSearchParams {
  q: string; // 필수, 최소 2자
  offset?: number; // 선택, 기본값 0
  limit?: number; // 선택, 1-50, 기본값 20
}

// 피드 검색 결과 아이템
export interface FeedSearchResult {
  id: number;
  created_at: string;
  preview_image: string | null;
}

// 피드 검색 응답
export interface FeedSearchResponse {
  feeds: FeedSearchResult[];
  pagination: SearchPagination;
}

// 피드 검색 요청 파라미터
export interface FeedSearchParams {
  q: string; // 필수, 최소 2자
  offset?: number; // 선택, 기본값 0
  limit?: number; // 선택, 1-50, 기본값 20
}

// 피드 검색 API 응답
export type FeedSearchApiResponse = ApiResponse<FeedSearchResponse>;
