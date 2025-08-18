import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

interface ProfileButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function ProfileButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
}: ProfileButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && icon}
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.MD,
    gap: SPACING.XS,
  },

  // Variants
  primary: {
    backgroundColor: COLORS.PRIMARY,
  },
  secondary: {
    backgroundColor: COLORS.GRAY_200,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
  },

  // Sizes
  small: {
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    minHeight: 32,
  },
  medium: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    minHeight: 40,
  },
  large: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    minHeight: 48,
  },

  // Disabled state
  disabled: {
    backgroundColor: COLORS.GRAY_200,
    borderColor: COLORS.GRAY_200,
  },

  // Text styles
  text: {
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    textAlign: 'center',
  },

  // Variant text colors
  primaryText: {
    color: COLORS.WHITE,
  },
  secondaryText: {
    color: COLORS.GRAY_700,
  },
  outlineText: {
    color: COLORS.GRAY_700,
  },

  // Size text sizes
  smallText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
  },
  mediumText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
  },
  largeText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
  },

  // Disabled text
  disabledText: {
    color: COLORS.GRAY_500,
  },
});
