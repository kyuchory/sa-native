import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

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
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={getTextStyle()}>{getButtonText()}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  
  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  
  // States
  default: {
    backgroundColor: '#9c27b0',
  },
  loading: {
    backgroundColor: '#9c27b0',
  },
  available: {
    backgroundColor: '#4caf50',
  },
  unavailable: {
    backgroundColor: '#f44336',
  },
  
  // Text styles
  defaultText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  availableText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  unavailableText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
