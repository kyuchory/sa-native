import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { AuthStackParamList } from '../types/navigation';
import { ChatRoom } from '../types/chat';

// Components
import ChatHeader from '../components/ChatHeader';
import ChatRoomItem from '../components/ChatRoomItem';
import ChatScreenEmptyState from '../components/ChatScreenEmptyState';
import ChatScreenLoading from '../components/ChatScreenLoading';
import ChatEditActionBar from '../components/ChatEditActionBar';
import MenuActionSheet from '../components/MenuActionSheet';
import { CheckIcon, MuteIcon, DeleteIcon, CheckboxEmptyIcon, CheckboxFilledIcon } from '../components/ChatActionIcons';

// Services
import { ChatService } from '../services/chatService';
import { chatScreenSocketService, onChatSummaryMessage, onChatRoomUpdated, onChatRoomCreated } from '../services/chatScreenSocketService';

// Hooks
import { useAppState } from '../hooks/useAppState';

type ChatScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Chat'>;

export default function ChatScreen() {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  
  // TODO: 소켓 관련 코드는 새로 구현할 예정
  
  // 로컬 상태 관리
  const [allChatRooms, setAllChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<number>>(new Set());

  // 컴포넌트 마운트 시 채팅방 데이터 로드
  useEffect(() => {
    const initializeChatScreen = async () => {
      // WebSocket 연결은 글로벌로 관리됨, 채팅 이벤트 리스너 등록은 AuthNavigator에서 처리

      // 채팅방 목록 로드
      loadChatRooms();
    };

    initializeChatScreen();
  }, []);



  // 요약 메시지 이벤트 리스너 설정 - 실시간 채팅 목록 업데이트
  useEffect(() => {
    const unsubscribeSummaryMessage = onChatSummaryMessage((data) => {
      const { chat_room_id, last_message } = data;

      setAllChatRooms(prevRooms => {
        // 업데이트할 방 찾기
        const targetRoomIndex = prevRooms.findIndex(room => room.id === chat_room_id);

        if (targetRoomIndex === -1) {
          console.warn(`⚠️ 요약 메시지 대상 채팅방을 찾을 수 없음: ${chat_room_id}`);
          return prevRooms;
        }

        const targetRoom = prevRooms[targetRoomIndex];

        // 나머지 방들 (업데이트할 방 제외)
        const otherRooms = prevRooms.filter(room => room.id !== chat_room_id);

        // 업데이트된 방을 맨 위로 이동
        const updatedRoom = {
          ...targetRoom,
          lastMessage: {
            id: last_message.id,
            content: last_message.content,
            type: last_message.type,
            sender_id: last_message.sender_id,
            created_at: last_message.created_at,
          },
          unread_count: (targetRoom.unread_count || 0) + 1 // TODO: 현재 보고 있는 채팅방일 때는 증가하지 않도록 수정
        };

        return [updatedRoom, ...otherRooms];
      });

      console.log(`📨 ChatScreen 요약 메시지 처리 + 재정렬: 채팅방 ${chat_room_id} → 맨 위 이동 - ${last_message.sender_nickname}`);
    });

    return unsubscribeSummaryMessage;
  }, []);

  // 채팅방 업데이트 이벤트 리스너 설정 - 사라진 채팅방 재등장 처리
  useEffect(() => {
    const unsubscribeRoomUpdated = onChatRoomUpdated((data) => {
      const { event, room_info, reason } = data;

      setAllChatRooms(prevRooms => {
        const existingRoomIndex = prevRooms.findIndex(room => room.id === room_info.id);

        if (existingRoomIndex === -1) {
          // 목록에 없는 채팅방 -> 맨 위에 추가
          const newRooms = [room_info, ...prevRooms];
          console.log(`🆕 채팅방 추가 (${reason}): ${room_info.name || room_info.other_user?.nickname} - ID: ${room_info.id}`);
          return newRooms;
        } else {
          // 이미 있는 채팅방 -> 정보 업데이트 (읽음 처리 등으로 방 정보가 변경될 수 있음)
          const updatedRooms = [...prevRooms];
          updatedRooms[existingRoomIndex] = room_info;
          console.log(`🔄 채팅방 업데이트 (${reason}): ${room_info.name || room_info.other_user?.nickname} - ID: ${room_info.id}`);
          return updatedRooms;
        }
      });

      console.log(`📪 ChatScreen 채팅방 업데이트 처리 (${reason}): ${room_info.name || room_info.other_user?.nickname}`);
    });

    return unsubscribeRoomUpdated;
  }, []);

  // 채팅방 생성 이벤트 리스너 설정 - 새 채팅방 또는 초대된 채팅방 처리
  useEffect(() => {
    const unsubscribeRoomCreated = onChatRoomCreated((data) => {
      const { event, room_info } = data;

      setAllChatRooms(prevRooms => {
        const existingRoomIndex = prevRooms.findIndex(room => room.id === room_info.id);

        if (existingRoomIndex === -1) {
          // 목록에 없는 채팅방 -> 맨 위에 추가
          const newRooms = [room_info, ...prevRooms];
          console.log(`🎉 채팅방 생성: ${room_info.name || room_info.other_user?.nickname} - ID: ${room_info.id}`);
          return newRooms;
        } else {
          // 이미 있는 채팅방 -> 무시 (중복 방지)
          console.log(`⚠️ 이미 존재하는 채팅방 생성 이벤트 무시: ${room_info.name || room_info.other_user?.nickname} - ID: ${room_info.id}`);
          return prevRooms;
        }
      });

      console.log(`📬 ChatScreen 채팅방 생성 처리: ${room_info.name || room_info.other_user?.nickname}`);
    });

    return unsubscribeRoomCreated;
  }, []);

  // 화면 진입/이탈 시 채팅 목록 구독 관리 (ChatDetailScreen과 동일한 패턴)
  useFocusEffect(
    useCallback(() => {
      console.log('📍 ChatScreen 포커스됨 - 채팅 목록 요약 메시지 수신 활성화');

      // 요약 메시지 수신 활성화 (chatScreenSocketService에서 관리)
      chatScreenSocketService.subscribeToChatList();

      return () => {
        console.log('📍 ChatScreen 포커스 해제됨 - 채팅 목록 요약 메시지 수신 비활성화');
        chatScreenSocketService.unsubscribeFromChatList();
      };
    }, [])
  );

  // 백그라운드↔포그라운드 시 구독 복원 (ChatDetailScreen과 동일한 패턴)
  useAppState({
    onForeground: async () => {
      console.log('🚀 ChatScreen 앱 포그라운드 - 채팅 목록 리프레시');

      // 채팅 목록 다시 로드 (최신 상태 반영)
      await loadChatRooms();

      // 요약 메시지 수신 활성화
      chatScreenSocketService.subscribeToChatList();
    },
    onBackground: () => {
      console.log('😴 ChatScreen 앱 백그라운드');
      // 백그라운드에서는 요약 메시지 수신 비활성화
      chatScreenSocketService.unsubscribeFromChatList();
    },
    enableSocketReconnection: true
  });

  // 채팅방 목록 로드 (API 호출)
  const loadChatRooms = async () => {
    try {
      setIsLoading(true);
      const loadedChatRooms = await ChatService.getChatRooms();
      
      // 로컬 상태와 ChatStore 모두 업데이트
      setAllChatRooms(loadedChatRooms);
      // TODO: ChatStore 업데이트 (새로 구현 예정)
      // setChatRooms(loadedChatRooms);
      
      console.log('📋 채팅방 목록 로드 완료:', loadedChatRooms.length, '개');
    } catch (error: any) {
      console.error('채팅방 목록 로드 실패:', error);
      Alert.alert('오류', error.message || '채팅방 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 채팅방 생성 핸들러
  const handleCreateChat = () => {
    navigation.navigate('SelectChatUser');
  };

  // 채팅방 선택 핸들러
  const handleChatRoomPress = (chatRoom: ChatRoom) => {
    const chatRoomName = getChatDisplayName(chatRoom);
    const chatPartnerId = chatRoom.type === 'private' ? chatRoom.other_user?.id : undefined;
    
    navigation.navigate('ChatDetail', {
      chatRoomId: chatRoom.id,
      chatRoomName,
      chatPartnerId,
    });
  };

  // 채팅방 길게 누르기 핸들러
  const handleChatRoomLongPress = (chatRoom: ChatRoom) => {
    setSelectedChatRoom(chatRoom);
    setActionSheetVisible(true);
  };

  // 채팅방 삭제 (나가기)
  const handleDeleteChat = async () => {
    if (!selectedChatRoom) return;
    
    Alert.alert(
      '채팅방 나가기',
      `"${getChatDisplayName(selectedChatRoom)}" 채팅방을 나가시겠습니까?\n나간 후에는 이전 메시지를 볼 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('선택된 채팅방 아이디:', selectedChatRoom.id);
              await ChatService.leaveChatRoom(selectedChatRoom.id);
              // 성공 시 로컬 상태에서 제거
              setAllChatRooms(prev => prev.filter(room => room.id !== selectedChatRoom.id));
              console.log('선택된 채팅방 나가기 성공');
              Alert.alert('성공', '채팅방을 나갔습니다.');
            } catch (error: any) {
              console.error('채팅방 나가기 실패:', error);
              Alert.alert('오류', error.message || '채팅방 나가기에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  // 채팅방 읽음 처리
  const handleMarkAsRead = async () => {
    if (!selectedChatRoom) return;

    // 지역 변수로 저장 (액션 시트 닫기 전에)
    const currentSelectedChatRoom = selectedChatRoom;

    try {
      // 먼저 액션 시트 닫기 (리렌더링 방지)
      setActionSheetVisible(false);
      setSelectedChatRoom(null);

      // API 호출로 읽음 처리
      await ChatService.markAsRead(currentSelectedChatRoom.id);

      // 로컬 상태 업데이트 (unread_count를 0으로)
      setAllChatRooms(prev =>
        prev.map(room =>
          room.id === currentSelectedChatRoom.id
            ? { ...room, unread_count: 0 }
            : room
        )
      );

      console.log('읽음 처리 성공:', currentSelectedChatRoom.id);
    } catch (error: any) {
      console.error('읽음 처리 실패:', error);

      // 에러 시 액션 시트를 다시 열어서 사용자에게 알리기
      setActionSheetVisible(true);
      setSelectedChatRoom(currentSelectedChatRoom); // 다시 선택된 채팅방으로 설정

      Alert.alert('오류', error.message || '읽음 처리에 실패했습니다.');
    }
  };

  // 채팅방 음소거
  const handleMuteChat = () => {
    if (!selectedChatRoom) return;

    Alert.alert(
      '알림 끄기',
      `"${getChatDisplayName(selectedChatRoom)}" 채팅방의 알림을 끄시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '알림 끄기',
          onPress: () => {
            console.log('알림 끄기:', selectedChatRoom.id);
            // TODO: API 호출 및 상태 업데이트
          }
        }
      ]
    );
  };

  // 채팅방 표시 이름 가져오기
  const getChatDisplayName = (chatRoom: ChatRoom) => {
    if (chatRoom.type === 'private') {
      // 1:1 채팅의 경우 - other_user 정보 활용
      return chatRoom.other_user?.nickname || '1:1 채팅';
    } else {
      // 그룹 채팅의 경우
      return chatRoom.name || '그룹 채팅';
    }
  };



  // 편집 모드 토글
  const handleEditModeToggle = () => {
    setIsEditMode(prev => !prev);
    setSelectedChatIds(new Set()); // 편집 모드 변경 시 선택 초기화
  };

  // 채팅방 선택/해제
  const handleChatSelect = (chatId: number) => {
    setSelectedChatIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedChatIds.size === allChatRooms.length) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(allChatRooms.map(room => room.id)));
    }
  };

  // 선택된 채팅방 삭제 (나가기)
  const handleBulkDelete = async () => {
    if (selectedChatIds.size === 0) return;

    Alert.alert(
      '채팅방 나가기',
      `선택한 ${selectedChatIds.size}개의 채팅방을 나가시겠습니까?\n나간 후에는 이전 메시지를 볼 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            try {
              const chatRoomIds = Array.from(selectedChatIds);
              
              // 병렬로 모든 채팅방 나가기 처리
              const deletePromises = chatRoomIds.map(id => ChatService.leaveChatRoom(id));
              await Promise.all(deletePromises);
              
              // 성공 시 로컬 상태에서 제거
              setAllChatRooms(prev => prev.filter(room => !selectedChatIds.has(room.id)));
              setSelectedChatIds(new Set());
              setIsEditMode(false);
              
              Alert.alert('성공', `${chatRoomIds.length}개 채팅방을 나갔습니다.`);
            } catch (error: any) {
              console.error('다중 채팅방 나가기 실패:', error);
              Alert.alert('오류', error.message || '일부 채팅방 나가기에 실패했습니다.');
            }
          }
        }
      ]
    );
  };





  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 헤더 */}
      <ChatHeader onCreateChat={handleCreateChat} />

      {/* 편집 버튼 */}
      <View style={styles.editButtonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditModeToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.editButtonText}>
            {isEditMode ? '완료' : '편집'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 채팅방 목록 */}
      {isLoading ? (
        <ChatScreenLoading />
      ) : (
        <FlatList
          data={allChatRooms}
          renderItem={({ item }) => (
            <ChatRoomItem
              chatRoom={item}
              isEditMode={isEditMode}
              isSelected={selectedChatIds.has(item.id)}
              onPress={() => {
                if (isEditMode) {
                  handleChatSelect(item.id);
                } else {
                  handleChatRoomPress(item);
                }
              }}
              onLongPress={() => {
                if (!isEditMode) {
                  handleChatRoomLongPress(item);
                }
              }}
              onSelect={handleChatSelect}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatListContent}

          ListEmptyComponent={<ChatScreenEmptyState />}
          refreshing={isLoading}
          onRefresh={loadChatRooms}
        />
      )}

      {/* 메뉴 액션 시트 */}
      <MenuActionSheet
        visible={actionSheetVisible}
        onClose={() => {
          setActionSheetVisible(false);
          setSelectedChatRoom(null);
        }}
        title={selectedChatRoom ? getChatDisplayName(selectedChatRoom) : undefined}
        actions={[
          {
            id: 'read',
            title: '읽음으로 표시',
            icon: <CheckIcon size={20} color={colors.PRIMARY} />,
            color: colors.PRIMARY,
            onPress: handleMarkAsRead,
          },
          {
            id: 'mute',
            title: '알림 끄기',
            icon: <MuteIcon size={20} color={colors.GRAY_700} />,
            color: colors.GRAY_700,
            onPress: handleMuteChat,
          },
          {
            id: 'delete',
            title: '채팅방 삭제',
            icon: <DeleteIcon size={20} color={colors.ERROR} />,
            color: colors.ERROR,
            onPress: handleDeleteChat,
          },
        ]}
      />

      {/* 편집 모드 하단 액션 바 */}
      {isEditMode && (
        <ChatEditActionBar
          selectedCount={selectedChatIds.size}
          totalCount={allChatRooms.length}
          onSelectAll={handleSelectAll}
          onDelete={handleBulkDelete}
        />
      )}
    </SafeAreaView>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50, // BG_COLORS.PRIMARY
  },

 // 채팅 목록 관련
  chatList: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  chatListContent: {
    padding: SPACING.MD,
  },

  // 편집 버튼
  editButtonContainer: {
    backgroundColor: colors.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
    alignItems: 'flex-end',
  },
  editButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.PRIMARY,
  },

  // 편집 모드 채팅방 아이템
  chatRoomItemEditMode: {
    paddingLeft: SPACING.SM, // 체크박스 공간 확보
  },
  chatRoomItemSelected: {
    backgroundColor: colors.GRAY_50,
  },
  checkboxContainer: {
    marginRight: SPACING.SM,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 하단 액션 바
  bottomActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: colors.GRAY_200,
    ...SHADOWS.SMALL,
  },
  selectAllButton: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  selectAllText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.PRIMARY,
  },
  actionBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  selectedCountText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ERROR,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    gap: SPACING.XS,
  },
  deleteButtonDisabled: {
    backgroundColor: colors.GRAY_300,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
  deleteButtonTextDisabled: {
    color: colors.GRAY_400,
  },
});
