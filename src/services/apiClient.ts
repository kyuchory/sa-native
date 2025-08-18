import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAccessToken, getRefreshToken } from '../stores/authStore';
import { getApiConfig } from '../config/api';

// API 기본 설정
const API_BASE_URL = getApiConfig().baseURL;

// HTTP 클라이언트 클래스
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // 기본 헤더 생성
  private async getHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-platform': 'mobile',
    };

    if (includeAuth) {
      const token = getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // GET 요청
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const headers = await this.getHeaders(includeAuth);
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  // POST 요청
  async post<T>(endpoint: string, data: any, includeAuth: boolean = true): Promise<T> {
    const headers = await this.getHeaders(includeAuth);
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  // PUT 요청
  async put<T>(endpoint: string, data: any, includeAuth: boolean = true): Promise<T> {
    const headers = await this.getHeaders(includeAuth);
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  // DELETE 요청
  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const headers = await this.getHeaders(includeAuth);
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  // 응답 처리
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || `HTTP ${response.status}`,
        errorData.errors || []
      );
    }

    return response.json();
  }

  // 토큰 재발급
  async refreshToken(): Promise<string> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-platform': 'mobile',
      'Authorization': `Bearer ${refreshToken}`,
    };

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return data.data.accessToken;
  }
}

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

// API 클라이언트 인스턴스 생성
export const apiClient = new ApiClient(API_BASE_URL);

// 에러 처리 유틸리티
export const handleApiError = (error: any): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
};
