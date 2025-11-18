// 게시물 작성 관련 타입 정의
import { ApiResponse } from './api';

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
}

// 🚨 BREAKING CHANGE: post_type과 item_snapshots 필드가 API에서 제거됨
// PostType, ItemOption, ItemInfo, ItemSnapshot 타입 제거됨

// 카테고리 정보
export interface Category {
  id: number;
  name: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
}

// 게시물 작성 요청 데이터
export interface CreatePostRequest {
  title: string;
  sub_category_id: number;
  content_blocks: Omit<ContentBlock, 'id'>[]; // 서버에는 id 제외하고 전송
  tags?: string[];
}

// 게시물 작성 응답 데이터
export interface CreatePostResponse {
  postId: number;
}

// 카테고리 조회 응답 데이터  
export interface CategoriesResponse {
  categories: Category[];
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
  value?: string; // text 타입일 때 필수, image/video에서는 선택
  sequence: number;
  path?: string; // image 타입일 때만 제공 (full URL 대신 경로만)
}

export interface PostTag {
  id: number;
  name: string;
}



// 게시물 상세 정보
export interface PostDetail {
  id: number;
  title: string;
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

// 게시글 수정 요청
export interface UpdatePostRequest {
  title?: string;
  sub_category_id?: number;
  content_blocks?: Omit<ContentBlock, 'id'>[];
  tags?: string[];
}

// 이미지 업로드 관련 타입
export interface UploadedImage {
  filename: string;
  path: string;
  url: string;
  size: number;
}

export interface ImageUploadResponse {
  files: UploadedImage[];
}

// 비디오 업로드 관련 타입
export interface UploadedVideo {
  filename: string;
  path: string;
  url: string;
  size: number;
}

export interface UploadedThumbnail {
  filename: string;
  path: string;
  url: string;
  size: number;
}

export interface VideoUploadResponse {
  video: UploadedVideo;
  thumbnail: UploadedThumbnail | null;
}

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

// 게시글 비디오 편집 업로드 응답 데이터 (새 API: /posts/upload/video/edit)
export interface PostVideoEditUploadResponse {
  editedVideo: {
    filename: string;
    path: string;
    url: string;
    size: number;
  };
  thumbnail: {
    filename: string;
    path: string;
    url: string;
    size: number;
  };
}

// 게시글 비디오 편집 업로드 API 응답
export type PostVideoEditUploadApiResponse = ApiResponse<PostVideoEditUploadResponse>;
