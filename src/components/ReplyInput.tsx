import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, BG_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { SendIcon } from './CommentInputIcons';

interface ReplyInputProps {
  onSendReply: (text: string) => void;
  onCancel: () => void;
  replyToUser: string;
  isLoading?: boolean;
}

export function ReplyInput({
  onSendReply,
  onCancel,
  replyToUser,
  isLoading = false,
}: ReplyInputProps) {
  const [replyText, setReplyText] = useState(`@${replyToUser} `);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 자동 포커스
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSend = () => {
    const cleanText = replyText.replace(`@${replyToUser} `, '').trim();
    if (cleanText && !isLoading) {
      onSendReply(cleanText);
    }
  };

  const canSend = replyText.replace(`@${replyToUser} `, '').trim().length > 0 && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.replyLabel}>{replyToUser}님에게 답글</Text>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="답글을 입력하세요..."
            placeholderTextColor={COLORS.GRAY_400}
            multiline
            maxLength={500}
            editable={!isLoading}
          />

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
              color={canSend ? COLORS.PRIMARY : COLORS.GRAY_400}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  replyLabel: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: COLORS.PRIMARY,
  },
  cancelButton: {
    padding: SPACING.XS,
  },
  cancelText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.GRAY_500,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG_COLORS.SECONDARY,
    borderRadius: BORDER_RADIUS.XL,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    minHeight: 44,
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.XS,
  },
  sendButtonActive: {
    backgroundColor: 'transparent',
  },
});
