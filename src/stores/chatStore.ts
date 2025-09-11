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

  // Actions
  initializeChatEvents: () => Promise<void>;
  joinChatRoom: (chatRoomId: number) => void;
  leaveChatRoom: () => void;
  sendMessage: (content: string, mentionUserIds?: number[]) => Promise<void>;
  retryMessage: (failedMessage: Message) => Promise<void>;
  retryAllFailedMessages: () => Promise<void>;

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

  // 채팅 이벤트 핸들러 초기화 - /chat 네임스페이스 구독
  initializeChatEvents: async () => {
    try {
      // /chat 네임스페이스 연결
      const socket = await useSocketStore.getState().connect('/chat');
      useSocketStore.getState().subscribe('/chat', 'chatStore');

      console.log('📢 ChatStore가 /chat 네임스페이스 이벤트 구독 시작');

      // 기존 이벤트 핸들러 제거
      socket.off('joined_room');
      socket.off('user_joined');
      socket.off('message:receive');
      socket.off('message:sent');
      socket.off('message:failed');
      socket.off('mention:receive');
      socket.off('typing:status');
      socket.off('user_left');
      socket.off('left_room');
      socket.off('error');

      // 채팅 이벤트 핸들러 설정
      socket.on('joined_room', (data: any) =>
        console.log(`📨 채팅방 ${data.chatRoomId} 참가 완료`));

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

      socket.on('message:sent', async (data: { tempId: string; message: Message }) => {
        console.log('✅ 메시지 전송 성공:', data);
        const { currentChatRoomId, updateMessageStatus, updateChatRoomLastMessage } = get();

        if (currentChatRoomId) {
          await LocalMessageService.replaceWithServerMessage(
            currentChatRoomId,
            data.tempId,
            data.message
          );
        }

        updateMessageStatus(data.tempId, 'sent', data.message);
        updateChatRoomLastMessage(data.message.chat_room_id, data.message);
      });

      socket.on('message:failed', async (data: { tempId: string; error: string }) => {
        console.log('❌ 메시지 전송 실패:', data);
        const { currentChatRoomId, updateMessageStatus } = get();

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

      socket.on('mention:receive', (mention: any) => {
        console.log('🔔 멘션 알림:', mention);
        Alert.alert('멘션 알림', `${mention.senderNickname}님이 회원님을 멘션했습니다.`);
      });

      socket.on('typing:status', (data: any) => {
        const { currentChatRoomId } = get();

        if (currentChatRoomId === data.chatRoomId) {
          set((state) => {
            let newTypingUsers = [...state.typingUsers];

            if (data.isTyping) {
              // 타이핑 시작 - 중복 제거
              const filtered = newTypingUsers.filter(u => u.id !== data.userId);
              newTypingUsers = [...filtered, {
                id: data.userId,
                nickname: data.nickname,
                profile_img: null
              }];
            } else {
              // 타이핑 중단
              newTypingUsers = newTypingUsers.filter(u => u.id !== data.userId);
            }

            return { typingUsers: newTypingUsers };
          });
        }
      });

      socket.on('user_left', (data: any) =>
        console.log(`👋 ${data.nickname}님이 나갔습니다.`));

      socket.on('left_room', (data: any) =>
        console.log(`📤 채팅방 ${data.chatRoomId}에서 나갔습니다.`));

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
    socket.emit('join_room', { chatRoomId });
    set({ currentChatRoomId: chatRoomId });
  },

  // 채팅방 나가기
  leaveChatRoom: () => {
    const socket = useSocketStore.getState().getSocket('/chat');
    const currentChatRoomId = get().currentChatRoomId;

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
    socket.emit('typing:start', { chatRoomId: currentChatRoomId });
  },

  // 타이핑 중단
  stopTyping: () => {
    const socket = useSocketStore.getState().getSocket('/chat');
    const isConnected = useSocketStore.getState().isConnected('/chat');
    const { currentChatRoomId } = get();

    if (!socket || !isConnected || !currentChatRoomId || !get().isTyping) return;

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
  setIsInitialLoading: (loading) => set({ isInitialLoading: loading })
}));
