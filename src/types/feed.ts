// 피드 관련 타입 정의
import { ApiResponse } from './api';

// 피드 콘텐츠 블록 타입
export type FeedContentBlockType = 'text' | 'image' | 'video';

// 피드 콘텐츠 블록 인터페이스
export interface FeedContentBlock {
  type: FeedContentBlockType;
  value: string;
  sequence: number;
}

// 피드 작성자 정보
export interface FeedUser {
  id: number;
  nickname: string;
  profile_img: string;
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

// 피드 좋아요 토글 응답 데이터
export interface ToggleLikeResponse {
  is_liked: boolean;
  like_count: number;
}

// 피드 좋아요 토글 API 응답
export type ToggleLikeApiResponse = ApiResponse<ToggleLikeResponse>;

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
    user: FeedUser;
    content_blocks: FeedContentBlock[];
    media_count: number;
    like_count: number;
    bookmark_count: number;
    comment_count: number;
    is_liked: boolean;
    is_bookmarked: boolean;
    is_author: boolean;
    // 단일 조회 시 모든 콘텐츠 블록 포함
}

// 피드 단일 조회 API 응답
export type FeedDetailApiResponse = ApiResponse<FeedDetailResponse>;

// 댓글 작성 요청 데이터
export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: number | null;
  mention_user_id?: number | null;
}

// 댓글 작성 응답 데이터
export interface CreateCommentResponse {
  comment: CommentItem;
}

// 댓글 작성 API 응답
export type CreateCommentApiResponse = ApiResponse<CreateCommentResponse>;

// 댓글 수정 요청 데이터
export interface UpdateCommentRequest {
  content: string;
}

// 댓글 수정 API 응답
export type UpdateCommentApiResponse = ApiResponse<CommentItem>;

// 댓글 삭제 응답 데이터
export interface DeleteCommentResponse {
  success: boolean;
}

// 댓글 삭제 API 응답
export type DeleteCommentApiResponse = ApiResponse<DeleteCommentResponse>;
