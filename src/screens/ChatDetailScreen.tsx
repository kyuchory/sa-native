import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Components
import CommonHeader from '../components/CommonHeader';
import { SearchIcon, MenuIcon, PlusCircleIcon, SendIcon } from '../components/ChatDetailIcons';
import ChatDetailSidebar from '../components/ChatDetailSidebar';

// Types
import { Message } from '../types/chat';
import { AuthStackParamList } from '../types/navigation';

// Constants
import {
  COLORS,
  TEXT_COLORS,
  BG_COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  INPUT_SIZES,
} from '../constants/theme';

// Stores
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

// Services
import { ChatService } from '../services/chatService';
import { LocalMessageService } from '../services/localMessageService';

// Utils
import { formatMessageTime, isSameDay, formatMessageDate, shouldShowDateSeparator } from '../utils';

type ChatDetailScreenRouteProp = RouteProp<AuthStackParamList, 'ChatDetail'>;
type ChatDetailScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ChatDetail'>;

export default function ChatDetailScreen() {
  const navigation = useNavigation<ChatDetailScreenNavigationProp>();
  const route = useRoute<ChatDetailScreenRouteProp>();
  const flatListRef = useRef<FlatList<Message>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Route params
  const { chatRoomId, chatRoomName, chatPartnerId } = route.params;

  // Auth store
  const { user } = useAuthStore();

  // Chat store (Zustand)
  const {
    // WebSocket 상태
    isConnected,
    currentChatRoomId,
    
    // 메시지 상태
    messages,
    typingUsers,
    isTyping,
    
    // 페이지네이션 상태
    hasNext,
    nextCursor,
    isLoadingMore,
    isInitialLoading,
    
    // Actions
    connectSocket,
    disconnectSocket,
    joinChatRoom,
    leaveChatRoom,
    sendMessage,
    retryMessage,
    retryAllFailedMessages,
    setMessages,
    setHasNext,
    setNextCursor,
    setIsLoadingMore,
    setIsInitialLoading,
    startTyping,
    stopTyping,
  } = useChatStore();

  // 로컬 상태
  const [inputText, setInputText] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  // Mock 데이터 (추후 API로 대체)
  const mockMembers = [
    {
      id: user?.id || 1,
      nickname: user?.nickname || '나',
      avatar_url: user?.profile_img || undefined,
      isOnline: true,
    },
    {
      id: chatPartnerId || 2,
      nickname: chatRoomName,
      avatar_url: undefined,
      isOnline: Math.random() > 0.5, // 랜덤하게 온라인 상태
    },
  ];

  const mockSharedMedia = [
    {
      id: '1',
      type: 'image' as const,
      url: 'https://via.placeholder.com/300x300/FFB6C1/000000?text=Image1',
      date: '2024-01-15',
    },
    {
      id: '2',
      type: 'video' as const,
      url: 'https://via.placeholder.com/300x300/87CEEB/000000?text=Video1',
      thumbnail: 'https://via.placeholder.com/300x300/87CEEB/000000?text=Video1',
      date: '2024-01-14',
    },
    {
      id: '3',
      type: 'image' as const,
      url: 'https://via.placeholder.com/300x300/98FB98/000000?text=Image2',
      date: '2024-01-13',
    },
    {
      id: '4',
      type: 'video' as const,
      url: 'https://via.placeholder.com/300x300/DDA0DD/000000?text=Video2',
      thumbnail: 'https://via.placeholder.com/300x300/DDA0DD/000000?text=Video2',
      date: '2024-01-12',
    },
    {
      id: '5',
      type: 'image' as const,
      url: 'https://via.placeholder.com/300x300/F0E68C/000000?text=Image3',
      date: '2024-01-11',
    },
    {
      id: '6',
      type: 'video' as const,
      url: 'https://via.placeholder.com/300x300/FFA07A/000000?text=Video3',
      thumbnail: 'https://via.placeholder.com/300x300/FFA07A/000000?text=Video3',
      date: '2024-01-10',
    },
    {
      id: '7',
      type: 'image' as const,
      url: 'https://via.placeholder.com/300x300/20B2AA/FFFFFF?text=Image4',
      date: '2024-01-09',
    },
  ];

  const mockNotices = [
    {
      id: '1',
      title: '채팅방 공지사항',
      content: '모든 분들께 알려드립니다. 채팅방 이용 시 서로를 존중하며 즐거운 대화를 나누어주세요.',
      date: '2024-01-10',
      author: '관리자',
    },
    {
      id: '2',
      title: '새로운 기능 안내',
      content: '이제 사진과 동영상을 공유할 수 있습니다. 첨부 버튼을 눌러 미디어를 선택해보세요.',
      date: '2024-01-08',
      author: chatRoomName,
    },
  ];

  // WebSocket 연결 및 채팅방 참가 (ChatStore 사용)
  useEffect(() => {
    const initChatRoom = async () => {
      try {
        if (!user) {
          Alert.alert('오류', '로그인이 필요합니다.');
          navigation.goBack();
          return;
        }

        // 1단계: WebSocket 연결 (전역 관리)
        await connectSocket();
        
        // 2단계: 채팅방 참가
        joinChatRoom(chatRoomId);
        
        // 3단계: 채팅 히스토리 로드
        loadChatHistory();
        
      } catch (error) {
        console.error('채팅방 초기화 실패:', error);
        Alert.alert('오류', '채팅방에 접속할 수 없습니다.');
      }
    };

    initChatRoom();

    // 클린업: 채팅방 나가기 (WebSocket은 유지)
    return () => {
      leaveChatRoom();
      
      // 타이핑 타이머 클린업
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatRoomId, user?.id, navigation]);

  // 컴포넌트 마운트 시 스크롤을 맨 아래로
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  // 초기 채팅 히스토리 로드 (서버 메시지 + 로컬 메시지 병합)
  const loadChatHistory = async () => {
    try {
      setIsInitialLoading(true);
      
      // 1. 서버에서 메시지 조회
      const response = await ChatService.getMessages(chatRoomId);
      
      // 2. 로컬 저장소에서 메시지 조회 (전송 실패한 것들 포함)
      const localMessages = await LocalMessageService.getLocalMessages(chatRoomId);
      
      // 3. 서버 메시지와 로컬 메시지 병합
      const mergedMessages = LocalMessageService.mergeWithServerMessages(
        response.messages,
        localMessages
      );
      
      // ChatStore에 메시지 설정
      setMessages(mergedMessages);
      setHasNext(response.hasNext);
      setNextCursor(response.nextCursor);
      
      console.log(
        '📨 채팅 히스토리 로드 완료:',
        `서버 ${response.messages.length}개`,
        `로컬 ${localMessages.length}개`,
        `병합 ${mergedMessages.length}개`
      );
      
      // 초기 로드 후 스크롤을 맨 아래로
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('채팅 히스토리 로드 실패:', error);
      Alert.alert('오류', '채팅 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 더 많은 메시지 로드 (무한 스크롤)
  const loadMoreMessages = async () => {
    if (!hasNext || !nextCursor || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const response = await ChatService.getMessages(chatRoomId, nextCursor);
      
      // 새 메시지를 기존 메시지 앞에 추가 (과거 메시지이므로)
      const newMessages = [...response.messages, ...messages];
      setMessages(newMessages);
      setHasNext(response.hasNext);
      setNextCursor(response.nextCursor);
      
      console.log('📨 더 많은 메시지 로드 완료:', response.messages.length, '개 메시지');
    } catch (error) {
      console.error('더 많은 메시지 로드 실패:', error);
      Alert.alert('오류', '이전 메시지를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 뒤로 가기 핸들러
  const handleBack = () => {
    navigation.goBack();
  };

  // 메시지 전송 핸들러 (ChatStore 사용)
  const handleSendMessage = async () => {
    if (!inputText.trim() || !isConnected || !user) return;

    const messageContent = inputText.trim();
    
    // @멘션 파싱
    const mentionRegex = /@(\w+)/g;
    const mentionUserIds: number[] = [];
    let match;
    
    while ((match = mentionRegex.exec(messageContent)) !== null) {
      console.log('멘션 감지:', match[1]);
    }

    // ChatStore의 sendMessage 사용
    await sendMessage(messageContent, mentionUserIds);

    // 입력창 초기화
    setInputText('');

    // 스크롤 맨 아래로 이동
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // 타이핑 시작 핸들러 (ChatStore 사용)
  const handleTypingStart = () => {
    if (!isConnected || isTyping) return;
    
    startTyping();
    
    // 3초 후 자동으로 타이핑 중단
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  // 타이핑 중단 핸들러 (ChatStore 사용)
  const handleTypingStop = () => {
    if (!isConnected || !isTyping) return;
    
    stopTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // 입력 텍스트 변경 핸들러
  const handleInputChange = (text: string) => {
    setInputText(text);
    
    // 타이핑 상태 시작
    if (text.trim() && !isTyping) {
      handleTypingStart();
    } else if (!text.trim() && isTyping) {
      handleTypingStop();
    }
  };

  // 실패한 메시지 재전송 (ChatStore 사용)
  const handleRetryMessage = async (failedMessage: Message) => {
    await retryMessage(failedMessage);
  };

  // 실패한 메시지들 일괄 재전송 (ChatStore 사용)
  const handleRetryAllFailedMessages = async () => {
    await retryAllFailedMessages();
  };



  // 같은 발신자의 연속 메시지인지 체크
  const isContinuousMessage = (currentMessage: Message, prevMessage: Message | null) => {
    if (!prevMessage) return false;
    
    const isSameSender = currentMessage.sender.id === prevMessage.sender.id;
    const isWithinTimeLimit = new Date(currentMessage.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 60000; // 1분
    
    return isSameSender && isWithinTimeLimit && isSameDay(currentMessage.created_at, prevMessage.created_at);
  };

  // 날짜 구분선 렌더링
  const renderDateSeparator = (dateString: string) => (
    <View style={styles.dateSeparatorContainer}>
      <View style={styles.dateSeparatorLine} />
      <Text style={styles.dateSeparatorText}>
        {formatMessageDate(dateString)}
      </Text>
      <View style={styles.dateSeparatorLine} />
    </View>
  );

  // 메시지 아이템 렌더링
  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender.id === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isContinuous = isContinuousMessage(item, prevMessage);
    const showDateSeparator = shouldShowDateSeparator(
      item.created_at, 
      prevMessage?.created_at || null
    );

    return (
      <>
        {/* 날짜 구분선 (날짜가 바뀔 때만 표시) */}
        {showDateSeparator && renderDateSeparator(item.created_at)}
        
        {/* 메시지 */}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          {/* 상대방 메시지의 경우 프로필 이미지 (연속 메시지가 아닐 때만) */}
          {!isMyMessage && (
            <View style={styles.profileSection}>
              {!isContinuous ? (
                <Image source={{ uri: item.sender.profile_img || '' }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder} />
              )}
            </View>
          )}

          {/* 메시지 내용 */}
          <View style={[
            styles.messageContentContainer,
            isMyMessage ? styles.myMessageContentContainer : styles.otherMessageContentContainer
          ]}>
            {/* 상대방 메시지의 경우 닉네임 (연속 메시지가 아닐 때만) */}
            {!isMyMessage && !isContinuous && (
              <Text style={styles.senderName}>{item.sender.nickname}</Text>
            )}
            
            <View style={styles.messageRow}>
                          {/* 내 메시지의 경우 시간이 왼쪽에 */}
            {isMyMessage && (
              <View style={styles.myMessageTimeContainer}>
                {item.status === 'failed' && (
                  <Text style={styles.messageStatusFailed}>실패</Text>
                )}
                <View style={styles.messageTimeContainer}>
                  {item.status === 'sending' ? (
                    <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                  ) : (
                    <Text style={styles.messageTime}>
                      {formatMessageTime(item.created_at)}
                    </Text>
                  )}
                </View>
              </View>
            )}
              
              {/* 메시지 말풍선 */}
              <TouchableOpacity 
                style={[
                  styles.messageBubble,
                  isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
                  item.status === 'failed' && styles.messageFailedBubble
                ]}
                onPress={() => {
                  // 실패한 메시지 재전송
                  if (item.status === 'failed' && item.isTemporary) {
                    handleRetryMessage(item);
                  }
                }}
                disabled={item.status !== 'failed'}
                activeOpacity={item.status === 'failed' ? 0.7 : 1}
              >
                <Text style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.otherMessageText
                ]}>
                  {item.content}
                </Text>
              </TouchableOpacity>
              
              {/* 상대방 메시지의 경우 시간이 오른쪽에 */}
              {!isMyMessage && (
                <Text style={styles.messageTime}>{formatMessageTime(item.created_at)}</Text>
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  // 사이드바 관련 핸들러
  const handleToggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleCloseSidebar = () => {
    setIsSidebarVisible(false);
  };

  const handleAddMember = () => {
    // TODO: 멤버 추가 기능 구현
    console.log('멤버 추가');
  };

  const handleViewAllMedia = () => {
    // TODO: 전체 미디어 보기 기능 구현
    console.log('전체 미디어 보기');
  };

  const handleViewNotice = (notice: any) => {
    // TODO: 공지사항 상세 보기 기능 구현
    console.log('공지사항 보기:', notice);
  };

  // 헤더 우측 컴포넌트 (검색, 햄버거 메뉴)
  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
        <SearchIcon size={20} color={TEXT_COLORS.SECONDARY} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.headerIconButton} 
        activeOpacity={0.7}
        onPress={handleToggleSidebar}
      >
        <MenuIcon size={20} color={TEXT_COLORS.SECONDARY} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* 헤더 */}
        <CommonHeader
          title={chatRoomName}
          onBackPress={handleBack}
          showBackButton={true}
          rightComponent={renderHeaderRight()}
        />

        {/* 채팅 메시지 목록 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (!isInitialLoading && !isLoadingMore) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          // 무한 스크롤 설정
          onRefresh={loadMoreMessages}
          refreshing={isLoadingMore}
          // ListHeaderComponent에 로딩 인디케이터 추가
          ListHeaderComponent={() => 
            isLoadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <Text style={styles.loadingMoreText}>이전 메시지를 불러오는 중...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isInitialLoading ? '메시지를 불러오는 중...' :
                 isConnected ? '메시지를 입력해 대화를 시작해보세요.' : 
                 '서버에 연결 중...'}
              </Text>
            </View>
          )}
          // 초기 로딩 중이 아닐 때만 자동 스크롤
          maintainVisibleContentPosition={isLoadingMore ? {
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 100,
          } : undefined}
        />

        {/* 타이핑 인디케이터 */}
        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>
              {typingUsers.map(u => u.nickname).join(', ')}님이 입력 중...
            </Text>
          </View>
        )}

        {/* 실패한 메시지 재전송 알림 */}
        {messages.some(msg => msg.status === 'failed') && (
          <View style={styles.failedMessagesContainer}>
            <Text style={styles.failedMessagesText}>
              전송에 실패한 메시지가 있습니다.
            </Text>
            <TouchableOpacity 
              style={styles.retryAllButton}
              onPress={handleRetryAllFailedMessages}
              activeOpacity={0.7}
            >
              <Text style={styles.retryAllButtonText}>모두 재전송</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 메시지 입력 영역 */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <PlusCircleIcon size={24} color={TEXT_COLORS.SECONDARY} />
          </TouchableOpacity>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={isConnected ? "메시지를 입력하세요..." : "연결 중..."}
              placeholderTextColor={TEXT_COLORS.DISABLED}
              value={inputText}
              onChangeText={handleInputChange}
              multiline={true}
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
              editable={isConnected}
            />
          </View>
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (inputText.trim() && isConnected) ? styles.sendButtonActive : styles.sendButtonInactive
            ]} 
            onPress={handleSendMessage}
            activeOpacity={0.7}
            disabled={!inputText.trim() || !isConnected}
          >
            <SendIcon 
              size={20} 
              color={(inputText.trim() && isConnected) ? COLORS.WHITE : TEXT_COLORS.DISABLED} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 사이드바 */}
      <ChatDetailSidebar
        isVisible={isSidebarVisible}
        onClose={handleCloseSidebar}
        chatRoomName={chatRoomName}
        members={mockMembers}
        sharedMedia={mockSharedMedia}
        notices={mockNotices}
        onAddMember={handleAddMember}
        onViewAllMedia={handleViewAllMedia}
        onViewNotice={handleViewNotice}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.PRIMARY,
  },

  // 헤더 관련
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  headerIconButton: {
    padding: SPACING.XS,
  },

  // 메시지 목록
  messagesList: {
    flex: 1,
    backgroundColor: BG_COLORS.PRIMARY,
  },
  messagesContent: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.SM,
  },

  // 메시지 컨테이너
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },

  // 프로필 섹션
  profileSection: {
    width: 40,
    marginRight: SPACING.SM,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BG_COLORS.SECONDARY,
  },
  profileImagePlaceholder: {
    width: 32,
    height: 32,
  },

  // 메시지 내용
  messageContentContainer: {
    flex: 1,
    maxWidth: '75%',
  },
  myMessageContentContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContentContainer: {
    alignItems: 'flex-start',
  },

  // 발신자 이름
  senderName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: TEXT_COLORS.SECONDARY,
    marginBottom: SPACING.XS,
  },

  // 메시지 행
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.XS,
  },

  // 메시지 말풍선
  messageBubble: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    maxWidth: '100%',
  },
  myMessageBubble: {
    backgroundColor: COLORS.PRIMARY,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  messageFailedBubble: {
    opacity: 0.7,
    borderColor: COLORS.ERROR || '#FF6B6B',
  },

  // 메시지 텍스트
  messageText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.WHITE,
  },
  otherMessageText: {
    color: TEXT_COLORS.PRIMARY,
  },

  // 메시지 시간
  messageTime: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.DISABLED,
    alignSelf: 'flex-end',
    marginBottom: SPACING.XS,
  },
  messageTimeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 16, // 로딩 스피너와 텍스트 높이 일치
  },
  
  // 내 메시지 시간 컨테이너
  myMessageTimeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  
  // 메시지 전송 실패 상태
  messageStatusFailed: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: COLORS.ERROR || '#FF6B6B',
    marginBottom: 2,
  },

  // 입력 영역
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
    gap: SPACING.SM,
  },
  attachButton: {
    width: INPUT_SIZES.CHAT_ATTACH_BUTTON_SIZE,
    height: INPUT_SIZES.CHAT_ATTACH_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: BG_COLORS.SECONDARY,
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 0,
    minHeight: INPUT_SIZES.CHAT_INPUT_MIN_HEIGHT,
    maxHeight: INPUT_SIZES.CHAT_INPUT_MAX_HEIGHT,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.PRIMARY,
    textAlignVertical: 'center',
    includeFontPadding: false,
    textAlign: 'left',
    paddingVertical: SPACING.XS,
  },
  sendButton: {
    width: INPUT_SIZES.CHAT_SEND_BUTTON_SIZE,
    height: INPUT_SIZES.CHAT_SEND_BUTTON_SIZE,
    borderRadius: INPUT_SIZES.CHAT_SEND_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  sendButtonInactive: {
    backgroundColor: BG_COLORS.SECONDARY,
  },

  // 타이핑 인디케이터
  typingContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    backgroundColor: BG_COLORS.SECONDARY,
  },
  typingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
    fontStyle: 'italic',
  },

  // 실패한 메시지 알림
  failedMessagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: '#FFF3E0', // 연한 주황색 배경
    borderTopWidth: 1,
    borderTopColor: '#FFE0B2',
  },
  failedMessagesText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: '#F57C00', // 주황색 텍스트
    flex: 1,
  },
  retryAllButton: {
    backgroundColor: '#FF9800', // 주황색 버튼
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  retryAllButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: TEXT_COLORS.SECONDARY,
    textAlign: 'center',
  },

  // 더 많은 메시지 로딩 인디케이터
  loadingMoreContainer: {
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: TEXT_COLORS.SECONDARY,
    fontStyle: 'italic',
  },

  // 날짜 구분선
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.LG,
    paddingHorizontal: SPACING.MD,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.GRAY_300,
  },
  dateSeparatorText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: TEXT_COLORS.SECONDARY,
    backgroundColor: BG_COLORS.PRIMARY,
    paddingHorizontal: SPACING.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
