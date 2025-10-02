// 채팅 관련 타입 정의 (API 명세서 기반)

// 채팅 타입
export type ChatType = 'private' | 'group'; // API 명세에 맞게 수정

// 메시지 타입
export type MessageType = 'text' | 'image' | 'video'; // API 명세에 맞게 수정

// 채팅방 상세 정보 타입
export interface ChatRoomDetail {
  id: number;
  name: string | null; // private 채팅은 항상 null, group 채팅은 필수
  type: ChatType;
  avatar_url: string | null;
  created_at: string;
  latest_notices: ChatRoomNotice[];
  chat_room_images_videos: ChatRoomMedia[];
  members: ChatRoomMember[];
}

// 채팅방 공지사항 정보
export interface ChatRoomNotice {
  notice_id: number;
  content: string;
  user_nickname: string;
  created_at: string;
}

// 채팅방 미디어 정보
export interface ChatRoomMedia {
  message_id: number;
  type: 'image' | 'video';
  content: string; // 이미지/비디오 URL
  created_at: string;
}

// 채팅방 멤버 정보 (API 형태)
export interface ChatRoomMember {
  id: number; // ChatMember 테이블 ID
  user_id: number; // User 테이블 사용자 ID
  joined_at: string;
  user: {
    id: number;
    nickname: string;
    profile_img?: string | null;
  };
}

// 채팅 참여자 정보 (간소화)
export interface ChatUser {
  id: number;
  nickname: string;
  avatar_url?: string | null; // profile_img에서 avatar_url로 통일
  profile_img?: string | null; // 기존 호환성을 위해 유지
}

// 마지막 메시지 정보 (최신 API 응답 형식)
export interface LastMessage {
  id: number;
  content: string;
  type: MessageType;
  sender_id: number; // 단순 숫자 ID로 변경
  created_at: string;
}

// 채팅방 정보 (최신 API 응답 형식)
export interface ChatRoom {
  id: number;
  name: string | null; // private 채팅은 항상 null, group 채팅은 필수
  type: ChatType;
  avatar_url: string | null;
  created_at: string;
  memberCount: number;
  unread_count: number; // 읽지 않은 메시지 개수 (API에서 제공)
  lastMessage: LastMessage | null; // null일 수 있음

  // 타입별 멤버 정보 (API에서 제공)
  other_user?: ChatUser; // 1:1 채팅일 때만 존재
  other_users?: ChatUser[]; // 그룹 채팅일 때만 존재 (나를 제외한 모든 멤버)
}

// 메시지 인터페이스 (API 응답 형식)
export interface Message {
  id: number;
  chat_room_id: number;
  sender_id: number;
  type: MessageType; // message_type에서 type으로 변경
  content: string;
  created_at: string;
  updated_at: string;
  sender: ChatUser;
  mentions: any[]; // 멘션 배열 (향후 타입 정의 가능)
  mention_user_ids: number[]; // 서버에서 전송하는 멘션 사용자 ID 배열
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

// 메시지 목록 조회 응답 (페이지네이션 포함)
export interface MessagesResponse {
  code: number;
  message: string;
  data: {
    messages: Message[];
    hasNext: boolean;
    nextCursor: number | null;
  };
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

// 채팅 공지사항 등록 요청
export interface RegisterNoticeRequest {
  content: string;
}

// 채팅 공지사항 등록 응답
export interface RegisterNoticeResponse {
  notice_id: number;
  success: boolean;
}
