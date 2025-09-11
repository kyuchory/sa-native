import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';

// 컴포넌트 imports
import CommonHeader from '../components/CommonHeader';
import NotificationListItem from '../components/NotificationListItem';
import { CheckIcon } from '../components/CommonIcons';

// 데이터 imports
import { NOTIFICATION_MOCK_DATA } from '../data/notificationMockData';
import { Notification } from '../types/notification';

type NotificationNavigationProp = StackNavigationProp<AuthStackParamList, 'Notifications'>;

export default function NotificationScreen() {
  const navigation = useNavigation<NotificationNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 상태 관리
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATION_MOCK_DATA);

  // 컴포넌트 마운트 시 알림 로드
  useEffect(() => {
    loadNotifications();
  }, []);

  // 알림 로드 (mock data를 사용)
  const loadNotifications = () => {
    try {
      setNotifications(NOTIFICATION_MOCK_DATA);
    } catch (error) {
      console.error('알림 로드 실패:', error);
      Alert.alert('오류', '알림을 불러오는데 실패했습니다.');
    }
  };

  // 모두 읽음 처리
  const handleMarkAllAsRead = () => {
    try {
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        isRead: true,
      }));
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error('읽음 처리 실패:', error);
      Alert.alert('오류', '읽음 처리에 실패했습니다.');
    }
  };

  // 알림 항목 클릭 핸들러
  const handleNotificationPress = (notification: Notification) => {
    try {
      // 알림을 읽음으로 표시
      const updatedNotifications = notifications.map(n =>
        n.id === notification.id ? { ...n, isRead: true } : n
      );
      setNotifications(updatedNotifications);

      // 알림 타입에 따라 적절한 스크린으로 이동
      switch (notification.type) {
        case 'follow':
          // 사용자 프로필로 이동
          if (notification.sender.id) {
            navigation.navigate('UserProfile', { userId: String(notification.sender.id) });
          }
          break;
        case 'like':
        case 'comment':
          // 게시물 상세로 이동
          if (notification.referenceId) {
            navigation.navigate('PostDetail', { postId: notification.referenceId });
          }
          break;
        case 'post':
          // 피드 상세로 이동
          if (notification.referenceId) {
            navigation.navigate('FeedDetail', { feedId: notification.referenceId });
          }
          break;
        case 'message':
          // 채팅 상세로 이동
          if (notification.sender.id) {
            navigation.navigate('ChatDetail', {
              chatRoomId: 0, // mock data에서는 임시 ID 사용
              chatRoomName: notification.sender.nickname,
              chatPartnerId: notification.sender.id,
            });
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('알림 클릭 처리 실패:', error);
      Alert.alert('오류', '알림 처리에 실패했습니다.');
    }
  };

  // 알림 렌더링
  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationListItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
    />
  );

  // 읽지 않은 알림 개수 확인
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 헤더 우측 버튼 (모두 읽음 - 체크 아이콘)
  const renderHeaderRight = () => (
    <TouchableOpacity
      style={[styles.markAllButton, unreadCount === 0 && styles.disabledButton]}
      onPress={handleMarkAllAsRead}
      disabled={unreadCount === 0}
      activeOpacity={0.7}
    >
      <CheckIcon
        size={20}
        color={unreadCount === 0 ? colors.GRAY_400 : colors.GRAY_700}
      />
    </TouchableOpacity>
  );

  // 빈 상태 렌더링
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>새로운 알림이 없습니다</Text>
      <Text style={styles.emptySubText}>알림이 도착하면 여기에서 확인할 수 있어요</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title="알림"
        rightComponent={renderHeaderRight()}
      />

      {/* 알림 목록 */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        style={styles.notificationList}
        contentContainerStyle={styles.notificationListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        // 성능 최적화
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
      />
    </SafeAreaView>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50, // BG_COLORS.SECONDARY
  },
  notificationList: {
    flex: 1,
  },
  notificationListContent: {
    paddingVertical: SPACING.SM,
    flexGrow: 1,
  },
  markAllButton: {
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    borderRadius: 12,
    backgroundColor: colors.GRAY_100,
  },
  disabledButton: {
    opacity: 0.5,
  },
  markAllText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
  },
  disabledText: {
    color: colors.GRAY_400,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
    marginBottom: SPACING.SM,
  },
  emptySubText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
    textAlign: 'center',
    lineHeight: 20,
  },
});
