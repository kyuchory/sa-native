import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNavigationState, navigate } from '../utils/navigationUtils';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, interpolate, runOnJS } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNotificationStore } from '../stores/notificationStore';
import { useThemeStore } from '../stores/themeStore';

const { width: SCREEN_W } = Dimensions.get('window');
const HEIGHT = 70;
const DISMISS_THRESHOLD = -HEIGHT * 0.4;
const HORIZONTAL_PADDING = 12;
const BANNER_WIDTH = SCREEN_W - (HORIZONTAL_PADDING * 2);

export const NotificationBanner: React.FC = () => {
  const { foregroundNotification, hideForegroundNotification } = useNotificationStore();
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-HEIGHT - 20);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (foregroundNotification) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });

      const timer = setTimeout(() => {
        hideNotification();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      translateY.value = -HEIGHT - 20;
    }
  }, [foregroundNotification]);

  const handleDismiss = useCallback(() => {
    'worklet';
    scheduleOnRN(hideForegroundNotification);
  }, [hideForegroundNotification]);

  const hideNotification = () => {
    translateY.value = withTiming(-HEIGHT - 20, { duration: 250 }, (finished) => {
      if (finished) {
        handleDismiss();
      }
    });
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
      scale.value = withSpring(0.98, { damping: 15 });
    })
    .onUpdate((e) => {
      if (e.translationY < 0) {
        translateY.value = startY.value + e.translationY;
      }
    })
    .onEnd((e) => {
      scale.value = withSpring(1, { damping: 15 });
      
      if (translateY.value < DISMISS_THRESHOLD || e.velocityY < -500) {
        translateY.value = withTiming(-HEIGHT - 20, { duration: 200 }, (finished) => {
          if (finished) {
            handleDismiss();
          }
        });
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    });

  const handleTap = useCallback(() => {
    if (foregroundNotification?.data?.type === 'chat_message' && foregroundNotification.data.chat_room_id) {
      navigate('ChatDetail', {
        chatRoomId: parseInt(foregroundNotification.data.chat_room_id),
        chatRoomName: '', // 빈 문자열로 처리
      });
    }
    // 알림 터치 후 숨김
    hideNotification();
  }, [foregroundNotification, navigate, hideNotification]);

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.96, { damping: 15 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15 });
      runOnJS(handleTap)(); // UI 스레드에서 JS 함수 호출
    });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [-HEIGHT, 0],
      [0, 1]
    );

    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ],
      opacity,
    };
  });

  if (!foregroundNotification) return null;

  // 현재 채팅룸 화면인지 확인하여 같은 채팅룸 메시지면 알림 표시하지 않음
  const navigationState = getNavigationState();
  if (navigationState) {
    const currentRoute = navigationState.routes[navigationState.index];
    let currentChatRoomId = null;
    if (currentRoute.name === 'ChatDetail' && currentRoute.params) {
      currentChatRoomId = (currentRoute.params as any).chatRoomId;
    }

    if (currentChatRoomId && foregroundNotification.data?.chat_room_id == currentChatRoomId) {
      return null;
    }
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.WHITE,
            top: insets.top + 8
          },
          animatedStyle,
        ]}
      >
        
        <View style={styles.content}>
          {/* 아이콘 영역 */}
          <View style={styles.iconContainer}>
            <Image
              source={require('../assets/main/AnimalTalk_app_icon.png')}
              style={styles.iconImage}
              cachePolicy="memory-disk"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.GRAY_900 }]} numberOfLines={1}>
              {foregroundNotification.title}
            </Text>
            <Text style={[styles.body, { color: colors.GRAY_700 }]} numberOfLines={2}>
              {foregroundNotification.body}
            </Text>
          </View>
        </View>

        {/* 하단 인디케이터 */}
        <View style={styles.indicator} />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: HORIZONTAL_PADDING,
    width: BANNER_WIDTH,
    minHeight: HEIGHT,
    borderRadius: 14,
    zIndex: 1000,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
    letterSpacing: -0.1,
  },
  indicator: {
    position: 'absolute',
    bottom: 6,
    left: '50%',
    marginLeft: -16,
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00000008',
  },
});
