// 채팅 소켓 서비스
import { socketService } from './socketService';
import type { ServerToClientEvents } from '../types/socket';
import type { Message } from '../types/chat';

// 채팅 관련 타입들
export interface TypingUser {
  id: number;
  nickname: string;
}

export interface SendMessageData {
  chatRoomId: number;
  tempId: string;
  type: 'text' | 'image' | 'video';
  content?: string;
  mentionUserIds?: number[];
}

// 채팅 서비스 클래스
class ChatSocketService {
  private currentChatRoomId: number | null = null;
  private isJoined = false;
  private isJoining = false;
  private typingUsers: TypingUser[] = [];
  private joinCallbacks: Array<(joined: boolean, chatRoomId: number) => void> = [];
  private messageCallbacks: Array<(message: Message) => void> = [];
  private typingCallbacks: Array<(typingUsers: TypingUser[]) => void> = [];

  constructor() {
    this.setupChatListeners();
  }

  // 게터들
  get isChatJoined(): boolean {
    return this.isJoined;
  }

  get isJoiningChat(): boolean {
    return this.isJoining;
  }

  get currentChatRoom(): number | null {
    return this.currentChatRoomId;
  }

  get currentTypingUsers(): TypingUser[] {
    return [...this.typingUsers];
  }

  // 채팅 리스너 설정
  private setupChatListeners() {
    // 기존 리스너 제거
    socketService.off('chat:joined_room');
    socketService.off('chat:left_room');
    socketService.off('chat:message:sent');
    socketService.off('chat:message:receive');
    socketService.off('chat:message:failed');
    socketService.off('chat:typing:status');

    // 채팅방 참가 성공
    socketService.on('chat:joined_room', (data) => {
      console.log('✅ 채팅방 참가 성공:', data.chat_room_id);
      this.isJoined = true;
      this.isJoining = false;
      this.currentChatRoomId = data.chat_room_id;
      this.notifyJoinCallbacks(true, data.chat_room_id);
    });

    // 채팅방 퇴장 성공
    socketService.on('chat:left_room', (data) => {
      console.log('👋 채팅방 퇴장 성공:', data.chat_room_id);
      this.isJoined = false;
      this.isJoining = false;
      this.currentChatRoomId = null;
      this.typingUsers = [];
      this.notifyJoinCallbacks(false, data.chat_room_id);
    });

    // 메시지 전송 성공 (내 메시지)
    socketService.on('chat:message:sent', (data) => {
      console.log('✅ 메시지 전송 성공:', data.temp_id);
      // 임시 메시지를 실제 메시지로 교체하는 로직은 ChatStore에서 처리
      // 여기서는 콜백만 호출
      this.notifyMessageCallbacks(data.message);
    });

    // 실시간 메시지 수신 (다른 사용자 메시지)
    socketService.on('chat:message:receive', (data) => {
      console.log('📨 실시간 메시지 수신:', {
        메시지ID: data.id,
        채팅방ID: data.chat_room_id,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        내용: data.content?.substring(0, 50) || '',
        생성시간: data.created_at
      });

      this.notifyMessageCallbacks(data);
    });

    // 메시지 전송 실패
    socketService.on('chat:message:failed', (data) => {
      console.error('❌ 메시지 전송 실패:', data.temp_id, data.error);
      // 실패 처리 로직은 ChatStore에서 처리
    });

    // 타이핑 상태 변경
    socketService.on('chat:typing:status', (data) => {
      console.log('⌨️ 타이핑 상태 변경:', {
        채팅방ID: data.chat_room_id,
        사용자ID: data.user_id,
        닉네임: data.nickname,
        타이핑중: data.is_typing
      });

      this.updateTypingUsers(data);
      this.notifyTypingCallbacks(this.typingUsers);
    });
  }

  // 채팅방 참가
  async joinChatRoom(chatRoomId: number): Promise<void> {
    if (this.isJoining || (this.isJoined && this.currentChatRoomId === chatRoomId)) {
      console.log('이미 참가 중이거나 참가된 채팅방입니다');
      return;
    }

    try {
      this.isJoining = true;
      console.log(`🚪 채팅방 ${chatRoomId} 참가 시도...`);

      socketService.emit('chat:join_room', { chat_room_id: chatRoomId });
    } catch (error) {
      console.error('채팅방 참가 실패:', error);
      this.isJoining = false;
      throw error;
    }
  }

  // 채팅방 퇴장
  async leaveChatRoom(chatRoomId?: number): Promise<void> {
    const targetRoomId = chatRoomId || this.currentChatRoomId;
    if (!targetRoomId) {
      console.log('퇴장할 채팅방이 없습니다');
      return;
    }

    try {
      console.log(`🚶 채팅방 ${targetRoomId} 퇴장 시도...`);
      socketService.emit('chat:leave_room', { chat_room_id: targetRoomId });
    } catch (error) {
      console.error('채팅방 퇴장 실패:', error);
      throw error;
    }
  }

  // 메시지 전송
  async sendMessage(data: SendMessageData): Promise<void> {
    if (!this.isJoined || this.currentChatRoomId !== data.chatRoomId) {
      throw new Error('채팅방에 참가하지 않은 상태입니다');
    }

    console.log(`📤 메시지 전송:`, {
      채팅방ID: data.chatRoomId,
      임시ID: data.tempId,
      타입: data.type,
      내용: data.content?.substring(0, 50) || ''
    });

    socketService.emit('chat:message:send', {
      temp_id: data.tempId,
      chat_room_id: data.chatRoomId,
      type: data.type,
      content: data.content,
      mention_user_ids: data.mentionUserIds
    });
  }

  // 타이핑 시작
  async startTyping(chatRoomId: number): Promise<void> {
    if (!this.isJoined || this.currentChatRoomId !== chatRoomId) {
      return;
    }

    socketService.emit('chat:typing:start', { chat_room_id: chatRoomId });
  }

  // 타이핑 중지
  async stopTyping(chatRoomId: number): Promise<void> {
    if (!this.isJoined || this.currentChatRoomId !== chatRoomId) {
      return;
    }

    socketService.emit('chat:typing:stop', { chat_room_id: chatRoomId });
  }

  // 타이핑 사용자 업데이트
  private updateTypingUsers(data: {
    chat_room_id: number;
    user_id: number;
    nickname: string;
    is_typing: boolean;
  }) {
    if (data.chat_room_id !== this.currentChatRoomId) {
      return;
    }

    if (data.is_typing) {
      // 타이핑 시작
      const existingUser = this.typingUsers.find(u => u.id === data.user_id);
      if (!existingUser) {
        this.typingUsers.push({
          id: data.user_id,
          nickname: data.nickname
        });
      }
    } else {
      // 타이핑 중지
      this.typingUsers = this.typingUsers.filter(u => u.id !== data.user_id);
    }
  }

  // 콜백 관리 메서드들
  onJoinChange(callback: (joined: boolean, chatRoomId: number) => void): () => void {
    this.joinCallbacks.push(callback);

    // 현재 상태 즉시 전달
    if (this.currentChatRoomId) {
      callback(this.isJoined, this.currentChatRoomId);
    }

    return () => {
      const index = this.joinCallbacks.indexOf(callback);
      if (index > -1) {
        this.joinCallbacks.splice(index, 1);
      }
    };
  }

  onMessageReceive(callback: (message: Message) => void): () => void {
    this.messageCallbacks.push(callback);

    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  onTypingChange(callback: (typingUsers: TypingUser[]) => void): () => void {
    this.typingCallbacks.push(callback);

    // 현재 상태 즉시 전달
    callback(this.typingUsers);

    return () => {
      const index = this.typingCallbacks.indexOf(callback);
      if (index > -1) {
        this.typingCallbacks.splice(index, 1);
      }
    };
  }

  // 콜백 알림 메서드들
  private notifyJoinCallbacks(joined: boolean, chatRoomId: number): void {
    this.joinCallbacks.forEach(callback => {
      try {
        callback(joined, chatRoomId);
      } catch (error) {
        console.error('Join 콜백 실행 중 에러:', error);
      }
    });
  }

  private notifyMessageCallbacks(message: Message): void {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Message 콜백 실행 중 에러:', error);
      }
    });
  }

  private notifyTypingCallbacks(typingUsers: TypingUser[]): void {
    this.typingCallbacks.forEach(callback => {
      try {
        callback(typingUsers);
      } catch (error) {
        console.error('Typing 콜백 실행 중 에러:', error);
      }
    });
  }

  // 리셋
  reset(): void {
    this.currentChatRoomId = null;
    this.isJoined = false;
    this.isJoining = false;
    this.typingUsers = [];
    this.joinCallbacks = [];
    this.messageCallbacks = [];
    this.typingCallbacks = [];
  }
}

// 싱글톤 인스턴스
export const chatSocketService = new ChatSocketService();
