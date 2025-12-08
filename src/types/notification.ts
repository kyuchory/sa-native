import { ApiResponse } from './api';

// 알림 타입 정의
export type NotificationType = 'followed' | 'feed_liked' | 'post_liked' | 'feed_commented' | 'post_commented' | 'feed_created' | 'post_created' | 'message' | 'short_liked' | 'short_commented' | 'short_created';

// 발신자 정보 인터페이스
export interface NotificationSender {
  id: number;
  nickname: string;
  profile_img: string | null;
}

// 알림 추가 정보 인터페이스들
export interface NotificationFeed {
  id: number;
  content?: string;
  title?: string;
}

export interface NotificationPost {
  id: number;
  title?: string;
  content?: string;
}

export interface NotificationComment {
  content: string;
  preview: string;
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

  // 추가 정보 (선택적)
  feed?: NotificationFeed;
  post?: NotificationPost;
  comment?: NotificationComment;
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

// 헤더 알림 구독 관련 타입
export interface HeaderSubscribeRequest {
  userId: number;
}

export interface HeaderSubscribeResponse {
  success: boolean;
  userId: number;
}

export interface UnreadCountData {
  unread_count: number;
  updated_at: string;
}

// 헤더 구독 이벤트 응답 타입
export type HeaderSubscribeApiResponse = ApiResponse<HeaderSubscribeResponse>;

// 읽지 않은 알림 개수 조회 응답 타입
export interface UnreadCountResponse {
  unread_count: number;
}

// 읽지 않은 알림 개수 조회 API 응답 타입
export type GetUnreadCountApiResponse = ApiResponse<UnreadCountResponse>;

// 알림 설정 인터페이스
export interface NotificationSettings {
  follow_notification: boolean;
  feed_like_notification: boolean;
  post_like_notification: boolean;
  short_like_notification: boolean;
  feed_comment_notification: boolean;
  post_comment_notification: boolean;
  short_comment_notification: boolean;
  dm_notification: boolean;
  feed_created_notification: boolean;
  post_created_notification: boolean;
  short_created_notification: boolean;
}

// 알림 설정 업데이트 인터페이스 (부분 업데이트를 위한 선택적 필드)
export interface NotificationSettingsUpdate {
  follow_notification?: boolean;
  feed_like_notification?: boolean;
  post_like_notification?: boolean;
  short_like_notification?: boolean;
  feed_comment_notification?: boolean;
  post_comment_notification?: boolean;
  short_comment_notification?: boolean;
  dm_notification?: boolean;
  feed_created_notification?: boolean;
  post_created_notification?: boolean;
  short_created_notification?: boolean;
}

// 알림 설정 조회 API 응답 타입
export type GetNotificationSettingsApiResponse = ApiResponse<NotificationSettings>;

// 알림 설정 업데이트 응답 데이터 인터페이스
export interface UpdateNotificationSettingsData {
  success: boolean;
  data: NotificationSettings;
  message: string;
}

// 알림 설정 업데이트 API 응답 타입
export type UpdateNotificationSettingsApiResponse = ApiResponse<UpdateNotificationSettingsData>;
