import { apiClient } from './apiClient';
import {
  Notification,
  GetNotificationsParams,
  GetNotificationsApiResponse,
  NotificationsResponse,
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
}
