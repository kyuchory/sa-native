import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Components
import CommonHeader from '../components/CommonHeader';
import { SearchIcon, MenuIcon, PlusCircleIcon, SendIcon } from '../components/ChatDetailIcons';
import { MenuIcon as MenuIcon32, CheckIcon } from '../components/CommonIcons';
import { NoticeIcon } from '../components/CommonIcons';
import ChatDetailSidebar from '../components/ChatDetailSidebar';
import MenuActionSheet from '../components/MenuActionSheet';

// Types
import { Message } from '../types/chat';
import { AuthStackParamList } from '../types/navigation';

// Constants
import {
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  INPUT_SIZES,
} from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useSocketStore } from '../stores/socketStore';

// Services
import { ChatService } from '../services/chatService';
import { LocalMessageService } from '../services/localMessageService';
import { ChatRoomDetail, ChatRoomMember, ChatRoomNotice, ChatRoomMedia } from '../types/chat';

// Utils
import { formatMessageTime, isSameDay, formatMessageDate, shouldShowDateSeparator } from '../utils';

type ChatDetailScreenRouteProp = RouteProp<AuthStackParamList, 'ChatDetail'>;
type ChatDetailScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ChatDetail'>;

const { height: screenHeight } = Dimensions.get('window');

export default function ChatDetailScreen() {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const styles = createStyles(colors, insets.bottom, keyboardHeight);

  const navigation = useNavigation<ChatDetailScreenNavigationProp>();
  const route = useRoute<ChatDetailScreenRouteProp>();
  const flatListRef = useRef<FlatList<Message>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Route params
  const { chatRoomId, chatRoomName, chatPartnerId } = route.params;

  // Auth store
  const { user } = useAuthStore();

  // Socket store (WebSocket 연결 상태 확인)
  const socketStore = useSocketStore();

  // Chat store (Zustand)
  const {
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
    initializeChatEvents,
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
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // 채팅방 상세 정보 상태
  const [chatRoomDetail, setChatRoomDetail] = useState<ChatRoomDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // WebSocket 연결 상태 (JSX에서 사용하기 위한 별도 변수)
  const isChatConnected = socketStore.isConnected('/chat');

  // 채팅방 참가 및 초기화
  useEffect(() => {
    const initChatRoom = async () => {
      try {
        if (!user) {
          Alert.alert('오류', '로그인이 필요합니다.');
          navigation.goBack();
          return;
        }

        // WebSocket 연결은 글로벌로 관리되므로, 채팅방 참가만 수행
        joinChatRoom(chatRoomId);

        // 채팅 히스토리 로드
        loadChatHistory();

        // 채팅방 상세 정보 로드 (멤버, 미디어, 공지사항 등)
        loadChatRoomDetail();

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

  // 키보드 이벤트 리스너 (플랫폼별 최적화)
  useEffect(() => {
    let keyboardDidShowListener: any;
    let keyboardDidHideListener: any;

    if (Platform.OS === 'android') {
      keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // 키보드가 올라왔을 때 스크롤을 맨 아래로
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0);
      });
    } else {
      // iOS는 KeyboardAvoidingView가 처리하므로 키보드 높이 추적
      keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0);
      });
    }

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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

  // 채팅방 상세 정보 로드 (멤버, 미디어, 공지사항)
  const loadChatRoomDetail = async () => {
    try {
      setLoadingDetail(true);
      const detail = await ChatService.getChatRoomDetail(chatRoomId);
      setChatRoomDetail(detail);

      console.log('📝 채팅방 상세 정보 로드 완료:', {
        members: detail.members.length,
        notices: detail.latest_notices.length,
        media: detail.chat_room_images_videos.length,
      });
    } catch (error) {
      console.error('채팅방 상세 정보 로드 실패:', error);
      Alert.alert('오류', '채팅방 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // 조건부 렌더링을 위한 computed 값들 - 사이드바에서 직접 타입 처리하여 사용
  const chatRoomData = chatRoomDetail;

  // 뒤로 가기 핸들러
  const handleBack = () => {
    navigation.goBack();
  };

  // 메시지 전송 핸들러 (ChatStore 사용)
  const handleSendMessage = async () => {
    if (!inputText.trim() || !socketStore.isConnected('/chat') || !user) return;

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
    if (!socketStore.isConnected('/chat') || isTyping) return;

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
    if (!socketStore.isConnected('/chat') || !isTyping) return;

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

  // 내가 보낸 메시지 long press 핸들러
  const handleLongPressMessage = (message: Message) => {
    // 자신이 보낸 메시지인 경우에만 메뉴 열기
    if (message.sender.id === user?.id) {
      setSelectedMessage(message);
      setMenuActionSheetVisible(true);
    }
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
                      <ActivityIndicator size="small" color={colors.PRIMARY} />
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
                onLongPress={() => handleLongPressMessage(item)}
                // disabled={item.status !== 'failed'}
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

  // 공지사항 등록 핸들러
  const handleRegisterNotice = async () => {
    if (!selectedMessage) {
      Alert.alert('오류', '선택된 메시지가 없습니다.');
      setMenuActionSheetVisible(false);
      return;
    }

    try {
      const response = await ChatService.registerNotice(chatRoomId, {
        content: selectedMessage.content
      });

      // 성공
      Alert.alert(
        '성공',
        '공지사항이 등록되었습니다.',
        [{ text: '확인' }]
      );

      // 채팅방 상세 정보 새로고침 (공지사항 목록 업데이트)
      await loadChatRoomDetail();

      console.log('공지사항 등록 성공:', response);
    } catch (error: any) {
      // 에러 처리
      console.error('공지사항 등록 실패:', error);

      let errorMessage = '공지사항 등록에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert(
        '오류',
        errorMessage,
        [{ text: '확인' }]
      );
    } finally {
      // 정리
      setSelectedMessage(null);
      setMenuActionSheetVisible(false);
    }
  };

  // 헤더 우측 컴포넌트 (검색, 햄버거 메뉴)
  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
        <SearchIcon size={20} color={colors.GRAY_700} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.headerIconButton}
        activeOpacity={0.7}
        onPress={handleToggleSidebar}
      >
        <MenuIcon size={20} color={colors.GRAY_700} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title={chatRoomName}
        onBackPress={handleBack}
        showBackButton={true}
        rightComponent={renderHeaderRight()}
      />
        
      {/* KeyboardAvoidingView - Android와 iOS 다르게 설정 */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.contentContainer}>
          {/* 채팅 메시지 목록 */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.messagesList}
            contentContainerStyle={[
              styles.messagesContent,
              // Android에서 키보드 높이만큼 bottom padding 추가
              Platform.OS === 'android' && keyboardHeight > 0 && {
                paddingBottom: keyboardHeight + SPACING.MD
              }
            ]}
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
                   isChatConnected ? '메시지를 입력해 대화를 시작해보세요.' :
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
          <View style={[
            styles.inputContainer,
            // 플랫폼별 키보드 대응
            Platform.OS === 'android' && keyboardHeight > 0 && {
              paddingBottom: SPACING.SM
            },
            Platform.OS === 'ios' && keyboardHeight > 0 && {
              paddingBottom: SPACING.SM // iOS에서 키보드 올라올 때 insets 제거
            }
          ]}>
            <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
              <PlusCircleIcon size={24} color={colors.GRAY_700} />
            </TouchableOpacity>

            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={isChatConnected ? "메시지를 입력하세요..." : "연결 중..."}
                placeholderTextColor={colors.GRAY_500}
                value={inputText}
                onChangeText={handleInputChange}
                multiline={true}
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
                editable={isChatConnected}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (inputText.trim() && isChatConnected) ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={handleSendMessage}
              activeOpacity={0.7}
              disabled={!inputText.trim() || !isChatConnected}
            >
              <SendIcon
                size={24}
                color={(inputText.trim() && isChatConnected) ? colors.WHITE : colors.GRAY_500}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 사이드바 - 실제 API 데이터를 사용 */}
      <ChatDetailSidebar
        isVisible={isSidebarVisible}
        onClose={handleCloseSidebar}
        chatRoomName={chatRoomName}
        onAddMember={handleAddMember}
        onViewAllMedia={handleViewAllMedia}
        onViewNotice={handleViewNotice}
        chatRoomDetail={chatRoomDetail}
      />

      {/* 메뉴 액션 시트 */}
      <MenuActionSheet
        visible={menuActionSheetVisible}
        onClose={() => setMenuActionSheetVisible(false)}
        title="채팅"
        actions={[
          {
            id: 'register_notice',
            title: '공지사항 등록',
            icon: <NoticeIcon size={20} color={colors.PRIMARY} />,
            color: colors.PRIMARY,
            onPress: handleRegisterNotice,
          },
        ]}
      />
    </View>
  );
}

const createStyles = (colors: Record<string, string>, bottomInset: number, keyboardHeight: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },

  // KeyboardAvoidingView 스타일
  keyboardAvoidingView: {
    flex: 1,
  },

  // 컨텐츠 컨테이너
  contentContainer: {
    flex: 1,
  },

  // 헤더 관련
  headerRightContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: SPACING.SM,
  },
  headerIconButton: {
    padding: SPACING.XS,
  },

  // 메시지 목록
  messagesList: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  messagesContent: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.SM,
    flexGrow: 1,
  },

  // 메시지 컨테이너
  messageContainer: {
    flexDirection: 'row' as const,
    marginBottom: SPACING.SM,
  },
  myMessageContainer: {
    justifyContent: 'flex-end' as const,
  },
  otherMessageContainer: {
    justifyContent: 'flex-start' as const,
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
    backgroundColor: colors.GRAY_100,
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
    alignItems: 'flex-end' as const,
  },
  otherMessageContentContainer: {
    alignItems: 'flex-start' as const,
  },

  // 발신자 이름
  senderName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
    marginBottom: SPACING.XS,
  },

  // 메시지 행
  messageRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
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
    backgroundColor: colors.PRIMARY,
  },
  otherMessageBubble: {
    backgroundColor: colors.WHITE,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  messageFailedBubble: {
    opacity: 0.7,
    borderColor: colors.ERROR || '#FF6B6B',
  },

  // 메시지 텍스트
  messageText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.WHITE,
  },
  otherMessageText: {
    color: colors.GRAY_900,
  },

  // 메시지 시간
  messageTime: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500,
    alignSelf: 'flex-end',
    marginBottom: SPACING.XS,
  },
  messageTimeContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 16,
  },

  // 내 메시지 시간 컨테이너
  myMessageTimeContainer: {
    alignItems: 'flex-end' as const,
    justifyContent: 'flex-end' as const,
  },

  // 메시지 전송 실패 상태
  messageStatusFailed: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.ERROR || '#FF6B6B',
    marginBottom: 2,
  },

  // 입력 영역
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    // 기본 상태에서는 bottomInset 적용, 키보드 올라올 때는 동적으로 변경
    paddingBottom: keyboardHeight > 0 ? SPACING.SM : bottomInset + SPACING.SM,
    backgroundColor: colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    gap: SPACING.SM,
  },
  attachButton: {
    width: INPUT_SIZES.CHAT_ATTACH_BUTTON_SIZE,
    height: INPUT_SIZES.CHAT_ATTACH_BUTTON_SIZE,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 0,
    minHeight: INPUT_SIZES.CHAT_INPUT_MIN_HEIGHT,
    maxHeight: INPUT_SIZES.CHAT_INPUT_MAX_HEIGHT,
    justifyContent: 'center' as const,
  },
  textInput: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_900,
    textAlignVertical: 'center',
    includeFontPadding: false,
    textAlign: 'left',
    paddingVertical: SPACING.XS,
  },
  sendButton: {
    width: INPUT_SIZES.CHAT_SEND_BUTTON_SIZE,
    height: INPUT_SIZES.CHAT_SEND_BUTTON_SIZE,
    borderRadius: INPUT_SIZES.CHAT_SEND_BUTTON_SIZE / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sendButtonActive: {
    backgroundColor: colors.PRIMARY,
  },
  sendButtonInactive: {
    backgroundColor: colors.GRAY_100,
  },

  // 타이핑 인디케이터
  typingContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    backgroundColor: colors.GRAY_100,
  },
  typingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    fontStyle: 'italic',
  },

  // 실패한 메시지 알림
  failedMessagesContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: '#FFF3E0',
    borderTopWidth: 1,
    borderTopColor: '#FFE0B2',
  },
  failedMessagesText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: '#F57C00',
    flex: 1,
  },
  retryAllButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  retryAllButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700,
    textAlign: 'center',
  },

  // 더 많은 메시지 로딩 인디케이터
  loadingMoreContainer: {
    paddingVertical: SPACING.MD,
    alignItems: 'center' as const,
  },
  loadingMoreText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    fontStyle: 'italic',
  },

  // 날짜 구분선
  dateSeparatorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginVertical: SPACING.LG,
    paddingHorizontal: SPACING.MD,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.GRAY_300,
  },
  dateSeparatorText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_700,
    backgroundColor: colors.GRAY_50,
    paddingHorizontal: SPACING.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
