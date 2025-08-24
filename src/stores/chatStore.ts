import { create } from 'zustand';
import io, { Socket } from 'socket.io-client';
import { Alert } from 'react-native';
import { Message, ChatUser, ChatRoom } from '../types/chat';
import { WS_BASE_URL } from '../config/api';
import { getAccessToken } from './authStore';
import { LocalMessageService, LocalMessage } from '../services/localMessageService';

interface ChatStore {
  // WebSocket 관련
  socket: Socket | null;
  isConnected: boolean;
  currentChatRoomId: number | null;
  
  // 메시지 관련
  messages: Message[];
  typingUsers: ChatUser[];
  isTyping: boolean;
  
  // 채팅방 목록 관련
  chatRooms: ChatRoom[];
  
  // 페이지네이션 관련
  hasNext: boolean;
  nextCursor: number | null;
  isLoadingMore: boolean;
  isInitialLoading: boolean;
  
  // Actions
  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
  joinChatRoom: (chatRoomId: number) => void;
  leaveChatRoom: () => void;
  sendMessage: (content: string, mentionUserIds?: number[]) => Promise<void>;
  retryMessage: (failedMessage: Message) => Promise<void>;
  retryAllFailedMessages: () => Promise<void>;
  
  // 메시지 관리
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (tempId: string, status: 'sending' | 'sent' | 'failed', serverMessage?: Message) => void;
  
  // 채팅방 목록 관리
  setChatRooms: (chatRooms: ChatRoom[]) => void;
  updateChatRoomLastMessage: (chatRoomId: number, message: Message) => void;
  
  // 타이핑 관리
  startTyping: () => void;
  stopTyping: () => void;
  setTypingUsers: (users: ChatUser[]) => void;
  
  // 페이지네이션
  setHasNext: (hasNext: boolean) => void;
  setNextCursor: (cursor: number | null) => void;
  setIsLoadingMore: (loading: boolean) => void;
  setIsInitialLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // 초기 상태
  socket: null,
  isConnected: false,
  currentChatRoomId: null,
  messages: [],
  typingUsers: [],
  isTyping: false,
  chatRooms: [],
  hasNext: true,
  nextCursor: null,
  isLoadingMore: false,
  isInitialLoading: true,

  // WebSocket 연결
  connectSocket: async () => {
    const { socket } = get();
    
    // 이미 연결되어 있으면 재사용
    if (socket && socket.connected) {
      console.log('✅ 기존 소켓 연결 재사용');
      return;
    }

    try {
      const token = getAccessToken();
      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      console.log('🔌 채팅 WebSocket 연결 시도...');
      
      const newSocket = io(WS_BASE_URL + '/chat', {
        auth: { token }
      });

      // 연결 성공
      newSocket.on('connected', (data) => {
        console.log('✅ 채팅 서버 연결 성공:', data);
        set({ isConnected: true });
      });

      // 연결 에러
      newSocket.on('connect_error', (error) => {
        console.error('❌ 채팅 서버 연결 실패:', error);
        set({ isConnected: false });
        Alert.alert('연결 오류', '채팅 서버에 연결할 수 없습니다.');
      });

      // 채팅방 참가 성공
      newSocket.on('joined_room', (data) => {
        console.log(`📨 채팅방 ${data.chatRoomId} 참가 완료`);
      });

      // 다른 사용자 참가 알림
      newSocket.on('user_joined', (data) => {
        console.log(`👋 ${data.nickname}님이 참가했습니다.`);
      });

      // 메시지 수신 (다른 사용자로부터)
      newSocket.on('message:receive', (message: Message) => {
        console.log('📨 새 메시지 수신:', message);
        
        const { currentChatRoomId, addMessage, updateChatRoomLastMessage } = get();
        
        // 현재 채팅방의 메시지인 경우 메시지 목록에 추가
        if (currentChatRoomId === message.chat_room_id) {
          addMessage(message);
        }
        
        // 채팅방 목록의 lastMessage 업데이트 (항상)
        updateChatRoomLastMessage(message.chat_room_id, message);
      });

      // 메시지 전송 성공 응답
      newSocket.on('message:sent', async (data: { tempId: string; message: Message }) => {
        console.log('✅ 메시지 전송 성공:', data);
        
        const { currentChatRoomId, updateMessageStatus, updateChatRoomLastMessage } = get();
        
        // 로컬 저장소 업데이트
        if (currentChatRoomId) {
          await LocalMessageService.replaceWithServerMessage(
            currentChatRoomId,
            data.tempId,
            data.message
          );
        }
        
        // UI 업데이트
        updateMessageStatus(data.tempId, 'sent', data.message);
        
        // 채팅방 목록 업데이트
        updateChatRoomLastMessage(data.message.chat_room_id, data.message);
      });

      // 메시지 전송 실패
      newSocket.on('message:failed', async (data: { tempId: string; error: string }) => {
        console.log('❌ 메시지 전송 실패:', data);
        
        const { currentChatRoomId, updateMessageStatus } = get();
        
        // 로컬 저장소에 실패 상태 저장
        if (currentChatRoomId) {
          await LocalMessageService.updateLocalMessageStatus(
            currentChatRoomId,
            data.tempId,
            'failed'
          );
        }
        
        updateMessageStatus(data.tempId, 'failed');
        Alert.alert('전송 실패', '메시지 전송에 실패했습니다. 메시지를 탭하여 재전송할 수 있습니다.');
      });

      // 멘션 알림 수신
      newSocket.on('mention:receive', (mention) => {
        console.log('🔔 멘션 알림:', mention);
        // 현재 사용자가 멘션된 경우에만 알림 (authStore에서 사용자 정보 가져와야 함)
        Alert.alert('멘션 알림', `${mention.senderNickname}님이 회원님을 멘션했습니다.`);
      });

      // 타이핑 상태 수신
      newSocket.on('typing:status', (data) => {
        const { currentChatRoomId, setTypingUsers } = get();
        
        // 현재 채팅방에서만 타이핑 상태 표시
        if (currentChatRoomId === data.chatRoomId) {
          set((state) => {
            if (data.isTyping) {
              // 타이핑 시작
              const filtered = state.typingUsers.filter(u => u.id !== data.userId);
              return {
                typingUsers: [...filtered, { 
                  id: data.userId, 
                  nickname: data.nickname, 
                  profile_img: null 
                }]
              };
            } else {
              // 타이핑 중단
              return {
                typingUsers: state.typingUsers.filter(u => u.id !== data.userId)
              };
            }
          });
        }
      });

      // 다른 사용자 퇴장 알림
      newSocket.on('user_left', (data) => {
        console.log(`👋 ${data.nickname}님이 나갔습니다.`);
      });

      // 채팅방 나가기 완료
      newSocket.on('left_room', (data) => {
        console.log(`📤 채팅방 ${data.chatRoomId}에서 나갔습니다.`);
      });

      // 에러 처리
      newSocket.on('error', (error) => {
        console.error('💥 Socket 에러:', error);
        switch(error.type) {
          case 'message_send_failed':
            Alert.alert('오류', '메시지 전송에 실패했습니다.');
            break;
          default:
            Alert.alert('오류', error.message || '알 수 없는 오류가 발생했습니다.');
        }
      });

      set({ socket: newSocket });
      
    } catch (error) {
      console.error('💥 Socket 초기화 실패:', error);
      Alert.alert('오류', '채팅 연결에 실패했습니다.');
    }
  },

  // WebSocket 연결 해제
  disconnectSocket: () => {
    const { socket } = get();
    
    if (socket) {
      console.log('🔌 채팅 WebSocket 연결 해제');
      socket.disconnect();
      set({ 
        socket: null, 
        isConnected: false, 
        currentChatRoomId: null,
        messages: [],
        typingUsers: [],
        isTyping: false
      });
    }
  },

  // 채팅방 참가
  joinChatRoom: (chatRoomId: number) => {
    const { socket } = get();
    
    if (socket && socket.connected) {
      console.log(`📨 채팅방 ${chatRoomId} 참가 요청`);
      socket.emit('join_room', { chatRoomId });
      set({ currentChatRoomId: chatRoomId });
    }
  },

  // 채팅방 나가기
  leaveChatRoom: () => {
    const { socket, currentChatRoomId } = get();
    
    if (socket && socket.connected && currentChatRoomId) {
      console.log(`📤 채팅방 ${currentChatRoomId} 나가기 요청`);
      socket.emit('leave_room', { chatRoomId: currentChatRoomId });
      set({ 
        currentChatRoomId: null, 
        messages: [], 
        typingUsers: [],
        isTyping: false 
      });
    }
  },

  // 메시지 전송
  sendMessage: async (content: string, mentionUserIds: number[] = []) => {
    const { socket, isConnected, currentChatRoomId, addMessage } = get();
    
    if (!socket || !isConnected || !currentChatRoomId) {
      Alert.alert('오류', '채팅 서버에 연결되지 않았습니다.');
      return;
    }

    // authStore에서 사용자 정보 가져오기 (실제로는 import 필요)
    const { user } = await import('./authStore').then(m => m.useAuthStore.getState());
    
    if (!user) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 1단계: 로컬 메시지 생성
    const localMessage: LocalMessage = {
      id: localId,
      chat_room_id: currentChatRoomId,
      sender_id: user.id,
      type: 'text',
      content,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        nickname: user.nickname,
        profile_img: user.profile_img || null,
        avatar_url: user.profile_img || null,
      },
      mentions: [],
      isTemporary: true,
      status: 'sending',
      chatRoomId: currentChatRoomId,
      localId,
      isLocal: true
    };

    // 2단계: 즉시 UI에 표시 + 로컬 저장소에 저장
    addMessage(localMessage);
    await LocalMessageService.saveLocalMessage(currentChatRoomId, localMessage);

    // 3단계: 소켓으로 메시지 전송
    socket.emit('message:send', {
      chatRoomId: currentChatRoomId,
      type: 'text',
      content,
      mentionUserIds,
      tempId: localId
    });

    // 타이핑 상태 중단
    get().stopTyping();
  },

  // 실패한 메시지 재전송
  retryMessage: async (failedMessage: Message) => {
    const { socket, isConnected, currentChatRoomId, updateMessageStatus } = get();
    
    if (!socket || !isConnected || !currentChatRoomId) return;
    
    const messageId = typeof failedMessage.id === 'string' ? failedMessage.id : failedMessage.id.toString();
    
    // 로컬 저장소에서 전송 중 상태로 업데이트
    await LocalMessageService.updateLocalMessageStatus(
      currentChatRoomId,
      messageId,
      'sending'
    );
    
    // UI에서 전송 중 상태로 변경
    updateMessageStatus(messageId, 'sending');

    // 다시 소켓으로 전송
    socket.emit('message:send', {
      chatRoomId: currentChatRoomId,
      type: failedMessage.type,
      content: failedMessage.content,
      mentionUserIds: [],
      tempId: messageId
    });
  },

  // 실패한 메시지들 일괄 재전송
  retryAllFailedMessages: async () => {
    const { messages, retryMessage } = get();
    const failedMessages = messages.filter(msg => msg.status === 'failed');
    
    for (const failedMessage of failedMessages) {
      await retryMessage(failedMessage);
      // 서버 부하를 줄이기 위해 약간의 딜레이
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  },

  // 타이핑 시작
  startTyping: () => {
    const { socket, isConnected, currentChatRoomId, isTyping } = get();
    
    if (!socket || !isConnected || !currentChatRoomId || isTyping) return;
    
    set({ isTyping: true });
    socket.emit('typing:start', { chatRoomId: currentChatRoomId });
  },

  // 타이핑 중단
  stopTyping: () => {
    const { socket, isConnected, currentChatRoomId, isTyping } = get();
    
    if (!socket || !isConnected || !currentChatRoomId || !isTyping) return;
    
    set({ isTyping: false });
    socket.emit('typing:stop', { chatRoomId: currentChatRoomId });
  },

  // Setters
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  updateMessageStatus: (tempId, status, serverMessage) => set((state) => ({
    messages: state.messages.map(msg => {
      if (msg.id === tempId && msg.isTemporary) {
        return serverMessage ? { ...serverMessage, status } : { ...msg, status };
      }
      return msg;
    })
  })),

  setChatRooms: (chatRooms) => set({ chatRooms }),
  
  updateChatRoomLastMessage: (chatRoomId, message) => set((state) => ({
    chatRooms: state.chatRooms.map(room => {
      if (room.id === chatRoomId) {
        return {
          ...room,
          lastMessage: {
            id: typeof message.id === 'number' ? message.id : parseInt(message.id.toString()),
            content: message.content,
            type: message.type,
            sender_id: message.sender_id,
            created_at: message.created_at
          }
        };
      }
      return room;
    })
  })),

  setTypingUsers: (users) => set({ typingUsers: users }),
  setHasNext: (hasNext) => set({ hasNext }),
  setNextCursor: (cursor) => set({ nextCursor: cursor }),
  setIsLoadingMore: (loading) => set({ isLoadingMore: loading }),
  setIsInitialLoading: (loading) => set({ isInitialLoading: loading }),
}));
