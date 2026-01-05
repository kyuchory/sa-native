import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Message } from '../types/chat';
import { formatMessageTime } from '../utils/timeUtils';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import UserAvatar from '../components/UserAvatar';
import { PlayIcon } from '../components/CutIcons';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../constants/theme';

interface MessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
  isFirstInGroup: boolean;
  showTime: boolean;
  onLongPress?: (message: Message) => void;
  onPressImage?: (imageUri: string) => void;
  onPressMedia?: (mediaItem: { type: 'image' | 'video'; url: string; thumbnailUrl?: string }) => void;
  onProfilePress?: (senderId: number) => void;
}

// ✅ 공백 렌더링 이슈 해결 함수
const normalizeText = (text: string) => {
  // 일반 공백을 non-breaking space(\u00A0)로 변환하여 렌더링 보장
  return text.replace(/ /g, '\u00A0');
};

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  isMyMessage,
  isFirstInGroup,
  showTime,
  onLongPress,
  onPressImage,
  onPressMedia,
  onProfilePress,
}) => {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const styles = createStyles(colors);

  const renderMessageContent = () => {
    // 시스템 메시지: 중앙 정렬 텍스트
    if (message.type === 'system') {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>
            {normalizeText(message.content)}
          </Text>
        </View>
      );
    }

    if (message.type === 'image' && message.isSending) {
      // 이미지 전송 중: 이미지 표시 + 오버레이
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: message.content }}
            style={styles.image}
            contentFit="cover"
            cachePolicy={'memory-disk'}
            transition={200}
            priority="normal" // ✅ 최적화: 우선순위 낮춤
            placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }} // ✅ 최적화: 기본 blurhash placeholder
          />
          {/* 반투명 오버레이 */}
          <View style={styles.imageOverlay}>
            <ActivityIndicator
              size="small"
              color={colors.WHITE}
            />
            <Text style={styles.imageOverlayText}>
              전송 중...
            </Text>
          </View>
        </View>
      );
    }

    if (message.type === 'video' && message.isSending) {
      // 비디오 전송 중: 썸네일 표시 + 오버레이
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: message.content }}
            style={styles.image}
            contentFit="cover"
            cachePolicy={'memory-disk'}
            transition={200}
            priority="normal"
            placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
          />
          {/* 반투명 오버레이 */}
          <View style={styles.imageOverlay}>
            <ActivityIndicator
              size="small"
              color={colors.WHITE}
            />
            <Text style={styles.imageOverlayText}>
              전송 중...
            </Text>
          </View>
        </View>
      );
    }

    // 일반 메시지 내용 (텍스트, 이미지, 또는 비디오)
    let content;
    if (message.type === 'image') {
      content = (
        <TouchableOpacity
          onPress={() => onPressMedia?.({ type: 'image', url: message.content })}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: message.content }}
            style={styles.image}
            contentFit="cover"
            cachePolicy={'memory-disk'}
            transition={200}
            priority="normal"
            placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
          />
        </TouchableOpacity>
      );
    } else if (message.type === 'video') {
      // 비디오: JSON 파싱해서 thumbnail_url 추출
      let thumbnailUrl = '';
      let videoData: any = null;
      try {
        videoData = JSON.parse(message.content);
        thumbnailUrl = videoData.thumbnail_url || '';
      } catch (error) {
        console.error('비디오 content 파싱 실패:', error);
        thumbnailUrl = '';
      }

      content = (
        <TouchableOpacity
          onPress={() => onPressMedia?.({ type: 'video', url: videoData?.video_url || '', thumbnailUrl })}
          activeOpacity={0.7}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.image}
              contentFit="cover"
              cachePolicy={'memory-disk'}
              transition={200}
              priority="normal"
              placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
            />
            {/* 플레이 버튼 오버레이 */}
            <View style={styles.videoOverlay}>
              <PlayIcon size={48} color={colors.WHITE} />
            </View>
          </View>
        </TouchableOpacity>
      );
    } else {
      // ✅ 텍스트 메시지: 공백 이슈 해결
      content = (
        <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
          {normalizeText(message.content)}
        </Text>
      );
    }

    return (
      <TouchableOpacity
        onLongPress={() => onLongPress?.(message)}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  };

  // 시스템 메시지의 경우 완전히 다른 레이아웃
  if (message.type === 'system') {
    return (
      <View style={styles.systemMessageWrapper}>
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>
            {normalizeText(message.content)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
      {/* 프로필 이미지 (상대방 메시지에서만, 연속 메시지가 아닐 때) */}
      {!isMyMessage && (
        <View style={styles.avatarContainer}>
          {isFirstInGroup ? (
            onProfilePress ? (
              <TouchableOpacity onPress={() => onProfilePress(message.sender.id)} activeOpacity={0.7}>
                <UserAvatar
                  profileImg={message.sender.profile_img}
                  nickname={message.sender.nickname}
                  size={32}
                />
              </TouchableOpacity>
            ) : (
              <UserAvatar
                profileImg={message.sender.profile_img}
                nickname={message.sender.nickname}
                size={32}
              />
            )
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
      )}

      {/* 메시지 내용 */}
      <View style={[styles.contentContainer, isMyMessage ? styles.myContentContainer : styles.otherContentContainer]}>
        {/* 상대방 메시지의 경우 닉네임 (연속 메시지가 아닐 때만) */}
        {!isMyMessage && isFirstInGroup && (
          <Text style={styles.nickname}>
            {message.sender.nickname}
          </Text>
        )}

        <View style={styles.messageRow}>
          {/* 내 메시지의 경우 시간이 왼쪽에 */}
          {isMyMessage && showTime && (
            <View style={styles.timeContainer}>
              {message.isSending ? (
                // 전송 중: 로딩 인디케이터
                <ActivityIndicator
                  size="small"
                  color={colors.GRAY_500}
                />
              ) : (
                // 전송 완료: 시간 표시
                <Text style={styles.timeText}>
                  {formatMessageTime(message.created_at)}
                </Text>
              )}
            </View>
          )}

          {/* 메시지 말풍선 */}
          <View style={isMyMessage ? styles.myBubble : styles.otherBubble}>
            {renderMessageContent()}
          </View>

          {/* 상대방 메시지의 경우 시간이 오른쪽에 */}
          {!isMyMessage && showTime && (
            <Text style={styles.timeText}>
              {formatMessageTime(message.created_at)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
});

MessageBubble.displayName = 'MessageBubble';

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: SPACING.XS,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 40,
    marginRight: 2,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  contentContainer: {
    flex: 1,
    maxWidth: '75%',
  },
  myContentContainer: {
    alignItems: 'flex-end',
  },
  otherContentContainer: {
    alignItems: 'flex-start',
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
    marginBottom: SPACING.XS,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.XS,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 16,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500,
    alignSelf: 'flex-end',
    marginBottom: SPACING.XS,
  },
  myBubble: {
    paddingHorizontal: SPACING.SMD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: colors.PRIMARY,
    // ✅ 공백 이슈 해결
    alignItems: 'flex-start',
    minWidth: 40,
  },
  otherBubble: {
    paddingHorizontal: SPACING.SMD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: colors.WHITE,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
    // ✅ 공백 이슈 해결
    alignItems: 'flex-start',
    minWidth: 40,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.MD,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.XS,
  },
  imageOverlayText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.WHITE,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BORDER_RADIUS.MD,
  },
  myMessageText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    lineHeight: 20,
    color: colors.WHITE,
    // ✅ 공백 이슈 해결
    textAlign: 'left',
    includeFontPadding: false,
    flexShrink: 1,
  },
  otherMessageText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    lineHeight: 20,
    color: colors.GRAY_900,
    // ✅ 공백 이슈 해결
    textAlign: 'left',
    includeFontPadding: false,
    flexShrink: 1,
  },
  // 시스템 메시지 스타일
  systemMessageWrapper: {
    alignItems: 'center',
    marginVertical: SPACING.SM,
  },
  systemMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.MD,
    maxWidth: '80%',
  },
  systemMessageText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});

export default MessageBubble;
