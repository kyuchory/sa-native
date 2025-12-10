// 인기 콘텐츠 관련 타입 정의 - API 스펙에 맞는 독립적인 타입들
import { ApiResponse } from './api';

// 인기 게시물 아이템
export interface PopularPostItem {
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
  bookmark_count: number;
  preview_image: string | null;
}

// 인기 쇼츠 아이템 (API 스펙에 맞춤)
export interface PopularShortItem {
  id: number;
  user: {
    id: number;
    nickname: string;
    profile_img: string | null;
  };
  type: string; // "image" | "video"
  thumbnail_url: string;
  content_url: string;
  description: string | null;
  duration_seconds: number;
  view_count: number;
  like_count: number;
  comment_count: number;
}

// 인기 사용자 아이템
export interface PopularUserItem {
  id: number;
  nickname: string;
  profile_img: string | null;
  follower_count: number;
}

// 인기 피드 아이템
export interface PopularFeedItem {
  id: number;
  created_at: string;
  user: {
    id: number;
    nickname: string;
    profile_img: string | null;
  };
  preview_image: string | null;
  preview_content_type: string | null;
  like_count: number;
  bookmark_count: number;
  comment_count: number;
}

// 인기 컨텐츠 조회 응답 데이터
export interface PopularData {
  popular_posts: PopularPostItem[];
  popular_shorts: PopularShortItem[];
  popular_users: PopularUserItem[];
  popular_feeds: PopularFeedItem[];
}

// 인기 컨텐츠 조회 전체 응답
export interface PopularResponse {
  code: number;
  message: string;
  data: PopularData;
}

// 인기 컨텐츠 조회 API 응답
export type PopularApiResponse = PopularResponse;
