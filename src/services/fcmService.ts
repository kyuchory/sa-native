import * as Application from 'expo-application';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, requestPermission, AuthorizationStatus, onMessage, onNotificationOpenedApp, getInitialNotification } from '@react-native-firebase/messaging';
import { DeviceService } from './deviceService';
import { Alert, Platform } from 'react-native';
import { useNotificationStore } from '../stores/notificationStore';
import { getNavigationState, navigate } from '../utils/navigationUtils';

export class FCMService {
  static async initializeFCMAndRegisterDevice(): Promise<void> {
    try {
      // Get messaging instance
      const messaging = getMessaging(getApp());

      // 1️⃣ 알림 권한 요청
      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        Alert.alert(
          '알림 권한이 필요합니다',
          'MomTalk에서 푸시 알림을 받기 위해 권한을 허용해주세요.'
        );
        return;
      }

      // 2️⃣ 기기 고유 ID 가져오기
      const deviceId =
        Platform.OS === 'android'
          ? (await Application.getAndroidId()) ?? 'unknown-android-id'
          : (await Application.getIosIdForVendorAsync()) ?? 'unknown-ios-id';

      // 3️⃣ FCM 토큰 가져오기
      const fcmToken = await getToken(messaging);
      if (!fcmToken) {
        console.warn('⚠️ FCM 토큰을 가져오지 못했습니다.');
        return;
      }

      // 5️⃣ 포그라운드 메시지 리스너 설정
      onMessage(messaging, async (remoteMessage) => {

        const { notification } = remoteMessage;
        if (notification) {
          useNotificationStore.getState().showForegroundNotification(
            notification.title || '알림',
            notification.body || '새로운 메시지가 도착했습니다.',
            remoteMessage.data
          );
        }
      });

      // 4️⃣ 서버에 디바이스 등록
      await DeviceService.registerDevice({
        device_id: deviceId,
        fcm_token: fcmToken,
      });

      // 6️⃣ 백그라운드 알림 터치 핸들러 설정
      onNotificationOpenedApp(messaging, (remoteMessage) => {
        FCMService.handleNotificationAction(remoteMessage);
      });

      // 7️⃣ 앱 종료 상태에서 알림 터치 처리 (초기 로드 시)
      getInitialNotification(messaging).then(remoteMessage => {
        if (remoteMessage) {
          FCMService.handleNotificationAction(remoteMessage);
        }
      });
    } catch (error) {
      console.error('❌ FCM 초기화 실패:', error);
    }
  }

  // 알림 액션 처리 함수
  static handleNotificationAction(remoteMessage: any) {
    const { data } = remoteMessage;
    if (!data || !data.type) return;

    const navState = getNavigationState();
    if (!navState) return;

    switch (data.type) {
      case 'chat_message':
        if (data.chat_room_id) {
          const currentRoute = navState.routes[navState.index];
          // 이미 해당 채팅룸에 있는지 확인
          if (!(currentRoute.name === 'ChatDetail' && (currentRoute.params as any)?.chatRoomId == data.chat_room_id)) {
            navigate('ChatDetail', {
              chatRoomId: parseInt(data.chat_room_id),
              chatRoomName: '', // 푸시 알림에서는 이름 미제공, 빈 문자열 처리
              // 기타 params는 기본값 사용
            });
          }
        }
        break;

      // 미래 확장을 위한 플레이스홀더
      case 'feed_notification':
        // 피드 관련 알림 처리
        console.log('📄 피드 알림 터치:', data);
        break;

      case 'general':
        // 일반 알림 처리
        console.log('📢 일반 알림 터치:', data);
        navigate('Notifications');
        break;

      default:
        console.log('❓ 알 수 없는 알림 타입:', data.type);
    }
  }
}
