// 채팅 API 서비스

import { apiClient } from './apiClient';
import {
  ChatRoom,
  ChatRoomsResponse,
  SingleChatRoomResponse,
  MessagesResponse,
  ChatRoomDetail,
  ApiResponse,
  RegisterNoticeRequest,
  RegisterNoticeResponse,
  UnreadChatCountResponse
} from '../types/chat';

/**
 * 채팅 서비스 클래스
 * Socket.io를 사용한 실시간 채팅과 REST API를 제공
 */
export class ChatService {
  // 채팅방 목록 조회
  static async getChatRooms(): Promise<ChatRoom[]> {
    const response = await apiClient.get<ChatRoomsResponse>('/chats');
    return response.data; // apiClient가 이미 data를 추출해서 반환
  }

  // 1:1 채팅방 생성
  static async createPrivateChat(userId: number): Promise<ChatRoom> {
    const response = await apiClient.post<SingleChatRoomResponse>('/chats/private', { userId });
    return response.data; // apiClient가 이미 data를 추출해서 반환
  }

  // 그룹 채팅방 생성
  static async createGroupChat(name: string, userIds: number[], avatarUrl?: string): Promise<ChatRoom> {
    const requestData = { name, userIds, ...(avatarUrl && { avatarUrl }) };
    const response = await apiClient.post<SingleChatRoomResponse>('/chats/group', requestData);
    return response.data; // apiClient가 이미 data를 추출해서 반환
  }

  // 채팅방 나가기
  static async leaveChatRoom(chatRoomId: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/chats/${chatRoomId}/members/me`);
  }

  // 채팅방 정보 수정 (그룹 채팅만)
  static async updateChatRoom(chatRoomId: number, name: string, avatarUrl?: string): Promise<ChatRoom> {
    const requestData = { name, ...(avatarUrl && { avatarUrl }) };
    const response = await apiClient.put<SingleChatRoomResponse>(`/chats/${chatRoomId}`, requestData);
    return response.data; // apiClient가 이미 data를 추출해서 반환
  }

  // 채팅 메시지 목록 조회 (페이지네이션)
  static async getMessages(
    chatRoomId: number,
    cursor?: number,
    limit: number = 30
  ): Promise<{ messages: any[]; hasNext: boolean; nextCursor: number | null }> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor.toString());
    params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = `/chats/${chatRoomId}/messages${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<MessagesResponse>(url);
    return response.data; // { messages, hasNext, nextCursor }
  }

  // 채팅방 상세 정보 조회
  static async getChatRoomDetail(chatRoomId: number): Promise<ChatRoomDetail> {
    const response = await apiClient.get<ApiResponse<ChatRoomDetail>>(`/chats/${chatRoomId}`);
    return response.data; // apiClient가 이미 data를 추출해서 반환
  }

  // 채팅 공지사항 등록
  static async registerNotice(chatRoomId: number, request: RegisterNoticeRequest): Promise<RegisterNoticeResponse> {
    const response = await apiClient.post<ApiResponse<RegisterNoticeResponse>>(
      `/chats/${chatRoomId}/notices`,
      request
    );
    return response.data; // apiClient가 이미 data를 추출해서 반환
  }

  // 채팅방 읽음 처리
  static async markAsRead(chatRoomId: number): Promise<{ success: boolean }> {
    const response = await apiClient.patch<ApiResponse<{ success: boolean }>>(`/chats/${chatRoomId}/read`, {});
    return response.data; // { success: boolean }
  }

  // 읽지 않은 채팅방 개수 조회
  static async getUnreadChatCount(): Promise<{ unread_count: number }> {
    const response = await apiClient.get<UnreadChatCountResponse>('/chats/unread-count');
    return response.data; // { unread_count: number }
  }
}
