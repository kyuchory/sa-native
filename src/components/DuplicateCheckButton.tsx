import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

interface DuplicateCheckButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  isChecked?: boolean;
  isAvailable?: boolean;
  size?: 'small' | 'medium';
}

export default function DuplicateCheckButton({
  onPress,
  isLoading = false,
  isChecked = false,
  isAvailable = false,
  size = 'medium',
}: DuplicateCheckButtonProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const getButtonStyle = () => {
    if (isLoading) return styles.loading;
    if (isChecked) {
      return isAvailable ? styles.available : styles.unavailable;
    }
    return styles.default;
  };

  const getButtonText = () => {
    if (isLoading) return '';
    if (isChecked) {
      return isAvailable ? '사용가능' : '사용불가';
    }
    return '중복체크';
  };

  const getTextStyle = () => {
    if (isLoading) return styles.loadingText;
    if (isChecked) {
      return isAvailable ? styles.availableText : styles.unavailableText;
    }
    return styles.defaultText;
  };

  return (
    <TouchableOpacity
      style={[styles.button, styles[size], getButtonStyle()]}
      onPress={onPress}
      disabled={isLoading || isChecked}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.WHITE} />
      ) : (
        <Text style={getTextStyle()}>{getButtonText()}</Text>
      )}
    </TouchableOpacity>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },

  // Sizes
  small: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.SM + SPACING.XS,
    minWidth: 70,
  },
  medium: {
    paddingVertical: SPACING.SM + SPACING.XS,
    paddingHorizontal: SPACING.MD,
    minWidth: 80,
  },

  // States
  default: {
    backgroundColor: colors.PRIMARY,
  },
  loading: {
    backgroundColor: colors.PRIMARY,
  },
  available: {
    backgroundColor: colors.SUCCESS,
  },
  unavailable: {
    backgroundColor: colors.ERROR,
  },

  // Text styles
  defaultText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  loadingText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  availableText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  unavailableText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
});
