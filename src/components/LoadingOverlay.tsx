import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({ 
  visible, 
  message = '게시물을 작성중입니다...' 
}: LoadingOverlayProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator 
            size="large" 
            color={COLORS.PRIMARY} 
            style={styles.spinner}
          />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.LG,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  spinner: {
    marginBottom: SPACING.MD,
  },
  message: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.PRIMARY,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
