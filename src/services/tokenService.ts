import { useTokenStore } from '../stores/tokenStore';
import { getApiConfig } from '../config/api';
import { ApiError } from '../utils/apiErrors';

// 토큰 서비스 클래스
export class TokenService {
  private static instance: TokenService;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {}

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  // 액세스 토큰 가져오기
  getAccessToken(): string | null {
    return useTokenStore.getState().tokens?.accessToken || null;
  }

  // 리프레시 토큰 가져오기
  getRefreshToken(): string | null {
    return useTokenStore.getState().tokens?.refreshToken || null;
  }

  // 토큰 설정
  setTokens(accessToken: string, refreshToken: string): void {
    useTokenStore.getState().setTokens({ accessToken, refreshToken });
  }

  // 액세스 토큰만 설정
  setAccessToken(accessToken: string): void {
    useTokenStore.getState().setAccessToken(accessToken);
  }

  // 토큰 클리어
  clearTokens(): void {
    useTokenStore.getState().clearTokens();
  }

  // 토큰 리프레시
  async refreshToken(): Promise<string> {
    // 이미 리프레시 중이면 기존 Promise 반환 (중복 호출 방지)
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      await this.clearTokens();
      throw new Error('Refresh token not found');
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  // 실제 토큰 리프레시 수행
  private async performTokenRefresh(refreshToken: string): Promise<string> {
    const API_BASE_URL = getApiConfig().baseURL;

    const headers = {
      'Content-Type': 'application/json',
      'x-platform': 'mobile',
      'Authorization': `Bearer ${refreshToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new ApiError(response.status, data.message || 'Token refresh failed', data.errors || []);

      // RefreshToken도 만료된 경우 토큰 클리어
      if (this.isRefreshTokenExpiredError(error)) {
        await this.clearTokens();
      }

      throw error;
    }

    const newAccessToken = data.data.accessToken;

    // 새 토큰 저장 (실제 액세스 토큰만 업데이트)
    await this.setAccessToken(newAccessToken);

    console.log('토큰 재발급 성공');
    return newAccessToken;
  }

  // RefreshToken 만료 감지
  private isRefreshTokenExpiredError(error: ApiError): boolean {
    if (error.status !== 401) return false;

    return error.errors.some(err =>
      err.field === 'refreshToken' &&
      ['TOKEN_EXPIRED', 'TOKEN_INVALID'].includes(err.message)
    );
  }

  // 토큰 존재 여부 확인
  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }

  // 토큰 유효성 기본 검증 (길이만)
  isTokenValid(token?: string): boolean {
    return !!(token && token.length > 10);
  }
}

// 싱글톤 인스턴스 (편의용)
export const tokenService = TokenService.getInstance();

// 편의 함수들 (하위 호환성 유지)
export const getAccessToken = () => tokenService.getAccessToken();
export const getRefreshToken = () => tokenService.getRefreshToken();
export const setAccessToken = (accessToken: string) => tokenService.setAccessToken(accessToken);
export const clearTokens = () => tokenService.clearTokens();
