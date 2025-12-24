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

// 카카오 로그인 요청 타입
export interface KakaoLoginRequest {
  accessToken: string;
}

// 카카오 사용자 계정 정보 타입
export interface KakaoUserAccount {
  has_email: boolean;
  email_needs_agreement?: boolean;
  is_email_valid?: boolean;
  is_email_verified?: boolean;
  email?: string;
  has_age_range?: boolean;
  age_range_needs_agreement?: boolean;
  age_range?: string;
  has_birthday?: boolean;
  birthday_needs_agreement?: boolean;
  birthday?: string;
  has_gender?: boolean;
  gender_needs_agreement?: boolean;
  gender?: 'male' | 'female';
}

// 카카오 사용자 정보 타입
export interface KakaoUserInfo {
  id: number;
  connected_at: string;
  kakao_account: KakaoUserAccount;
}

// 카카오 로그인 응답 데이터 타입
export interface KakaoLoginResponseData {
  user: Omit<User, 'bio'>; // bio 제외하고 User 타입 재사용
  tokens: Tokens;
}

// API 응답 타입들
export type SignUpApiResponse = ApiResponse<SignUpResponse>;
export type LoginApiResponse = ApiResponse<LoginResponse>;
export type TokenRefreshApiResponse = ApiResponse<TokenRefreshResponse>;
export type EmailCheckApiResponse = ApiResponse<EmailCheckResponse>;
export type NicknameCheckApiResponse = ApiResponse<NicknameCheckResponse>;
export type LogoutApiResponse = ApiResponse<null>;
export type DeleteAccountApiResponse = ApiResponse<null>;
export type KakaoLoginApiResponse = ApiResponse<KakaoLoginResponseData>;
