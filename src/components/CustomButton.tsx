import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
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

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variants
  primary: {
    backgroundColor: COLORS.PRIMARY,
  },
  secondary: {
    backgroundColor: COLORS.GRAY_100,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
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
    backgroundColor: COLORS.GRAY_300,
    borderColor: COLORS.GRAY_300,
  },
  
  // Text styles
  text: {
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  
  // Variant text colors
  primaryText: {
    color: COLORS.WHITE,
  },
  secondaryText: {
    color: TEXT_COLORS.PRIMARY,
  },
  outlineText: {
    color: COLORS.PRIMARY,
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
    color: TEXT_COLORS.DISABLED,
  },
});
