import { create } from 'zustand';
import { ChatService } from '../services';
import { chatSocketService, SendMessageData, TypingUser } from '../services/chatSocketService';
import { Message } from '../types/chat';

interface ChatState {
  // 채팅방 상태
  currentChatRoomId: number | null;
  isJoined: boolean;
  isJoining: boolean;
  joinError: string | null;

  // 메시지 관련
  messages: Message[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  nextCursor: number | null;
  loadMessagesError: string | null;

  // 타이핑 관련
  typingUsers: TypingUser[];
  pendingMessages: Map<string, Message>;

  // 채팅방 참가
  joinChatRoom: (chatRoomId: number) => Promise<void>;
  
  // 채팅방 퇴장
  leaveChatRoom: () => Promise<void>;
  
  // 메시지 전송
  sendMessage: (data: SendMessageData) => Promise<void>;
  
  // 메시지 로드
  loadMessages: (chatRoomId: number, cursor?: number) => Promise<void>;
  
  // 타이핑 시작/중단
  startTyping: () => void;
  stopTyping: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // 초기 상태
  currentChatRoomId: null,
  isJoined: false,
  isJoining: false,
  joinError: null,

  messages: [],
  isLoadingMessages: false,
  hasMoreMessages: true,
  nextCursor: null,
  loadMessagesError: null,

  typingUsers: [],
  pendingMessages: new Map(),

  // 채팅방 참가
  joinChatRoom: async (chatRoomId: number) => {
    const { isJoined, currentChatRoomId } = get();

    // 이미 참가한 채팅방이면 무시
    if (isJoined && currentChatRoomId === chatRoomId) {
      console.log('이미 참가한 채팅방입니다');
      return;
    }

    // 다른 채팅방에 참가중이면 먼저 퇴장
    if (isJoined && currentChatRoomId !== chatRoomId) {
      await get().leaveChatRoom();
    }

    try {
      set({ isJoining: true, joinError: null });
      console.log(`🚪 채팅방 ${chatRoomId} 참가 시작...`);

      // 소켓으로 채팅방 참가
      await chatSocketService.joinChatRoom(chatRoomId);

      // 채팅 히스토리 로드
      await get().loadMessages(chatRoomId);

      // 콜백 설정
      chatSocketService.onJoinChange((joined, roomId) => {
        console.log('🔄 onJoinChange 콜백 실행:', { joined, roomId });
        set({
          isJoined: joined,
          isJoining: false,
          currentChatRoomId: joined ? roomId : null,
          joinError: null
        });
        console.log('✅ 상태 업데이트 완료:', { isJoined: joined, currentChatRoomId: joined ? roomId : null });
      });

      chatSocketService.onMessageReceive((message) => {
        const { pendingMessages, messages } = get();

        // 임시 메시지가 있으면 실제 메시지로 교체
        if (pendingMessages.has(message.id.toString())) {
          const tempMessage = pendingMessages.get(message.id.toString())!;
          const updatedMessages = messages.map(msg =>
            msg.id === tempMessage.id ? message : msg
          );
          set({ messages: updatedMessages });
          pendingMessages.delete(message.id.toString());
        } else {
          // 새 메시지 추가
          set({ messages: [...messages, message] });
        }
      });

      chatSocketService.onTypingChange((typingUsers) => {
        set({ typingUsers });
      });

      console.log(`✅ 채팅방 ${chatRoomId} 참가 완료`);
    } catch (error) {
      console.error('채팅방 참가 실패:', error);
      set({
        isJoining: false,
        joinError: error instanceof Error ? error.message : '채팅방 참가에 실패했습니다'
      });
      throw error;
    }
  },

  // 채팅방 퇴장
  leaveChatRoom: async () => {
    const { currentChatRoomId, isJoined } = get();

    if (!isJoined || !currentChatRoomId) {
      console.log('퇴장할 채팅방이 없습니다');
      return;
    }

    try {
      console.log(`🚶 채팅방 ${currentChatRoomId} 퇴장 시작...`);

      await chatSocketService.leaveChatRoom(currentChatRoomId);

      // 상태 초기화
      set({
        currentChatRoomId: null,
        isJoined: false,
        isJoining: false,
        messages: [],
        typingUsers: [],
        pendingMessages: new Map(),
        joinError: null,
        loadMessagesError: null
      });

      console.log(`✅ 채팅방 ${currentChatRoomId} 퇴장 완료`);
    } catch (error) {
      console.error('채팅방 퇴장 실패:', error);
      throw error;
    }
  },

  // 메시지 전송
  sendMessage: async (data: SendMessageData) => {
    const { currentChatRoomId, isJoined, pendingMessages, messages } = get();

    console.log('🔍 sendMessage 상태 확인:', {
      currentChatRoomId,
      isJoined,
      dataChatRoomId: data.chatRoomId,
      isMatch: currentChatRoomId === data.chatRoomId
    });

    if (!isJoined || currentChatRoomId !== data.chatRoomId) {
      console.error('❌ 메시지 전송 검증 실패:', {
        isJoined,
        currentChatRoomId,
        dataChatRoomId: data.chatRoomId
      });
      throw new Error('채팅방에 참가하지 않은 상태입니다');
    }

    // 임시 메시지 생성
    const tempMessage: Message = {
      id: Date.now() + Math.random(), // 임시 메시지를 위한 고유 숫자 ID
      chat_room_id: data.chatRoomId,
      sender_id: 0, // 실제 사용자 ID는 서버에서 설정
      type: data.type,
      content: data.content || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: {
        id: 0,
        nickname: '나',
        avatar_url: null,
        profile_img: null
      }, // 임시 사용자 정보
      mentions: [], // 임시 메시지이므로 빈 배열
      mention_user_ids: data.mentionUserIds || []
    };

    // 임시 메시지를 즉시 UI에 표시
    pendingMessages.set(data.tempId, tempMessage);
    set({
      messages: [...messages, tempMessage],
      pendingMessages: new Map(pendingMessages)
    });

    try {
      console.log(`📤 메시지 전송 시작:`, data.tempId);
      await chatSocketService.sendMessage(data);
      console.log(`✅ 메시지 전송 완료:`, data.tempId);
    } catch (error) {
      console.error('메시지 전송 실패:', error);

      // 전송 실패한 임시 메시지 제거
      pendingMessages.delete(data.tempId);
      set({
        messages: messages.filter(msg => msg.id !== tempMessage.id),
        pendingMessages: new Map(pendingMessages)
      });

      throw error;
    }
  },

  // 메시지 로드
  loadMessages: async (chatRoomId: number, cursor?: number) => {
    try {
      set({ isLoadingMessages: true, loadMessagesError: null });

      const response = await ChatService.getMessages(chatRoomId, cursor);

      const { messages, hasMoreMessages, nextCursor } = get();

      if (cursor) {
        // 이전 메시지 로드 (무한 스크롤) - inverted에서는 과거 메시지를 뒤에 추가
        set({
          messages: [...messages, ...response.messages],
          hasMoreMessages: response.hasNext,
          nextCursor: response.nextCursor,
          isLoadingMessages: false
        });
      } else {
        // 초기 로드 - FlatList의 inverted 속성으로 인해 순서 뒤집기 불필요
        set({
          messages: response.messages,
          hasMoreMessages: response.hasNext,
          nextCursor: response.nextCursor,
          isLoadingMessages: false
        });
      }

      console.log(`📨 메시지 로드 완료: ${response.messages.length}개`);
    } catch (error) {
      console.error('메시지 로드 실패:', error);
      set({
        isLoadingMessages: false,
        loadMessagesError: error instanceof Error ? error.message : '메시지 로드에 실패했습니다'
      });
      throw error;
    }
  },

  // 타이핑 시작
  startTyping: () => {
    const { currentChatRoomId, isJoined } = get();
    if (isJoined && currentChatRoomId) {
      chatSocketService.startTyping(currentChatRoomId);
    }
  },

  // 타이핑 중단
  stopTyping: () => {
    const { currentChatRoomId, isJoined } = get();
    if (isJoined && currentChatRoomId) {
      chatSocketService.stopTyping(currentChatRoomId);
    }
  }
}));