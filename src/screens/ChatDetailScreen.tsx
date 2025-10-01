import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Components
import CommonHeader from '../components/CommonHeader';
import { SearchIcon, MenuIcon, PlusCircleIcon, SendIcon } from '../components/ChatDetailIcons';
import { MenuIcon as MenuIcon32, CheckIcon } from '../components/CommonIcons';
import { NoticeIcon } from '../components/CommonIcons';
import ChatDetailSidebar from '../components/ChatDetailSidebar';
import MenuActionSheet from '../components/MenuActionSheet';
import UserAvatar from '../components/UserAvatar';

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

// Services
import { ChatService } from '../services/chatService';
import { socketService } from '../services/socketService';
import {
  chatSocketService,
  sendMessage,
  startTyping,
  stopTyping,
  onMessageEvent,
  onTypingEvent
} from '../services/chatSocketService';

// Hooks
import { useAppState } from '../hooks/useAppState';

// Utils
import { formatMessageTime, isSameDay, formatMessageDate, shouldShowDateSeparator } from '../utils';

type ChatDetailScreenRouteProp = RouteProp<AuthStackParamList, 'ChatDetail'>;
type ChatDetailScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ChatDetail'>;

const { height: screenHeight } = Dimensions.get('window');

export default function ChatDetailScreen() {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const navigation = useNavigation<ChatDetailScreenNavigationProp>();
  const route = useRoute<ChatDetailScreenRouteProp>();
  const flatListRef = useRef<FlatList<Message>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Route params
  const { chatRoomId, chatRoomName, chatPartnerId } = route.params;

  // Auth store
  const { user } = useAuthStore();

  // 로컬 상태
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 타이핑 상태
  const [typingUsers, setTypingUsers] = useState<Array<{ user_id: number; nickname: string; timestamp: number }>>([]);

  // 채팅 구독 상태 (chatSocketService에서 관리)
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isSubscribed: boolean;
    error: string | null;
    chatRoomId: number | null;
  }>({
    isSubscribed: false,
    error: null,
    chatRoomId: null
  });




  // 구독 상태 변경 콜백 설정 (chatSocketService에서 관리)
  useEffect(() => {
    const unsubscribe = chatSocketService.onSubscriptionChange((status) => {
      setSubscriptionStatus({
        isSubscribed: status.isSubscribed,
        error: status.error,
        chatRoomId: status.chatRoomId
      });
    });

    return unsubscribe;
  }, []);

  // 메시지 이벤트 리스너 설정
  useEffect(() => {
    const unsubscribeMessage = onMessageEvent((type, data) => {
      if (type === 'receive' && data.chat_room_id === chatRoomId) {
        // 상대방 메시지 수신
        const newMessage: Message = {
          id: data.id,
          chat_room_id: data.chat_room_id,
          sender_id: data.sender_id,
          content: data.content,
          type: data.type,
          sender: data.sender,
          created_at: data.created_at,
          updated_at: data.created_at,
          mentions: data.mentions || [],
          mention_user_ids: data.mentions?.map((m: any) => m.mentionedUserId) || []
        };

        setMessages(prev => {
          // 중복 메시지 방지: 이미 같은 ID의 메시지가 있는지 확인
          const existingMessageIndex = prev.findIndex(msg => msg.id === newMessage.id);
          if (existingMessageIndex >= 0) {
            console.warn(`중복 메시지 감지: ID ${newMessage.id} - 추가하지 않음`);
            return prev; // 중복이면 추가하지 않음
          }
          return [newMessage, ...prev];
        });
      } else if (type === 'failed') {
        // 메시지 전송 실패 처리
        console.error('메시지 전송 실패:', data.error);
        // TODO: 실패한 메시지 UI 업데이트
      }
    });

    return unsubscribeMessage;
  }, [chatRoomId]);

  // 타이핑 이벤트 리스너 설정
  useEffect(() => {
    const unsubscribeTyping = onTypingEvent((data) => {
      if (data.chat_room_id === chatRoomId && data.user_id !== user?.id) {
        // 상대방 타이핑 상태 업데이트
        setTypingUsers(prev => {
          const now = Date.now();
          if (data.is_typing) {
            // 타이핑 시작
            const existingIndex = prev.findIndex(u => u.user_id === data.user_id);
            if (existingIndex >= 0) {
              // 이미 있는 경우 timestamp만 업데이트
              const updated = [...prev];
              updated[existingIndex].timestamp = now;
              return updated;
            } else {
              // 새로 추가
              return [...prev, {
                user_id: data.user_id,
                nickname: data.nickname,
                timestamp: now
              }];
            }
          } else {
            // 타이핑 중단
            return prev.filter(u => u.user_id !== data.user_id);
          }
        });
      }
    });

    return unsubscribeTyping;
  }, [chatRoomId, user?.id]);

  // 타이핑 상태 자동 정리 (3초 후 만료)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => prev.filter(u => now - u.timestamp < 3000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 채팅방 초기화 - API로 메시지 로드
  useEffect(() => {
    const initChatRoom = async () => {
      try {
        if (!user) {
          Alert.alert('오류', '로그인이 필요합니다.');
          navigation.goBack();
          return;
        }

        setIsInitialLoading(true);

        // API로 초기 메시지 로드
        const response = await ChatService.getMessages(chatRoomId);
        setMessages(response.messages);
        setHasMoreMessages(response.hasNext);
        setNextCursor(response.nextCursor);

        setIsInitialLoading(false);
        console.log(`📨 초기 메시지 로드 완료: ${response.messages.length}개`);

      } catch (error) {
        console.error('채팅방 초기화 실패:', error);
        Alert.alert('오류', '채팅방에 접속할 수 없습니다.');
        setIsInitialLoading(false);
      }
    };

    initChatRoom();

    // 타이핑 타이머 클린업
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatRoomId, user?.id, navigation]);

  // 화면 진입/이탈 처리 (useFocusEffect)
  useFocusEffect(
    useCallback(() => {
      console.log('📍 ChatDetailScreen 포커스됨 - 채팅방 구독 시작');
      chatSocketService.subscribeToChat(chatRoomId);

      return () => {
        console.log('📍 ChatDetailScreen 포커스 해제됨 - 채팅방 구독 해제');
        chatSocketService.unsubscribeFromChat(chatRoomId);
      };
    }, [chatRoomId])
  );

  // 백그라운드 복귀 처리
  useAppState({
    onForeground: async () => {
      console.log('🚀 앱 포그라운드 복귀 (ChatDetailScreen) - 채팅 구독 복원 및 메시지 동기화');

      // 소켓 연결이 완료될 때까지 기다렸다가 구독 복원 및 메시지 동기화
      const restoreSubscriptionAndSyncMessages = async () => {
        if (socketService.isConnected && chatRoomId) {
          console.log('🔄 포그라운드 복귀 - 채팅 구독 복원 및 메시지 동기화 시작');

          // 1. 먼저 구독 복원
          await chatSocketService.subscribeToChat(chatRoomId);

          // 2. 백그라운드에 있는 동안 도착한 메시지들을 동기화 (전체 재로드)
          try {
            console.log('📥 포그라운드 복귀 - 백그라운드 메시지 동기화 시작');
            setIsInitialLoading(true);

            const response = await ChatService.getMessages(chatRoomId);
            setMessages(response.messages);
            setHasMoreMessages(response.hasNext);
            setNextCursor(response.nextCursor);

            setIsInitialLoading(false);
            console.log(`📥 백그라운드 메시지 동기화 완료: ${response.messages.length}개 메시지 로드`);
          } catch (error) {
            console.error('백그라운드 메시지 동기화 실패:', error);
            setIsInitialLoading(false);
            // 동기화 실패해도 구독은 유지됨
          }
        } else if (!socketService.isConnected) {
          console.log('⏳ 포그라운드 복귀 - 소켓 연결 대기 중, 500ms 후 재시도');
          // 소켓 연결이 아직 안 되었으면 500ms 후 재시도
          setTimeout(restoreSubscriptionAndSyncMessages, 500);
        }
      };

      // 즉시 실행 (연결되어 있으면 바로 진행)
      restoreSubscriptionAndSyncMessages();
    },
    onBackground: () => {
      console.log('😴 앱 백그라운드 진입 (ChatDetailScreen) - 채팅 구독 해제');
      // 백그라운드 진입 시 구독 해제
      if (chatRoomId) {
        chatSocketService.unsubscribeFromChat(chatRoomId);
      }
    },
    enableSocketReconnection: false
  });

  // TODO: 컴포넌트 마운트 시 스크롤을 맨 아래로 (새로 구현 예정)
  // useEffect(() => {
  //   if (messages.length > 0) {
  //     setTimeout(() => {
  //       flatListRef.current?.scrollToEnd({ animated: false });
  //     }, 100);
  //   }
  // }, [messages.length]);


  // 더 많은 메시지 로드 (무한 스크롤)
  const loadMoreMessages = async () => {
    if (!hasMoreMessages || !nextCursor || isLoadingMessages) return;

    try {
      setIsLoadingMessages(true);
      console.log('📨 이전 메시지 로드 시작...');

      const response = await ChatService.getMessages(chatRoomId, nextCursor);

      // 기존 메시지에 이전 메시지 추가
      setMessages(prevMessages => [...prevMessages, ...response.messages]);
      setHasMoreMessages(response.hasNext);
      setNextCursor(response.nextCursor);
      setIsLoadingMessages(false);

      console.log(`📨 이전 메시지 로드 완료: ${response.messages.length}개`);
    } catch (error) {
      console.error('더 많은 메시지 로드 실패:', error);
      setIsLoadingMessages(false);
      Alert.alert('오류', '이전 메시지를 불러오는데 실패했습니다.');
    }
  };



  // 뒤로 가기 핸들러
  const handleBack = () => {
    navigation.goBack();
  };

  // 메시지 전송 핸들러 - 실시간 소켓 전송
  const handleSendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const messageContent = inputText.trim();
    const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // 고유 임시 ID 생성

    // @멘션 파싱
    const mentionRegex = /@(\w+)/g;
    const mentionUserIds: number[] = [];
    let match;

    while ((match = mentionRegex.exec(messageContent)) !== null) {
      console.log('멘션 감지:', match[1]);
      // TODO: 실제 멘션 유저 ID로 변환하는 로직 추가 필요
    }

    // 낙관적 UI: 임시 메시지 생성
    const optimisticMessage: Message = {
      id: -Date.now() - Math.floor(Math.random() * 1000), // 음수 ID로 임시 표시
      chat_room_id: chatRoomId,
      sender_id: user.id,
      content: messageContent,
      type: 'text' as const,
      sender: {
        id: user.id,
        nickname: user.nickname || '',
        profile_img: user.profile_img || null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mentions: [], // 빈 멘션 배열
      mention_user_ids: mentionUserIds,
    };

    // 입력창 즉시 초기화
    setInputText('');

    // 낙관적 업데이트: 메시지 목록에 메시지 추가 (inverted이므로 맨 앞에 추가)
    setMessages(prevMessages => [optimisticMessage, ...prevMessages]);

    // 스크롤 맨 아래로 즉시 이동 (inverted이므로 맨 위로)
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 50);

    // 실제 소켓으로 메시지 전송
    sendMessage(tempMessageId, chatRoomId, 'text', messageContent, mentionUserIds);

    // 타이핑 중단 (메시지 전송했으므로)
    stopTyping(chatRoomId);
  };

  // 타이핑 시작 핸들러
  const handleTypingStart = () => {
    // 소켓으로 타이핑 시작 알림
    startTyping(chatRoomId);

    // 3초 후 자동으로 타이핑 중단
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  // 타이핑 중단 핸들러
  const handleTypingStop = () => {
    // 소켓으로 타이핑 중단 알림
    stopTyping(chatRoomId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // 입력 텍스트 변경 핸들러 - 타이핑 로직 포함
  const handleInputChange = (text: string) => {
    const hadText = inputText.length > 0;
    const hasText = text.length > 0;

    setInputText(text);

    // 타이핑 상태 관리
    if (!hadText && hasText) {
      // 텍스트 입력 시작
      handleTypingStart();
    } else if (hadText && !hasText) {
      // 텍스트 모두 삭제
      handleTypingStop();
    }
    // 텍스트가 있을 때는 타이핑 상태 유지 (타이머가 알아서 처리)
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
    // inverted에서는 다음 메시지(화면상 아래쪽)를 확인해서 날짜 구분선 표시
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const isContinuous = isContinuousMessage(item, nextMessage);
    // 날짜 구분자 표시 (inverted에서는 다음 메시지와 비교)
    const showDateSeparator = shouldShowDateSeparator(
      item.created_at,
      nextMessage?.created_at || null
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
                <UserAvatar 
                  profileImg={item.sender.profile_img} 
                  nickname={item.sender.nickname}
                  size={32}
                />
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
                  <View style={styles.messageTimeContainer}>
                    <Text style={styles.messageTime}>
                      {formatMessageTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              )}
              
              {/* 메시지 말풍선 */}
              <TouchableOpacity
                style={[
                  styles.messageBubble,
                  isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
                ]}
                onLongPress={() => handleLongPressMessage(item)}
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

      // 공지사항 등록 후 사이드바 새로고침 (사이드바에서 직접 데이터 로드)

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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
            showsVerticalScrollIndicator={false}
            inverted
            onContentSizeChange={() => {
              // inverted 속성으로 인해 자동으로 최신 메시지 위치로 스크롤됨
            }}
            // 무한 스크롤: 스크롤을 아래로 내리면 과거 메시지 로드
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
            // 로딩 인디케이터 제거 - 깔끔한 UX를 위해
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isInitialLoading ? '메시지를 불러오는 중...' :
                   '메시지를 입력해 대화를 시작해보세요.'}
                </Text>
              </View>
            )}
            // inverted에서는 maintainVisibleContentPosition 불필요
          />

          {/* 구독 상태 표시 */}
          {subscriptionStatus.error && (
            <View style={styles.subscriptionErrorContainer}>
              <Text style={styles.subscriptionErrorText}>
                {subscriptionStatus.error}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => chatSocketService.subscribeToChat(chatRoomId)}
                disabled={chatSocketService.subscriptionStatus.isSubscribing}
              >
                <Text style={styles.retryButtonText}>
                  {chatSocketService.subscriptionStatus.isSubscribing ? '구독중...' : '재시도'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 타이핑 인디케이터 */}
          {typingUsers.length > 0 && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>
                {typingUsers.map(u => u.nickname).join(', ')}님이 입력 중...
              </Text>
            </View>
          )}


          {/* 메시지 입력 영역 */}
          <View style={[
            styles.inputContainer
          ]}>
            <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
              <PlusCircleIcon size={24} color={colors.GRAY_700} />
            </TouchableOpacity>

            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="메시지를 입력하세요..."
                placeholderTextColor={colors.GRAY_500}
                value={inputText}
                onChangeText={handleInputChange}
                multiline={true}
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
                editable={true}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={handleSendMessage}
              activeOpacity={0.7}
              disabled={!inputText.trim()}
            >
              <SendIcon
                size={24}
                color={inputText.trim() ? colors.WHITE : colors.GRAY_500}
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
        chatRoomId={chatRoomId}
        onAddMember={handleAddMember}
        onViewAllMedia={handleViewAllMedia}
        onViewNotice={handleViewNotice}
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
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
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
    paddingHorizontal: SPACING.MD,
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
    marginRight: SPACING.XS,
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


  // 입력 영역
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
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

  // 구독 상태 에러 표시
  subscriptionErrorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: colors.GRAY_100,
    borderTopWidth: 1,
    borderTopColor: colors.ERROR,
  },
  subscriptionErrorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.ERROR,
    marginRight: SPACING.SM,
  },
  retryButton: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    backgroundColor: colors.ERROR,
    borderRadius: BORDER_RADIUS.SM,
  },
  retryButtonText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
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
