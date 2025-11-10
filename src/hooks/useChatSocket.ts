import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '../types/chat';
import { chatSocketService } from '../services/chatSocketService';
import { onMessageEvent, onTypingEvent } from '../services/chatSocketService';

interface UseChatSocketProps {
  chatRoomId: number;
  userId?: number;
  onMessageReceive?: (message: Message) => void;
  onMessageSent?: (tempId: string, message: Message) => void;
  onMessageFailed?: (tempId: string, error: any) => void;
  onTypingUpdate?: (typingUsers: Array<{ user_id: number; nickname: string; timestamp: number }>) => void;
}

interface UseChatSocketReturn {
  subscriptionStatus: {
    isSubscribed: boolean;
    error: string | null;
    chatRoomId: number | null;
  };
  typingUsers: Array<{ user_id: number; nickname: string; timestamp: number }>;
  subscribeToChat: () => Promise<void>;
  unsubscribeFromChat: () => void;
}

export const useChatSocket = ({
  chatRoomId,
  userId,
  onMessageReceive,
  onMessageSent,
  onMessageFailed,
  onTypingUpdate,
}: UseChatSocketProps): UseChatSocketReturn => {
  // 채팅 구독 상태
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isSubscribed: boolean;
    error: string | null;
    chatRoomId: number | null;
  }>({
    isSubscribed: false,
    error: null,
    chatRoomId: null
  });

  // 타이핑 상태
  const [typingUsers, setTypingUsers] = useState<Array<{ user_id: number; nickname: string; timestamp: number }>>([]);

  // cleanup 함수들을 저장할 ref
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // 구독 상태 변경 콜백 설정
  useEffect(() => {
    const unsubscribe = chatSocketService.onSubscriptionChange((status) => {
      setSubscriptionStatus({
        isSubscribed: status.isSubscribed,
        error: status.error,
        chatRoomId: status.chatRoomId
      });
    });

    cleanupFunctionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // 메시지 이벤트 리스너 설정
  useEffect(() => {
    const unsubscribeMessage = onMessageEvent((type, data) => {
      // 내가 보낸 메시지 성공 확인 (sent 이벤트)
      if (type === 'sent' && data.temp_id) {
        console.log(`✅ 내가 보낸 메시지 성공 확인: ${data.temp_id}`);
        onMessageSent?.(data.temp_id, data.message);
      }
      // 상대방 메시지 수신
      else if (type === 'receive' && data.chat_room_id === chatRoomId) {
        console.log(`📨 상대방 메시지 정상 수신:`, data);

        const newMessage: Message = {
          id: data.id,
          chat_room_id: data.chat_room_id,
          sender_id: data.sender_id,
          content: data.content,
          type: data.type,
          sender: data.sender,
          created_at: data.created_at,
          updated_at: data.created_at,
          mentions: data.mentions || [],
          mention_user_ids: data.mentions?.map((m: any) => m.mentionedUserId) || []
        };

        onMessageReceive?.(newMessage);
      } else if (type === 'failed') {
        // 메시지 전송 실패 처리
        console.error('메시지 전송 실패:', data.error);
        onMessageFailed?.(data.temp_id, data.error);
      }
    });

    cleanupFunctionsRef.current.push(unsubscribeMessage);
    return unsubscribeMessage;
  }, [chatRoomId, onMessageReceive, onMessageSent, onMessageFailed]);

  // 타이핑 이벤트 리스너 설정
  useEffect(() => {
    const unsubscribeTyping = onTypingEvent((data) => {
      if (data.chat_room_id === chatRoomId && data.user_id !== userId) {
        // 상대방 타이핑 상태 업데이트
        setTypingUsers(prev => {
          const now = Date.now();
          if (data.is_typing) {
            // 타이핑 시작
            const existingIndex = prev.findIndex(u => u.user_id === data.user_id);
            if (existingIndex >= 0) {
              // 이미 있는 경우 timestamp만 업데이트
              const updated = [...prev];
              updated[existingIndex].timestamp = now;
              return updated;
            } else {
              // 새로 추가
              return [...prev, {
                user_id: data.user_id,
                nickname: data.nickname,
                timestamp: now
              }];
            }
          } else {
            // 타이핑 중단
            return prev.filter(u => u.user_id !== data.user_id);
          }
        });
      }
    });

    cleanupFunctionsRef.current.push(unsubscribeTyping);
    return unsubscribeTyping;
  }, [chatRoomId, userId]);

  // 타이핑 상태 자동 정리 (3초 후 만료)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const filtered = prev.filter(u => now - u.timestamp < 3000);
        if (filtered.length !== prev.length) {
          onTypingUpdate?.(filtered);
        }
        return filtered;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTypingUpdate]);

  // 타이핑 상태가 변경될 때 콜백 호출
  useEffect(() => {
    onTypingUpdate?.(typingUsers);
  }, [typingUsers, onTypingUpdate]);

  // 채팅 구독
  const subscribeToChat = useCallback(async () => {
    try {
      await chatSocketService.subscribeToChat(chatRoomId);
      console.log('✅ 채팅방 구독 완료');
    } catch (error) {
      console.error('❌ 채팅방 구독 실패:', error);
      throw error;
    }
  }, [chatRoomId]);

  // 채팅 구독 해제
  const unsubscribeFromChat = useCallback(() => {
    console.log('📍 채팅방 구독 해제');
    chatSocketService.unsubscribeFromChat(chatRoomId);
  }, [chatRoomId]);

  // cleanup 함수들 실행
  useEffect(() => {
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current = [];
    };
  }, []);

  return {
    subscriptionStatus,
    typingUsers,
    subscribeToChat,
    unsubscribeFromChat,
  };
};
