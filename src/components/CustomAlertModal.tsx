import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

interface AlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertModalProps {
  visible: boolean;
  title?: string;
  message: string;
  buttons: AlertButton[];
  onClose: () => void;
}

export default function CustomAlertModal({
  visible,
  title,
  message,
  buttons,
  onClose,
}: CustomAlertModalProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const getButtonStyle = (btnStyle?: string) => {
    switch (btnStyle) {
      case 'destructive':
        return { backgroundColor: colors.ERROR, textColor: colors.WHITE };
      case 'cancel':
        return { backgroundColor: colors.GRAY_100, textColor: colors.GRAY_700 };
      default:
        return { backgroundColor: colors.PRIMARY, textColor: colors.WHITE };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 제목 (선택적) */}
          {title && (
            <Text style={styles.title}>{title}</Text>
          )}

          {/* 메시지 */}
          <Text style={styles.message}>{message}</Text>

          {/* 버튼들 */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const { backgroundColor, textColor } = getButtonStyle(button.style);

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.button, { backgroundColor }]}
                  onPress={button.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, { color: textColor }]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    marginHorizontal: SPACING.LG,
    maxWidth: 320,
    minWidth: 280,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  message: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.LG,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.SM,
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
