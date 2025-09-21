// 채팅 상태 관리 스토어 (notificationStore 패턴 적용)
import { create } from 'zustand';
import { Alert } from 'react-native';
import { Message, ChatRoom } from '../types/chat';
import { SOCKET_EVENTS, SOCKET_NAMESPACES } from '../config/socket';
import { useSocketStore } from './socketStore';
import { useAuthStore } from './authStore';

// 채팅 스토어 상태 타입
interface ChatStoreState {
  // 구독 상태
  isGlobalSubscribed: boolean;
  isRoomSubscribed: boolean;
  
  // 데이터
  chatRooms: ChatRoom[];
  messages: Message[];
  typingUsers: { id: number; nickname: string; profile_img: string | null }[];
  
  // 현재 채팅방
  currentChatRoomId: number | null;
  
  // Actions
  // Global 구독 (채팅방 목록용)
  subscribeGlobal: () => void;
  unsubscribeGlobal: () => void;
  
  // Local 구독 (특정 채팅방용)
  subscribeRoom: (chatRoomId: number) => void;
  unsubscribeRoom: () => void;
  
  // 메시지 관련
  sendMessage: (content: string, mentionUserIds?: number[]) => Promise<void>;
  setCurrentChatRoom: (chatRoomId: number | null) => void;
  clearMessages: () => void;
  
  // 데이터 업데이트
  updateChatRooms: (rooms: ChatRoom[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (tempId: string, status: 'sending' | 'sent' | 'failed', serverMessage?: Message) => void;
  
  // 타이핑 관리
  startTyping: () => void;
  stopTyping: () => void;
  
  // 이벤트 핸들러들
  handleMessageReceived: (message: Message) => void;
  handleMessageSent: (data: { temp_id: string; message: Message }) => void;
  handleMessageFailed: (data: { temp_id: string; error: string }) => void;
  handleMentionReceived: (mention: any) => void;
  handleTypingStatus: (data: any) => void;
  handleRoomListUpdate: (data: { rooms?: ChatRoom[]; updated_room_id?: number; last_message?: any; unread_count?: number }) => void;
  handleRoomInfoUpdate: (data: { room_info: any }) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  // 초기 상태
  isGlobalSubscribed: false,
  isRoomSubscribed: false,
  chatRooms: [],
  messages: [],
  typingUsers: [],
  currentChatRoomId: null,

  // =========================
  // 🌐 Global 구독 (채팅방 목록용)
  // =========================
  subscribeGlobal: () => {
    const state = get();
    
    if (state.isGlobalSubscribed) {
      console.log('이미 채팅 전역을 구독하고 있습니다.');
      return;
    }

    const socket = useSocketStore.getState().getSocket(SOCKET_NAMESPACES.CHAT);
    
    if (!socket) {
      console.error('채팅 소켓이 연결되지 않았습니다.');
      return;
    }

    console.log('🌐 채팅 전역 구독 시작...');
    
    // 서버에 구독 요청
    socket.emit(SOCKET_EVENTS.CHAT_GLOBAL_SUBSCRIBE_USER_ROOM);
    
    // 이벤트 리스너 설정
    setupChatEventListeners(socket);
    
    set({ isGlobalSubscribed: true });
  },

  unsubscribeGlobal: () => {
    const state = get();
    
    if (!state.isGlobalSubscribed) {
      console.log('전역 구독 중이 아닙니다.');
      return;
    }

    const socket = useSocketStore.getState().getSocket(SOCKET_NAMESPACES.CHAT);
    
    if (socket) {
      console.log('🌐 채팅 전역 구독 해제...');
      
      // 서버에 구독 해제 요청
      socket.emit(SOCKET_EVENTS.CHAT_GLOBAL_UNSUBSCRIBE_USER_ROOM);
      
      // 이벤트 리스너 제거
      removeChatEventListeners(socket);
    }
    
    set({ 
      isGlobalSubscribed: false,
      chatRooms: [], // 채팅방 목록만 초기화
      // 로컬 상태는 그대로 유지
    });
  },

  // =========================
  // 🏠 Local 구독 (특정 채팅방용)
  // =========================
  subscribeRoom: (chatRoomId: number) => {
    const state = get();
    
    if (state.isRoomSubscribed) {
      console.log('이미 채팅방을 구독하고 있습니다.');
      return;
    }

    const socket = useSocketStore.getState().getSocket(SOCKET_NAMESPACES.CHAT);
    
    if (!socket) {
      console.error('채팅 소켓이 연결되지 않았습니다.');
      return;
    }

    console.log(`🏠 채팅방 ${chatRoomId} 구독 시작...`);
    
    // 서버에 구독 요청
    socket.emit(SOCKET_EVENTS.CHAT_LOCAL_SUBSCRIBE_ROOM, { chat_room_id: chatRoomId });
    
    // 구독 상태 업데이트
    set({
      isRoomSubscribed: true,
      currentChatRoomId: chatRoomId
    });
  },

  unsubscribeRoom: () => {
    const state = get();
    
    if (!state.isRoomSubscribed) {
      console.log('구독 중이 아닙니다.');
      return;
    }

    const socket = useSocketStore.getState().getSocket(SOCKET_NAMESPACES.CHAT);
    
    if (socket && state.currentChatRoomId) {
      console.log(`🏠 채팅방 ${state.currentChatRoomId} 구독 해제...`);
      
      // 서버에 구독 해제 요청
      socket.emit(SOCKET_EVENTS.CHAT_LOCAL_UNSUBSCRIBE_ROOM, { chat_room_id: state.currentChatRoomId });
    }
    
    // 구독 상태 초기화
    set({
      isRoomSubscribed: false,
      currentChatRoomId: null,
      messages: [],
      typingUsers: []
    });
  },

  // =========================
  // 💬 메시지 관련
  // =========================
  sendMessage: async (content: string, mentionUserIds: number[] = []) => {
    const { currentChatRoomId } = get();
    
    if (!currentChatRoomId) {
      Alert.alert('오류', '채팅방이 선택되지 않았습니다.');
      return;
    }

    const socket = useSocketStore.getState().getSocket(SOCKET_NAMESPACES.CHAT);
    
    if (!socket) {
      Alert.alert('오류', '채팅 서버에 연결되지 않았습니다.');
      return;
    }

    const { user } = useAuthStore.getState();
    if (!user) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 로컬 메시지 생성
    const localMessage: Message = {
      id: tempId,
      chat_room_id: currentChatRoomId,
      sender_id: user.id,
      type: 'text',
      content,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        nickname: user.nickname,
        profile_img: user.profile_img || null,
      },
      mentions: [],
      status: 'sending',
    };

    // UI에 즉시 표시
    get().addMessage(localMessage);

    // 서버로 전송
    socket.emit(SOCKET_EVENTS.CHAT_LOCAL_SEND_MESSAGE, {
      temp_id: tempId,
      chat_room_id: currentChatRoomId,
      type: 'text',
      content,
      mention_user_ids: mentionUserIds,
    });

    // 타이핑 상태 중단
    get().stopTyping();
  },

  setCurrentChatRoom: (chatRoomId: number | null) => {
    const { isRoomSubscribed, unsubscribeRoom, subscribeRoom } = get();
    
    if (chatRoomId) {
      // 기존 구독이 있다면 해제
      if (isRoomSubscribed) {
        unsubscribeRoom();
      }
      // 새 채팅방 구독
      subscribeRoom(chatRoomId);
    } else {
      // 채팅방 나가기
      if (isRoomSubscribed) {
        unsubscribeRoom();
      }
    }
  },

  clearMessages: () => {
    set({ messages: [], typingUsers: [] });
  },

  // =========================
  // 📊 데이터 업데이트
  // =========================
  updateChatRooms: (rooms: ChatRoom[]) => {
    set({ chatRooms: rooms });
    console.log(`📋 채팅방 목록 업데이트: ${rooms.length}개`);
  },

  addMessage: (message: Message) => {
    set(state => ({
      messages: [...state.messages, message]
    }));
    console.log(`💬 새 메시지 추가: ${message.content?.substring(0, 20)}...`);
  },

  updateMessageStatus: (tempId: string, status: 'sending' | 'sent' | 'failed', serverMessage?: Message) => {
    set(state => ({
      messages: state.messages.map(msg => {
        if (msg.id === tempId && msg.status === 'sending') {
          return serverMessage ? { ...serverMessage, status } : { ...msg, status };
        }
        return msg;
      })
    }));
    console.log(`📝 메시지 상태 업데이트: ${tempId} → ${status}`);
  },

  // =========================
  // ⌨️ 타이핑 관리
  // =========================
  startTyping: () => {
    const { currentChatRoomId } = get();
    
    if (!currentChatRoomId) return;

    const socket = useSocketStore.getState().getSocket(SOCKET_NAMESPACES.CHAT);
    
    if (socket) {
      socket.emit(SOCKET_EVENTS.CHAT_LOCAL_TYPING_START, { 
        chat_room_id: currentChatRoomId 
      });
    }
  },

  stopTyping: () => {
    const { currentChatRoomId } = get();
    
    if (!currentChatRoomId) return;

    const socket = useSocketStore.getState().getSocket(SOCKET_NAMESPACES.CHAT);
    
    if (socket) {
      socket.emit(SOCKET_EVENTS.CHAT_LOCAL_TYPING_STOP, { 
        chat_room_id: currentChatRoomId 
      });
    }
  },

  // =========================
  // 🎯 이벤트 핸들러들
  // =========================
  handleMessageReceived: (message: Message) => {
    console.log('📨 새 메시지 수신:', message);
    const { currentChatRoomId, addMessage } = get();

    if (currentChatRoomId === message.chat_room_id) {
      addMessage(message);
    }
  },

  handleMessageSent: (data: { temp_id: string; message: Message }) => {
    console.log('✅ 메시지 전송 성공:', data);
    const { updateMessageStatus } = get();
    updateMessageStatus(data.temp_id, 'sent', data.message);
  },

  handleMessageFailed: (data: { temp_id: string; error: string }) => {
    console.log('❌ 메시지 전송 실패:', data);
    const { updateMessageStatus } = get();
    updateMessageStatus(data.temp_id, 'failed');
    Alert.alert('전송 실패', '메시지 전송에 실패했습니다. 메시지를 탭하여 재전송할 수 있습니다.');
  },

  handleMentionReceived: (mention: any) => {
    console.log('🔔 멘션 알림:', mention);
    Alert.alert('멘션 알림', `${mention.sender_nickname}님이 회원님을 멘션했습니다.`);
  },

  handleTypingStatus: (data: any) => {
    const { currentChatRoomId } = get();

    if (currentChatRoomId === data.chat_room_id) {
      set(state => {
        let newTypingUsers = [...state.typingUsers];

        if (data.is_typing) {
          // 타이핑 시작 - 중복 제거
          const filtered = newTypingUsers.filter(u => u.id !== data.user_id);
          newTypingUsers = [...filtered, {
            id: data.user_id,
            nickname: data.nickname,
            profile_img: null
          }];
        } else {
          // 타이핑 중단
          newTypingUsers = newTypingUsers.filter(u => u.id !== data.user_id);
        }

        return { typingUsers: newTypingUsers };
      });
    }
  },

  handleRoomListUpdate: (data: { rooms?: ChatRoom[]; updated_room_id?: number; last_message?: any; unread_count?: number }) => {
    console.log('📋 채팅방 목록 업데이트 수신:', data);
    
    // 전체 채팅방 목록 업데이트 (기존 방식)
    if (data.rooms) {
      get().updateChatRooms(data.rooms);
      return;
    }
    
    // 개별 채팅방 업데이트 (새로운 방식)
    if (data.updated_room_id && data.last_message) {
      const { chatRooms } = get();
      const updatedRooms = chatRooms.map(room => {
        if (room.id === data.updated_room_id) {
          return {
            ...room,
            lastMessage: data.last_message,
            unread_count: (room.unread_count || 0) + (data.unread_count || 0)
          };
        }
        return room;
      });
      
      set({ chatRooms: updatedRooms });
      console.log(`📋 채팅방 ${data.updated_room_id} 업데이트 완료`);
    }
  },

  handleRoomInfoUpdate: (data: { room_info: any }) => {
    console.log('🏠 채팅방 정보 업데이트 수신:', data);
    // TODO: 채팅방 정보 업데이트 로직 구현
  },
}));

// =========================
// 🔧 이벤트 리스너 관리 함수들
// =========================

// 채팅 이벤트 리스너 설정
const setupChatEventListeners = (socket: any) => {
  const store = useChatStore.getState();
  
  // Global 구독 성공 응답
  socket.on(SOCKET_EVENTS.CHAT_GLOBAL_SUBSCRIBED_USER_ROOM, (data: any) => {
    console.log('✅ 채팅 전역 구독 성공:', data);
  });

  // Local 구독 성공 응답
  socket.on(SOCKET_EVENTS.CHAT_LOCAL_SUBSCRIBED_ROOM, (data: any) => {
    console.log('✅ 채팅방 구독 성공:', data);
  });

  // Local 구독 해제 성공 응답
  socket.on(SOCKET_EVENTS.CHAT_LOCAL_UNSUBSCRIBED_ROOM, (data: any) => {
    console.log('✅ 채팅방 구독 해제 성공:', data);
  });

  // 메시지 관련 이벤트들
  socket.on(SOCKET_EVENTS.CHAT_LOCAL_MESSAGE_RECEIVED, (message: Message) => {
    store.handleMessageReceived(message);
  });

  socket.on(SOCKET_EVENTS.CHAT_LOCAL_MESSAGE_SENT, (data: { temp_id: string; message: Message }) => {
    store.handleMessageSent(data);
  });

  socket.on(SOCKET_EVENTS.CHAT_LOCAL_MESSAGE_FAILED, (data: { temp_id: string; error: string }) => {
    store.handleMessageFailed(data);
  });

  socket.on(SOCKET_EVENTS.CHAT_LOCAL_MENTION_RECEIVED, (mention: any) => {
    store.handleMentionReceived(mention);
  });

  // 타이핑 관련 이벤트
  socket.on(SOCKET_EVENTS.CHAT_LOCAL_TYPING_STATUS, (data: any) => {
    store.handleTypingStatus(data);
  });

  // 채팅방 관련 이벤트들
  socket.on(SOCKET_EVENTS.CHAT_LOCAL_USER_JOINED, (data: any) => {
    console.log(`👋 ${data.nickname}님이 참가했습니다.`);
  });

  socket.on(SOCKET_EVENTS.CHAT_LOCAL_USER_LEFT, (data: any) => {
    console.log(`👋 ${data.nickname}님이 나갔습니다.`);
  });

  // Global 이벤트들
  socket.on(SOCKET_EVENTS.CHAT_GLOBAL_ROOM_LIST_UPDATE, (data: { rooms?: ChatRoom[]; updated_room_id?: number; last_message?: any; unread_count?: number }) => {
    store.handleRoomListUpdate(data);
  });

  socket.on(SOCKET_EVENTS.CHAT_GLOBAL_ROOM_INFO_UPDATE, (data: { room_info: any }) => {
    store.handleRoomInfoUpdate(data);
  });

  // 에러 처리
  socket.on('error', (error: any) => {
    console.error('💥 채팅 소켓 에러:', error);
    Alert.alert('오류', error.message || '알 수 없는 오류가 발생했습니다.');
  });
};

// 채팅 이벤트 리스너 제거
const removeChatEventListeners = (socket: any) => {
  // 모든 채팅 관련 이벤트 리스너 제거
  const events = [
    SOCKET_EVENTS.CHAT_GLOBAL_SUBSCRIBED_USER_ROOM,
    SOCKET_EVENTS.CHAT_LOCAL_SUBSCRIBED_ROOM,
    SOCKET_EVENTS.CHAT_LOCAL_UNSUBSCRIBED_ROOM,
    SOCKET_EVENTS.CHAT_LOCAL_MESSAGE_RECEIVED,
    SOCKET_EVENTS.CHAT_LOCAL_MESSAGE_SENT,
    SOCKET_EVENTS.CHAT_LOCAL_MESSAGE_FAILED,
    SOCKET_EVENTS.CHAT_LOCAL_MENTION_RECEIVED,
    SOCKET_EVENTS.CHAT_LOCAL_TYPING_STATUS,
    SOCKET_EVENTS.CHAT_LOCAL_USER_JOINED,
    SOCKET_EVENTS.CHAT_LOCAL_USER_LEFT,
    SOCKET_EVENTS.CHAT_GLOBAL_ROOM_LIST_UPDATE,
    SOCKET_EVENTS.CHAT_GLOBAL_ROOM_INFO_UPDATE,
  ];

  events.forEach(event => {
    socket.off(event);
  });
  
  console.log('🧹 채팅 이벤트 리스너 제거 완료');
};