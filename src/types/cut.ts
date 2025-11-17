// 쇼츠(세로형 영상) 관련 타입 정의 - 실제 API 명세 기반

// 쇼츠 카테고리 정보
export interface ShortCategory {
  id: number;
  name: string;
}

// 쇼츠 개별 아이템 (API 명세 기반)
export interface ShortItem {
  id: number;
  user_id: number;
  username: string;
  profile_img: string | null;
  type: 'image' | 'video';
  content_url: string;        // 서버에서 이미 baseUrl 합쳐서 제공
  thumbnail_url?: string;     // 서버에서 이미 baseUrl 합쳐서 제공
  description?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;         // ISO 8601 문자열
  categories: ShortCategory[];
  is_liked: boolean;
  is_bookmarked: boolean;
  is_owner: boolean;
}

// 쇼츠 피드 조회 응답
export interface ShortsFeedResponse {
  code: number;
  message: string;
  data: {
    items: ShortItem[];       // 쇼츠 아이템 배열
    next_cursor: string | null; // 다음 페이지 커서
  };
}

// 쇼츠 좋아요 응답
export interface ShortLikeResponse {
  code: number;
  message: string;
  data: {
    is_liked: boolean;
    like_count: number;
  };
}

// 쇼츠 북마크 응답
export interface ShortBookmarkResponse {
  code: number;
  message: string;
  data: {
    is_bookmarked: boolean;
    bookmark_count: number;
  };
}

// 쇼츠 댓글 정보
export interface ShortComment {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    nickname: string;
    profile_img: string | null;
  };
  like_count: number;
  is_liked: boolean;
  parent_comment_id?: number | null;
  replies?: ShortComment[];
}

// 쇼츠 댓글 목록 조회 응답
export interface ShortCommentsResponse {
  code: number;
  message: string;
  data: ShortComment[];
}

// 쇼츠 댓글 작성 요청
export interface CreateShortCommentRequest {
  content: string;
  parent_comment_id?: number | null;
}

// 쇼츠 공유 요청
export interface ShareShortRequest {
  platform: 'kakao' | 'instagram' | 'facebook' | 'twitter' | 'link';
}

// 쇼츠 업로드 요청 (기존 유지)
export interface ShortUploadRequest {
  file: any; // File object
  type: 'image' | 'video';
  category_ids: number[];
  description?: string;
  tag_ids?: number[];
  trimStart?: number; // milliseconds (video only)
  trimEnd?: number; // milliseconds (video only)
  cropArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 쇼츠 업로드 응답 (기존 유지)
export interface ShortUploadResponse {
  id: number;
  content_url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
  description?: string;
  created_at: string;
}

// 쇼츠 업로드 API 응답 (기존 유지)
export interface ShortUploadApiResponse {
  code: number;
  message: string;
  data: ShortUploadResponse;
}
