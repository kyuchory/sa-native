import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SPACING, TYPOGRAPHY } from '../constants/theme';
import { Message } from '../types/chat';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { shouldShowDateSeparator, isContinuousMessage, shouldShowMessageTime } from '../utils/messageUtils';
import MessageBubble from './MessageBubble';
import MessageDateSeparator from './MessageDateSeparator';

interface MessageListProps {
  messages: Message[];
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  isInitialLoading: boolean;
  onLoadMore: () => Promise<void>;
  onMessageLongPress?: (message: Message) => void;
}

const MessageList: React.FC<MessageListProps> = React.memo(({
  messages,
  hasMoreMessages,
  isLoadingMessages,
  isInitialLoading,
  onLoadMore,
  onMessageLongPress,
}) => {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const styles = createStyles(colors);

  const renderMessageItem = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender.id === user?.id;
    // displayMessages에서 다음 메시지(화면상 아래쪽)를 확인해서 날짜 구분선 표시
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    // displayMessages에서 이전 메시지(화면상 위쪽, 더 최근)를 확인해서 연속 메시지/시간 표시 판별
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isContinuous = isContinuousMessage(item, prevMessage);
    // 날짜 구분자 표시 (다음 메시지와 비교)
    const showDateSeparator = shouldShowDateSeparator(
      item.created_at,
      nextMessage?.created_at || null
    );
    // 시간 표시 여부 결정 (이전 메시지와 비교)
    const showTime = shouldShowMessageTime(item, prevMessage);

    return (
      <React.Fragment>
        {/* 날짜 구분선 (날짜가 바뀔 때만 표시) */}
        {showDateSeparator && <MessageDateSeparator dateString={item.created_at} />}

        {/* 메시지 */}
        <View style={styles.messageContainer}>
          <MessageBubble
            message={item}
            isMyMessage={isMyMessage}
            isContinuous={isContinuous}
            showTime={showTime}
            onLongPress={onMessageLongPress}
          />
        </View>
      </React.Fragment>
    );
  }, [messages, user?.id, onMessageLongPress]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {isInitialLoading ? '메시지를 불러오는 중...' :
         '메시지를 입력해 대화를 시작해보세요.'}
      </Text>
    </View>
  );

  const keyExtractor = useCallback((item: Message) => item.id.toString(), []);

  return (
    <FlatList
      data={messages}
      renderItem={renderMessageItem}
      keyExtractor={keyExtractor}
      style={styles.flatList}
      showsVerticalScrollIndicator={false}
      inverted={messages.length > 0} // 메시지가 있을 때만 inverted 적용
      onContentSizeChange={() => {
        // inverted 속성으로 인해 자동으로 최신 메시지 위치로 스크롤됨
      }}
      // 무한 스크롤: 스크롤을 아래로 내리면 과거 메시지 로드
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.1}
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
