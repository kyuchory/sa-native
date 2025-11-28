import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAccessToken, getRefreshToken, clearTokens, setAccessToken } from '../stores/tokenStore';
import { getApiConfig } from '../config/api';
import { ApiError } from '../utils/apiErrors';

// API 기본 설정
const API_BASE_URL = getApiConfig().baseURL;

// HTTP 클라이언트 클래스
class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false; // 토큰 재발급 중 플래그
  private refreshPromise: Promise<string> | null = null; // 중복 재발급 방지

  constructor(baseURL: string) {
    this.baseURL = baseURL;
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
      await clearTokens();
      // TODO: 네비게이션을 통한 로그인 화면 이동
      // 현재는 콘솔 로그만 출력
      console.log('토큰 만료로 인한 자동 로그아웃');
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
      const token = getAccessToken();
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
  async postFormData<T>(endpoint: string, formData: FormData, includeAuth: boolean = true): Promise<T> {
    const makeRequest = async () => {
      const headers = await this.getHeaders(includeAuth);
      // FormData 전송 시에는 Content-Type을 제거해야 함 (브라우저가 자동으로 설정)
      delete headers['Content-Type'];
      return fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
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

  // 토큰 재발급 (실무용 구현)
  async refreshToken(): Promise<string> {
    // 이미 재발급 중이면 기존 Promise 반환 (중복 호출 방지)
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      await this.forceLogout();
      throw new Error('Refresh token not found');
    }

    this.isRefreshing = true;

    this.refreshPromise = (async () => {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'x-platform': 'mobile',
          'Authorization': `Bearer ${refreshToken}`,
        };

        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers,
        });

        const data = await response.json();

        if (!response.ok) {
          const error = new ApiError(response.status, data.message || 'Token refresh failed', data.errors || []);
          
          // RefreshToken도 만료된 경우 강제 로그아웃
          if (this.isRefreshTokenExpiredError(error)) {
            await this.forceLogout();
          }
          
          throw error;
        }

        const newAccessToken = data.data.accessToken;
        
        // 새 토큰을 AuthStore에 저장
        setAccessToken(newAccessToken);
        console.log('토큰 재발급 성공');
        
        return newAccessToken;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

// API 클라이언트 인스턴스 생성
export const apiClient = new ApiClient(API_BASE_URL);

// apiErrors에서 import하여 재익스포트 (역호환성 유지)
export { ApiError, handleApiError } from '../utils/apiErrors';
