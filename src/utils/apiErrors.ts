// API 에러 클래스
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Array<{ field: string; message: string }> = []
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API 에러 처리 유틸리티
export const handleApiError = (error: any): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error.message) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
};
