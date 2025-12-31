// 게시물 작성 관련 타입 정의
import { ApiResponse } from './api';

// 동물 타입 enum
export type AnimalType = 'dog' | 'cat' | 'small_pet' | 'bird' | 'reptile' | 'fish' | 'other';

// 동물 타입 옵션
export interface AnimalTypeOption {
  value: AnimalType;
  label: string;
}

// 동물 타입 목록 조회 응답
export interface AnimalTypesResponse {
  animal_types: AnimalTypeOption[];
}

// 콘텐츠 블록 타입
export type ContentBlockType = 'text' | 'image' | 'video';

// 콘텐츠 블록 인터페이스
export interface ContentBlock {
  id: string; // 클라이언트 사이드에서 관리용 ID
  type: ContentBlockType;
  value: string;
  sequence: number;
  originalValue?: string; // 서버 제출용 원래 value
  thumbnailPath?: string; // 서버 제출용 썸네일 경로 (비디오 블록용)
  editInfo?: { // 비디오 편집 정보
    trimStart: number;
    trimEnd: number;
    cropArea: { x: number; y: number; width: number; height: number };
  };
}

// 🚨 BREAKING CHANGE: post_type과 item_snapshots 필드가 API에서 제거됨
// PostType, ItemOption, ItemInfo, ItemSnapshot 타입 제거됨

// 카테고리 정보
export interface Category {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// 게시물 작성 요청 데이터
export interface CreatePostRequest {
  title: string;
  sub_category_id: number;
  animal_type: AnimalType;
  content_blocks: Omit<ContentBlock, 'id'>[]; // 서버에는 id 제외하고 전송
  tags?: string[];
}

// 게시물 작성 응답 데이터
export interface CreatePostResponse {
  postId: number;
}

// 게시물 상세 조회 관련 타입
export interface PostDetailUser {
  id: number;
  nickname: string;
  profile_img: string | null;
}

export interface PostDetailSubCategory {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
}

export interface PostDetailContentBlock {
  type: ContentBlockType;
  value: string; // text: 내용, image/video: URL
  sequence: number;
  path?: string; // image 타입일 때 상대 경로
  thumbnail_path?: string; // video 타입일 때 썸네일 URL
}

export interface PostTag {
  id: number;
  name: string;
}



// 게시물 상세 정보
export interface PostDetail {
  id: number;
  title: string;
  animal_type: AnimalType;
  created_at: string;
  updated_at: string;
  user: PostDetailUser;
  sub_category: PostDetailSubCategory;
  content_blocks: PostDetailContentBlock[];
  tags: PostTag[];
  like_count: number;
  bookmark_count: number;
  comment_count: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  is_author?: boolean; // 게시글 작성자 여부 (로그인 시에만 제공)
}

// 게시물 상세 조회 응답
export interface PostDetailResponse {
  code: number;
  message: string;
  data: PostDetail;
}

// 댓글 관련 타입
export interface CommentUser {
  id: number;
  nickname: string;
  profile_img: string | null;
}

export interface MentionUser {
  id: number;
  nickname: string;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: CommentUser;
  parent_comment_id: number | null;
  mention_user: MentionUser | null;
  like_count: number;
  is_liked?: boolean;
  is_author?: boolean;
  is_deleted: boolean;
  replies?: Comment[];
}

// 댓글 목록 조회 응답
export interface CommentsResponse {
  items: Comment[];
  next_cursor: string | null;
}

// 댓글 작성 요청
export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: number | null;
  mention_user_id?: number | null;
}

// 댓글 수정 요청
export interface UpdateCommentRequest {
  content: string;
}

// 댓글 삭제 요청 (소프트 삭제)
export interface DeleteCommentRequest {
  is_deleted: true;
}

// 댓글 좋아요 응답
export interface CommentLikeResponse {
  code: number;
  message: string;
  data: {
    is_liked: boolean;
    like_count: number;
  };
}

// ==============================================
// 🆕 새로운 API 명세에 맞는 타입 정의들
// ==============================================

// 게시글 목록 조회용 타입
export interface PostListItem {
  id: number;
  title: string;
  animal_type: AnimalType;
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
  is_liked: boolean;
  is_bookmarked: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PostListResponse {
  posts: PostListItem[];
  pagination: Pagination;
}

// 게시글 수정 요청 (기존)
export interface UpdatePostRequest {
  title?: string;
  sub_category_id?: number;
  animal_type?: AnimalType;
  content_blocks?: Omit<ContentBlock, 'id'>[];
  tags?: string[];
}

// 게시물 수정 (통합 파일 업로드) 요청
export interface UpdatePostWithFilesRequest {
  title: string;
  sub_category_id: number;
  animal_type: AnimalType;
  content_blocks: UpdatePostContentBlock[];
  tags?: string[];
}

// 서버 전송용 콘텐츠 블록 (게시물 수정)
export interface UpdatePostContentBlock {
  type: ContentBlockType;
  value: string | null; // 기존 파일 URL 또는 null (새 파일)
  sequence: number;
  editInfo?: VideoEditInfo;
  thumbnail_url?: string; // 비디오 썸네일 URL
}

// 비디오 편집 정보
export interface VideoEditInfo {
  trimStart: number;
  trimEnd: number;
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// 이미지 업로드 관련 타입 (더 이상 사용하지 않음 - 통합 API로 대체)
// export interface UploadedImage { ... }
// export interface ImageUploadResponse { ... }
// export interface UploadedVideo { ... }
// export interface UploadedThumbnail { ... }
// export interface VideoUploadResponse { ... }

// 게시글 좋아요 토글 응답
export interface PostLikeResponse {
  code: number;
  message: string;
  data: {
    is_liked: boolean;
    like_count: number;
  };
}

// 게시글 북마크 토글 응답
export interface PostBookmarkResponse {
  code: number;
  message: string;
  data: {
    is_bookmarked: boolean;
    bookmark_count: number;
  };
}

// 게시글 삭제 응답 (data는 null)
export type DeletePostResponse = null;

// 게시글 수정 응답 (data는 null)
export type UpdatePostResponse = null;

// 게시글 비디오 편집 업로드 관련 타입 (더 이상 사용하지 않음 - 통합 API로 대체)
// export interface PostVideoEditUploadResponse { ... }
// export type PostVideoEditUploadApiResponse = ApiResponse<PostVideoEditUploadResponse>;

// 게시글 북마크 목록 아이템
export interface BookmarkPostListItem {
  id: number;
  title: string;
  animal_type: AnimalType;
  created_at: string;
  created_at_bookmark: string;
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
  bookmark_count: number;
  comment_count: number;
  preview_image: string | null;
  is_liked?: boolean; // 로그인 시에만 제공
  is_bookmarked?: boolean; // 로그인 시에만 제공
}

// 게시글 북마크 목록 조회 응답 데이터
export interface BookmarkPostListResponse {
  items: BookmarkPostListItem[];
  next_cursor: string | null;
}

// 게시글 북마크 목록 조회 API 응답
export type BookmarkPostListApiResponse = ApiResponse<BookmarkPostListResponse>;
