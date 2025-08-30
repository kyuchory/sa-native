import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, BG_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { SendIcon, EmojiIcon, CameraIcon } from './CommentInputIcons';

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

  const handleSend = () => {
    if (commentText.trim() && !isLoading) {
      onSendComment(commentText.trim());
      setCommentText('');
    }
  };

  const canSend = commentText.trim().length > 0 && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          {/* 이모지 버튼 */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              // TODO: 이모지 피커 구현
            }}
          >
            <EmojiIcon size={24} color={COLORS.GRAY_400} />
          </TouchableOpacity>

          {/* 텍스트 입력 */}
          <TextInput
            style={styles.textInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.GRAY_400}
            multiline
            maxLength={500}
            editable={!isLoading}
          />

          {/* 카메라 버튼 */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              // TODO: 이미지 첨부 구현
            }}
          >
            <CameraIcon size={24} color={COLORS.GRAY_400} />
          </TouchableOpacity>

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
              size={20}
              color={canSend ? COLORS.WHITE : COLORS.GRAY_400}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    backgroundColor: BG_COLORS.PRIMARY,
  },
  container: {
    backgroundColor: BG_COLORS.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: BG_COLORS.SECONDARY,
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
    color: COLORS.BLACK,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    maxHeight: 100,
    minHeight: 24,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.XS,
  },
  sendButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
});
