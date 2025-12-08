import { apiClient } from './apiClient';
import {
  Notification,
  GetNotificationsParams,
  GetNotificationsApiResponse,
  NotificationsResponse,
  ReadNotificationsRequest,
  ReadNotificationsApiResponse,
  ReadAllNotificationsApiResponse,
  GetUnreadCountApiResponse,
  GetNotificationSettingsApiResponse,
  NotificationSettingsUpdate,
  UpdateNotificationSettingsApiResponse,
} from '../types/notification';

// 알림 관련 API 서비스
export class NotificationService {
  // 알림 목록 조회
  static async getNotifications(params: GetNotificationsParams = {}): Promise<GetNotificationsApiResponse> {
    const { offset = 0, limit = 20, type, is_read } = params;

    // 쿼리 파라미터 구성
    const queryParams = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });

    if (type) {
      queryParams.append('type', type);
    }

    if (is_read !== undefined) {
      queryParams.append('is_read', is_read.toString());
    }

    const endpoint = `/notifications?${queryParams.toString()}`;

    return apiClient.get<GetNotificationsApiResponse>(endpoint);
  }

  // 특정 알림들 읽음 처리
  static async read(notificationIds: number[]): Promise<ReadNotificationsApiResponse> {
    const request: ReadNotificationsRequest = { notificationIds };

    return apiClient.patch<ReadNotificationsApiResponse>('/notifications/read', request);
  }

  // 모든 알림 읽음 처리
  static async readAll(): Promise<ReadAllNotificationsApiResponse> {
    return apiClient.patch<ReadAllNotificationsApiResponse>('/notifications/read-all', {});
  }

  // 읽지 않은 알림 개수 조회
  static async getUnreadCount(): Promise<GetUnreadCountApiResponse> {
    return apiClient.get<GetUnreadCountApiResponse>('/notifications/unread-count');
  }

  // 알림 설정 조회
  static async getNotificationSettings(): Promise<GetNotificationSettingsApiResponse> {
    return apiClient.get<GetNotificationSettingsApiResponse>('/notification-settings');
  }

  // 알림 설정 업데이트
  static async updateNotificationSettings(settings: NotificationSettingsUpdate): Promise<UpdateNotificationSettingsApiResponse> {
    return apiClient.put<UpdateNotificationSettingsApiResponse>('/notification-settings', settings);
  }
}
