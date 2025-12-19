import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { NotificationIcon, WriteIcon } from './HomeHeaderIcons';
import { ChatIcon } from './CommonIcons';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useChatStore } from '../stores/chatStore';

interface HeaderButton {
  key: string;
  onPress: () => void;
  IconComponent: React.ComponentType<{ size: number; color: string }>;
  badgeCount?: number;
}

interface MainHeaderProps {
  leftButtons?: HeaderButton[];
  rightButtons?: HeaderButton[];
}

export default function MainHeader({ leftButtons = [], rightButtons = [] }: MainHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useThemeStore();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuthStore();
  const { unreadCount, loadUnreadCount, lastUpdated } = useNotificationStore();
  const { unreadCount: chatUnreadCount, loadUnreadCount: loadChatUnreadCount, shouldLoadUnreadCount, setShouldLoadUnreadCount } = useChatStore();
  const route = useRoute();
  const styles = createStyles(colors);

  // 이전 화면 추적을 위한 state
  const [previousRoute, setPreviousRoute] = useState<string | null>(null);

  // 초기 로딩 시 읽지않은 알림 개수 및 채팅방 개수 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      loadChatUnreadCount();
    }
  }, [isAuthenticated, loadUnreadCount, loadChatUnreadCount]);

  // 화면 포커스 시 알림 개수 및 채팅방 개수 새로고침
  useFocusEffect(
    useCallback(() => {
      const currentRouteName = route.name;

      if (isAuthenticated) {
        // 알림 화면에서 돌아오는 경우 (알림을 읽었을 가능성이 높음)
        if (previousRoute === 'Notifications') {
          loadUnreadCount();
        }

        // 채팅 화면에서 돌아오는 경우 (채팅을 읽었을 가능성이 높음)
        // 또는 shouldLoadUnreadCount 플래그가 true인 경우 API 호출 후 플래그 off
        if (previousRoute === 'Chat' || shouldLoadUnreadCount) {
          loadChatUnreadCount();
          // API 호출 후 플래그를 off로 돌림
          setShouldLoadUnreadCount(false);
        }
      }

      // 현재 화면을 이전 화면으로 저장
      setPreviousRoute(currentRouteName);
    }, [isAuthenticated, route.name, previousRoute, loadUnreadCount, loadChatUnreadCount, shouldLoadUnreadCount, setShouldLoadUnreadCount])
  );

  const handleNotificationPress = () => {
    navigation.navigate('Notifications' as never);
  };

  const handleChatPress = () => {
    navigation.navigate('Chat' as never);
  };

  const renderButton = (button: HeaderButton) => (
    <TouchableOpacity
      key={button.key}
      style={styles.iconButton}
      onPress={button.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContainer}>
        <button.IconComponent size={22} color={colors.GRAY_600} />
        {/* 알림 버튼인 경우 실시간 unreadCount 사용 */}
        {button.key === 'notification' && unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
        {/* 다른 버튼들은 기존 badgeCount 사용 */}
        {button.key !== 'notification' && button.badgeCount && button.badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {button.badgeCount > 99 ? '99+' : button.badgeCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          {/* 왼쪽 버튼들 */}
          {leftButtons.length > 0 && (
            <View style={styles.leftActions}>
              {leftButtons.map(renderButton)}
            </View>
          )}

          {/* 로고 영역 */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Animal</Text>
            <Text style={styles.logoSubText}>Talk</Text>
            <Image
              source={require('../../assets/AnimalTalk_logo_icon.png')}
              style={styles.logoImage}
            />
          </View>

          {/* 우측 버튼들 */}
          <View style={styles.rightActions}>
            {/* 알림 버튼 (항상 표시) */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNotificationPress}
              activeOpacity={0.7}
            >
              <View style={styles.notificationContainer}>
                <NotificationIcon size={22} color={colors.GRAY_600} />
                {/* 실시간 unreadCount 표시 */}
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* 채팅 버튼 (항상 표시) */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleChatPress}
              activeOpacity={0.7}
            >
              <View style={styles.notificationContainer}>
                <ChatIcon size={26} color={colors.GRAY_600} />
                {/* 채팅 unread count 표시 */}
                {chatUnreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* 사용자 정의 우측 버튼들 */}
            {rightButtons.map(renderButton)}
          </View>
        </View>
      </View>
    </>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
    ...SHADOWS.SMALL,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    minHeight: 56,
  },

  // 왼쪽 액션 버튼들
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },

  // 로고 영역
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    position: 'relative',
  },
  logoText: {
    fontSize: TYPOGRAPHY.SIZE.XXL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.PRIMARY,
    marginRight: 2,
  },
  logoSubText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_600,
  },
  logoImage: {
    width: 60,
    height: 45,
    resizeMode: 'contain',
    position: 'absolute',
    right: -58,
    top: '50%',
    transform: [{ translateY: -26 }],
  },

  // 우측 액션 버튼들
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  iconButton: {
    padding: SPACING.SM,
    borderRadius: 20,
  },

  // 알림 배지
  notificationContainer: {
    position: 'relative',
    height: 26, // 아이콘 최대 크기(26px)를 기준으로 통일
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.ERROR,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.WHITE,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
});
