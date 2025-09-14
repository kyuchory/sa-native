
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
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
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
  }, [visible, slideAnim, overlayOpacity]);

  const handleActionPress = (action: ActionItem) => {
    action.onPress();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* 배경 오버레이 */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* 액션 시트 */}
      <Animated.View
        style={[
          styles.actionSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
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
