import { apiClient } from './apiClient';
import {
  SignUpRequest,
  LoginRequest,
  LogoutRequest,
  SignUpApiResponse,
  LoginApiResponse,
  EmailCheckApiResponse,
  NicknameCheckApiResponse,
  LogoutApiResponse,
} from '../types/auth';

// 인증 관련 API 서비스
export class AuthService {
  // 회원가입
  static async signUp(data: SignUpRequest): Promise<SignUpApiResponse> {
    return apiClient.post<SignUpApiResponse>('/auth/signup', data, false);
  }

  // 로그인
  static async login(data: LoginRequest): Promise<LoginApiResponse> {
    return apiClient.post<LoginApiResponse>('/auth/login', data, false);
  }

  // 로그아웃
  static async logout(data: LogoutRequest = { refreshToken: '' }): Promise<LogoutApiResponse> {
    return apiClient.post<LogoutApiResponse>('/auth/logout', data);
  }

  // 이메일 중복 체크
  static async checkEmail(email: string): Promise<EmailCheckApiResponse> {
    return apiClient.get<EmailCheckApiResponse>(`/auth/check-email?email=${encodeURIComponent(email)}`, false);
  }

  // 닉네임 중복 체크
  static async checkNickname(nickname: string): Promise<NicknameCheckApiResponse> {
    return apiClient.get<NicknameCheckApiResponse>(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`, false);
  }

  // 토큰 재발급
  static async refreshToken(): Promise<string> {
    return apiClient.refreshToken();
  }
}
