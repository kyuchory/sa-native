import { useState, useEffect, useMemo, useCallback } from 'react';
import { Message } from '../types/chat';
import { ChatService } from '../services/chatService';

interface UseChatMessagesProps {
  chatRoomId: number;
  userId?: number;
}

interface UseChatMessagesReturn {
  messages: Message[];
  pendingMessages: Message[];
  displayMessages: Message[];
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  nextCursor: number | null;
  isInitialLoading: boolean;
  loadMoreMessages: () => Promise<void>;
  addPendingMessage: (message: Message) => void;
  removePendingMessage: (tempId: string) => void;
  addMessage: (message: Message) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setHasMoreMessages: React.Dispatch<React.SetStateAction<boolean>>;
  setNextCursor: React.Dispatch<React.SetStateAction<number | null>>;
  setIsInitialLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useChatMessages = ({
  chatRoomId,
  userId
}: UseChatMessagesProps): UseChatMessagesReturn => {
  // 서버에서 온 실제 메시지들
  const [messages, setMessages] = useState<Message[]>([]);
  // 낙관적 메시지들 (전송 중)
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);

  // 로딩 상태
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 표시할 메시지들: 서버 메시지 + 낙관적 메시지 결합 (실무 표준 패턴)
  const displayMessages = useMemo(() => {
    return [...messages, ...pendingMessages].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [messages, pendingMessages]);

  // 낙관적 메시지 추가
  const addPendingMessage = useCallback((message: Message) => {
    setPendingMessages(prev => [message, ...prev]);
  }, []);

  // 낙관적 메시지 제거
  const removePendingMessage = useCallback((tempId: string) => {
    setPendingMessages(prev => prev.filter(msg => msg.tempId !== tempId));
  }, []);

  // 실제 메시지 추가 (중복 방지)
  const addMessage = useCallback((newMessage: Message) => {
    setMessages(prev => {
      const exists = prev.find(msg => msg.id === newMessage.id);
      if (!exists) {
        return [newMessage, ...prev];
      }
      return prev;
    });
  }, []);

  // 더 많은 메시지 로드 (무한 스크롤)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || !nextCursor || isLoadingMessages) return;

    try {
      setIsLoadingMessages(true);
      console.log('📨 이전 메시지 로드 시작...');

      const response = await ChatService.getMessages(chatRoomId, nextCursor);

      // 기존 메시지에 이전 메시지 추가
      setMessages(prevMessages => [...prevMessages, ...response.messages]);
      setHasMoreMessages(response.hasNext);
      setNextCursor(response.nextCursor);
      setIsLoadingMessages(false);

      console.log(`📨 이전 메시지 로드 완료: ${response.messages.length}개`);
    } catch (error) {
      console.error('더 많은 메시지 로드 실패:', error);
      setIsLoadingMessages(false);
    }
  }, [chatRoomId, hasMoreMessages, nextCursor, isLoadingMessages]);

  // 채팅방 초기화 - API로 메시지 로드
  useEffect(() => {
    const initChatRoom = async () => {
      if (!userId) return;

      try {
        setIsInitialLoading(true);

        // API로 초기 메시지 로드
        const response = await ChatService.getMessages(chatRoomId);
        setMessages(response.messages);
        setHasMoreMessages(response.hasNext);
        setNextCursor(response.nextCursor);

        setIsInitialLoading(false);
        console.log(`📨 초기 메시지 로드 완료: ${response.messages.length}개`);

      } catch (error) {
        console.error('채팅방 초기화 실패:', error);
        setIsInitialLoading(false);
      }
    };

    initChatRoom();
  }, [chatRoomId, userId]);

  return {
    messages,
    pendingMessages,
    displayMessages,
    hasMoreMessages,
    isLoadingMessages,
    nextCursor,
    isInitialLoading,
    loadMoreMessages,
    addPendingMessage,
    removePendingMessage,
    addMessage,
    setMessages,
    setHasMoreMessages,
    setNextCursor,
    setIsInitialLoading,
  };
};
