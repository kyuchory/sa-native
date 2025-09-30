import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';

// 컴포넌트 imports
import CommonHeader from '../components/CommonHeader';
import NotificationListItem from '../components/NotificationListItem';
import { CheckIcon } from '../components/CommonIcons';

// 서비스 imports
import { NotificationService } from '../services/notificationService';
import { Notification } from '../types/notification';
// 알림 store
import { useNotificationStore, loadNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../stores/notificationStore';

type NotificationNavigationProp = StackNavigationProp<AuthStackParamList, 'Notifications'>;

export default function NotificationScreen() {
  const navigation = useNavigation<NotificationNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 알림 store 사용
  const { notifications, unreadCount, isLoading, loadNotifications, markAllNotificationsAsRead, markNotificationAsRead } = useNotificationStore();

  // 컴포넌트 마운트 시 알림 데이터 로드
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await loadNotifications();
      } catch (error) {
        console.error('알림 초기화 실패:', error);
        Alert.alert('오류', '알림을 불러오는데 실패했습니다.');
      }
    };

    initializeNotifications();
  }, [loadNotifications]);


  // 모두 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      // API 호출로 모든 알림 읽음 처리
      const response = await NotificationService.readAll();

      if (response.code === 200 && response.data) {
        console.log(`✅ 모든 알림 읽음 처리 완료: ${response.data.affectedRows}개`);

        // Store를 통해 상태 업데이트
        markAllNotificationsAsRead();
      } else {
        throw new Error(response.message || '알림 읽음 처리에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('모두 읽음 처리 실패:', error);
      Alert.alert('오류', '모두 읽음 처리에 실패했습니다.');
    }
  };

  // 알림 항목 클릭 핸들러
  const handleNotificationPress = async (notification: Notification) => {
    try {
      // 먼저 스크린 이동을 실행 (사용자 경험 우선)
      switch (notification.type) {
        case 'followed':
          // 사용자 프로필로 이동
          if (notification.sender.id) {
            navigation.navigate('UserProfile', { userId: String(notification.sender.id) });
          }
          break;
        case 'post_commented':
          // 게시물 상세로 이동
          if (notification.reference_id) {
            navigation.navigate('PostDetail', { postId: notification.reference_id });
          }
          break;
        case 'feed_commented':
          // 피드 상세로 이동
          if (notification.reference_id) {
            navigation.navigate('FeedDetail', { feedId: notification.reference_id });
          }
          break;
        case 'post_created':
          // 새로 작성된 게시물 상세로 이동
          if (notification.reference_id) {
            navigation.navigate('PostDetail', { postId: notification.reference_id });
          }
          break;
        case 'post_liked':
          // 게시물 상세로 이동 (좋아요 관련)
          if (notification.reference_id) {
            navigation.navigate('PostDetail', { postId: notification.reference_id });
          }
          break;
        case 'feed_liked':
          // 피드 상세로 이동 (좋아요 관련)
          if (notification.reference_id) {
            navigation.navigate('FeedDetail', { feedId: notification.reference_id });
          }
          break;
        case 'feed_created':
          // 새로 작성된 피드 상세로 이동
          if (notification.reference_id) {
            navigation.navigate('FeedDetail', { feedId: notification.reference_id });
          }
          break;
        case 'message':
          // 채팅 상세로 이동
          if (notification.sender.id) {
            navigation.navigate('ChatDetail', {
              chatRoomId: 0, // API 데이터에서는 기본값 사용
              chatRoomName: notification.sender.nickname,
              chatPartnerId: notification.sender.id,
            });
          }
          break;
        default:
          break;
      }

      // 이미 읽었던 알림이면 API 호출 생략
      if (notification.is_read) {
        return;
      }

      // 백그라운드에서 알림 읽음 처리 API 호출
      try {
        const response = await NotificationService.read([notification.id]);

        if (response.code === 200 && response.data) {
          // Store를 통해 상태 업데이트
          markNotificationAsRead(notification.id);
        }
      } catch (readError) {
        console.error('알림 읽음 처리 API 실패:', readError);
        // API 실패 시에도 사용자 경험을 위해 로컬 상태만 업데이트
        markNotificationAsRead(notification.id);
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

  // 로딩 상태 렌더링
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.PRIMARY} />
      <Text style={styles.loadingText}>알림을 불러오는 중...</Text>
    </View>
  );

  // 빈 상태 렌더링
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyText}>알림이 없어요</Text>
      <Text style={styles.emptySubText}>새 소식을 기다려보세요!</Text>
    </View>
  );

  return (
    <View style={styles.container}>
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
        ListEmptyComponent={isLoading ? renderLoadingState : renderEmptyState}
        // 성능 최적화
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
      />
    </View>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  notificationList: {
    flex: 1,
  },
  notificationListContent: {
    paddingTop: SPACING.SM,
    paddingBottom: SPACING.LG,
    flexGrow: 1,
  },
  markAllButton: {
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    borderRadius: 16,
    backgroundColor: colors.GRAY_50,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  disabledButton: {
    opacity: 0.4,
    borderColor: colors.GRAY_100,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.XXL,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700,
    marginTop: SPACING.MD,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.XXL,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.MD,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.XL,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_500,
    marginBottom: SPACING.SM,
  },
  emptySubText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_400,
    textAlign: 'center',
    lineHeight: 22,
  },
});
