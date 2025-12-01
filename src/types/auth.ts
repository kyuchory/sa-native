import { ApiResponse } from './api';

// 사용자 정보 타입
export interface User {
  id: number;
  email: string;
  nickname: string;
  profile_img: string | null;
  bio: string | null;
}

// 토큰 타입
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// 회원가입 요청 타입
export interface SignUpRequest {
  email: string;
  password: string;
  nickname: string;
}

// 로그인 요청 타입
export interface LoginRequest {
  email: string;
  password: string;
}

// 회원가입 응답 타입
export interface SignUpResponse {
  userId: number;
  email: string;
  nickname: string;
}

// 로그인 응답 타입 (모바일)
export interface LoginResponse {
  user: User;
  tokens: Tokens;
}

// 토큰 재발급 응답 타입
export interface TokenRefreshResponse {
  accessToken: string;
}

// 이메일 중복 체크 응답 타입
export interface EmailCheckResponse {
  isAvailable: boolean;
}

// 닉네임 중복 체크 응답 타입
export interface NicknameCheckResponse {
  isAvailable: boolean;
}

// 로그아웃 요청 타입
export interface LogoutRequest {
  refreshToken: string;
  deviceId?: string;
}

// API 응답 타입들
export type SignUpApiResponse = ApiResponse<SignUpResponse>;
export type LoginApiResponse = ApiResponse<LoginResponse>;
export type TokenRefreshApiResponse = ApiResponse<TokenRefreshResponse>;
export type EmailCheckApiResponse = ApiResponse<EmailCheckResponse>;
export type NicknameCheckApiResponse = ApiResponse<NicknameCheckResponse>;
export type LogoutApiResponse = ApiResponse<null>;
