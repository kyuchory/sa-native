import * as Application from 'expo-application';
import { Platform } from 'react-native';

export class DeviceUtils {
  // 현재 디바이스의 고유 ID 가져오기
  static async getDeviceId(): Promise<string> {
    try {
      if (Platform.OS === 'android') {
        const deviceId = await Application.getAndroidId();
        return deviceId ?? 'unknown-android-id';
      } else {
        const deviceId = await Application.getIosIdForVendorAsync();
        return deviceId ?? 'unknown-ios-id';
      }
    } catch (error) {
      console.error('❌ 디바이스 ID를 가져올 수 없습니다:', error);
      return Platform.OS === 'android' ? 'unknown-android-id' : 'unknown-ios-id';
    }
  }
}
