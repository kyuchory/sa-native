import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({
  visible,
  message = '게시물을 작성중입니다...'
}: LoadingOverlayProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // iOS 호환성을 위해 Modal 대신 View 사용
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color={colors.PRIMARY}
          style={styles.spinner}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 9999,
  },
  container: {
    backgroundColor: colors.WHITE,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.LG,
    borderRadius: 12,
    alignItems: 'center' as const,
    minWidth: 200,
    shadowColor: colors.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  spinner: {
    marginBottom: SPACING.MD,
  },
  message: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    textAlign: 'center' as const,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
