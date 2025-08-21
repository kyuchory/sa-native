// 채팅 API 서비스

import { apiClient } from './apiClient';
import { ChatRoom, ChatRoomsResponse, SingleChatRoomResponse, ApiResponse } from '../types/chat';

/**
 * 채팅 서비스 클래스
 * Socket.io를 사용한 실시간 채팅과 REST API를 제공
 */
export class ChatService {
  // 채팅방 목록 조회
  static async getChatRooms(): Promise<ChatRoom[]> {
    const response = await apiClient.get<ChatRoomsResponse>('/chats');
    return response.data;
  }

  // 1:1 채팅방 생성
  static async createPrivateChat(userId: number): Promise<ChatRoom> {
    const response = await apiClient.post<SingleChatRoomResponse>('/chats/private', { userId });
    return response.data;
  }

  // 그룹 채팅방 생성
  static async createGroupChat(name: string, userIds: number[], avatarUrl?: string): Promise<ChatRoom> {
    const requestData = { name, userIds, ...(avatarUrl && { avatarUrl }) };
    const response = await apiClient.post<SingleChatRoomResponse>('/chats/group', requestData);
    return response.data;
  }

  // 채팅방 나가기
  static async leaveChatRoom(chatRoomId: number): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/chats/${chatRoomId}`);
  }

  // 채팅방 정보 수정 (그룹 채팅만)
  static async updateChatRoom(chatRoomId: number, name: string, avatarUrl?: string): Promise<ChatRoom> {
    const requestData = { name, ...(avatarUrl && { avatarUrl }) };
    const response = await apiClient.put<SingleChatRoomResponse>(`/chats/${chatRoomId}`, requestData);
    return response.data;
  }
}
