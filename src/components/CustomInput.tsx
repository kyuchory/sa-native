import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { COLORS } from '../constants/theme';

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
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError, style]}
          placeholderTextColor="#999"
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: COLORS.PRIMARY,
  },
  rightComponent: {
    marginLeft: 10,
  },
  errorText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
  },
});
