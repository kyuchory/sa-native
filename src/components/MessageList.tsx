import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SPACING, TYPOGRAPHY } from '../constants/theme';
import { Message } from '../types/chat';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { shouldShowDateSeparator, isContinuousMessage, shouldShowMessageTime, isSameDay } from '../utils/messageUtils';
import MessageBubble from './MessageBubble';
import MessageDateSeparator from './MessageDateSeparator';

// ✅ 최적화 1: 메시지 메타데이터 인터페이스
interface MessageMetadata {
  isMyMessage: boolean;
  showDateSeparator: boolean;
  isFirstInGroup: boolean;
  showTime: boolean;
}

interface CachedMessageItem {
  message: Message;
  metadata: MessageMetadata;
}

interface MessageListProps {
  messages: Message[];
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  isInitialLoading: boolean;
  onLoadMore: () => Promise<void>;
  onMessageLongPress?: (message: Message) => void;
  onPressImage?: (imageUri: string) => void;
  onPressMedia?: (mediaItem: { type: 'image' | 'video'; url: string; thumbnailUrl?: string }) => void;
}

const MessageList: React.FC<MessageListProps> = React.memo(({
  messages,
  hasMoreMessages,
  isLoadingMessages,
  isInitialLoading,
  onLoadMore,
  onMessageLongPress,
  onPressImage,
  onPressMedia,
}) => {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const styles = createStyles(colors);

  // ✅ 최적화 2: Incremental 메타데이터 캐시 (메시지 추가 시 최신 메시지만 재계산)
  const cachedMetadataRef = useRef<Map<number, CachedMessageItem>>(new Map());

  const messagesWithMetadata = useMemo(() => {
    const result: CachedMessageItem[] = messages.map((message, index) => {
      // inverted FlatList에서 맨 위 3개의 최신 메시지만 실시간 계산
      // 가장 최근 메시지들은 날짜 표시, 그룹 표시가 중요하므로 실시간 계산
      const isRecentMessage = index < 3;

      if (!isRecentMessage && cachedMetadataRef.current.has(message.id)) {
        return cachedMetadataRef.current.get(message.id)!;
      }

      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
      const prevMessage = index > 0 ? messages[index - 1] : null;

      const metadata: MessageMetadata = {
        isMyMessage: message.sender.id === user?.id,
        showDateSeparator: nextMessage ? shouldShowDateSeparator(
          message.created_at,
          nextMessage.created_at
        ) : false,
        isFirstInGroup: !nextMessage ||
          nextMessage.sender.id !== message.sender.id ||
          (nextMessage && (new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() > 60000)) ||
          (nextMessage && !isSameDay(message.created_at, nextMessage.created_at)),
        showTime: shouldShowMessageTime(message, prevMessage),
      };

      const item: CachedMessageItem = { message, metadata };
      cachedMetadataRef.current.set(message.id, item);
      return item;
    });

    // 오래된 캐시 정리 (메모리 누수 방지)
    if (cachedMetadataRef.current.size > messages.length + 50) {
      const currentMessageIds = new Set(messages.map(m => m.id));
      for (const [id] of cachedMetadataRef.current) {
        if (!currentMessageIds.has(id)) {
          cachedMetadataRef.current.delete(id);
        }
      }
    }

    return result;
  }, [messages, user?.id]);

  // ✅ 최적화 3: renderItem에서 의존성 배열 최소화
  const renderMessageItem = useCallback(({ item }: { item: typeof messagesWithMetadata[0] }) => {
    const { message, metadata } = item;

    return (
      <React.Fragment>
        <View style={styles.messageContainer}>
          <MessageBubble
            message={message}
            isMyMessage={metadata.isMyMessage}
            isFirstInGroup={metadata.isFirstInGroup}
            showTime={metadata.showTime}
            onLongPress={onMessageLongPress}
            onPressImage={onPressImage}
            onPressMedia={onPressMedia}
          />
        </View>

        {metadata.showDateSeparator && (
          <MessageDateSeparator dateString={message.created_at} />
        )}
      </React.Fragment>
    );
  }, [onMessageLongPress, onPressImage, onPressMedia, styles.messageContainer]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {isInitialLoading ? '메시지를 불러오는 중...' :
         '메시지를 입력해 대화를 시작해보세요.'}
      </Text>
    </View>
  ), [isInitialLoading, styles.emptyContainer, styles.emptyText]);

  // ✅ 최적화 4: keyExtractor 최적화
  const keyExtractor = useCallback(
    (item: typeof messagesWithMetadata[0]) => item.message.id.toString(),
    []
  );

  // ✅ 최적화 5: getItemLayout 간단 구현 (평균 높이 사용)
  // inverted FlatList에서 새 메시지는 맨 위에만 추가 → 평균 높이만으로 충분
  const getItemLayout = useCallback((data: any, index: number) => {
    const AVERAGE_HEIGHT = 80; // 텍스트(52-60)와 이미지(232)의 균형 잡힌 평균
    return {
      length: AVERAGE_HEIGHT,
      offset: AVERAGE_HEIGHT * index,
      index,
    };
  }, []);

  // ✅ 최적화 6: FlatList 성능 최적화 옵션 추가
  return (
    <FlatList
      data={messagesWithMetadata}
      renderItem={renderMessageItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      style={styles.flatList}
      showsVerticalScrollIndicator={false}
      inverted={messages.length > 0} // 메시지가 있을 때만 inverted 적용
      onContentSizeChange={() => {
        // inverted 속성으로 인해 자동으로 최신 메시지 위치로 스크롤됨
      }}
      // 무한 스크롤: 스크롤을 아래로 내리면 과거 메시지 로드
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.1}
      // ✅ 최적화 6: 성능 관련 FlatList props 추가
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={10}
      initialNumToRender={15}
      // 로딩 인디케이터 제거 - 깔끔한 UX를 위해
      ListEmptyComponent={renderEmptyState}
    />
  );
});

MessageList.displayName = 'MessageList';

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  messageContainer: {
    paddingHorizontal: SPACING.MD,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700,
    textAlign: 'center',
  },
  flatList: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
});

export default MessageList;
