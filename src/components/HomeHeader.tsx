import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { NotificationIcon, WriteIcon } from './HomeHeaderIcons';
import { AuthStackParamList } from '../types/navigation';
import { useThemeStore } from '../stores/themeStore';

type HomeHeaderNavigationProp = StackNavigationProp<AuthStackParamList>;

interface HomeHeaderProps {
  onNotificationPress?: () => void;
  onWritePress?: () => void;
  notificationCount?: number;
}

export default function HomeHeader({
  onNotificationPress,
  onWritePress,
  notificationCount = 0
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const handleWritePress = () => {
    if (onWritePress) {
      onWritePress();
    } else {
      // 기본 동작: 게시물 작성 페이지로 이동
      navigation.navigate('CreatePost');
    }
  };


  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.WHITE} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          {/* 로고 영역 */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Mom</Text>
            <Text style={styles.logoSubText}>Talk</Text>
          </View>

          {/* 우측 버튼들 */}
          <View style={styles.rightActions}>
            {/* 알림 버튼 */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onNotificationPress}
              activeOpacity={0.7}
            >
              <View style={styles.notificationContainer}>
                <NotificationIcon size={22} color={colors.GRAY_600} />
                {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* 글쓰기 버튼 */}
            <TouchableOpacity
              style={styles.writeButton}
              onPress={handleWritePress}
              activeOpacity={0.7}
            >
              <WriteIcon size={22} color={colors.GRAY_600} />
            </TouchableOpacity>
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

  // 글쓰기 버튼
  writeButton: {
    padding: SPACING.SM,
    borderRadius: 20,
  },
});
