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
        return { 
          backgroundColor: colors.ERROR, 
          textColor: colors.WHITE 
        };
      case 'cancel':
        return { 
          backgroundColor: '#E5E5EA', 
          textColor: colors.GRAY_900 
        };
      default:
        return { 
          backgroundColor: colors.PRIMARY, 
          textColor: colors.WHITE 
        };
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
          {/* 제목 */}
          {title && <Text style={styles.title}>{title}</Text>}

          {/* 메시지 */}
          <Text style={[styles.message, !title && styles.messageWithoutTitle]}>
            {message}
          </Text>

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

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    container: {
      backgroundColor: colors.WHITE,
      borderRadius: 32,
      paddingTop: 28,
      paddingHorizontal: 24,
      paddingBottom: 20,
      width: '100%',
      maxWidth: 340,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.GRAY_900,
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    message: {
      fontSize: 14,
      fontWeight: '400',
      color: '#86868B',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    messageWithoutTitle: {
      marginBottom: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    button: {
      flex: 1,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.3,
    },
  });
