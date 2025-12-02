import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ✅ 최적화 1: 정렬된 타임스탬프를 캐싱하여 재계산 방지
  const sortedTimestamps = useRef<Map<number, number>>(new Map());

  const getMessageTimestamp = useCallback((message: Message): number => {
    const cachedTimestamp = sortedTimestamps.current.get(message.id);
    if (cachedTimestamp !== undefined) {
      return cachedTimestamp;
    }
    const timestamp = new Date(message.created_at).getTime();
    sortedTimestamps.current.set(message.id, timestamp);
    return timestamp;
  }, []);

  // ✅ 최적화 2: 정렬 최적화 - 이미 정렬된 배열을 효율적으로 병합
  const displayMessages = useMemo(() => {
    // pendingMessages는 항상 최신이므로 fastest delivery를 위해 앞에 배치
    // inverted FlatList에서 최신 메시지가 가장 위에 표시됨
    return [...pendingMessages, ...messages];
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

  // ✅ 타임스탬프 캐시 정리
  useEffect(() => {
    return () => {
      sortedTimestamps.current.clear();
    };
  }, []);

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
