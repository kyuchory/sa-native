import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { AuthStackParamList } from '../types/navigation';
import { ChatRoom, ChatType } from '../types/chat';

// Components
import ChatHeader from '../components/ChatHeader';
import ChatRoomItem from '../components/ChatRoomItem';
import ChatScreenTab from '../components/ChatScreenTab';
import ChatScreenEmptyState from '../components/ChatScreenEmptyState';
import ChatScreenLoading from '../components/ChatScreenLoading';
import ChatEditActionBar from '../components/ChatEditActionBar';
import ChatActionSheet from '../components/ChatActionSheet';
import { CheckIcon, MuteIcon, DeleteIcon, CheckboxEmptyIcon, CheckboxFilledIcon } from '../components/ChatActionIcons';

// Services
import { ChatService } from '../services/chatService';

// Stores
import { useChatStore } from '../stores/chatStore';
import { useSocketStore } from '../stores/socketStore';

type ChatScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Chat'>;

export default function ChatScreen() {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  
  // Socket store (WebSocket 연결 관리)
  const { connect: connectSocket } = useSocketStore();

  // Chat store (채팅 관련 상태 관리)
  const { initializeChatEvents, setChatRooms, chatRooms } = useChatStore();
  
  // 로컬 상태 관리
  const [selectedTab, setSelectedTab] = useState<ChatType>('private');
  const [allChatRooms, setAllChatRooms] = useState<ChatRoom[]>([]);
  const [filteredChatRooms, setFilteredChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<number>>(new Set());

  // 컴포넌트 마운트 시 채팅 이벤트 초기화 및 채팅방 데이터 로드
  useEffect(() => {
    const initializeChatScreen = async () => {
      // 1. 채팅 이벤트 초기화 (WebSocket 연결 자동 포함)
      await initializeChatEvents();

      // 2. 채팅방 목록 로드
      loadChatRooms();
    };

    initializeChatScreen();

    // 클린업: 화면을 완전히 벗어날 때만 WebSocket 해제
    return () => {
      // ChatDetailScreen에서도 사용하므로 여기서는 연결 해제하지 않음
      // useSocketStore.getState().disconnect('/chat');
    };
  }, []);

  // 탭 변경 시 필터링
  useEffect(() => {
    filterChatRooms();
  }, [selectedTab, allChatRooms]);

  // ChatStore의 chatRooms 변경 감지 (실시간 업데이트)
  useEffect(() => {
    if (chatRooms.length > 0) {
      setAllChatRooms(chatRooms);
    }
  }, [chatRooms]);

  // 채팅방 목록 로드 (API 호출)
  const loadChatRooms = async () => {
    try {
      setIsLoading(true);
      const loadedChatRooms = await ChatService.getChatRooms();
      
      // 로컬 상태와 ChatStore 모두 업데이트
      setAllChatRooms(loadedChatRooms);
      setChatRooms(loadedChatRooms);
      
      console.log('📋 채팅방 목록 로드 완료:', loadedChatRooms.length, '개');
    } catch (error: any) {
      console.error('채팅방 목록 로드 실패:', error);
      Alert.alert('오류', error.message || '채팅방 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 채팅방 필터링 (탭에 따라)
  const filterChatRooms = () => {
    const filtered = allChatRooms.filter(room => room.type === selectedTab);
    setFilteredChatRooms(filtered);
  };

  // 채팅방 생성 핸들러
  const handleCreateChat = () => {
    if (selectedTab === 'private') {
      navigation.navigate('SelectChatUser');
    } else {
      Alert.alert(
        '그룹 채팅방 생성',
        '그룹 채팅방 생성 기능은 준비 중입니다.',
        [{ text: '확인' }]
      );
    }
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
  const handleMarkAsRead = () => {
    if (!selectedChatRoom) return;
    
        setAllChatRooms(prev => 
      prev.map(room => 
        room.id === selectedChatRoom.id
          ? { ...room, unread_count: 0 }
          : room
      )
    );
    console.log('읽음 처리:', selectedChatRoom.id);
    // TODO: API 호출
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
    if (selectedChatIds.size === filteredChatRooms.length) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(filteredChatRooms.map(room => room.id)));
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
      // 1:1 채팅의 경우 - other_user 정보 활용
      if (chatRoom.other_user?.avatar_url) {
        return (
          <Image 
            source={{ uri: chatRoom.other_user.avatar_url }} 
            style={styles.profileImage}
          />
        );
      }
      
      // other_user 닉네임의 첫 글자 사용
      const firstChar = chatRoom.other_user?.nickname?.charAt(0).toUpperCase() || '?';
      return (
        <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
          <Text style={styles.profileImageText}>
            {firstChar}
          </Text>
        </View>
      );
    } else {
      // 그룹 채팅의 경우 그룹 프로필 이미지
      if (chatRoom.avatar_url) {
        return (
          <Image 
            source={{ uri: chatRoom.avatar_url }} 
            style={styles.profileImage}
          />
        );
      }
      return (
        <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
          <Text style={styles.profileImageText}>
            {chatRoom.name?.charAt(0).toUpperCase() || 'G'}
          </Text>
        </View>
      );
    }
  };

  // 채팅방 아이템 렌더링
  const renderChatRoomItem = ({ item }: { item: ChatRoom }) => {
    const displayName = getChatDisplayName(item);
    const isSelected = selectedChatIds.has(item.id);

    const handlePress = () => {
      if (isEditMode) {
        handleChatSelect(item.id);
      } else {
        handleChatRoomPress(item);
      }
    };

    const handleLongPress = () => {
      if (!isEditMode) {
        handleChatRoomLongPress(item);
      }
    };

    return (
      <TouchableOpacity 
        style={[
          styles.chatRoomItem,
          isEditMode && styles.chatRoomItemEditMode,
          isSelected && styles.chatRoomItemSelected
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        delayLongPress={500}
      >
        {/* 체크박스 (편집 모드일 때만) */}
        {isEditMode && (
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => handleChatSelect(item.id)}
            activeOpacity={0.7}
          >
            {isSelected ? (
              <CheckboxFilledIcon size={20} color={colors.PRIMARY} />
            ) : (
              <CheckboxEmptyIcon size={20} color={colors.GRAY_400} />
            )}
          </TouchableOpacity>
        )}

        {/* 프로필 이미지 */}
        <View style={styles.profileContainer}>
          {renderProfileImage(item)}
        </View>

        {/* 채팅방 정보 */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.timeText}>
              {item.lastMessage ? formatTime(item.lastMessage.created_at) : ''}
            </Text>
          </View>
          
          <View style={styles.chatFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage ? (
                // 그룹 채팅의 경우 발신자 이름 포함 (sender_id로 other_users에서 찾기)
                item.type === 'group' && item.other_users ? (
                  (() => {
                    const sender = item.other_users.find(user => user.id === item.lastMessage!.sender_id);
                    return sender ? `${sender.nickname}: ${item.lastMessage.content}` : item.lastMessage.content;
                  })()
                ) : item.lastMessage.content
              ) : (
                // lastMessage가 null일 때
                item.type === 'private' ? '채팅을 시작해 보세요!' : '메시지가 없습니다.'
              )}
            </Text>
            {item.unread_count && item.unread_count > 0 && !isEditMode && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unread_count > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 탭 렌더링
  const renderTabButton = (tabType: ChatType, label: string) => {
    const isSelected = selectedTab === tabType;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isSelected && styles.tabButtonActive]}
        onPress={() => setSelectedTab(tabType)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <ChatHeader onCreateChat={handleCreateChat} />

      {/* 탭 버튼 */}
      <ChatScreenTab
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />

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
          data={filteredChatRooms}
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<ChatScreenEmptyState selectedTab={selectedTab} />}
          refreshing={isLoading}
          onRefresh={loadChatRooms}
        />
      )}

      {/* 채팅 액션 시트 */}
      <ChatActionSheet
        visible={actionSheetVisible}
        onClose={() => {
          setActionSheetVisible(false);
          setSelectedChatRoom(null);
        }}
        chatName={selectedChatRoom ? getChatDisplayName(selectedChatRoom) : undefined}
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
          totalCount={filteredChatRooms.length}
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

  // 로딩
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 탭 관련
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.PRIMARY,
  },
  tabText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
  },
  tabTextActive: {
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },

  // 채팅 목록 관련
  chatList: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  chatListContent: {
    padding: SPACING.MD,
  },
  separator: {
    height: 1,
    backgroundColor: colors.GRAY_200,
    marginLeft: 72, // 프로필 이미지 + 여백 너비만큼
  },

  // 채팅방 아이템 관련
  chatRoomItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  profileContainer: {
    marginRight: SPACING.MD,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileImagePlaceholder: {
    backgroundColor: colors.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },

  // 채팅 정보 관련
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  chatName: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
    marginRight: SPACING.SM,
  },
  timeText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
    marginRight: SPACING.SM,
  },

  // 읽지 않은 메시지 배지
  unreadBadge: {
    backgroundColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS.ROUND,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XS,
  },
  unreadText: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
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
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
    textAlign: 'center',
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
