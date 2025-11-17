// 컷(세로형 쇼츠) 관련 타입 정의

// 컷 사용자 정보
export interface CutUser {
  id: number;
  nickname: string;
  profile_img: string | null;
}

// 컷 정보
export interface Cut {
  id: number;
  title: string;
  description: string;
  image_url: string; // 임시로 이미지 사용 (추후 video_url로 변경)
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  user: CutUser;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  is_liked?: boolean;
  duration?: number; // 영상 길이 (초)
  tags?: string[];
}

// 컷 목록 조회 응답
export interface CutsResponse {
  code: number;
  message: string;
  data: {
    cuts: Cut[];
    has_next: boolean;
    next_cursor?: string;
  };
}

// 컷 좋아요 응답
export interface CutLikeResponse {
  code: number;
  message: string;
  data: {
    is_liked: boolean;
    like_count: number;
  };
}

// 컷 댓글 정보
export interface CutComment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: CutUser;
  like_count: number;
  is_liked?: boolean;
  parent_comment_id?: number | null;
  replies?: CutComment[];
}

// 컷 댓글 목록 조회 응답
export interface CutCommentsResponse {
  code: number;
  message: string;
  data: CutComment[];
}

// 컷 댓글 작성 요청
export interface CreateCutCommentRequest {
  content: string;
  parent_comment_id?: number | null;
}

// 컷 공유 요청
export interface ShareCutRequest {
  platform: 'kakao' | 'instagram' | 'facebook' | 'twitter' | 'link';
}

// 컷 업로드 요청
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

// 컷 업로드 응답
export interface ShortUploadResponse {
  id: number;
  content_url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
  description?: string;
  created_at: string;
}

// 컷 업로드 API 응답
export interface ShortUploadApiResponse {
  code: number;
  message: string;
  data: ShortUploadResponse;
}
