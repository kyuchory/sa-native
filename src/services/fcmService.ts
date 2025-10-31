import * as Application from 'expo-application';
import messaging from '@react-native-firebase/messaging';
import { DeviceService } from './deviceService';
import { Alert, Platform } from 'react-native';

export class FCMService {
  static async initializeFCMAndRegisterDevice(): Promise<void> {
    try {
      // 1️⃣ 알림 권한 요청
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

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
      const fcmToken = await messaging().getToken();
      if (!fcmToken) {
        console.warn('⚠️ FCM 토큰을 가져오지 못했습니다.');
        return;
      }

      console.log('📱 FCM Token:', fcmToken);

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
