import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { NotificationIcon } from './HomeHeaderIcons';
import { CreateFeedIcon } from './CommonIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import Svg, { Path } from 'react-native-svg';

type FeedHeaderNavigationProp = StackNavigationProp<AuthStackParamList>;

interface FeedHeaderProps {
  onNotificationPress?: () => void;
  onChatPress?: () => void;
  onFeedPress?: () => void;
  notificationCount?: number;
}

// 채팅 아이콘 (비행기 모양)
const ChatIcon = ({ size = 22, color = COLORS.GRAY_600 }) => (
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

export default function FeedHeader({ 
  onNotificationPress, 
  onChatPress,
  onFeedPress,
  notificationCount = 0 
}: FeedHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<FeedHeaderNavigationProp>();

  const handleFeedPress = () => {
    if (onFeedPress) {
      onFeedPress();
    } else {
      // 기본 동작: 피드 작성 페이지로 이동
      navigation.navigate('CreateFeed');
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.WHITE} />
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
                <NotificationIcon size={22} color={COLORS.GRAY_600} />
                {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* 피드 작성 버튼 */}
            <TouchableOpacity 
              style={styles.feedButton}
              onPress={handleFeedPress}
              activeOpacity={0.7}
            >
              <CreateFeedIcon size={22} color={COLORS.GRAY_600} />
            </TouchableOpacity>

            {/* 채팅 버튼 */}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={onChatPress}
              activeOpacity={0.7}
            >
              <ChatIcon size={22} color={COLORS.GRAY_600} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
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
    color: COLORS.PRIMARY,
    marginRight: 2,
  },
  logoSubText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: TEXT_COLORS.SECONDARY,
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
    backgroundColor: COLORS.ERROR,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  
  // 피드 작성 버튼
  feedButton: {
    padding: SPACING.SM,
    borderRadius: 20,
  },
});
