import { apiClient, ApiError } from './apiClient';
import { getApiConfig } from '../config/api';
import { getAccessToken } from '../stores/authStore';
import {
  RegisterDeviceRequest,
  DeleteDeviceRequest,
  RegisterDeviceApiResponse,
  DeviceListApiResponse,
  DeleteDeviceApiResponse,
} from '../types/device';

const API_BASE_URL = getApiConfig().baseURL;

// 디바이스 토큰 관리 API 서비스
export class DeviceService {
  // FCM 토큰 등록/업데이트
  static async registerDevice(data: RegisterDeviceRequest): Promise<RegisterDeviceApiResponse> {
    return apiClient.post<RegisterDeviceApiResponse>('/devices', data);
  }

  // 사용자 디바이스 토큰 목록 조회
  static async getDeviceList(): Promise<DeviceListApiResponse> {
    return apiClient.get<DeviceListApiResponse>('/devices');
  }

  // 단일 디바이스 토큰 삭제
  static async deleteDevice(deviceId: string): Promise<DeleteDeviceApiResponse> {
    return apiClient.delete<DeleteDeviceApiResponse>(`/devices/${deviceId}`);
  }

  // 디바이스 토큰 삭제 (단일 또는 전체 삭제)
  static async deleteDevices(data?: DeleteDeviceRequest): Promise<DeleteDeviceApiResponse> {
    if (data && data.device_id) {
      // 특정 디바이스만 삭제
      return apiClient.delete<DeleteDeviceApiResponse>(`/devices/${data.device_id}`);
    } else {
      // 모든 디바이스 삭제 - 커스텀 DELETE 요청
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-platform': 'mobile',
      };

      const token = getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/devices`, {
        method: 'DELETE',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

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
  }
}
