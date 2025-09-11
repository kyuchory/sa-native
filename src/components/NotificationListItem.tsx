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
      activeOpacity={0.7}
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
            numberOfLines={1}
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
    backgroundColor: colors.PRIMARY_LIGHT + '08',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
  },

  // 프로필 이미지
  profileContainer: {
    marginRight: SPACING.SM,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.ROUND,
  },
  placeholderImage: {
    backgroundColor: colors.GRAY_200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_600,
  },

  // 텍스트 컨테이너
  textContainer: {
    flex: 1,
    gap: 4,
  },
  senderName: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_900,
  },
  messageText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    lineHeight: 18,
  },
  unreadText: {
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500,
  },

  // 읽음 표시 점
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.ROUND,
    backgroundColor: colors.PRIMARY,
    marginLeft: SPACING.XS,
  },
});

export default NotificationListItem;
