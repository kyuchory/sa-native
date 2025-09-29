// 고객센터 문의 관련 타입 정의
import { ApiResponse } from './api';

// 문의 상태 타입
export type InquiryStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

// 문의 우선순위 타입
export type InquiryPriority = 'low' | 'normal' | 'high' | 'urgent';

// 첨부파일 정보
export interface InquiryAttachment {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type?: string;
  created_at: string;
}

// 사용자 정보 (문의에서 사용)
export interface InquiryUser {
  id: number;
  nickname: string;
  profile_img?: string;
}

// 문의 작성 요청 데이터
export interface CreateInquiryRequest {
  title: string;
  content: string;
  category?: string;
  priority?: InquiryPriority;
}

// 문의 작성 응답 데이터
export interface CreateInquiryResponse {
  inquiry_id: number;
  title: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  created_at: string;
}

// 문의 작성 API 응답
export type CreateInquiryApiResponse = ApiResponse<CreateInquiryResponse>;

// 문의 목록 조회 요청 데이터 (쿼리 파라미터)
export interface GetInquiriesRequest {
  page?: number;
  limit?: number;
  status?: InquiryStatus;
  priority?: InquiryPriority;
  category?: string;
}

// 문의 목록 아이템
export interface InquiryListItem {
  id: number;
  user_id: number;
  category?: string;
  title: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  created_at: string;
  updated_at: string;
  user: InquiryUser;
  attachment_count: number;
}

// 문의 목록 페이징 정보
export interface InquiryPagination {
  current_page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_prev: boolean;
}

// 문의 목록 조회 응답 데이터
export interface GetInquiriesResponse {
  inquiries: InquiryListItem[];
  pagination: InquiryPagination;
}

// 문의 목록 조회 API 응답
export type GetInquiriesApiResponse = ApiResponse<GetInquiriesResponse>;

// 문의 상세 조회 응답 데이터
export interface GetInquiryDetailResponse {
  id: number;
  user_id: number;
  category?: string;
  title: string;
  content: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  created_at: string;
  updated_at: string;
  user: InquiryUser;
  attachments: InquiryAttachment[];
}

// 문의 상세 조회 API 응답
export type GetInquiryDetailApiResponse = ApiResponse<GetInquiryDetailResponse>;

// 문의 수정 요청 데이터
export interface UpdateInquiryRequest {
  title?: string;
  content?: string;
  category?: string;
  priority?: InquiryPriority;
}

// 문의 수정 응답 데이터
export interface UpdateInquiryResponse {
  id: number;
  title: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  updated_at: string;
}

// 문의 수정 API 응답
export type UpdateInquiryApiResponse = ApiResponse<UpdateInquiryResponse>;

// 문의 삭제 응답 데이터
export interface DeleteInquiryResponse {
  // 삭제 성공 시 data는 null
}

// 문의 삭제 API 응답
export type DeleteInquiryApiResponse = ApiResponse<DeleteInquiryResponse>;
