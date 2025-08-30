import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING } from '../constants/theme';

interface CommentActionsProps {
  commentId: number;
  isOwner: boolean;
  onEdit: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onReply: () => void;
}

// 더보기 아이콘 (3개 점)
function MoreIcon({ size = 20, color = COLORS.GRAY_400 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
        fill={color}
      />
    </Svg>
  );
}

export function CommentActions({
  commentId,
  isOwner,
  onEdit,
  onDelete,
  onReply,
}: CommentActionsProps) {
  
  const handleMorePress = () => {
    const actions = [
      {
        text: '답글 달기',
        onPress: () => onReply(),
      },
    ];

    if (isOwner) {
      actions.push(
        {
          text: '수정',
          onPress: () => onEdit(commentId),
        },
        {
          text: '삭제',
          onPress: () => {
            Alert.alert(
              '댓글 삭제',
              '정말로 이 댓글을 삭제하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                { 
                  text: '삭제', 
                  style: 'destructive',
                  onPress: () => onDelete(commentId)
                },
              ]
            );
          },
        }
      );
    }

    actions.push({ text: '취소', onPress: () => {} });

    Alert.alert('댓글 옵션', '', actions);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.moreButton}
        onPress={handleMorePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MoreIcon />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    padding: SPACING.XS,
    borderRadius: 12,
  },
});
