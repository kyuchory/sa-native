import { ApiResponse } from './api';

// 알림 타입 정의
export type NotificationType = 'follow' | 'like' | 'comment' | 'post' | 'message';

// 발신자 정보 인터페이스
export interface NotificationSender {
  id: number;
  nickname: string;
  profileImg: string | null;
}

// 알림 인터페이스
export interface Notification {
  id: number;
  type: NotificationType;
  sender: NotificationSender;
  message: string;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string; // ISO 8601 포맷
}

// 알림 목록 조회 쿼리 파라미터 인터페이스
export interface GetNotificationsParams {
  offset?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
}

// 알림 목록 조회 응답 데이터 인터페이스
export interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

// API 응답 타입
export type GetNotificationsApiResponse = ApiResponse<NotificationsResponse>;
