import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Components
import CommonHeader from '../components/CommonHeader';
import { SearchIcon, MenuIcon, PlusCircleIcon, SendIcon } from '../components/ChatDetailIcons';
import { MenuIcon as AddImageIcon, NoticeIcon, CameraIcon } from '../components/CommonIcons';
import ChatDetailSidebar from '../components/ChatDetailSidebar';
import MenuActionSheet from '../components/MenuActionSheet';
import { ImageViewerModal } from '../components/ImageViewerModal';


// Local Components
import MessageList from '../components/MessageList';
import TypingIndicator from '../components/TypingIndicator';

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
import { chatSocketService, sendMessage, startTyping, stopTyping } from '../services/chatSocketService';

// Hooks
import { useAppState } from '../hooks/useAppState';

// Local Hooks
import { useChatMessages } from '../hooks/useChatMessages';
import { useChatSocket } from '../hooks/useChatSocket';

// Utils
import { takePhotoFromCamera, selectPhotoFromGallery, selectVideoFromGallery, uploadChatImage, uploadChatVideo } from '../utils/uploadUtils';

type ChatDetailScreenRouteProp = RouteProp<AuthStackParamList, 'ChatDetail'>;
type ChatDetailScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ChatDetail'>;

export default function ChatDetailScreen() {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const navigation = useNavigation<ChatDetailScreenNavigationProp>();
  const route = useRoute<ChatDetailScreenRouteProp>();

  // Route params
  const { chatRoomId, chatRoomName, chatPartnerId, unreadCount, isVideoEditResult, videoUri: editedVideoUri, trimStart, trimEnd } = route.params;

  // Auth store
  const { user } = useAuthStore();

  // Local state
  const [inputText, setInputText] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);
  const [attachmentActionSheetVisible, setAttachmentActionSheetVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [localChatRoomName, setLocalChatRoomName] = useState(chatRoomName);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [selectedMediaItem, setSelectedMediaItem] = useState<{ type: 'image' | 'video'; url: string; thumbnailUrl?: string } | null>(null);
  const [allMediaItems, setAllMediaItems] = useState<Array<{ type: 'image' | 'video'; url: string; thumbnailUrl?: string }>>([]);
  const [initialMediaIndex, setInitialMediaIndex] = useState(0);


  // Keyboard height for input adjustments
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 읽음 처리 중복 방지 플래그
  const didMarkReadRef = useRef(false);

  // 타이핑 타이머 ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const {
    displayMessages,
    hasMoreMessages,
    isLoadingMessages,
    isInitialLoading,
    loadMoreMessages,
    addPendingMessage,
    removePendingMessage,
    addMessage,
    setIsInitialLoading,
  } = useChatMessages({
    chatRoomId,
    userId: user?.id,
  });

  const { subscriptionStatus, typingUsers, subscribeToChat, unsubscribeFromChat } = useChatSocket({
    chatRoomId,
    userId: user?.id,
    onMessageReceive: useCallback((message: Message) => {
      addMessage(message);
    }, [addMessage]),
    onMessageSent: useCallback((tempId: string, message: Message) => {
      removePendingMessage(tempId);
      addMessage(message);
    }, [removePendingMessage, addMessage]),
    onMessageFailed: useCallback((tempId: string, error: any) => {
      removePendingMessage(tempId);
      Alert.alert('전송 실패', '메시지를 전송할 수 없습니다. 다시 시도해주세요.');
    }, [removePendingMessage]),
    onTypingUpdate: useCallback((_typingUsers: Array<{ user_id: number; nickname: string; timestamp: number }>) => {
      // 타이핑 상태는 useChatSocket에서 관리
    }, []),
  });

  // 타이핑 시작 핸들러
  const startTypingIndicator = useCallback(() => {
    // 소켓으로 타이핑 시작 알림
    startTyping(chatRoomId);

    // 3초 후 자동으로 타이핑 중단
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIndicator();
    }, 3000);
  }, [chatRoomId]);

  // 타이핑 중단 핸들러
  const stopTypingIndicator = useCallback(() => {
    // 소켓으로 타이핑 중단 알림
    stopTyping(chatRoomId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [chatRoomId]);

  // Event handlers
  const handleBack = useCallback(async () => {
    // 읽음 처리 (중복 방지)
    if (!didMarkReadRef.current) {
      didMarkReadRef.current = true;
      try {
        await ChatService.markAsRead(chatRoomId);
        console.log('✅ 뒤로가기 버튼에서 읽음 처리 완료');
      } catch (error) {
        console.error('❌ 뒤로가기 읽음 처리 실패:', error);
      }
    }
    navigation.goBack();
  }, [navigation, chatRoomId]);

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);

    // 타이핑 상태 관리
    if (text.length > 0 && inputText.length === 0) {
      startTypingIndicator();
    } else if (text.length === 0 && inputText.length > 0) {
      stopTypingIndicator();
    }
  }, [inputText, startTypingIndicator, stopTypingIndicator]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !user) return;

    const messageContent = inputText.trim();
    const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 낙관적 메시지 생성
    const optimisticMessage: Message = {
      id: -Date.now() - Math.floor(Math.random() * 1000),
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
      mentions: [],
      mention_user_ids: [],
      tempId: tempMessageId,
      isSending: true
    };

    setInputText('');
    addPendingMessage(optimisticMessage);

    try {
      await sendMessage(tempMessageId, chatRoomId, 'text', messageContent, []);
      stopTypingIndicator();
    } catch (error) {
      removePendingMessage(tempMessageId);
      Alert.alert('전송 실패', '메시지를 전송할 수 없습니다. 다시 시도해주세요.');
    }
  }, [inputText, user, chatRoomId, addPendingMessage, removePendingMessage, sendMessage, stopTypingIndicator]);

  const handleMessageLongPress = useCallback((message: Message) => {
    if (message.sender.id === user?.id) {
      setSelectedMessage(message);
      setMenuActionSheetVisible(true);
    }
  }, [user?.id]);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarVisible(!isSidebarVisible);
  }, [isSidebarVisible]);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarVisible(false);
  }, []);

  const handleAttachmentPress = useCallback(() => {
    setAttachmentActionSheetVisible(true);
  }, []);

  const handleSelectCamera = useCallback(async () => {
    try {
      const asset = await takePhotoFromCamera();
      if (asset && user) {
        await handleSendImageMessage(asset);
      }
    } catch (error) {
      Alert.alert('오류', '사진 촬영에 실패했습니다.');
    }
    setAttachmentActionSheetVisible(false);
  }, [user]);

  const handleSelectGalleryImage = useCallback(async () => {
    try {
      const asset = await selectPhotoFromGallery();
      if (asset && user) {
        await handleSendImageMessage(asset);
      }
    } catch (error) {
      Alert.alert('오류', '사진 선택에 실패했습니다.');
    }
    setAttachmentActionSheetVisible(false);
  }, [user]);

  const handleSelectGalleryVideo = useCallback(async () => {
    try {
      const asset = await selectVideoFromGallery();
      if (asset && user) {
        // VideoTrimCropScreen으로 이동 (trim 전용, 2분 제한)
        navigation.navigate('VideoTrimCrop', {
          videoUri: asset.uri,
          videoDuration: asset.duration ? asset.duration * 1000 : undefined,
          editMode: 'trim',
          maxDuration: 120000, // 2분
          uploadService: 'chat',
          chatRoomId: chatRoomId // 채팅방 ID 전달
        });
      }
    } catch (error) {
      Alert.alert('오류', '비디오 선택에 실패했습니다.');
    }
    setAttachmentActionSheetVisible(false);
  }, [user, navigation]);

  const handleSendImageMessage = useCallback(async (asset: any) => {
    if (!user) return;

    const tempMessageId = `temp_img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const optimisticMessage: Message = {
      id: -Date.now() - Math.floor(Math.random() * 1000),
      chat_room_id: chatRoomId,
      sender_id: user.id,
      content: asset.uri,
      type: 'image' as const,
      sender: {
        id: user.id,
        nickname: user.nickname || '',
        profile_img: user.profile_img || null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mentions: [],
      mention_user_ids: [],
      isSending: true,
      tempId: tempMessageId
    };

    addPendingMessage(optimisticMessage);

    try {
      const uploadResponse = await uploadChatImage(asset.uri);
      await sendMessage(tempMessageId, chatRoomId, 'image', uploadResponse.image_path, []);
    } catch (error) {
      removePendingMessage(tempMessageId);
      Alert.alert('전송 실패', '이미지를 전송할 수 없습니다. 다시 시도해주세요.');
    }
  }, [user, chatRoomId, addPendingMessage, removePendingMessage, uploadChatImage, sendMessage]);

  const handleSendVideoMessage = useCallback(async (asset: any) => {
    if (!user) return;

    const tempMessageId = `temp_video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const optimisticMessage: Message = {
      id: -Date.now() - Math.floor(Math.random() * 1000),
      chat_room_id: chatRoomId,
      sender_id: user.id,
      content: asset.uri,
      type: 'video' as const,
      sender: {
        id: user.id,
        nickname: user.nickname || '',
        profile_img: user.profile_img || null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      mentions: [],
      mention_user_ids: [],
      isSending: true,
      tempId: tempMessageId
    };

    addPendingMessage(optimisticMessage);

    try {
      const uploadResponse = await uploadChatVideo(asset.uri);
      const content = JSON.stringify({
        video_path: uploadResponse.video_path,
        thumbnail_path: uploadResponse.thumbnail_path
      });
      await sendMessage(tempMessageId, chatRoomId, 'video', content, []);
    } catch (error) {
      removePendingMessage(tempMessageId);
      Alert.alert('전송 실패', '비디오를 전송할 수 없습니다. 다시 시도해주세요.');
    }
  }, [user, chatRoomId, addPendingMessage, removePendingMessage, uploadChatVideo, sendMessage]);

  const handleRegisterNotice = useCallback(async () => {
    if (!selectedMessage) return;

    try {
      await ChatService.registerNotice(chatRoomId, {
        content: selectedMessage.content
      });
      Alert.alert('성공', '공지사항이 등록되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '공지사항 등록에 실패했습니다.');
    } finally {
      setSelectedMessage(null);
      setMenuActionSheetVisible(false);
    }
  }, [selectedMessage, chatRoomId]);

  const handleEditChatName = useCallback(() => {
    // ChatDetailSidebar에서 직접 처리하므로 빈 함수
  }, []);

  const handleAddMember = useCallback(async () => {
    // 먼저 사이드바 즉시 닫기
    setIsSidebarVisible(false);

    // 사이드바 애니메이션 완료까지 대기 (50ms + 여유 시간)
    await new Promise(resolve => setTimeout(resolve, 50));

    // 현재 채팅방 멤버들의 ID를 가져와서 제외 리스트 생성
    try {
      const chatRoomDetail = await ChatService.getChatRoomDetail(chatRoomId);
      const excludeUserIds = chatRoomDetail.members.map(member => member.user.id);

      // SelectChatUserScreen으로 이동 (초대 모드)
      navigation.navigate('SelectChatUser', {
        mode: 'invite',
        chatRoomId: chatRoomId,
        excludeUserIds: excludeUserIds,
      });
    } catch (error) {
      console.error('채팅방 멤버 정보 로드 실패:', error);
      Alert.alert('오류', '멤버 정보를 불러오는데 실패했습니다.');
    }
  }, [chatRoomId, navigation]);

  const handleChatNameUpdate = useCallback((newName: string) => {
    // 채팅방 이름이 변경되었을 때 헤더 등에 반영 (낙관적 업데이트)
    setLocalChatRoomName(newName);
    console.log('📝 채팅방 이름 업데이트:', newName);
  }, []);

  // displayMessages에서 모든 미디어 아이템 추출
  const extractAllMediaItems = useCallback((messages: Message[]) => {
    const mediaItems: Array<{ type: 'image' | 'video'; url: string; thumbnailUrl?: string }> = [];

    messages.forEach(message => {
      if (message.type === 'image') {
        mediaItems.push({
          type: 'image',
          url: message.content,
        });
      } else if (message.type === 'video') {
        try {
          const videoData = JSON.parse(message.content);
          mediaItems.push({
            type: 'video',
            url: videoData.video_url || videoData.video_path || '',
            thumbnailUrl: videoData.thumbnail_url || videoData.thumbnail_path || '',
          });
        } catch (error) {
          console.error('비디오 content 파싱 실패:', error);
        }
      }
    });

    return mediaItems;
  }, []);

  const handlePressMedia = useCallback((mediaItem: { type: 'image' | 'video'; url: string; thumbnailUrl?: string }) => {
    const allItems = extractAllMediaItems(displayMessages);
    const initialIndex = allItems.findIndex(item =>
      item.type === mediaItem.type &&
      item.url === mediaItem.url &&
      item.thumbnailUrl === mediaItem.thumbnailUrl
    );

    if (initialIndex !== -1) {
      setAllMediaItems(allItems);
      setInitialMediaIndex(initialIndex);
      setImageViewerVisible(true);
    }
  }, [displayMessages, extractAllMediaItems]);

  const handlePressImage = useCallback((imageUri: string) => {
    handlePressMedia({ type: 'image', url: imageUri });
  }, [handlePressMedia]);

  const handleCloseImageViewer = useCallback(() => {
    setImageViewerVisible(false);
    setSelectedImageUri('');
    setSelectedMediaItem(null);
  }, []);

  const handleViewAllMedia = useCallback(() => {
    // 사이드바 즉시 닫기
    setIsSidebarVisible(false);

    // 사이드바 애니메이션 완료까지 대기
    setTimeout(() => {
      navigation.navigate('ChatRoomMedia', {
        chatRoomId,
        chatRoomName: localChatRoomName,
      });
    }, 50);
  }, [chatRoomId, localChatRoomName, navigation]);

  // Effects
  useEffect(() => {
    // 읽음 처리
    if (!isInitialLoading && unreadCount && unreadCount > 0 && user) {
      ChatService.markAsRead(chatRoomId).catch(error => {
        console.error('읽음 처리 실패:', error);
      });
    }
  }, [isInitialLoading, unreadCount, chatRoomId, user]);

  // 타이핑 타이머 클린업
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // 화면 진입/이탈 처리
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const subscribeIfMounted = async () => {
        if (!isMounted) return;
        try {
          await subscribeToChat();
        } catch (error) {
          console.error('채팅방 구독 실패:', error);
        }
      };

      subscribeIfMounted();

      return () => {
        isMounted = false;
        unsubscribeFromChat();
      };
    }, [subscribeToChat, unsubscribeFromChat])
  );

  // VideoTrimCropScreen 결과 처리
  useEffect(() => {
    if (isVideoEditResult && editedVideoUri && user) {
      console.log('🎬 VideoTrimCrop 결과 처리:', { editedVideoUri, trimStart, trimEnd });

      // 비디오 전송 처리
      handleSendVideoMessage({
        uri: editedVideoUri,
        duration: trimEnd && trimStart ? (trimEnd - trimStart) / 1000 : undefined
      });

      // URL에서 결과 파라미터 제거 (화면 리프레시 방지)
      navigation.setParams({
        isVideoEditResult: undefined,
        videoUri: undefined,
        trimStart: undefined,
        trimEnd: undefined
      });
    }
  }, [isVideoEditResult, editedVideoUri, trimStart, trimEnd, user, handleSendVideoMessage, navigation]);

  // 키보드 이벤트 리스너
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // 백그라운드 복귀 처리
  useAppState({
    onForeground: async () => {
      try {
        setIsInitialLoading(true);
        const response = await ChatService.getMessages(chatRoomId);
        setIsInitialLoading(false);
      } catch (error) {
        setIsInitialLoading(false);
      }
    },
    onBackground: () => {},
    enableSocketReconnection: false
  });

  // 채팅방 나가기 시 읽음 처리 (beforeRemove 이벤트)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
      // 이미 처리했다면 스킵
      if (didMarkReadRef.current) return;

      // 뒤로가기/팝 액션일 때만 처리 (채팅방에서 벗어날 때)
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        didMarkReadRef.current = true;
        try {
          await ChatService.markAsRead(chatRoomId);
          console.log('✅ beforeRemove에서 읽음 처리 완료');
        } catch (error) {
          console.error('❌ beforeRemove 읽음 처리 실패:', error);
        }
      }
    });

    return unsubscribe;
  }, [navigation, chatRoomId]);

  // Header right component
  const renderHeaderRight = useCallback(() => (
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
  ), [colors.GRAY_700, handleToggleSidebar, styles.headerIconButton, styles.headerRightContainer]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* 상단 고정 헤더 */}
        <CommonHeader
          title={localChatRoomName}
          onBackPress={handleBack}
          showBackButton={true}
          rightComponent={renderHeaderRight()}
        />

        {/* 채팅 컨텐츠 영역 */}
        <View style={styles.contentContainer}>
          <MessageList
            messages={displayMessages}
            hasMoreMessages={hasMoreMessages}
            isLoadingMessages={isLoadingMessages}
            isInitialLoading={isInitialLoading}
            onLoadMore={loadMoreMessages}
            onMessageLongPress={handleMessageLongPress}
            onPressImage={handlePressImage}
            onPressMedia={handlePressMedia}
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

          <TypingIndicator typingUsers={typingUsers as Array<{ user_id: number; nickname: string; timestamp: number }>} />

          {/* 메시지 입력 영역 */}
          <View style={[styles.inputContainer]}>
            <TouchableOpacity
              style={styles.attachButton}
              activeOpacity={0.7}
              onPress={handleAttachmentPress}
            >
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

      {/* 첨부파일 액션 시트 */}
      <MenuActionSheet
        visible={attachmentActionSheetVisible}
        onClose={() => setAttachmentActionSheetVisible(false)}
        title="첨부파일"
        actions={[
          {
            id: 'camera',
            title: '사진 촬영',
            icon: <CameraIcon size={24} color={colors.PRIMARY} />,
            color: colors.PRIMARY,
            onPress: handleSelectCamera,
          },
          {
            id: 'gallery_image',
            title: '갤러리에서 이미지 선택',
            icon: <AddImageIcon size={24} color={colors.PRIMARY} />,
            color: colors.PRIMARY,
            onPress: handleSelectGalleryImage,
          },
          {
            id: 'gallery_video',
            title: '갤러리에서 비디오 선택',
            icon: <AddImageIcon size={24} color={colors.PRIMARY} />,
            color: colors.PRIMARY,
            onPress: handleSelectGalleryVideo,
          },
        ]}
      />

      {/* 사이드바 */}
      <ChatDetailSidebar
        isVisible={isSidebarVisible}
        onClose={handleCloseSidebar}
        chatRoomName={chatRoomName}
        chatRoomId={chatRoomId}
        onAddMember={handleAddMember}
        onViewAllMedia={handleViewAllMedia}
        onViewNotice={() => {}}
        onEditChatName={handleEditChatName}
        onChatNameUpdate={handleChatNameUpdate}
        navigation={navigation}
      />

      {/* 미디어 뷰어 모달 */}
      <ImageViewerModal
        visible={imageViewerVisible}
        mediaItems={allMediaItems}
        initialIndex={initialMediaIndex}
        title={localChatRoomName}
        onClose={handleCloseImageViewer}
      />

    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  contentContainer: {
    flex: 1,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  headerIconButton: {
    padding: SPACING.XS,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SM,
    backgroundColor: colors.WHITE,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
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
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 0,
    minHeight: INPUT_SIZES.CHAT_INPUT_MIN_HEIGHT,
    maxHeight: INPUT_SIZES.CHAT_INPUT_MAX_HEIGHT,
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.PRIMARY,
  },
  sendButtonInactive: {
    backgroundColor: colors.GRAY_100,
  },
  subscriptionErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});
