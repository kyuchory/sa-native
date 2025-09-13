import { ApiResponse } from './api';

// 알림 타입 정의
export type NotificationType = 'followed' | 'feed_liked' | 'post_liked' | 'feed_commented' | 'post_commented' | 'feed_created' | 'post_created' | 'message';

// 발신자 정보 인터페이스
export interface NotificationSender {
  id: number;
  nickname: string;
  profile_img: string | null;
}

// 알림 인터페이스
export interface Notification {
  id: number;
  type: NotificationType;
  sender: NotificationSender;
  message: string;
  reference_id: number | null;
  is_read: boolean;
  created_at: string; // ISO 8601 포맷
}

// 알림 목록 조회 쿼리 파라미터 인터페이스
export interface GetNotificationsParams {
  offset?: number;
  limit?: number;
  type?: NotificationType;
  is_read?: boolean;
}

// 알림 목록 조회 응답 데이터 인터페이스
export interface NotificationsResponse {
  notifications: Notification[];
  total_count: number;
  unread_count: number;
  has_more: boolean;
}

// 특정 알림들 읽음 처리 요청 데이터 인터페이스
export interface ReadNotificationsRequest {
  notificationIds: number[];
}

// 특정 알림들 읽음 처리 응답 데이터 인터페이스
export interface ReadNotificationsResponse {
  affectedRows: number;
}

// 모든 알림 읽음 처리 응답 데이터 인터페이스
export interface ReadAllNotificationsResponse {
  affectedRows: number;
}

// API 응답 타입
export type GetNotificationsApiResponse = ApiResponse<NotificationsResponse>;
export type ReadNotificationsApiResponse = ApiResponse<ReadNotificationsResponse>;
export type ReadAllNotificationsApiResponse = ApiResponse<ReadAllNotificationsResponse>;
