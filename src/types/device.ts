import { ApiResponse } from './api';

// 디바이스 정보 타입
export interface Device {
  id: number;
  device_id: string;
  fcm_token: string;
  last_synced_at: string;
}

// FCM 토큰 등록/업데이트 요청 타입
export interface RegisterDeviceRequest {
  device_id: string;
  fcm_token: string;
}

// 디바이스 토큰 삭제 요청 타입 (선택적)
export interface DeleteDeviceRequest {
  device_id?: string;
}

// FCM 토큰 등록/업데이트 응답 데이터 타입
export interface RegisterDeviceResponse {
  ok: true;
}

// 디바이스 토큰 목록 조회 응답 데이터 타입
export interface DeviceListResponse {
  devices: Device[];
}

// 디바이스 토큰 삭제 응답 데이터 타입
export interface DeleteDeviceResponse {
  ok: true;
  deleted_count: number;
}

// API 응답 타입들
export type RegisterDeviceApiResponse = ApiResponse<RegisterDeviceResponse>;
export type DeviceListApiResponse = ApiResponse<DeviceListResponse>;
export type DeleteDeviceApiResponse = ApiResponse<DeleteDeviceResponse>;
