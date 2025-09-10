import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useThemeStore } from '../stores/themeStore';

interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  rightComponent?: React.ReactNode;
}

export default function CustomInput({
  label,
  error,
  rightComponent,
  style,
  ...props
}: CustomInputProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError, style]}
          placeholderTextColor={colors.GRAY_500}
          {...props}
        />
        {rightComponent && (
          <View style={styles.rightComponent}>
            {rightComponent}
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.GRAY_900,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.GRAY_300,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: colors.WHITE,
    color: colors.GRAY_900, // 텍스트 색상 추가
  },
  inputError: {
    borderColor: colors.PRIMARY,
  },
  rightComponent: {
    marginLeft: 10,
  },
  errorText: {
    color: colors.PRIMARY,
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
  },
});
