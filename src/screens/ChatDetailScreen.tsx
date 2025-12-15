import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { openSettings } from 'react-native-permissions';
import CustomAlertModal from '../components/CustomAlertModal';
// Components
import CommonHeader from '../components/CommonHeader';
import { SearchIcon, MenuIcon, PlusCircleIcon, SendIcon, GalleryImageIcon, GalleryVideoIcon } from '../components/ChatDetailIcons';
import { MenuIcon as AddImageIcon, NoticeIcon } from '../components/CommonIcons';
import ChatDetailSidebar from '../components/ChatDetailSidebar';
import MenuActionSheet from '../components/MenuActionSheet';
import { ImageViewerModal } from '../components/ImageViewerModal';

// NOTE: 채팅에서는 throttle 불필요 - 버튼 disabled로 충분한 중복 방지 효과


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

import { uploadChatImage, uploadChatVideo } from '../utils/uploadUtils';

type ChatDetailScreenRouteProp = RouteProp<AuthStackParamList, 'ChatDetail'>;
type ChatDetailScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ChatDetail'>;

export default function ChatDetailScreen() {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const navigation = useNavigation<ChatDetailScreenNavigationProp>();
  const route = useRoute<ChatDetailScreenRouteProp>();
  const insets = useSafeAreaInsets();

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


  // Alert modal state
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // Keyboard height for input adjustments
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 읽음 처리 중복 방지 플래그
  const didMarkReadRef = useRef(false);

  // 타이핑 타이머 ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 이전 입력값 ref (타이핑 상태 비교용)
  const prevInputTextRef = useRef<string>('');

  // ✅ 최적화: 전송 버튼 활성화 상태 캐싱 (매 렌더마다 trim() 호출 방지)
  const isSendButtonEnabled = useMemo(
    () => inputText.trim().length > 0,
    [inputText]
  );

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
      setAlertModal({ visible: true, title: '전송 실패', message: '메시지를 전송할 수 없습니다. 다시 시도해주세요.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
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
      } catch (error) {
        console.error('❌ 뒤로가기 읽음 처리 실패:', error);
      }
    }
    navigation.goBack();
  }, [navigation, chatRoomId]);

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);

    // ✅ 최적화: 이전 입력값과 비교하여 타이핑 상태 관리
    const prevText = prevInputTextRef.current;
    if (text.length > 0 && prevText.length === 0) {
      startTypingIndicator();
    } else if (text.length === 0 && prevText.length > 0) {
      stopTypingIndicator();
    }

    // 이전 값 업데이트
    prevInputTextRef.current = text;
  }, [startTypingIndicator, stopTypingIndicator]);

  // ✅ 최적화 4: 메시지 전송 로직 분리 (throttle 불필요 - disabled로 충분)
  const sendMessageLogic = useCallback(async () => {
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
      setAlertModal({ visible: true, title: '전송 실패', message: '메시지를 전송할 수 없습니다. 다시 시도해주세요.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
    }
  }, [inputText, user, chatRoomId, addPendingMessage, removePendingMessage, sendMessage, stopTypingIndicator]);

  // 메시지 전송 핸들러 (disabled 버튼으로 중복 전송 방지 충분)
  const handleSendMessage = useCallback(async () => {
    if (!isSendButtonEnabled) return; // 버튼이 disabled되어 있어도 보험 적용
    await sendMessageLogic();
  }, [sendMessageLogic, isSendButtonEnabled]);

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



  const handleSelectGalleryImage = useCallback(async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
      setAlertModal({
          visible: true,
          title: '권한 필요',
          message: '갤러리 접근 권한이 필요합니다. 설정에서 허용해주세요.',
          buttons: [{ text: '설정', onPress: () => openSettings() },{ text: '확인', onPress: () => setAlertModal(null) }]
        });
        setAttachmentActionSheetVisible(false);
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        allowsEditing: false, // 채팅에서는 편집 없이 바로 선택
        quality: 0.8, // 적절한 품질로 압축
        exif: false,
      });

      if (!result.canceled && result.assets.length > 0 && user) {
        const selectedImage = result.assets[0];
        await handleSendImageMessage(selectedImage);
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '이미지 선택에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
    setAttachmentActionSheetVisible(false);
  }, [user]);

  const handleSelectGalleryVideo = useCallback(async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertModal({
          visible: true,
          title: '권한 필요',
          message: '갤러리 접근 권한이 필요합니다. 설정에서 허용해주세요.',
          buttons: [
            { text: '설정', onPress: () => openSettings() },
            { text: '확인', onPress: () => setAlertModal(null) }
          ]
        });
        setAttachmentActionSheetVisible(false);
        return;
      }

      // 비디오 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: false,
        allowsEditing: false, // 채팅에서는 편집 없이 바로 선택
        quality: 0.8, // 적절한 품질로 압축
        exif: false,
      });

      if (!result.canceled && result.assets.length > 0 && user) {
        const selectedVideo = result.assets[0];

        // 3분(180초) 초과 비디오 확인
        if (selectedVideo.duration && selectedVideo.duration > 180 * 1000) {
          setAlertModal({
            visible: true,
            title: '비디오 길이 제한',
            message: '3분 이하의 비디오만 채팅에서 전송할 수 있습니다.',
            buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
          });
          setAttachmentActionSheetVisible(false);
          return; // API 요청 방지
        }

        // 바로 비디오 전송 (편집없이)
        await handleSendVideoMessage(selectedVideo);
      }
    } catch (error) {
      console.error('비디오 선택 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '비디오 선택에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
    setAttachmentActionSheetVisible(false);
  }, [user]);

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
      setAlertModal({ visible: true, title: '전송 실패', message: '이미지를 전송할 수 없습니다. 다시 시도해주세요.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
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
      setAlertModal({ visible: true, title: '전송 실패', message: '비디오를 전송할 수 없습니다. 다시 시도해주세요.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
    }
  }, [user, chatRoomId, addPendingMessage, removePendingMessage, uploadChatVideo, sendMessage]);

  const handleRegisterNotice = useCallback(async () => {
    if (!selectedMessage) return;

    try {
      await ChatService.registerNotice(chatRoomId, {
        content: selectedMessage.content
      });
      setAlertModal({ visible: true, title: '성공', message: '공지사항이 등록되었습니다.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
    } catch (error: any) {
      setAlertModal({ visible: true, title: '오류', message: error.response?.data?.message || '공지사항 등록에 실패했습니다.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
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
      setAlertModal({ visible: true, title: '오류', message: '멤버 정보를 불러오는데 실패했습니다.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
    }
  }, [chatRoomId, navigation]);

  const handleChatNameUpdate = useCallback((newName: string) => {
    // 채팅방 이름이 변경되었을 때 헤더 등에 반영 (낙관적 업데이트)
    setLocalChatRoomName(newName);

    // 성공 알림 표시
    setAlertModal({ visible: true, title: '성공', message: '채팅방 이름이 성공적으로 수정되었습니다.', buttons: [{ text: '확인', onPress: () => setAlertModal(null) }] });
  }, []);

  // ✅ 최적화 3: 미디어 리스트를 캐싱하여 재계산 방지
  const allMediaItemsCache = useMemo(() => {
    const mediaItems: Array<{ type: 'image' | 'video'; url: string; thumbnailUrl?: string }> = [];

    displayMessages.forEach(message => {
      if (message.type === 'image') {
        mediaItems.push({
          type: 'image',
          url: message.content,
        });
      } else if (message.type === 'video') {
        // ✅ 수정: 낙관적 메시지의 파일 URI와 실제 메시지의 JSON을 구분하여 처리
        try {
          // content가 JSON 형태인지 확인 (실제 메시지)
          if (message.content && message.content.startsWith('{')) {
            const videoData = JSON.parse(message.content);
            mediaItems.push({
              type: 'video',
              url: videoData.video_url || videoData.video_path || '',
              thumbnailUrl: videoData.thumbnail_url || videoData.thumbnail_path || '',
            });
          } else if (message.isSending) {
            // 낙관적 메시지 (전송 중)인 경우 미디어 캐싱에서 제외
          } else {
            // 기타 경우 (알 수 없는 포맷)
            console.warn('⚠️ 알 수 없는 비디오 content 포맷:', message.content);
          }
        } catch (error) {
          console.error('비디오 content 파싱 실패:', error, 'content:', message.content);
        }
      }
    });

    return mediaItems;
  }, [displayMessages]);

  const handlePressMedia = useCallback((mediaItem: { type: 'image' | 'video'; url: string; thumbnailUrl?: string }) => {
    const initialIndex = allMediaItemsCache.findIndex(item =>
      item.type === mediaItem.type &&
      item.url === mediaItem.url &&
      item.thumbnailUrl === mediaItem.thumbnailUrl
    );

    if (initialIndex !== -1) {
      setAllMediaItems(allMediaItemsCache);
      setInitialMediaIndex(initialIndex);
      setImageViewerVisible(true);
    }
  }, [allMediaItemsCache]);

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

  // 프로필 이미지 터치 핸들러
  const handleProfilePress = useCallback((senderId: number) => {
    navigation.navigate('UserProfile', { userId: senderId.toString() });
  }, [navigation]);

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
      <View style={{ flex: 1 }}>
        {/* 상단 고정 헤더 */}
        <CommonHeader
          title={localChatRoomName}
          onBackPress={handleBack}
          showBackButton={true}
          rightComponent={renderHeaderRight()}
        />

        {/* 스크롤 가능한 채팅 컨텐츠 */}
        <View style={styles.contentContainer}>
          {/* 과거 메시지 로드 중 표시 (헤더 바로 아래) */}
          {isLoadingMessages && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                오래된 메시지를 불러오고 있습니다...
              </Text>
            </View>
          )}

          <MessageList
            messages={displayMessages}
            hasMoreMessages={hasMoreMessages}
            isLoadingMessages={isLoadingMessages}
            isInitialLoading={isInitialLoading}
            onLoadMore={loadMoreMessages}
            onMessageLongPress={handleMessageLongPress}
            onPressImage={handlePressImage}
            onPressMedia={handlePressMedia}
            onProfilePress={handleProfilePress}
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
        </View>

        {/* 채팅 입력창 */}
        <View style={[
          styles.chatInputWrapper,
          {
            marginBottom: Platform.OS === 'ios'
              ? Math.max(0, keyboardHeight - insets.bottom)
              : keyboardHeight
          }
        ]}>
          {/* 실제 입력 컨테이너 */}
          <View style={styles.chatInputContainer}>
            <TouchableOpacity
              style={styles.chatIconButton}
              activeOpacity={0.7}
              onPress={handleAttachmentPress}
            >
              <PlusCircleIcon size={24} color={colors.GRAY_700} />
            </TouchableOpacity>

            <TextInput
              style={styles.chatTextInput}
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
              // ✅ 최적화: 불필요한 리렌더 방지
              selectTextOnFocus={false}
              autoCorrect={false}
              spellCheck={false}
            />

            <TouchableOpacity
              style={[
                styles.chatSendButton,
                isSendButtonEnabled ? styles.chatSendButtonActive : styles.chatSendButtonInactive
              ]}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              onPress={handleSendMessage}
              activeOpacity={0.7}
              disabled={!isSendButtonEnabled}
            >
              <SendIcon
                size={24}
                color={isSendButtonEnabled ? colors.PRIMARY : colors.GRAY_400}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
            id: 'gallery_image',
            title: '갤러리에서 이미지 선택',
            icon: <GalleryImageIcon size={24} color={colors.GRAY_700} />,
            color: colors.GRAY_700,
            onPress: handleSelectGalleryImage,
          },
          {
            id: 'gallery_video',
            title: '갤러리에서 비디오 선택',
            icon: <GalleryVideoIcon size={24} color={colors.GRAY_700} />,
            color: colors.GRAY_700,
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

      {/* Alert modal */}
      {alertModal && (
        <CustomAlertModal
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          buttons={alertModal.buttons}
          onClose={() => setAlertModal(null)}
        />
      )}

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
  loadingContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    alignItems: 'center',
    backgroundColor: colors.GRAY_50,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  headerIconButton: {
    padding: SPACING.XS,
  },
  chatInputWrapper: {
    backgroundColor: colors.GRAY_50,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.XL,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    minHeight: 44,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  chatIconButton: {
    padding: SPACING.XS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTextInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    maxHeight: 100,
    minHeight: 24,
  },
  chatSendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.XS,
  },
  chatSendButtonActive: {
    backgroundColor: 'transparent',
  },
  chatSendButtonInactive: {
    backgroundColor: 'transparent',
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
