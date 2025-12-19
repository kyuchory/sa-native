import { Platform } from 'react-native';
import { openSettings, checkNotifications, requestNotifications } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSED_DATE_KEY = 'notificationPromptDismissedDate';

export interface AlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export async function checkNotificationPermissionWithSkip(
  onShowAlert: (alertConfig: {title?: string, message: string, buttons: AlertButton[]}) => void,
  onCloseAlert: () => void
) {
  try {
    // 3일 보지 않기 상태 확인
    const dismissedDateStr = await AsyncStorage.getItem(DISMISSED_DATE_KEY);
    if (dismissedDateStr) {
      const dismissedDate = new Date(dismissedDateStr);
      const now = new Date();
      const diffTime = now.getTime() - dismissedDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24); // 일 단위로 변환

      if (diffDays < 3) {
        return; // 3일 이내이면 팝업 생략
      }
    }

    // 권한 확인 로직 - 플랫폼별 처리
    if (Platform.OS === 'ios') {
      const { status } = await checkNotifications();

      if (status === 'granted') {
        return; // 권한 이미 있음
      } else {
        const reqResult = await requestNotifications(['alert', 'sound']);
        if (reqResult.status === 'granted') {
          return;
        } else {
          // 거부됨: 3일간 보지 않기 팝업 표시
          showDismissiblePermissionAlert(onShowAlert, onCloseAlert);
        }
      }
    } else if (Platform.OS === 'android') {
      const { status } = await checkNotifications();

      if (status === 'granted') {
        return; // 권한 이미 있음
      } else {
        const reqResult = await requestNotifications(['alert', 'sound']);
        if (reqResult.status === 'granted') {
          return;
        } else {
          // 거부됨: 3일간 보지 않기 팝업 표시
          showDismissiblePermissionAlert(onShowAlert, onCloseAlert);
        }
      }
    } else {
      return;
    }

  } catch (error) {
    console.error('❌ Notification permission check failed:', error);
  }
}

// 3일간 보지 않기 옵션이 있는 알림 권한 Alert 표시
function showDismissiblePermissionAlert(
  onShowAlert: (alertConfig: {title?: string, message: string, buttons: AlertButton[]}) => void,
  onCloseAlert: () => void
) {
  onShowAlert({
    title: '푸시 알림을 허용해주세요',
    message: 'AnimalTalk에서 새로운 메시지, 팔로워 소식, 게시물 업데이트 등\n균형있는 소식을 빠르게 받아보세요!\n\n알림 권한을 허용하지 않으면 중요한 알림을 놓칠 수 있습니다.',
    buttons: [
      {
        text: '3일간 보지 않기',
        style: 'default',
        onPress: async () => {
          // 3일 후 다시 표시하도록 현재 날짜 저장
          const now = new Date();
          await AsyncStorage.setItem(DISMISSED_DATE_KEY, now.toISOString());
          onCloseAlert(); // 모달 닫기
        },
      },
      { text: '취소', style: 'cancel', onPress: onCloseAlert }, // 취소 버튼에서 모달 닫기
      {
        text: '설정으로 이동',
        onPress: () => openSettings()
      },
    ]
  });
}
