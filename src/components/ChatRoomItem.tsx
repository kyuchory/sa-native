import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { ChatRoom, ChatType } from '../types/chat';
import { useThemeStore } from '../stores/themeStore';
import { COLORS } from '../constants/theme';
import { CheckboxEmptyIcon, CheckboxFilledIcon } from './ChatActionIcons';
import { GroupMembersIcon } from './CommonIcons';

interface ChatRoomItemProps {
  chatRoom: ChatRoom;
  isEditMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onSelect?: (chatId: number) => void;
  onProfilePress?: () => void;
}

export default function ChatRoomItem({
  chatRoom,
  isEditMode,
  isSelected,
  onPress,
  onLongPress,
  onSelect,
  onProfilePress
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
            contentFit="cover"
            cachePolicy={'memory-disk'}
            transition={200}
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
      // 그룹 채팅의 경우 memberCount 표시
      const baseImage = chatRoom.avatar_url ? (
        <Image
          source={{ uri: chatRoom.avatar_url }}
          style={styles.profileImage}
          contentFit="cover"
          cachePolicy={'memory-disk'}
          transition={200}
        />
      ) : (
        <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
          <Text style={styles.profileImageText}>
            {chatRoom.name?.charAt(0).toUpperCase() || 'G'}
          </Text>
        </View>
      );

      return (
        <View style={styles.groupProfileContainer}>
          {baseImage}
          {/* 그룹 멤버 수 표시 오버레이 */}
          <View style={styles.groupMemberOverlay}>
            <Text style={styles.groupMemberCount}>
              {chatRoom.memberCount}
            </Text>
            <View style={styles.groupMemberIcon}>
              <GroupMembersIcon size={12} color={COLORS.WHITE} />
            </View>
          </View>
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
        {chatRoom.type === 'private' && onProfilePress ? (
          <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7}>
            {renderProfileImage(chatRoom)}
          </TouchableOpacity>
        ) : (
          renderProfileImage(chatRoom)
        )}
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
    paddingVertical: 12,
    alignItems: 'center' as const,
    backgroundColor: 'transparent',
  },
  editMode: {
    paddingLeft: SPACING.SM,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_700,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  message: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.SM,
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

  // 그룹 채팅 멤버 수 표시 스타일
  groupProfileContainer: {
    position: 'relative',
  },
  groupMemberOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
    minWidth: 20,
    justifyContent: 'center',
    gap: 1.5,
  },
  groupMemberCount: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
    lineHeight: 12,
  },
  groupMemberIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
