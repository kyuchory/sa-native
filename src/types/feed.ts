// 피드 관련 타입 정의
import { ApiResponse } from './api';

// 피드 콘텐츠 블록 타입
export type FeedContentBlockType = 'text' | 'image' | 'video';

// 피드 콘텐츠 블록 인터페이스
export interface FeedContentBlock {
  id: number;
  type: FeedContentBlockType;
  value: string;
  sequence: number;
  path?: string;
}

// 피드 작성자 정보
export interface FeedUser {
  id: number;
  nickname: string;
  profile_img: string | null; // 사용자가 프로필 이미지를 설정하지 않은 경우 null
}

// 피드 목록 아이템
export interface FeedListItem {
  id: number;
  created_at: string;
  user: FeedUser;
  content_blocks: FeedContentBlock[];
  media_count: number;
  like_count: number;
  bookmark_count: number;
  comment_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
}

// 피드 목록 페이지네이션
export interface FeedPagination {
  next_cursor: number | null;
  has_next: boolean;
}

// 피드 목록 조회 응답 데이터
export interface FeedListResponse {
  feeds: FeedListItem[];
  pagination: FeedPagination;
}

// 피드 목록 조회 API 응답
export type FeedListApiResponse = ApiResponse<FeedListResponse>;

// 피드 작성 요청 데이터
export interface CreateFeedRequest {
  content_blocks: Array<{
    type: string;
    value: string;
    sequence: number;
  }>;
}

// 피드 작성 응답 데이터
export interface CreateFeedResponse {
  feedId: number;
  created_at: string;
}

// 피드 작성 API 응답
export type CreateFeedApiResponse = ApiResponse<CreateFeedResponse>;

// 피드 수정 요청 데이터 (필요한 필드만 포함)
export interface UpdateFeedRequest {
  content_blocks: Array<{
    type: string;
    value: string;
    sequence: number;
  }>;
}

// 피드 수정 응답 데이터
export interface UpdateFeedResponse {
  id: number;
  updated_at: string;
}

// 피드 수정 API 응답
export type UpdateFeedApiResponse = ApiResponse<UpdateFeedResponse>;

// 피드 좋아요 토글 응답 데이터
export interface ToggleLikeResponse {
  is_liked: boolean;
  like_count: number;
}

// 피드 좋아요 토글 API 응답
export type ToggleLikeApiResponse = ApiResponse<ToggleLikeResponse>;

// 피드 북마크 토글 응답 데이터
export interface ToggleBookmarkResponse {
  is_bookmarked: boolean;
  bookmark_count: number;
}

// 피드 북마크 토글 API 응답
export type ToggleBookmarkApiResponse = ApiResponse<ToggleBookmarkResponse>;

// 댓글 사용자 정보
export interface CommentUser {
  id: number;
  nickname: string;
  profile_img: string | null;
}

// 멘션 대상 사용자 정보
export interface MentionUser {
  id: number;
  nickname: string;
}

// 댓글 데이터 인터페이스
export interface CommentItem {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: CommentUser;
  parent_comment_id: number | null;
  mention_user: MentionUser | null;
  like_count: number;
  is_liked: boolean;
  is_author: boolean;
  is_deleted: boolean;
  replies?: CommentItem[]; // 대댓글 목록
}

// 댓글 목록 조회 응답 데이터
export interface CommentListResponse {
  data: CommentItem[];
}

// 댓글 목록 조회 API 응답
export type CommentListApiResponse = ApiResponse<CommentItem[]>;

// 피드 단일 조회 응답 데이터 (상세 조회용, 모든 이미지 포함)
export interface FeedDetailResponse {
    id: number;
    created_at: string;
    updated_at: string; // 추가된 필드
    user: FeedUser;
    content_blocks: FeedContentBlock[];
    media_count?: number; // 선택 필드로 변경 (API 명세에 따라)
    like_count: number;
    bookmark_count: number;
    comment_count: number;
    is_liked: boolean;
    is_bookmarked: boolean;
    is_author: boolean; // API 명세에 따라 필수 필드
    // 단일 조회 시 모든 콘텐츠 블록 포함
}

// 피드 단일 조회 API 응답
export type FeedDetailApiResponse = ApiResponse<FeedDetailResponse>;

// 댓글 작성 요청 데이터 (API 요청용)
export interface CreateFeedCommentRequest {
  content: string;
  parent_comment_id?: number | null;
  mention_user_id?: number | null;
}

// 댓글 작성 응답 데이터
export interface CreateFeedCommentResponse {
  commentId: number;
  created_at: string;
}

// 댓글 작성 API 응답
export type CreateFeedCommentApiResponse = ApiResponse<CreateFeedCommentResponse>;

// 댓글 수정 요청 데이터
export interface UpdateCommentRequest {
  content: string;
}

// 댓글 수정 응답 데이터
export interface UpdateCommentResponse {
  id: number;
  updated_at: string;
}

// 댓글 수정 API 응답
export type UpdateCommentApiResponse = ApiResponse<UpdateCommentResponse>;

// 댓글 삭제 응답 데이터
export interface DeleteCommentResponse {
  success: boolean;
}

// 댓글 삭제 API 응답
export type DeleteCommentApiResponse = ApiResponse<DeleteCommentResponse>;

// 피드 댓글 좋아요 토글 응답 데이터
export interface ToggleCommentLikeResponse {
  is_liked: boolean;
  like_count: number;
}

// 피드 댓글 좋아요 토글 API 응답
export type ToggleCommentLikeApiResponse = ApiResponse<ToggleCommentLikeResponse>;

// 피드 삭제 응답 (data는 null)
export type DeleteFeedResponse = null;

// 피드 이미지 업로드 파일 정보
export interface FeedUploadedImage {
  filename: string;
  path: string;
  url: string;
  size: number;
}

// 피드 이미지 업로드 응답 데이터
export interface FeedImageUploadResponse {
  files: FeedUploadedImage[];
}

// 피드 이미지 업로드 API 응답
export type FeedImageUploadApiResponse = ApiResponse<FeedImageUploadResponse>;

// 피드 비디오 업로드 파일 정보
export interface FeedUploadedVideo {
  filename: string;
  path: string;
  url: string;
  size: number;
}

// 피드 썸네일 정보
export interface FeedThumbnail {
  path: string;
  url: string;
}

// 피드 비디오 업로드 응답 데이터
export interface FeedVideoUploadResponse {
  video: FeedUploadedVideo;
  thumbnail?: FeedThumbnail;
}

// 피드 비디오 업로드 API 응답
export type FeedVideoUploadApiResponse = ApiResponse<FeedVideoUploadResponse>;