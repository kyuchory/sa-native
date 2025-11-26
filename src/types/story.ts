import { ApiResponse } from './api';

// 스토리 생성 요청 (클라이언트에서 파일 URI를 받음)
export interface CreateStoryRequest {
  fileUri: string;
  trimStart?: number; // 자르기 시작 시간 (밀리초) - 영상 파일인 경우
  trimEnd?: number; // 자르기 종료 시간 (밀리초) - 영상 파일인 경우
  cropArea?: { // 크롭 영역 정보 - 영상 파일인 경우
    x: number;
    y: number;
    width: number;
    height: number;
  };
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
  following: StoryListItem[]; // 팔로우한 사용자들의 스토리 배열 (서버에서 정렬된 상태로 제공)
}

// 스토리 목록 조회 API 응답
export type StoryListApiResponse = ApiResponse<StoryListResponse>;

// 스토리 상세 조회 - 현재 스토리 정보
export interface StoryDetail {
  id: number;
  user_id: number;
  username: string;
  profile_img: string;
  type: 'image' | 'video';
  content_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  is_viewed: boolean;
  created_at: string;
}

// 스토리 상세 조회 - 사용자 스토리 리스트 아이템
export interface UserStoryItem {
  id: number;
  user_id: number;
  username: string;
  profile_img: string;
  type: 'image' | 'video';
  content_url: string;
  thumbnail_url?: string | null;
  duration?: number | null;
  is_viewed: boolean;
  created_at: string;
}

// 스토리 상세 조회 - 내비게이션 정보
export interface NavigationInfo {
  next_user_id: number | null;
  prev_user_id: number | null;
  has_next: boolean;
  has_prev: boolean;
}

// 스토리 상세 조회 응답 데이터
export interface StoryDetailResponse {
  current_story: StoryDetail;
  current_user_stories: UserStoryItem[];
  next_user_stories: UserStoryItem[];
  prev_user_stories: UserStoryItem[];
  navigation_info: NavigationInfo;
}

// 스토리 상세 조회 API 응답
export type StoryDetailApiResponse = ApiResponse<StoryDetailResponse>;

// 스토리 진입 정보 조회 응답 데이터
export interface StoryEntryResponse {
  entry_user_id: number;
  redirect_to: string;
}

// 스토리 진입 정보 조회 API 응답
export type StoryEntryApiResponse = ApiResponse<StoryEntryResponse>;

// 사용자 스토리 상세 조회 응답 데이터 (새로운 userId 기반 구조)
export interface UserStoryDetailResponse {
  current_user_stories: UserStoryItem[]; // 현재 사용자의 모든 스토리 (시간순) - direction이 있을 때는 빈 배열
  next_user_stories: UserStoryItem[]; // 다음 사용자의 스토리 (프리페칭용, 빈 배열 가능)
  prev_user_stories: UserStoryItem[]; // 이전 사용자의 스토리 (프리페칭용, 빈 배열 가능)
  navigation_info: NavigationInfo; // 네비게이션 정보
  pagination_info?: { // 초기 조회시에만 제공
    total_users: number; // 총 조회 가능한 유저 수
    current_index: number; // 현재 유저의 인덱스 (0부터 시작)
  };
}

// 사용자 스토리 상세 조회 API 응답
export type UserStoryDetailApiResponse = ApiResponse<UserStoryDetailResponse>;

// 자신의 스토리 상세 조회 응답 데이터
export interface MyStoryDetailResponse {
  current_story: StoryDetail;
  current_user_stories: UserStoryItem[];
  next_user_stories: UserStoryItem[]; // 빈 배열
  prev_user_stories: UserStoryItem[]; // 빈 배열
  navigation_info: NavigationInfo; // 모두 false/null
}

// 자신의 스토리 상세 조회 API 응답
export type MyStoryDetailApiResponse = ApiResponse<MyStoryDetailResponse>;

// 스토리 읽음 처리 응답 데이터
export interface StoryViewResponse {
  story_id: number;
  viewer_id: number;
  viewed_at: string;
}

// 스토리 읽음 처리 API 응답
export type StoryViewApiResponse = ApiResponse<StoryViewResponse>;
