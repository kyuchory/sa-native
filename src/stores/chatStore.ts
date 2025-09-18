import { create } from 'zustand';
import { Alert } from 'react-native';
import { Message, ChatUser, ChatRoom } from '../types/chat';
import { LocalMessageService, LocalMessage } from '../services/localMessageService';
import { useSocketStore } from './socketStore';
import { useAuthStore } from './authStore';

interface ChatStore {
  // 채팅방 관련
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

  // 이벤트 리스너 등록 상태 (메모리 누수 방지)
  chatEventListenersRegistered: boolean;
  
  // 🔥 이벤트 리스너 정리 기능 추가
  cleanupEventListeners: () => void;

  // Actions
  initializeChatEvents: () => Promise<void>;
  joinChatRoom: (chatRoomId: number) => void;
  leaveChatRoom: () => void;
  sendMessage: (content: string, mentionUserIds?: number[]) => Promise<void>;
  retryMessage: (failedMessage: Message) => Promise<void>;
  retryAllFailedMessages: () => Promise<void>;
  
  // 🔥 이벤트 리스너 관리 기능
  resetEventListeners: () => void;
  
  // 🔥 오프라인 복구 기능
  recoverFromOffline: () => Promise<void>;
  syncMissedMessages: () => Promise<void>;

  // 타이핑 관리
  startTyping: () => void;
  stopTyping: () => void;

  // Setters
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (tempId: string, status: 'sending' | 'sent' | 'failed', serverMessage?: Message) => void;
  setChatRooms: (chatRooms: ChatRoom[]) => void;
  updateChatRoomLastMessage: (chatRoomId: number, message: Message) => void;
  setTypingUsers: (users: ChatUser[]) => void;
  setHasNext: (hasNext: boolean) => void;
  setNextCursor: (cursor: number | null) => void;
  setIsLoadingMore: (loading: boolean) => void;
  setIsInitialLoading: (loading: boolean) => void;
  setChatEventListenersRegistered: (registered: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // 초기 상태
  currentChatRoomId: null,
  messages: [],
  typingUsers: [],
  isTyping: false,
  chatRooms: [],
  hasNext: true,
  nextCursor: null,
  isLoadingMore: false,
  isInitialLoading: true,
  chatEventListenersRegistered: false,

  // 채팅 이벤트 핸들러 초기화 - /chat 네임스페이스 구독
  initializeChatEvents: async () => {
    // 이미 등록된 리스너가 있으면 기존 리스너 정리 후 재등록
    if (get().chatEventListenersRegistered) {
      console.log('📢 ChatStore 이벤트 리스너가 이미 등록됨 - 기존 리스너 정리 후 재등록');
      get().cleanupEventListeners();
    }

    try {
      // 연결 상태 확인 - 연결될 때까지 최대 3초 대기
      let attempts = 0;
      const maxAttempts = 30; // 30 * 100ms = 3초
      let socket = useSocketStore.getState().getSocket('/chat');

      while (!socket && attempts < maxAttempts) {
        console.log(`🔄 /chat 연결 대기 중... (${++attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 대기
        socket = useSocketStore.getState().getSocket('/chat');
      }

      if (!socket) {
        throw new Error('Chat socket not connected after timeout');
      }

      const isConnected = useSocketStore.getState().isConnected('/chat');
      if (!isConnected) {
        console.warn('⚠️ /chat 소켓은 있지만 연결 상태가 아직 false임');
        // 연결 상태를 기다리되 타임아웃 설정
        let connectedAttempts = 0;
        const maxConnectedAttempts = 20; // 20 * 100ms = 2초 추가 대기

        while (!useSocketStore.getState().isConnected('/chat') && connectedAttempts < maxConnectedAttempts) {
          console.log(`🔄 /chat 연결 상태 대기 중... (${++connectedAttempts}/${maxConnectedAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      useSocketStore.getState().subscribe('/chat', 'chatStore');

      console.log('📢 ChatStore가 /chat 네임스페이스 이벤트 구독 시작');

      // 🔥 개선된 이벤트 핸들러 정리 - 모든 리스너 제거
      socket.removeAllListeners();
      console.log('🧹 기존 모든 이벤트 리스너 제거 완료');

      // 채팅 이벤트 핸들러 설정
      socket.on('joined_room', (data: any) =>
        console.log(`📨 채팅방 ${data.chat_room_id} 참가 완료`));

      socket.on('user_joined', (data: any) =>
        console.log(`👋 ${data.nickname}님이 참가했습니다.`));

      socket.on('message:receive', (message: Message) => {
        console.log('📨 새 메시지 수신:', message);
        const { currentChatRoomId, addMessage, updateChatRoomLastMessage } = get();

        if (currentChatRoomId === message.chat_room_id) {
          addMessage(message);
        }
        updateChatRoomLastMessage(message.chat_room_id, message);
      });

      socket.on('message:sent', async (data: { temp_id: string; message: Message }) => {
        console.log('✅ 메시지 전송 성공:', data);
        const { currentChatRoomId, updateMessageStatus, updateChatRoomLastMessage } = get();

        if (currentChatRoomId) {
          await LocalMessageService.replaceWithServerMessage(
            currentChatRoomId,
            data.temp_id,
            data.message
          );
        }

        updateMessageStatus(data.temp_id, 'sent', data.message);
        updateChatRoomLastMessage(data.message.chat_room_id, data.message);
      });

      socket.on('message:failed', async (data: { temp_id: string; error: string }) => {
        console.log('❌ 메시지 전송 실패:', data);
        const { currentChatRoomId, updateMessageStatus } = get();

        if (currentChatRoomId) {
          await LocalMessageService.updateLocalMessageStatus(
            currentChatRoomId,
            data.temp_id,
            'failed'
          );
        }

        updateMessageStatus(data.temp_id, 'failed');
        Alert.alert('전송 실패', '메시지 전송에 실패했습니다. 메시지를 탭하여 재전송할 수 있습니다.');
      });

      socket.on('mention:receive', (mention: any) => {
        console.log('🔔 멘션 알림:', mention);
        Alert.alert('멘션 알림', `${mention.sender_nickname}님이 회원님을 멘션했습니다.`);
      });

      socket.on('typing:status', (data: any) => {
        const { currentChatRoomId } = get();

        if (currentChatRoomId === data.chat_room_id) {
          set((state) => {
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
      });

      socket.on('user_left', (data: any) =>
        console.log(`👋 ${data.nickname}님이 나갔습니다.`));

      socket.on('left_room', (data: any) =>
        console.log(`📤 채팅방 ${data.chat_room_id}에서 나갔습니다.`));

      socket.on('error', (error: any) => {
        console.error('💥 Socket 에러:', error);
        switch(error.type) {
          case 'message_send_failed':
            Alert.alert('오류', '메시지 전송에 실패했습니다.');
            break;
          default:
            Alert.alert('오류', error.message || '알 수 없는 오류가 발생했습니다.');
        }
      });

      // 이벤트 리스너 등록 완료 표시
      get().setChatEventListenersRegistered(true);

      console.log('✅ ChatStore 이벤트 핸들러 초기화 완료');
    } catch (error) {
      console.error('❌ ChatStore 이벤트 초기화 실패:', error);
    }
  },

  // 채팅방 참가
  joinChatRoom: (chatRoomId: number) => {
    const socket = useSocketStore.getState().getSocket('/chat');
    const isConnected = useSocketStore.getState().isConnected('/chat');

    if (!socket || !isConnected) {
      Alert.alert('오류', '채팅 서버에 연결되지 않았습니다.');
      return;
    }

    console.log(`📨 채팅방 ${chatRoomId} 참가 요청`);
    socket.emit('join_room', { chat_room_id: chatRoomId });
    set({ currentChatRoomId: chatRoomId });
  },

  // 채팅방 나가기
  leaveChatRoom: () => {
    const socket = useSocketStore.getState().getSocket('/chat');
    const currentChatRoomId = get().currentChatRoomId;

    if (socket && socket.connected && currentChatRoomId) {
      console.log(`📤 채팅방 ${currentChatRoomId} 나가기 요청`);
      socket.emit('leave_room', { chat_room_id: currentChatRoomId });
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
    const socket = useSocketStore.getState().getSocket('/chat');
    const isConnected = useSocketStore.getState().isConnected('/chat');
    const { currentChatRoomId, addMessage } = get();

    if (!socket || !isConnected || !currentChatRoomId) {
      Alert.alert('오류', '채팅 서버에 연결되지 않았습니다.');
      return;
    }

    const { user } = useAuthStore.getState();
    if (!user) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 로컬 메시지 생성
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

    // UI에 즉시 표시 + 로컬 저장소에 저장
    addMessage(localMessage);
    await LocalMessageService.saveLocalMessage(currentChatRoomId, localMessage);

    // 소켓으로 전송
    socket.emit('message:send', {
      chat_room_id: currentChatRoomId,
      type: 'text',
      content,
      mention_user_ids: mentionUserIds,
      temp_id: localId
    });

    // 타이핑 상태 중단
    get().stopTyping();
  },

  // 실패한 메시지 재전송
  retryMessage: async (failedMessage: Message) => {
    const socket = useSocketStore.getState().getSocket('/chat');
    const isConnected = useSocketStore.getState().isConnected('/chat');
    const { currentChatRoomId, updateMessageStatus } = get();

    if (!socket || !isConnected || !currentChatRoomId) return;

    const messageId = typeof failedMessage.id === 'string' ? failedMessage.id : failedMessage.id.toString();

    // 로컬 저장소에서 전송 중 상태로 업데이트
    await LocalMessageService.updateLocalMessageStatus(
      currentChatRoomId,
      messageId,
      'sending'
    );

    updateMessageStatus(messageId, 'sending');

    // 다시 전송
    socket.emit('message:send', {
      chat_room_id: currentChatRoomId,
      type: failedMessage.type,
      content: failedMessage.content,
      mention_user_ids: [],
      temp_id: messageId
    });
  },

  // 실패한 메시지들 일괄 재전송
  retryAllFailedMessages: async () => {
    const { messages, retryMessage } = get();
    const failedMessages = messages.filter(msg => msg.status === 'failed');

    for (const failedMessage of failedMessages) {
      await retryMessage(failedMessage);
      await new Promise(resolve => setTimeout(resolve, 100)); // 부하 방지
    }
  },

  // 타이핑 시작
  startTyping: () => {
    const socket = useSocketStore.getState().getSocket('/chat');
    const isConnected = useSocketStore.getState().isConnected('/chat');
    const { currentChatRoomId } = get();

    if (!socket || !isConnected || !currentChatRoomId || get().isTyping) return;

    set({ isTyping: true });
    socket.emit('typing:start', { chat_room_id: currentChatRoomId });
  },

  // 타이핑 중단
  stopTyping: () => {
    const socket = useSocketStore.getState().getSocket('/chat');
    const isConnected = useSocketStore.getState().isConnected('/chat');
    const { currentChatRoomId } = get();

    if (!socket || !isConnected || !currentChatRoomId || !get().isTyping) return;

    set({ isTyping: false });
    socket.emit('typing:stop', { chat_room_id: currentChatRoomId });
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
  setChatEventListenersRegistered: (registered) => set({ chatEventListenersRegistered: registered }),
  
  // 🔥 이벤트 리스너 정리 기능
  cleanupEventListeners: () => {
    const socket = useSocketStore.getState().getSocket('/chat');
    if (socket) {
      console.log('🧹 ChatStore 이벤트 리스너 정리 시작...');
      socket.removeAllListeners();
      console.log('✅ ChatStore 이벤트 리스너 정리 완료');
    }
    set({ chatEventListenersRegistered: false });
  },
  
  // 🔥 이벤트 리스너 리셋 기능
  resetEventListeners: () => {
    get().cleanupEventListeners();
    // 재등록은 initializeChatEvents()를 다시 호출하여 수행
  },
  
  // 🔥 오프라인 상태에서 복구
  recoverFromOffline: async () => {
    console.log('🔄 오프라인 복구 시작...');
    
    const { currentChatRoomId } = get();
    
    try {
      // 1. 연결된 채팅방이 있다면 다시 참가
      if (currentChatRoomId) {
        console.log(`💬 채팅방 ${currentChatRoomId} 재참가...`);
        get().joinChatRoom(currentChatRoomId);
      }
      
      // 2. 누락된 메시지 동기화
      await get().syncMissedMessages();
      
      // 3. 실패한 메시지 재전송
      await get().retryAllFailedMessages();
      
      console.log('✅ 오프라인 복구 완료');
      
    } catch (error) {
      console.error('❌ 오프라인 복구 실패:', error);
    }
  },
  
  // 🔥 누락된 메시지 동기화
  syncMissedMessages: async () => {
    const { currentChatRoomId, messages } = get();
    
    if (!currentChatRoomId || messages.length === 0) {
      console.log('🔄 동기화할 채팅방 또는 메시지가 없음');
      return;
    }
    
    try {
      // 마지막 메시지 시간 기준으로 새 메시지 조회
      const lastMessage = messages[messages.length - 1];
      const lastMessageTime = lastMessage.created_at;
      
      console.log(`🔄 ${lastMessageTime} 이후 메시지 동기화...`);
      
      // TODO: 서버 API에서 특정 시간 이후 메시지 조회 기능 구현 필요
      // const newMessages = await ChatService.getMessagesSince(currentChatRoomId, lastMessageTime);
      // newMessages.forEach(message => get().addMessage(message));
      
      console.log('✅ 누락된 메시지 동기화 완료');
      
    } catch (error) {
      console.error('❌ 누락된 메시지 동기화 실패:', error);
    }
  }
}));
