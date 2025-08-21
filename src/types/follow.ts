// 팔로우 관련 타입 정의 (새로운 API 명세 기반)

// 팔로우 사용자 정보
export interface FollowUser {
  id: number;
  nickname: string;
  profile_img: string | null;
  isFollowing: boolean; // is_following → isFollowing (camelCase)
  created_at: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 페이지네이션 데이터
export interface PaginationData<T> {
  nextCursor: number | null;
  hasMore: boolean;
  following?: T[]; // 팔로잉 목록
  followers?: T[]; // 팔로워 목록
}

// 팔로잉 목록 조회 응답
export interface FollowingListResponse extends ApiResponse<PaginationData<FollowUser>> {}

// 팔로워 목록 조회 응답
export interface FollowerListResponse extends ApiResponse<PaginationData<FollowUser>> {}

// 팔로우/언팔로우 응답
export interface FollowActionResponse extends ApiResponse<{
  isFollowing: boolean;
  message: string;
}> {}

// 팔로우 상태 조회 응답
export interface FollowStatusResponse extends ApiResponse<{
  isFollowing: boolean;  // 내가 상대방을 팔로우하고 있는지
  isFollowedBy: boolean; // 상대방이 나를 팔로우하고 있는지 (맞팔)
}> {}

// 페이지네이션 옵션
export interface PaginationOptions {
  cursor?: number;
  limit?: number;
}
