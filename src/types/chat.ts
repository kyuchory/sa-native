// 채팅 관련 타입 정의 (API 명세서 기반)

// 채팅 타입
export type ChatType = 'private' | 'group'; // API 명세에 맞게 수정

// 메시지 타입
export type MessageType = 'text' | 'image' | 'video'; // API 명세에 맞게 수정

// 채팅 참여자 정보 (간소화)
export interface ChatUser {
  id: number;
  nickname: string;
  profile_img: string | null;
}

// 마지막 메시지 정보 (API 응답 형식)
export interface LastMessage {
  id: number;
  content: string;
  type: MessageType;
  sender_id: number;
  created_at: string;
}

// 채팅방 정보 (API 응답 형식에 맞게 수정)
export interface ChatRoom {
  id: number;
  name: string | null; // private 채팅은 null, group 채팅은 필수
  type: ChatType; // chat_type에서 type으로 변경
  avatar_url: string | null; // profile_img에서 avatar_url로 변경
  created_at: string;
  memberCount: number; // 새로 추가
  lastMessage: LastMessage | null; // last_message에서 lastMessage로 변경
  
  // 클라이언트에서 추가로 계산되는 필드들
  participants?: ChatUser[]; // 필요시 별도 API로 조회
  unread_count?: number; // 별도 API로 조회하거나 계산
}

// 기존 Message 인터페이스는 상세 채팅에서 사용
export interface Message {
  id: number;
  content: string;
  message_type: MessageType;
  created_at: string;
  updated_at: string;
  sender: ChatUser;
  is_read: boolean;
}

// API 응답 타입
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 채팅방 목록 조회 응답
export interface ChatRoomsResponse extends ApiResponse<ChatRoom[]> {}

// 단일 채팅방 응답
export interface SingleChatRoomResponse extends ApiResponse<ChatRoom> {}

// 메시지 목록 조회 응답
export interface MessagesResponse {
  code: number;
  message: string;
  data: Message[];
}

// 메시지 전송 요청
export interface SendMessageRequest {
  content: string;
  message_type: MessageType;
}

// 채팅방 생성 요청
export interface CreateChatRoomRequest {
  name?: string; // 그룹 채팅방 이름 (옵션)
  chat_type: ChatType;
  participant_ids: number[];
  profile_img?: string; // 그룹 채팅방 프로필 이미지 (옵션)
}

// 채팅 요청 상태
export type ChatRequestStatus = 'pending' | 'accepted' | 'rejected';

// 채팅 요청 정보
export interface ChatRequest {
  id: number;
  sender: ChatUser;
  receiver: ChatUser;
  message: string; // 첫 메시지
  status: ChatRequestStatus;
  created_at: string;
  updated_at: string;
  is_follower: boolean; // 발신자가 수신자를 팔로우하고 있는지
}

// 채팅 요청 목록 조회 응답
export interface ChatRequestsResponse {
  code: number;
  message: string;
  data: ChatRequest[];
}

// 채팅 요청 처리 요청
export interface HandleChatRequestRequest {
  action: 'accept' | 'reject';
}
