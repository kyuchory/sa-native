import * as Application from 'expo-application';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, getToken, requestPermission, AuthorizationStatus, onMessage } from '@react-native-firebase/messaging';
import { DeviceService } from './deviceService';
import { Alert, Platform } from 'react-native';
import { useNotificationStore } from '../stores/notificationStore';

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

      console.log('🔢 Device ID:', deviceId);

      // 3️⃣ FCM 토큰 가져오기
      const fcmToken = await getToken(messaging);
      if (!fcmToken) {
        console.warn('⚠️ FCM 토큰을 가져오지 못했습니다.');
        return;
      }

      console.log('📱 FCM Token:', fcmToken);

      // 5️⃣ 포그라운드 메시지 리스너 설정
      onMessage(messaging, async (remoteMessage) => {
        console.log('📨 포그라운드 메시지 수신:', remoteMessage);

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

      console.log('✅ FCM 등록 완료');
    } catch (error) {
      console.error('❌ FCM 초기화 실패:', error);
    }
  }
}
