// 프로필 관련 타입 정의

// 프로필 관계 정보
export interface ProfileRelation {
  is_me: boolean;
  is_following: boolean;
  is_followed_by: boolean;
  is_request_sent?: boolean;
  is_request_received?: boolean;
  request_status?: 'pending' | 'accepted' | 'rejected';
  can_send_request?: boolean;
}

// 프로필 기본 정보
export interface Profile {
  id: number;
  nickname: string;
  profile_img: string | null;
  bio: string | null;
  profile_visibility: 'public' | 'followers';
  created_at: string;
  stats: ProfileStats;
  relation?: ProfileRelation;
  can_view_content: boolean;
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
  bio?: string;
}

// 프로필 편집 응답 데이터
export interface UpdateProfileResponse {
  id: number;
  nickname: string;
  profile_img: string | null;
  bio: string | null;
  updated_at: string;
}

// 프로필 공개여부 수정 요청 데이터
export interface UpdateProfileVisibilityRequest {
  profile_visibility: 'public' | 'followers';
}

// 프로필 공개여부 수정 응답 데이터
export interface UpdateProfileVisibilityResponse {
  id: number;
  nickname: string;
  profile_img: string | null;
  bio: string | null;
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

// 프로필 공개여부 수정 응답
export interface UpdateProfileVisibilityApiResponse {
  code: number;
  message: string;
  data: UpdateProfileVisibilityResponse;
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
  preview_content_type?: string;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

// 쇼츠 목록 아이템 (프로필용)
export interface ProfileShortItem {
  id: number;
  thumbnail_url: string;
  created_at: string;
}

// 피드 목록 아이템 (프로필용)
export interface ProfileFeedItem {
  id: number;
  created_at: string;
  preview_image: string | null;
  preview_content_type?: string;
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

// 쇼츠 목록 조회 응답
export interface ProfileShortsResponse {
  code: number;
  message: string;
  data: {
    shorts: ProfileShortItem[];
    next_cursor: string;
  };
}

// 프로필 이미지 업로드 관련 타입 (업로드와 동시에 DB 저장 완료)
export interface ProfileImageUploadResponse {
  id: number;
  nickname: string;
  profile_img: string | null;
  bio: string | null;
  updated_at: string;
}

// 업로드된 이미지 정보 (post.ts의 UploadedImage와 동일)
export interface UploadedImage {
  filename: string;
  path: string;
  url: string;
  size: number;
}
