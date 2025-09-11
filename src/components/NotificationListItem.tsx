import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { Notification } from '../types/notification';

interface NotificationListItemProps {
  notification: Notification;
  onPress?: () => void;
}

// 시간 포맷팅 유틸리티 (간단한)
const formatTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
};

const NotificationListItem = ({ notification, onPress }: NotificationListItemProps) => {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead && styles.unreadContainer,
      ]}
      onPress={handlePress}
      activeOpacity={0.6}
    >
      <View style={styles.content}>
        {/* 프로필 이미지 */}
        <View style={styles.profileContainer}>
          {notification.sender.profileImg ? (
            <Image
              source={{ uri: notification.sender.profileImg }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>
                {notification.sender.nickname.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* 텍스트 컨텐츠 - 한 줄로 통합 */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.messageText,
              !notification.isRead && styles.unreadText,
            ]}
            numberOfLines={2}
          >
            <Text style={styles.senderName}>{notification.sender.nickname}</Text>
            {notification.message}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(notification.createdAt)}
          </Text>
        </View>

        {/* 읽음 표시 점 (안읽은 경우) */}
        {!notification.isRead && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    marginVertical: 1,
  },
  unreadContainer: {
    // 배경색 완전 제거 - 점 아이콘만으로 읽음 상태 표시
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  separator: {
    height: 1,
    backgroundColor: colors.GRAY_100,
    marginHorizontal: SPACING.LG,
  },

  // 프로필 이미지
  profileContainer: {
    marginRight: SPACING.MD,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.ROUND,
  },
  placeholderImage: {
    backgroundColor: colors.GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_600,
  },

  // 텍스트 컨테이너
  textContainer: {
    flex: 1,
    gap: 3,
  },
  senderName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
  },
  messageText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    lineHeight: 20,
  },
  unreadText: {
    color: colors.GRAY_900,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 읽음 표시 점
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.ROUND,
    backgroundColor: colors.PRIMARY,
    marginLeft: SPACING.SM,
  },
});

export default NotificationListItem;
