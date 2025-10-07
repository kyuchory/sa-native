import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { ChatRoom, ChatType } from '../types/chat';
import { useThemeStore } from '../stores/themeStore';
import { CheckboxEmptyIcon, CheckboxFilledIcon } from './ChatActionIcons';

interface ChatRoomItemProps {
  chatRoom: ChatRoom;
  isEditMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onSelect?: (chatId: number) => void;
}

export default function ChatRoomItem({
  chatRoom,
  isEditMode,
  isSelected,
  onPress,
  onLongPress,
  onSelect
}: ChatRoomItemProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 채팅방 표시 이름 가져오기
  const getChatDisplayName = (chatRoom: ChatRoom) => {
    if (chatRoom.type === 'private') {
      return chatRoom.other_user?.nickname || '1:1 채팅';
    } else {
      return chatRoom.name || '그룹 채팅';
    }
  };

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    if (diffInMinutes < 2880) return '어제';
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  // 프로필 이미지 렌더링
  const renderProfileImage = (chatRoom: ChatRoom) => {
    if (chatRoom.type === 'private') {
      if (chatRoom.other_user?.avatar_url) {
        return (
          <Image
            source={{ uri: chatRoom.other_user.avatar_url }}
            style={styles.profileImage}
          />
        );
      }

      const firstChar = chatRoom.other_user?.nickname?.charAt(0).toUpperCase() || '?';
      return (
        <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
          <Text style={styles.profileImageText}>
            {firstChar}
          </Text>
        </View>
      );
    } else {
      if (chatRoom.avatar_url) {
        return (
          <Image
            source={{ uri: chatRoom.avatar_url }}
            style={styles.profileImage}
          />
        );
      }
      return (
        <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
          <Text style={styles.profileImageText}>
            {chatRoom.name?.charAt(0).toUpperCase() || 'G'}
          </Text>
        </View>
      );
    }
  };

  const displayName = getChatDisplayName(chatRoom);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isEditMode && styles.editMode,
        isSelected && styles.selected
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      {isEditMode && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => onSelect?.(chatRoom.id)}
          activeOpacity={0.7}
        >
          {isSelected ? (
            <CheckboxFilledIcon size={20} color={colors.PRIMARY} />
          ) : (
            <CheckboxEmptyIcon size={20} color={colors.GRAY_300} />
          )}
        </TouchableOpacity>
      )}

      <View style={styles.profileContainer}>
        {renderProfileImage(chatRoom)}
      </View>

      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.time}>
            {chatRoom.lastMessage ? formatTime(chatRoom.lastMessage.created_at) : ''}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.message} numberOfLines={1}>
            {chatRoom.lastMessage ? (
              chatRoom.type === 'group' && chatRoom.other_users ? (
                (() => {
                  const sender = chatRoom.other_users.find(user => user.id === chatRoom.lastMessage!.sender_id);
                  return sender ? `${sender.nickname}: ${chatRoom.lastMessage.content}` : chatRoom.lastMessage.content;
                })()
              ) : chatRoom.lastMessage.content
            ) : (
              chatRoom.type === 'private' ? '채팅을 시작해 보세요!' : '메시지가 없습니다.'
            )}
          </Text>
          
          {!isEditMode && chatRoom.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {chatRoom.unread_count > 99 ? '99+' : chatRoom.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flexDirection: 'row' as const,
    paddingVertical: SPACING.MD,
    alignItems: 'center' as const,
    backgroundColor: 'transparent',
  },
  editMode: {
    paddingLeft: SPACING.LG,
  },
  selected: {
    backgroundColor: colors.GRAY_50,
  },

  checkboxContainer: {
    marginRight: SPACING.MD,
  },

  profileContainer: {
    marginRight: SPACING.MD,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileImagePlaceholder: {
    backgroundColor: colors.GRAY_300,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },

  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.XS,
  },
  name: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginRight: SPACING.SM,
  },
  time: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  message: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700,
    marginRight: SPACING.SM,
  },

  unreadBadge: {
    backgroundColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS.ROUND,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.XS,
  },
  unreadText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },
});
