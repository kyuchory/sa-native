// 채팅 관련 타입 정의

// 채팅 타입
export type ChatType = 'direct' | 'group' | 'request';

// 채팅 참여자 정보
export interface ChatUser {
  id: number;
  nickname: string;
  profile_img: string | null;
}

// 메시지 타입
export type MessageType = 'text' | 'image' | 'file';

// 메시지 정보
export interface Message {
  id: number;
  content: string;
  message_type: MessageType;
  created_at: string;
  updated_at: string;
  sender: ChatUser;
  is_read: boolean;
}

// 채팅방 정보
export interface ChatRoom {
  id: number;
  name: string; // 그룹 채팅방 이름 (1:1 채팅은 상대방 닉네임)
  chat_type: ChatType;
  profile_img: string | null; // 그룹 채팅방 프로필 이미지
  participants: ChatUser[];
  last_message: Message | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

// 채팅방 목록 조회 응답
export interface ChatRoomsResponse {
  code: number;
  message: string;
  data: ChatRoom[];
}

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
