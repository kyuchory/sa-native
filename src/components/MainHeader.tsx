import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { NotificationIcon, WriteIcon } from './HomeHeaderIcons';
import { CreateFeedIcon } from './CommonIcons';
import Svg, { Path } from 'react-native-svg';
import { useThemeStore } from '../stores/themeStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';

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

// 채팅 아이콘 (비행기 모양)
const ChatIconComponent = ({ size = 22, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 21L23 12L2 3V10L17 12L2 14V21Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function MainHeader({ leftButtons = [], rightButtons = [] }: MainHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const navigation = useNavigation();
  const { unreadCount, initializeNotificationEvents, subscribeToHeaderNotifications } = useNotificationStore();
  const { isAuthenticated, user } = useAuthStore();
  const styles = createStyles(colors);

  // MainHeader가 마운트될 때 헤더 알림 구독
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('🔒 인증되지 않은 사용자 - 헤더 알림 구독 건너뜀');
      return;
    }

    console.log('🔔 MainHeader 마운트 - 헤더 알림 구독 요청');
    // notificationStore에서 이벤트 초기화 후 헤더 구독
    initializeNotificationEvents().then(() => {
      subscribeToHeaderNotifications();
    });
  }, [isAuthenticated, user]);

  const handleNotificationPress = () => {
    console.log('알림 버튼 클릭');
    navigation.navigate('Notifications' as never);
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.WHITE} />
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
            <Text style={styles.logoText}>Mom</Text>
            <Text style={styles.logoSubText}>Talk</Text>
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

  // 우측 액션 버튼들
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  iconButton: {
    padding: SPACING.SM,
    borderRadius: 20,
  },

  // 알림 배지
  notificationContainer: {
    position: 'relative',
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

export { ChatIconComponent as ChatIcon };
