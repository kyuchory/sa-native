// 프로필 관련 타입 정의

// 프로필 기본 정보
export interface Profile {
  id: number;
  nickname: string;
  profile_img: string | null;
  created_at: string;
  stats: ProfileStats;
}

// 프로필 통계 정보
export interface ProfileStats {
  post_count: number;
  feed_count: number;
  follower_count: number;
  following_count: number;
}

// 프로필 편집 요청 데이터
export interface UpdateProfileRequest {
  nickname?: string;
  profile_img?: string;
}

// 프로필 편집 응답 데이터
export interface UpdateProfileResponse {
  id: number;
  nickname: string;
  profile_img: string | null;
  updated_at: string;
}

// 프로필 기본 정보 조회 응답
export interface ProfileResponse {
  code: number;
  message: string;
  data: Profile;
}

// 프로필 편집 응답
export interface UpdateProfileApiResponse {
  code: number;
  message: string;
  data: UpdateProfileResponse;
}

// 게시글 목록 아이템 (프로필용)
export interface ProfilePostItem {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
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
  is_liked: boolean;
  is_bookmarked: boolean;
}

// 피드 목록 아이템 (프로필용)
export interface ProfileFeedItem {
  id: number;
  created_at: string;
  preview_image: string;
}

// 페이지네이션 정보
export interface ProfilePagination {
  offset: number;
  limit: number;
  total: number;
  has_next: boolean;
}

// 게시글 목록 조회 응답
export interface ProfilePostsResponse {
  code: number;
  message: string;
  data: {
    posts: ProfilePostItem[];
    pagination: ProfilePagination;
  };
}

// 피드 목록 조회 응답
export interface ProfileFeedsResponse {
  code: number;
  message: string;
  data: {
    feeds: ProfileFeedItem[];
    pagination: ProfilePagination;
  };
}
