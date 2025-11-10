import { useState, useCallback, useRef } from 'react';
import { startTyping, stopTyping } from '../services/chatSocketService';

interface UseChatTypingProps {
  chatRoomId: number;
}

interface UseChatTypingReturn {
  typingUsers: Array<{ user_id: number; nickname: string; timestamp: number }>;
  startTypingIndicator: () => void;
  stopTypingIndicator: () => void;
  updateTypingUsers: (users: Array<{ user_id: number; nickname: string; timestamp: number }>) => void;
}

export const useChatTyping = ({ chatRoomId }: UseChatTypingProps): UseChatTypingReturn => {
  // 타이핑 상태
  const [typingUsers, setTypingUsers] = useState<Array<{ user_id: number; nickname: string; timestamp: number }>>([]);

  // 타이핑 타이머 ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 타이핑 시작 핸들러
  const startTypingIndicator = useCallback(() => {
    // 소켓으로 타이핑 시작 알림
    startTyping(chatRoomId);

    // 3초 후 자동으로 타이핑 중단
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIndicator();
    }, 3000);
  }, [chatRoomId]);

  // 타이핑 중단 핸들러
  const stopTypingIndicator = useCallback(() => {
    // 소켓으로 타이핑 중단 알림
    stopTyping(chatRoomId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [chatRoomId]);

  // 타이핑 사용자 업데이트
  const updateTypingUsers = useCallback((users: Array<{ user_id: number; nickname: string; timestamp: number }>) => {
    setTypingUsers(users);
  }, []);

  return {
    typingUsers,
    startTypingIndicator,
    stopTypingIndicator,
    updateTypingUsers,
  };
};
