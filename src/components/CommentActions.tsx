import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING } from '../constants/theme';
import CustomAlertModal from './CustomAlertModal';

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
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  const handleMorePress = () => {
    const buttons = [
      {
        text: '답글 달기',
        onPress: () => { onReply(); setAlertModal(null); },
      },
    ];

    if (isOwner) {
      buttons.push(
        {
          text: '수정',
          onPress: () => { onEdit(commentId); setAlertModal(null); },
        },
        {
          text: '삭제',
          onPress: () => {
            setAlertModal({
              visible: true,
              title: '댓글 삭제',
              message: '정말로 이 댓글을 삭제하시겠습니까?',
              buttons: [
                { text: '취소', onPress: () => { setAlertModal(null); }, style: 'cancel' },
                {
                  text: '삭제',
                  onPress: () => { onDelete(commentId); setAlertModal(null); },
                  style: 'destructive'
                },
              ]
            });
          },
        }
      );
    }

    buttons.push({ text: '취소', onPress: () => { setAlertModal(null); } });

    // For multiple options, show as modal with multiple buttons
    setAlertModal({
      visible: true,
      title: '댓글 옵션',
      message: '',
      buttons: buttons,
    });
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

      {alertModal && (
        <CustomAlertModal
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          buttons={alertModal.buttons}
          onClose={() => setAlertModal(null)}
        />
      )}
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
