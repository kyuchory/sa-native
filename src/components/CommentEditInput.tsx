import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { SendIcon } from './CommentInputIcons';
import { useThemeStore } from '../stores/themeStore';

interface CommentEditInputProps {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CommentEditInput({
  initialText,
  onSave,
  onCancel,
  isLoading = false,
}: CommentEditInputProps) {
  const [editText, setEditText] = useState(initialText);
  const textInputRef = useRef<TextInput>(null);
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  useEffect(() => {
    // 컴포넌트 마운트 시 자동 포커스 및 텍스트 끝으로 커서 이동
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSave = () => {
    const trimmedText = editText.trim();
    if (trimmedText && !isLoading && trimmedText !== initialText) {
      onSave(trimmedText);
    }
  };

  const canSave = editText.trim().length > 0 && 
                  editText.trim() !== initialText && 
                  !isLoading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.editLabel}>댓글 수정</Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={editText}
          onChangeText={setEditText}
          placeholder="댓글을 입력하세요..."
          placeholderTextColor={colors.GRAY_400}
          multiline
          maxLength={500}
          editable={!isLoading}
          selectTextOnFocus
        />

        <TouchableOpacity
          style={[
            styles.saveButton,
            canSave && styles.saveButtonActive,
          ]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <SendIcon
            size={20}
            color={canSave ? colors.PRIMARY : colors.GRAY_400}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.GRAY_50, // BG_COLORS.PRIMARY
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  editLabel: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.PRIMARY,
  },
  cancelButton: {
    padding: SPACING.XS,
  },
  cancelText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.WHITE, // BG_COLORS.SECONDARY
    borderRadius: BORDER_RADIUS.XL,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900, // COLORS.BLACK
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    maxHeight: 100,
    minHeight: 24,
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.XS,
  },
  saveButtonActive: {
    backgroundColor: 'transparent',
  },
});
