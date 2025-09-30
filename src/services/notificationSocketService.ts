import { socketService } from './socketService';
import type { ServerToClientEvents } from '../types/socket';
import { useNotificationStore } from '../stores/notificationStore';
import { Notification } from '../types/notification';

// 알림 서비스 클래스
class NotificationSocketService {
  private isSubscribed = false;
  private isSubscribing = false;
  private restoredRooms: string[] = [];
  private subscriptionCallbacks: Array<(subscribed: boolean) => void> = [];
  private notificationCallbacks: { [event: string]: Array<(...args: any[]) => void> } = {};

  constructor() {
    this.setupNotificationListeners();
  }

  // 게터들
  get isNotificationSubscribed(): boolean {
    return this.isSubscribed;
  }

  get isSubscribingToNotifications(): boolean {
    return this.isSubscribing;
  }

  get notificationRestoredRooms(): string[] {
    return [...this.restoredRooms];
  }

  // 알림 리스너 설정 (구독 시점에 매번 재설정)
  private setupNotificationListeners() {
    // 기존 리스너 제거
    socketService.off('notification:subscribed');
    socketService.off('notification:unread_count');
    socketService.off('notification:message_badge');
    socketService.off('notification:unsubscribed');
    socketService.off('notification:subscription:restored');
    socketService.off('notification:post_liked');
    socketService.off('notification:feed_liked');
    socketService.off('notification:followed');
    socketService.off('notification:feed_commented');
    socketService.off('notification:post_commented');
    socketService.off('notification:feed_created');
    socketService.off('notification:post_created');
    socketService.off('notification:message');

    // 구독 응답 (새로 설정)
    socketService.on('notification:subscribed', (data) => {
      console.log('✅ 알림 구독 성공');
      this.isSubscribed = true;
      this.isSubscribing = false;
      this.notifySubscriptionCallbacks(true);
    });

    // 구독 해제 응답
    socketService.on('notification:unsubscribed', (data) => {
      console.log('🔔 알림 구독 해제:', data);
      this.isSubscribed = false;
      this.isSubscribing = false;
      this.restoredRooms = [];
      this.notifySubscriptionCallbacks(false);
    });

    // 구독 복원 응답 (재연결시)
    socketService.on('notification:subscription:restored', (data) => {
      console.log('🔄 알림 구독 복원:', data);
      this.isSubscribed = true;
      this.isSubscribing = false;
      this.restoredRooms = data.restoredRooms;
      this.notifySubscriptionCallbacks(true);

      // 구독 복원 로그 추가
      console.log(`✅ 알림 구독 복원 완료 - ${data.restoredRooms.length}개 룸 복원됨`);
    });

    // 포스트 좋아요 알림 수신
    socketService.on('notification:post_liked', (data) => {
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

    // 연결 해제시 상태 초기화
    socketService.on('disconnect', () => {
      this.isSubscribed = false;
      this.isSubscribing = false;
      this.restoredRooms = [];
      this.notifySubscriptionCallbacks(false);
    });

    // 인증 에러시 상태 초기화
    socketService.onError((error) => {
      if (error.includes('인증') || error.includes('로그인')) {
        this.isSubscribed = false;
        this.isSubscribing = false;
        this.restoredRooms = [];
        this.notifySubscriptionCallbacks(false);
      }
    });
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
      default:
        return `${sender.nickname}님의 알림`;
    }
  }

  // 알림 구독 요청 (단순화된 버전)
  async subscribeToNotifications(): Promise<void> {
    if (this.isSubscribed || this.isSubscribing) {
      console.log('이미 알림을 구독중이거나 구독되어 있습니다.');
      return;
    }

    // 소켓 연결 상태 확인 (서버 응답을 받았으므로 연결됨으로 간주)
    console.log('🔍 소켓 연결 상태 확인: 서버 응답 완료됨');
    this.isSubscribing = true;

    try {
      console.log('📨 알림 구독 요청 중...');

      // 이미 구독중인지 확인
      if (this.isSubscribed) {
        console.log('✅ 이미 알림이 구독되어 있음');
        return;
      }

      // 구독 요청 전에 이벤트 리스너 재설정
      this.setupNotificationListeners();

      console.log(`📤 알림 구독 이벤트 전송 (연결됨: ${socketService.isConnected})`);
      socketService.emit('notification:subscribe');

      // 타임아웃 설정 (3초로 더 단축)
      await this.waitForSubscriptionResponse();

      console.log('✅ 알림 구독 완료');

    } catch (error) {
      this.isSubscribing = false;
      console.error('❌ 알림 구독 실패:', error);
      throw error;
    }
  }

  // 알림 구독 해제
  async unsubscribeFromNotifications(): Promise<void> {
    if (!this.isSubscribed) {
      console.log('알림이 구독되어 있지 않습니다.');
      return;
    }

    this.isSubscribing = true;

    try {
      console.log('🔔 알림 구독 해제 요청 중...');
      socketService.emit('notification:unsubscribe');

      // 응답 대기 (짧은 타임아웃)
      await this.waitForUnsubscriptionResponse();

    } catch (error) {
      this.isSubscribing = false;
      console.error('❌ 알림 구독 해제 실패:', error);
      throw error;
    }
  }

  // 구독 응답 대기 (단순화된 타임아웃 로직)
  private waitForSubscriptionResponse(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('⏳ 알림 구독 응답 대기 시작...');

      const timeout = setTimeout(() => {
        console.log('⏰ 알림 구독 응답 타임아웃 발생');
        this.isSubscribing = false;
        reject(new Error('알림 구독 응답 타임아웃'));
      }, 3000); // 3초로 더 단축

      const checkSubscription = () => {
        if (this.isSubscribed && !this.isSubscribing) {
          console.log('✅ 알림 구독 상태 확인 완료');
          clearTimeout(timeout);
          resolve();
        } else if (!this.isSubscribing && !this.isSubscribed) {
          console.log('❌ 알림 구독 거부 상태 확인');
          clearTimeout(timeout);
          reject(new Error('알림 구독이 거부되었습니다.'));
        } else {
          setTimeout(checkSubscription, 100);
        }
      };

      checkSubscription();
    });
  }

  // 구독 해제 응답 대기
  private waitForUnsubscriptionResponse(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.isSubscribing = false;
        reject(new Error('알림 구독 해제 응답 타임아웃'));
      }, 5000);

      const checkUnsubscription = () => {
        if (!this.isSubscribed && !this.isSubscribing) {
          clearTimeout(timeout);
          resolve();
        } else if (this.isSubscribing) {
          setTimeout(checkUnsubscription, 100);
        } else {
          clearTimeout(timeout);
          reject(new Error('알림 구독 해제에 실패했습니다.'));
        }
      };

      checkUnsubscription();
    });
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

  // 구독 상태 변경 콜백 등록
  onSubscriptionChange(callback: (subscribed: boolean) => void): () => void {
    this.subscriptionCallbacks.push(callback);

    // 현재 상태 즉시 전달
    callback(this.isSubscribed);

    // 정리 함수 반환
    return () => {
      const index = this.subscriptionCallbacks.indexOf(callback);
      if (index > -1) {
        this.subscriptionCallbacks.splice(index, 1);
      }
    };
  }

  // 콜백 알림 함수들
  private notifySubscriptionCallbacks(subscribed: boolean): void {
    this.subscriptionCallbacks.forEach(callback => {
      try {
        callback(subscribed);
      } catch (error) {
        console.error('구독 상태 콜백 실행 중 에러:', error);
      }
    });
  }

  // 상태 초기화
  reset(): void {
    this.isSubscribed = false;
    this.isSubscribing = false;
    this.restoredRooms = [];
    this.removeAllNotificationListeners();
    this.subscriptionCallbacks = [];
  }

  // 정리
  destroy(): void {
    this.reset();
  }
}

// 싱글톤 인스턴스 생성
export const notificationSocketService = new NotificationSocketService();

// 편의 함수들
export const subscribeToNotifications = () => notificationSocketService.subscribeToNotifications();
export const unsubscribeFromNotifications = () => notificationSocketService.unsubscribeFromNotifications();
export const isNotificationSubscribed = () => notificationSocketService.isNotificationSubscribed;
export const onNotificationSubscriptionChange = (callback: (subscribed: boolean) => void) =>
  notificationSocketService.onSubscriptionChange(callback);
export const onNotification = <K extends keyof ServerToClientEvents>(
  event: K,
  callback: ServerToClientEvents[K]
) => notificationSocketService.onNotification(event, callback);
