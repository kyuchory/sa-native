import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

interface GroupChatNameInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  selectedUsersCount: number;
  firstUserName: string;
}

export default function GroupChatNameInputModal({
  visible,
  onClose,
  onSubmit,
  selectedUsersCount,
  firstUserName,
}: GroupChatNameInputModalProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const [chatName, setChatName] = useState('');

  // 모달 표시 시 초기 이름 설정
  useEffect(() => {
    if (visible && selectedUsersCount > 1) {
      const defaultName = `${firstUserName} 외 ${selectedUsersCount - 1}명의 그룹`;
      setChatName(defaultName);
    }
  }, [visible, selectedUsersCount, firstUserName]);

  // 모달이 닫힐 때 입력값 초기화
  useEffect(() => {
    if (!visible) {
      setChatName('');
    }
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = () => {
    const finalName = chatName.trim() || `${firstUserName} 외 ${selectedUsersCount - 1}명의 그룹`;
    onSubmit(finalName);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>그룹 채팅방 만들기</Text>
        <Text style={styles.subtitle}>
          {firstUserName}님 외 {selectedUsersCount - 1}명의 그룹 채팅
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={chatName}
            onChangeText={setChatName}
            placeholder="채팅방 이름을 입력하세요"
            placeholderTextColor={colors.GRAY_400}
            autoFocus
            maxLength={50}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleSubmit}
            activeOpacity={0.7}
          >
            <Text style={styles.createButtonText}>생성</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 9999,
  },
  container: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    width: '80%',
    maxWidth: 300,
    // 그림자 효과 없음 - 뚜렷한 창으로 유지
    elevation: 0,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    textAlign: 'center' as const,
    marginBottom: SPACING.XS,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    textAlign: 'center' as const,
    marginBottom: SPACING.LG,
  },
  inputContainer: {
    marginBottom: SPACING.MD,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: SPACING.SM,
    marginTop: SPACING.SM,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cancelButton: {
    backgroundColor: colors.GRAY_100,
    borderWidth: 1,
    borderColor: colors.GRAY_300,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
  },
  createButton: {
    backgroundColor: colors.PRIMARY,
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
});
