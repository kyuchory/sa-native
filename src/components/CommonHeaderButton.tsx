import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

interface CommonHeaderButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function CommonHeaderButton({
  title,
  onPress,
  disabled = false,
  loading: externalLoading = false,
  style,
}: CommonHeaderButtonProps) {
  const { colors } = useThemeStore();
  const [internalLoading, setInternalLoading] = useState(false);

  const styles = createStyles(colors);

  const isLoading = externalLoading || internalLoading;
  const isDisabled = disabled || isLoading;

  const handlePress = async () => {
    if (isDisabled) return;

    const result = onPress();

    // Promise가 반환되면 로딩 상태로 전환
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={isDisabled ? colors.GRAY_400 : colors.WHITE}
        />
      ) : (
        <Text style={[
          styles.buttonText,
          isDisabled && styles.buttonTextDisabled,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  button: {
    backgroundColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS.XL,
    minWidth: 80,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
  },
  buttonDisabled: {
    backgroundColor: colors.GRAY_300,
  },
  buttonText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  buttonTextDisabled: {
    color: colors.GRAY_500,
  },
});
