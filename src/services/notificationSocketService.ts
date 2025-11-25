import { socketService } from './socketService';
import type { ServerToClientEvents } from '../types/socket';
import { useNotificationStore } from '../stores/notificationStore';
import { useChatStore } from '../stores/chatStore';
import { Notification } from '../types/notification';

// 알림 서비스 클래스
// 서버에서 자동으로 알림 구독을 처리하므로 클라이언트에서는 상태 추적 불필요
class NotificationSocketService {
  private notificationCallbacks: { [event: string]: Array<(...args: any[]) => void> } = {};
  private eventListenersSetup = false;

  constructor() {
    this.setupSocketConnectionListener();
  }

  // 게터들 (서버 자동 구독이므로 상태 추적 불필요)

  // 소켓 연결 상태 리스너 설정
  private setupSocketConnectionListener() {
    socketService.onConnectionChange((connected: boolean) => {
      if (connected) {
        console.log('🔌 NotificationSocketService: 소켓 연결됨, 알림 이벤트 리스너 설정');
        // 재연결 시 플래그 리셋 (중요!)
        this.eventListenersSetup = false;
        this.setupNotificationListeners();
      } else {
        console.log('🔌 NotificationSocketService: 소켓 연결 해제됨');
        this.clearAllEventListeners();
      }
    });

    // 초기 연결 상태에 따라 설정
    if (socketService.isConnected) {
      console.log('🔌 NotificationSocketService: 초기 소켓 연결됨, 알림 이벤트 리스너 설정');
      this.setupNotificationListeners();
    }
  }

  // 알림 리스너 설정 (외부에서 호출 가능하도록 public)
  public setupListeners() {
    this.setupNotificationListeners();
  }

  // 알림 리스너 설정 (서버 자동 구독이므로 재연결시 재설정만)
  private setupNotificationListeners() {
    if (this.eventListenersSetup) return;

    console.log('🎧 NotificationSocketService: 알림 이벤트 리스너 설정 시작');

    // 기존 리스너 제거 (알림 수신용만 유지)
    this.clearAllEventListeners();

    // 포스트 좋아요 알림 수신
    socketService.on('notification:post_liked', (data) => {
      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);
    });

    // 피드 좋아요 알림 수신
    socketService.on('notification:feed_liked', (data) => {
      console.log('🔔 피드 좋아요 알림 수신:', {
        알림ID: data.id,
        타입: data.type,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        피드ID: data.feed.id,
        피드제목: data.feed.title,
        읽음여부: data.is_read,
        생성시간: data.created_at
      });

      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);

      console.log('📢 피드 좋아요 알림 처리 완료');
    });

    // 팔로우 알림 수신
    socketService.on('notification:followed', (data) => {
      console.log('🔔 팔로우 알림 수신:', {
        알림ID: data.id,
        타입: data.type,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        읽음여부: data.is_read,
        생성시간: data.created_at
      });

      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);

      console.log('📢 팔로우 알림 처리 완료');
    });

    // 피드 댓글 알림 수신
    socketService.on('notification:feed_commented', (data) => {
      console.log('🔔 피드 댓글 알림 수신:', {
        알림ID: data.id,
        타입: data.type,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        피드ID: data.feed.id,
        댓글내용: data.comment_content.substring(0, 50) + '...',
        읽음여부: data.is_read,
        생성시간: data.created_at
      });

      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);

      console.log('📢 피드 댓글 알림 처리 완료');
    });

    // 포스트 댓글 알림 수신
    socketService.on('notification:post_commented', (data) => {
      console.log('🔔 포스트 댓글 알림 수신:', {
        알림ID: data.id,
        타입: data.type,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        포스트ID: data.post.id,
        댓글내용: data.comment_content.substring(0, 50) + '...',
        읽음여부: data.is_read,
        생성시간: data.created_at
      });

      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);

      console.log('📢 포스트 댓글 알림 처리 완료');
    });

    // 읽지 않은 알림 개수 업데이트 수신
    socketService.on('notification:unread_count', (data) => {
      console.log('🔔 읽지 않은 알림 개수 업데이트:', {
        읽지않은알림개수: data.unread_count,
        업데이트시간: data.updated_at
      });

      // Zustand 스토어를 통해 실시간 업데이트
      useNotificationStore.getState().setUnreadCount(data.unread_count);

      console.log('📢 읽지 않은 알림 개수 업데이트 처리 완료');
    });

    // 피드 생성 알림 수신
    socketService.on('notification:feed_created', (data) => {
      console.log('🔔 피드 생성 알림 수신:', {
        알림ID: data.id,
        타입: data.type,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        피드ID: data.feed.id,
        피드제목: data.feed.title,
        읽음여부: data.is_read,
        생성시간: data.created_at
      });

      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);

      console.log('📢 피드 생성 알림 처리 완료');
    });

    // 포스트 생성 알림 수신
    socketService.on('notification:post_created', (data) => {
      console.log('🔔 포스트 생성 알림 수신:', {
        알림ID: data.id,
        타입: data.type,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        포스트ID: data.post.id,
        포스트제목: data.post.title,
        읽음여부: data.is_read,
        생성시간: data.created_at
      });

      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);

      console.log('📢 포스트 생성 알림 처리 완료');
    });

    // 메시지 알림 수신
    socketService.on('notification:message', (data) => {
      console.log('🔔 메시지 알림 수신:', {
        알림ID: data.id,
        타입: data.type,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        읽음여부: data.is_read,
        생성시간: data.created_at
      });

      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);

      console.log('📢 메시지 알림 처리 완료');
    });

    // 쇼츠 좋아요 알림 수신
    socketService.on('notification:short_liked', (data) => {
      console.log('🔔 쇼츠 좋아요 알림 수신:', {
        알림ID: data.id,
        타입: data.type,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        컷츠ID: data.reference_id,
        읽음여부: data.is_read,
        생성시간: data.created_at
      });

      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);

      console.log('📢 쇼츠 좋아요 알림 처리 완료');      console.log('📢 쇼츠 좋아요 알림 처리 완료');
    });

    // 컷츠 댓글 알림 수신
    socketService.on('notification:short_commented', (data) => {
      console.log('🔔 컷츠 댓글 알림 수신:', {
        알림ID: data.id,
        타입: data.type,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        컷츠ID: data.reference_id,
        읽음여부: data.is_read,
        생성시간: data.created_at
      });

      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);

      console.log('📢 컷츠 댓글 알림 처리 완료');
    });

    // 컷츠 생성 알림 수신
    socketService.on('notification:short_created', (data) => {
      console.log('🔔 컷츠 생성 알림 수신:', {
        알림ID: data.id,
        타입: data.type,
        보낸사람: `${data.sender.nickname} (ID: ${data.sender.id})`,
        컷츠ID: data.reference_id,
        읽음여부: data.is_read,
        생성시간: data.created_at
      });

      // 실제 알림 처리 로직
      this.handleRealtimeNotification(data);

      console.log('📢 컷츠 생성 알림 처리 완료');
    });

    // 채팅 배지 알림 수신 (새 메시지 도착 시)
    socketService.on('notification:chat_badge', (data) => {
      console.log('🔔 채팅 배지 알림 수신:', {
        새메시지여부: data.hasNewMessage,
        업데이트시간: data.updated_at
      });

      // 새 메시지가 도착한 경우 채팅 읽지 않은 개수 증가
      if (data.hasNewMessage) {
        useChatStore.getState().incrementUnreadCount();
        console.log('📢 채팅 읽지 않은 개수 증가 처리 완료');
      }
    });

    this.eventListenersSetup = true;
    console.log('🎧 NotificationSocketService: 알림 이벤트 리스너 설정 완료');
  }

  // 모든 이벤트 리스너 제거 (연결별 정리용)
  private clearAllEventListeners() {
    console.log('🧹 NotificationSocketService: 모든 이벤트 리스너 정리');

    // 기존 리스너 제거 (알림 수신용만 유지)
    socketService.off('notification:unread_count');
    socketService.off('notification:message_badge');
    socketService.off('notification:chat_badge');
    socketService.off('notification:post_liked');
    socketService.off('notification:feed_liked');
    socketService.off('notification:followed');
    socketService.off('notification:feed_commented');
    socketService.off('notification:post_commented');
    socketService.off('notification:feed_created');
    socketService.off('notification:post_created');
    socketService.off('notification:message');
    socketService.off('notification:short_liked');
    socketService.off('notification:short_commented');
    socketService.off('notification:short_created');

    this.eventListenersSetup = false;
  }

  // 실시간 알림 처리 메서드
  private handleRealtimeNotification(data: any) {
    try {
      // 소켓 데이터를 Notification 타입으로 변환
      const notification: Notification = {
        id: data.id,
        type: data.type,
        sender: data.sender,
        message: this.generateNotificationMessage(data),
        reference_id: data.reference_id,
        is_read: false, // 새 알림은 읽지 않음으로 설정
        created_at: data.created_at
      };

      // NotificationStore에 알림 추가
      useNotificationStore.getState().addNotification(notification);
    } catch (error) {
      console.error('❌ 실시간 알림 처리 실패:', error);
    }
  }

  // 알림 메시지 생성
  private generateNotificationMessage(data: any): string {
    const { type, sender } = data;

    switch (type) {
      case 'followed':
        return `${sender.nickname}님이 회원님을 팔로우했습니다.`;
      case 'feed_liked':
        return `${sender.nickname}님이 회원님의 피드를 좋아합니다.`;
      case 'post_liked':
        return `${sender.nickname}님이 회원님의 포스트를 좋아합니다.`;
      case 'feed_commented':
        return `${sender.nickname}님이 회원님의 피드에 댓글을 남겼습니다.`;
      case 'post_commented':
        return `${sender.nickname}님이 회원님의 포스트에 댓글을 남겼습니다.`;
      case 'feed_created':
        return `${sender.nickname}님이 새 피드를 작성했습니다.`;
      case 'post_created':
        return `${sender.nickname}님이 새 포스트를 작성했습니다.`;
      case 'message':
        return `${sender.nickname}님이 메시지를 보냈습니다.`;
      case 'short_liked':
        return `${sender.nickname}님이 회원님의 컷츠를 좋아합니다.`;
      case 'short_commented':
        return `${sender.nickname}님이 회원님의 컷츠에 댓글을 남겼습니다.`;
      case 'short_created':
        return `${sender.nickname}님이 컷츠를 공유했습니다.`;
      default:
        return `${sender.nickname}님의 알림`;
    }
  }



  // 알림 이벤트 리스너 등록
  onNotification<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): () => void {
    if (!this.notificationCallbacks[event]) {
      this.notificationCallbacks[event] = [];
    }

    this.notificationCallbacks[event].push(callback);

    // 소켓 이벤트 리스너 등록
    socketService.on(event, callback);

    // 정리 함수 반환
    return () => {
      const callbacks = this.notificationCallbacks[event];
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }

      socketService.off(event, callback);
    };
  }

  // 모든 알림 이벤트 리스너 제거
  removeAllNotificationListeners(event?: keyof ServerToClientEvents): void {
    if (event) {
      // 특정 이벤트의 모든 리스너 제거
      const callbacks = this.notificationCallbacks[event];
      if (callbacks) {
        callbacks.forEach(callback => {
          socketService.off(event, callback);
        });
        this.notificationCallbacks[event] = [];
      }
    } else {
      // 모든 알림 이벤트 리스너 제거
      Object.keys(this.notificationCallbacks).forEach(eventName => {
        const callbacks = this.notificationCallbacks[eventName as keyof ServerToClientEvents];
        if (callbacks) {
          callbacks.forEach(callback => {
            socketService.off(eventName, callback);
          });
        }
      });
      this.notificationCallbacks = {};
    }
  }


  // 정리
  destroy(): void {
    this.removeAllNotificationListeners();
  }
}// 싱글톤 인스턴스 생성
export const notificationSocketService = new NotificationSocketService();

// 편의 함수들
export const onNotification = <K extends keyof ServerToClientEvents>(
  event: K,
  callback: ServerToClientEvents[K]
) => notificationSocketService.onNotification(event, callback);
