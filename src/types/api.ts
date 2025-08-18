// 공통 API 응답 타입
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface ApiError {
  code: number;
  message: string;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

// API 상태 타입
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';
