import { ApiResponse } from './api';

// 스토리 생성 요청 (클라이언트에서 파일 URI를 받음)
export interface CreateStoryRequest {
  fileUri: string;
}

// 스토리 생성 응답 데이터
export interface CreateStoryResponse {
  id: number;
  content_url: string;
  type: 'image' | 'video';
  created_at: string;
}

// 스토리 생성 API 응답
export type CreateStoryApiResponse = ApiResponse<CreateStoryResponse>;

// 스토리 정보 (조회 등에 사용)
export interface Story {
  id: number;
  content_url: string;
  type: 'image' | 'video';
  created_at: string;
  expires_at?: string; // 24시간 제한 적용 시간 (옵션)
}

// 스토리 사용자 정보
export interface StoryUser {
  id: number;
  nickname: string;
  profile_img: string | null;
}

// 스토리 목록 아이템 (각 사용자의 최신 스토리 1개씩)
export interface StoryListItem {
  id: number;
  created_at: string;
  user: StoryUser;
  has_unseen_story: boolean; // 안 본 스토리가 있는지 여부
  story_count: number; // 작성자의 총 활성 스토리 개수
}

// 스토리 목록 조회 응답 데이터
export interface StoryListResponse {
  own: StoryListItem[] | null; // 자신의 스토리 (최대 1개, 없으면 null)
  following: Record<string, StoryListItem[]>; // 팔로우한 사용자들의 스토리 객체 (각 사용자 ID별로 1개씩)
}

// 스토리 목록 조회 API 응답
export type StoryListApiResponse = ApiResponse<StoryListResponse>;
