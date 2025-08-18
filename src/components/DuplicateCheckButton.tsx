import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

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
        <ActivityIndicator size="small" color={COLORS.WHITE} />
      ) : (
        <Text style={getTextStyle()}>{getButtonText()}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.PRIMARY,
  },
  loading: {
    backgroundColor: COLORS.PRIMARY,
  },
  available: {
    backgroundColor: COLORS.SUCCESS,
  },
  unavailable: {
    backgroundColor: COLORS.ERROR,
  },
  
  // Text styles
  defaultText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  loadingText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  availableText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  unavailableText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
});
