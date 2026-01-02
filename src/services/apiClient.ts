import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenService } from './tokenService';
import { getApiConfig } from '../config/api';
import { ApiError } from '../utils/apiErrors';

// API 기본 설정
const API_BASE_URL = getApiConfig().baseURL;

// HTTP 클라이언트 클래스
class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false; // 토큰 재발급 중 플래그
  private refreshPromise: Promise<string> | null = null; // 중복 재발급 방지
  private onAuthError?: () => void; // 인증 에러 콜백

  constructor(baseURL: string, options?: { onAuthError?: () => void }) {
    this.baseURL = baseURL;
    this.onAuthError = options?.onAuthError;
  }

  // 토큰 만료 감지
  private isTokenExpiredError(error: ApiError): boolean {
    if (error.status !== 401) return false;
    
    return error.errors.some(err => 
      err.field === 'token' && 
      ['TOKEN_EXPIRED', 'TOKEN_INVALID'].includes(err.message)
    );
  }

  // RefreshToken 만료/무효 감지
  private isRefreshTokenExpiredError(error: ApiError): boolean {
    if (error.status !== 401) return false;
    
    return error.errors.some(err => 
      err.field === 'refreshToken' && 
      ['TOKEN_EXPIRED', 'TOKEN_INVALID'].includes(err.message)
    );
  }

  // 강제 로그아웃 처리
  private async forceLogout(): Promise<void> {
    try {
      // 외부에서 주입받은 콜백 실행
      this.onAuthError?.();
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
    }
  }

  // 기본 헤더 생성
  private async getHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-platform': 'mobile',
    };

    if (includeAuth) {
      const token = tokenService.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // GET 요청
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const makeRequest = async () => {
      const headers = await this.getHeaders(includeAuth);
      return fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers,
      });
    };

    const response = await makeRequest();
    return this.handleResponse<T>(response, includeAuth ? makeRequest : undefined);
  }

  // POST 요청
  async post<T>(endpoint: string, data: any, includeAuth: boolean = true): Promise<T> {
    const makeRequest = async () => {
      const headers = await this.getHeaders(includeAuth);
      return fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
    };

    const response = await makeRequest();
    return this.handleResponse<T>(response, includeAuth ? makeRequest : undefined);
  }

  // FormData 전송용 POST 요청
  async postFormData<T>(endpoint: string, formData: FormData, includeAuth: boolean = true, extraHeaders?: Record<string, string>): Promise<T> {
    const makeRequest = async () => {
      const headers = await this.getHeaders(includeAuth);
      // FormData 전송 시에는 Content-Type을 제거해야 함 (브라우저가 자동으로 설정)
      delete headers['Content-Type'];

      // 추가 헤더가 있으면 병합
      if (extraHeaders) {
        Object.assign(headers, extraHeaders);
      }

      return fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    };

    const response = await makeRequest();
    return this.handleResponse<T>(response, includeAuth ? makeRequest : undefined);
  }

  // FormData 전송용 PUT 요청
  async putFormData<T>(endpoint: string, formData: FormData, includeAuth: boolean = true): Promise<T> {
    const makeRequest = async () => {
      const headers = await this.getHeaders(includeAuth);
      // FormData 전송 시에는 Content-Type을 제거해야 함 (브라우저가 자동으로 설정)
      delete headers['Content-Type'];
      return fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: formData,
      });
    };

    const response = await makeRequest();
    return this.handleResponse<T>(response, includeAuth ? makeRequest : undefined);
  }

  // PUT 요청
  async put<T>(endpoint: string, data: any, includeAuth: boolean = true): Promise<T> {
    const makeRequest = async () => {
      const headers = await this.getHeaders(includeAuth);
      return fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
    };

    const response = await makeRequest();
    return this.handleResponse<T>(response, includeAuth ? makeRequest : undefined);
  }

  // PATCH 요청
  async patch<T>(endpoint: string, data: any, includeAuth: boolean = true): Promise<T> {
    const makeRequest = async () => {
      const headers = await this.getHeaders(includeAuth);
      return fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
    };

    const response = await makeRequest();
    return this.handleResponse<T>(response, includeAuth ? makeRequest : undefined);
  }

  // DELETE 요청
  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const makeRequest = async () => {
      const headers = await this.getHeaders(includeAuth);
      return fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
    };

    const response = await makeRequest();
    return this.handleResponse<T>(response, includeAuth ? makeRequest : undefined);
  }

  // 응답 처리 (Response Interceptor 포함)
  private async handleResponse<T>(response: Response, originalRequest?: () => Promise<Response>): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new ApiError(
        response.status,
        errorData.message || `HTTP ${response.status}`,
        errorData.errors || []
      );

      // 토큰 만료 에러 감지 및 자동 재발급
      if (this.isTokenExpiredError(error) && originalRequest) {
        try {
          console.log('토큰 만료 감지, 자동 재발급 시도...');
          
          // 토큰 재발급
          await this.refreshToken();
          
          // 원래 요청 재시도
          console.log('토큰 재발급 완료, 원래 요청 재시도...');
          const retryResponse = await originalRequest();
          
          // 재시도 응답 처리 (무한 루프 방지를 위해 originalRequest는 전달하지 않음)
          return this.handleResponse<T>(retryResponse);
          
        } catch (refreshError) {
          console.error('토큰 재발급 실패:', refreshError);
          await this.forceLogout();
          // 재발급 실패 시 원래 에러를 그대로 throw
          throw error;
        }
      }

      throw error;
    }

    return response.json();
  }

  // 토큰 재발급 (토큰 서비스로 위임)
  async refreshToken(): Promise<string> {
    return tokenService.refreshToken();
  }
}

// API 클라이언트 인스턴스 생성 (콜백은 나중에 주입)
export let apiClient = new ApiClient(API_BASE_URL);

// 콜백 주입 함수
export const setApiClientAuthErrorHandler = (onAuthError: () => void) => {
  apiClient = new ApiClient(API_BASE_URL, { onAuthError });
};

// apiErrors에서 import하여 재익스포트 (역호환성 유지)
export { ApiError, handleApiError } from '../utils/apiErrors';
