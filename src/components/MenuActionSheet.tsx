
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeStore } from '../stores/themeStore';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ActionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
}
interface MenuActionSheetProps {
  visible: boolean;
  onClose: () => void;
  actions: ActionItem[];
  title?: string;
}

export default function MenuActionSheet({
  visible,
  onClose,
  actions,
  title,
}: MenuActionSheetProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 애니메이션 값들
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragAnim = React.useRef(new Animated.Value(0)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  // 드래그에 따라 배경 투명도 조절
  const dragOpacity = dragAnim.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const combinedOverlayOpacity = Animated.multiply(overlayOpacity, dragOpacity);

  // 드래그 상태
  const lastGestureDy = React.useRef(0);

  React.useEffect(() => {
    if (visible) {
      // 강제 리셋: 드래그 상태와 슬라이드 상태 모두 초기화하여 깨끗한 상태로 시작
      dragAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleActionPress = (action: ActionItem) => {
    action.onPress();
    onClose();
  };

  // 드래그 제스처 핸들러
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: dragAnim } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      const dragThreshold = SCREEN_HEIGHT * 0.2; // 20% 화면 높이
      const velocityThreshold = 500; // 빠른 속도 임계값

      // 아래로 드래그한 경우에만 체크 (양수 값)
      if (translationY > 0) {
        // 닫힘 조건: 드래그 거리가 임계값 이상 또는 빠른 속도로 드래그
        const shouldClose = translationY > dragThreshold || velocityY > velocityThreshold;

        if (shouldClose) {
          // Modal을 먼저 닫아서 뒤의 화면이 즉시 터치 가능하도록
          onClose();

          // 닫힘 애니메이션 - 빠른 닫힘 (시각적 효과만)
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: SCREEN_HEIGHT,
              velocity: velocityY,
              useNativeDriver: true,
            }),
            Animated.spring(dragAnim, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 150, // 빠른 페이드아웃
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          // 원위치 복귀
          Animated.spring(dragAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      } else {
        // 위로 드래그한 경우는 그대로 복귀
        Animated.spring(dragAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* 배경 오버레이 */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: combinedOverlayOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* 액션 시트 */}
        <Animated.View
          style={[
            styles.actionSheet,
            {
              transform: [{ translateY: Animated.add(slideAnim, dragAnim) }],
            },
          ]}
        >
          {/* 핸들 바 + 제목 전체를 드래그 영역으로 */}
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
            activeOffsetY={10} // 위아래 10px 이동까지는 취소되지 않음
            failOffsetY={-10}
            minPointers={1}
            maxPointers={1}
          >
            <View>
              {/* 핸들 바 */}
              <View style={styles.handle} />

              {/* 제목 */}
              {title && (
                <View style={styles.titleContainer}>
                  <Text style={styles.titleText} numberOfLines={1}>
                    {title}
                  </Text>
                </View>
              )}
            </View>
          </PanGestureHandler>

          {/* 액션 버튼들 */}
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  index === actions.length - 1 && styles.lastActionButton,
                ]}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  {action.icon}
                </View>
                <Text style={[styles.actionText, { color: action.color }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 취소 버튼 */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.LG,
    borderTopRightRadius: BORDER_RADIUS.LG,
    paddingBottom: SPACING.LG + 20, // Safe area padding
    ...SHADOWS.LARGE,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.GRAY_300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  titleContainer: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  titleText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.PRIMARY,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.MD,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  lastActionButton: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    marginRight: SPACING.MD,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    flex: 1,
  },
  cancelButton: {
    marginHorizontal: SPACING.LG,
    marginTop: SPACING.MD,
    paddingVertical: SPACING.MD,
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.PRIMARY,
  },
});
