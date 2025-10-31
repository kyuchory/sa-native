import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNotificationStore } from '../stores/notificationStore';
import { useThemeStore } from '../stores/themeStore';

const { width: SCREEN_W } = Dimensions.get('window');
const HEIGHT = 60;
const DISMISS_THRESHOLD = -HEIGHT * 0.5;

export const NotificationBanner: React.FC = () => {
  const { foregroundNotification, hideForegroundNotification } = useNotificationStore();
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-HEIGHT);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (foregroundNotification) {
      translateY.value = withTiming(0, { duration: 300 });

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        hideNotification();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      translateY.value = -HEIGHT;
    }
  }, [foregroundNotification]);

  const handleDismiss = useCallback(() => {
    'worklet';
    scheduleOnRN(hideForegroundNotification);
  }, [hideForegroundNotification]);

  const hideNotification = () => {
    translateY.value = withTiming(-HEIGHT, { duration: 200 }, (finished) => {
      if (finished) {
        handleDismiss();
      }
    });
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (e.translationY < 0) {
        translateY.value = startY.value + e.translationY;
      }
    })
    .onEnd(() => {
      if (translateY.value < DISMISS_THRESHOLD) {
        translateY.value = withTiming(-HEIGHT, { duration: 200 }, (finished) => {
          if (finished) {
            handleDismiss();
          }
        });
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!foregroundNotification) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.WHITE,
            borderColor: colors.PRIMARY,
            top: insets.top + 10
          },
          animatedStyle,
        ]}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.GRAY_900 }]} numberOfLines={1}>
              {foregroundNotification.title}
            </Text>
            <Text style={[styles.body, { color: colors.GRAY_700 }]} numberOfLines={1}>
              {foregroundNotification.body}
            </Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: SCREEN_W * 0.1,
    width: SCREEN_W * 0.8,
    height: HEIGHT,
    borderRadius: 16,
    borderWidth: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
    marginTop: 1,
  },
});
