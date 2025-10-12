import { ApiResponse } from './api';

// 스토리 생성 요청 (클라이언트에서 파일 URI를 받음)
export interface CreateStoryRequest {
  fileUri: string;
}

// 스토리 생성 응답 데이터
export interface CreateStoryResponse {
  id: number;
  content_url: string;
  type: 'image' | 'video';
  created_at: string;
}

// 스토리 생성 API 응답
export type CreateStoryApiResponse = ApiResponse<CreateStoryResponse>;

// 스토리 정보 (조회 등에 사용)
export interface Story {
  id: number;
  content_url: string;
  type: 'image' | 'video';
  created_at: string;
  expires_at?: string; // 24시간 제한 적용 시간 (옵션)
}
