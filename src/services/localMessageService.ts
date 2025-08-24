/**
 * 로컬 메시지 저장소 서비스 (카카오톡 스타일)
 * 전송 실패한 메시지도 로컬에 저장하여 앱 재시작 시에도 유지
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types/chat';

const LOCAL_MESSAGES_KEY = 'local_messages';

export interface LocalMessage extends Message {
  chatRoomId: number;
  localId: string;
  serverId?: number;
  isLocal: boolean;
}

export class LocalMessageService {
  /**
   * 특정 채팅방의 로컬 메시지들을 조회
   */
  static async getLocalMessages(chatRoomId: number): Promise<LocalMessage[]> {
    try {
      const storedMessages = await AsyncStorage.getItem(`${LOCAL_MESSAGES_KEY}_${chatRoomId}`);
      if (!storedMessages) return [];
      
      const messages: LocalMessage[] = JSON.parse(storedMessages);
      return messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } catch (error) {
      console.error('로컬 메시지 조회 실패:', error);
      return [];
    }
  }

  /**
   * 로컬 메시지 저장 (전송 시도 시)
   */
  static async saveLocalMessage(chatRoomId: number, message: LocalMessage): Promise<void> {
    try {
      const existingMessages = await this.getLocalMessages(chatRoomId);
      const updatedMessages = [...existingMessages, message];
      
      await AsyncStorage.setItem(
        `${LOCAL_MESSAGES_KEY}_${chatRoomId}`,
        JSON.stringify(updatedMessages)
      );
    } catch (error) {
      console.error('로컬 메시지 저장 실패:', error);
    }
  }

  /**
   * 로컬 메시지 상태 업데이트 (전송 성공/실패 시)
   */
  static async updateLocalMessageStatus(
    chatRoomId: number,
    localId: string,
    status: 'sending' | 'sent' | 'failed',
    serverId?: number
  ): Promise<void> {
    try {
      const existingMessages = await this.getLocalMessages(chatRoomId);
      const updatedMessages = existingMessages.map(msg => {
        if (msg.localId === localId) {
          return {
            ...msg,
            status,
            serverId: serverId || msg.serverId,
            // 서버 ID가 있으면 더 이상 로컬 메시지가 아님
            isLocal: status === 'failed' || status === 'sending'
          };
        }
        return msg;
      });

      await AsyncStorage.setItem(
        `${LOCAL_MESSAGES_KEY}_${chatRoomId}`,
        JSON.stringify(updatedMessages)
      );
    } catch (error) {
      console.error('로컬 메시지 상태 업데이트 실패:', error);
    }
  }

  /**
   * 전송 성공한 로컬 메시지를 서버 메시지로 교체
   */
  static async replaceWithServerMessage(
    chatRoomId: number,
    localId: string,
    serverMessage: Message
  ): Promise<void> {
    try {
      const existingMessages = await this.getLocalMessages(chatRoomId);
      const updatedMessages = existingMessages.map(msg => {
        if (msg.localId === localId) {
          return {
            ...serverMessage,
            chatRoomId,
            localId,
            serverId: typeof serverMessage.id === 'number' ? serverMessage.id : undefined,
            isLocal: false,
            status: 'sent' as const
          };
        }
        return msg;
      });

      await AsyncStorage.setItem(
        `${LOCAL_MESSAGES_KEY}_${chatRoomId}`,
        JSON.stringify(updatedMessages)
      );
    } catch (error) {
      console.error('서버 메시지로 교체 실패:', error);
    }
  }

  /**
   * 실패한 메시지들만 조회 (재전송용)
   */
  static async getFailedMessages(chatRoomId: number): Promise<LocalMessage[]> {
    try {
      const allMessages = await this.getLocalMessages(chatRoomId);
      return allMessages.filter(msg => msg.status === 'failed');
    } catch (error) {
      console.error('실패 메시지 조회 실패:', error);
      return [];
    }
  }

  /**
   * 특정 로컬 메시지 삭제
   */
  static async deleteLocalMessage(chatRoomId: number, localId: string): Promise<void> {
    try {
      const existingMessages = await this.getLocalMessages(chatRoomId);
      const filteredMessages = existingMessages.filter(msg => msg.localId !== localId);
      
      await AsyncStorage.setItem(
        `${LOCAL_MESSAGES_KEY}_${chatRoomId}`,
        JSON.stringify(filteredMessages)
      );
    } catch (error) {
      console.error('로컬 메시지 삭제 실패:', error);
    }
  }

  /**
   * 로컬 메시지와 서버 메시지를 병합하여 최종 메시지 목록 생성
   */
  static mergeWithServerMessages(
    serverMessages: Message[],
    localMessages: LocalMessage[]
  ): Message[] {
    // 서버 메시지 ID들 추출
    const serverMessageIds = new Set(
      serverMessages.map(msg => typeof msg.id === 'number' ? msg.id : null).filter(Boolean)
    );

    // 로컬 메시지 중 서버에 없는 것들만 필터링 (전송 실패한 것들)
    const uniqueLocalMessages = localMessages.filter(localMsg => {
      // 서버 ID가 있고 서버 메시지에 포함되어 있으면 제외
      if (localMsg.serverId && serverMessageIds.has(localMsg.serverId)) {
        return false;
      }
      // 전송 실패하거나 전송 중인 메시지만 포함
      return localMsg.status === 'failed' || localMsg.status === 'sending';
    });

    // 서버 메시지와 로컬 메시지 병합 후 시간순 정렬
    const allMessages = [...serverMessages, ...uniqueLocalMessages];
    return allMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  /**
   * 채팅방의 모든 로컬 메시지 삭제 (채팅방 나가기 시)
   */
  static async clearChatRoomMessages(chatRoomId: number): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${LOCAL_MESSAGES_KEY}_${chatRoomId}`);
    } catch (error) {
      console.error('채팅방 메시지 삭제 실패:', error);
    }
  }
}
