import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';

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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variants
  primary: {
    backgroundColor: '#9c27b0',
  },
  secondary: {
    backgroundColor: '#f5f5f5',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#9c27b0',
  },
  
  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  large: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  
  // Disabled state
  disabled: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  
  // Text styles
  text: {
    fontWeight: '600',
  },
  
  // Variant text colors
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: '#333',
  },
  outlineText: {
    color: '#9c27b0',
  },
  
  // Size text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Disabled text
  disabledText: {
    color: '#999',
  },
});
