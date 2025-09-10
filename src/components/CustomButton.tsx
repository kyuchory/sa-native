import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export default function CustomButton({
  title,
  variant = 'primary',
  size = 'medium',
  style,
  disabled,
  ...props
}: CustomButtonProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled}
      {...props}
    >
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Variants
  primary: {
    backgroundColor: colors.PRIMARY,
  },
  secondary: {
    backgroundColor: colors.GRAY_100,
  },
  tertiary: {
    backgroundColor: colors.GRAY_50, // 더 수수한 배경색
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.PRIMARY,
  },

  // Sizes
  small: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  medium: {
    paddingVertical: SPACING.MD - SPACING.XS,
    paddingHorizontal: SPACING.MD + SPACING.XS,
  },
  large: {
    paddingVertical: SPACING.LG - SPACING.SM,
    paddingHorizontal: SPACING.LG,
  },

  // Disabled state
  disabled: {
    backgroundColor: colors.GRAY_300,
    borderColor: colors.GRAY_300,
  },

  // Text styles
  text: {
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },

  // Variant text colors
  primaryText: {
    color: colors.WHITE,
  },
  secondaryText: {
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
  },
  tertiaryText: {
    color: colors.GRAY_700, // tertiary의 적절한 텍스트 색상
  },
  outlineText: {
    color: colors.PRIMARY,
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
    color: colors.GRAY_500, // TEXT_COLORS.DISABLED
  },
});
