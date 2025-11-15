import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { SendIcon, EmojiIcon, CameraIcon } from './CommentInputIcons';
import { useThemeStore } from '../stores/themeStore';

interface CommentInputProps {
  onSendComment: (text: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function CommentInput({
  onSendComment,
  placeholder = '댓글을 작성해 보세요.',
  isLoading = false,
}: CommentInputProps) {
  const [commentText, setCommentText] = useState('');
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const handleSend = () => {
    if (commentText.trim() && !isLoading) {
      onSendComment(commentText.trim());
      setCommentText('');
    }
  };

  const canSend = commentText.trim().length > 0 && !isLoading;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {/* 이모지 버튼 */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            // TODO: 이모지 피커 구현
          }}
        >
          <EmojiIcon size={24} color={colors.GRAY_400} />
        </TouchableOpacity>

        {/* 텍스트 입력 */}
        <TextInput
          style={styles.textInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder={placeholder}
          placeholderTextColor={colors.GRAY_400}
          multiline
          maxLength={500}
          editable={!isLoading}
        />

        {/* 전송 버튼 */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            canSend && styles.sendButtonActive,
          ]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <SendIcon
            size={24}
            color={canSend ? colors.PRIMARY : colors.GRAY_400}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  keyboardAvoidingView: {
    backgroundColor: colors.GRAY_50, // BG_COLORS.PRIMARY
  },
  container: {
    backgroundColor: colors.WHITE, // BG_COLORS.PRIMARY
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.GRAY_50, // BG_COLORS.SECONDARY
    borderRadius: BORDER_RADIUS.XL,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    minHeight: 44,
  },
  iconButton: {
    padding: SPACING.XS,
    justifyContent: 'center',
    alignItems: 'center',
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
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.XS,
  },
  sendButtonActive: {
    backgroundColor: 'transparent',
  },
});
