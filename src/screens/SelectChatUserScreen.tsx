// 채팅 상대 선택 화면

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Components
import CommonHeader from '../components/CommonHeader';
import { SearchIcon, ClearSearchIcon, UserIcon } from '../components/SearchIcons';
import UserAvatar from '../components/UserAvatar';
import { PlusCircleIcon } from '../components/ChatDetailIcons';
import GroupChatNameInputModal from '../components/GroupChatNameInputModal';
import CustomAlertModal from '../components/CustomAlertModal';

// Services
import { FollowService } from '../services/followService';
import { ChatService } from '../services/chatService';

// Types
import { FollowUser } from '../types/follow';
import { AuthStackParamList } from '../types/navigation';

// Constants
import {
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

type SelectChatUserScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'SelectChatUser'>;

export default function SelectChatUserScreen() {
  const navigation = useNavigation<SelectChatUserScreenNavigationProp>();
  const route = useRoute<RouteProp<AuthStackParamList, 'SelectChatUser'>>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // Route params
  const { mode = 'create', chatRoomId, excludeUserIds = [] } = route.params || {};

  // 상태 관리
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<FollowUser>>(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // 선택된 사용자 리스트 (메모이제이션)
  const selectedUserList = useMemo(() =>
    Array.from(selectedUsers),
    [selectedUsers]
  );

  // 컴포넌트 마운트 시 팔로우 목록 로드
  useEffect(() => {
    loadFollowingList();
  }, []);

  // 팔로우 목록 로드 (새로운 API 사용)
  const loadFollowingList = async () => {
    try {
      setIsLoading(true);
      // 편의 함수 사용으로 사용자 배열만 추출
      const following = await FollowService.getFollowingUsers({ limit: 50 });
      setFollowingList(following);
    } catch (error: any) {
      console.error('팔로우 목록 로드 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '팔로우 목록을 불러오는데 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 필터링 및 제외 사용자 필터링 (실시간)
  const filteredUsers = useMemo(() => {
    let filtered = followingList;

    // 제외할 사용자 필터링
    if (excludeUserIds.length > 0) {
      filtered = filtered.filter(user => !excludeUserIds.includes(user.id));
    }

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.nickname.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [followingList, searchQuery, excludeUserIds]);

  // 검색어 지우기
  const clearSearch = () => {
    setSearchQuery('');
  };

  // 사용자 선택/해제 핸들러 (다중 선택)
  const handleUserSelect = (user: FollowUser) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      const newIdsSet = new Set(selectedUserIds);

      if (selectedUserIds.has(user.id)) {
        // 선택 해제
        newSet.delete(user);
        newIdsSet.delete(user.id);
      } else {
        // 선택 추가
        newSet.add(user);
        newIdsSet.add(user.id);
      }

      setSelectedUserIds(newIdsSet);
      return newSet;
    });
  };

  // 선택 완료 핸들러 (모드에 따라 다른 동작)
  const handleCreateChatWithSelected = async () => {
    if (selectedUserList.length === 0) return;

    if (mode === 'invite') {
      // 초대 모드
      await inviteUsersToChatRoom(selectedUserList);
    } else {
      // 생성 모드
      if (selectedUserList.length === 1) {
        // 1:1 채팅
        const user = selectedUserList[0];
        setAlertModal({
          visible: true,
          title: '채팅방 생성',
          message: `${user.nickname}님과 1:1 채팅방을 생성하시겠습니까?`,
          buttons: [
            { text: '취소', style: 'cancel', onPress: () => setAlertModal(null) },
            {
              text: '생성',
              onPress: () => createPrivateChat(user),
              style: 'default'
            }
          ]
        });
      } else {
        // 그룹 채팅 모달 표시
        setShowGroupChatModal(true);
      }
    }
  };

  // 그룹 채팅방 생성
  const createGroupChat = async (name: string, users: FollowUser[]) => {
    try {
      setIsLoading(true);
      const memberIds = users.map(user => user.id);
      const response = await ChatService.createGroupChat(name, memberIds);

      const { chatRoomId } = response;

      // 항상 새로운 채팅방이므로 바로 이동

      // 채팅방으로 이동 (네비게이션 스택에서 현재 화면 교체)
      navigation.replace('ChatDetail', {
        chatRoomId: chatRoomId,
        chatRoomName: name,
        chatPartnerId: undefined, // 그룹 채팅이므로 partnerId 없음
      });
    } catch (error: any) {
      console.error('그룹 채팅방 생성 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '그룹 채팅방 생성에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 1:1 채팅방 생성
  const createPrivateChat = async (user: FollowUser) => {
    try {
      setIsLoading(true);
      const response = await ChatService.createPrivateChat(user.id);

      const { chatRoomId, isNewlyCreated } = response;

      // 기존 채팅방이면 알림 표시, 새 채팅방이면 조용히 이동

      // 채팅방으로 이동 (네비게이션 스택에서 현재 화면 교체)
      navigation.replace('ChatDetail', {
        chatRoomId: chatRoomId,
        chatRoomName: user.nickname,
        chatPartnerId: user.id,
      });
    } catch (error: any) {
      console.error('채팅방 생성 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '채팅방 생성에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 뒤로 가기 핸들러
  const handleBack = () => {
    navigation.goBack();
  };

  // 그룹 채팅 모달 닫기
  const handleGroupChatModalClose = () => {
    setShowGroupChatModal(false);
  };

  // 그룹 채팅 모달에서 생성
  const handleGroupChatModalSubmit = async (chatRoomName: string) => {
    setShowGroupChatModal(false);
    await createGroupChat(chatRoomName, selectedUserList);
  };

  // 채팅방에 사용자 초대
  const inviteUsersToChatRoom = async (users: FollowUser[]) => {
    if (!chatRoomId) return;

    try {
      setIsLoading(true);

      // 선택된 사용자들을 순차적으로 초대
      const invitePromises = users.map(user =>
        ChatService.inviteUser(chatRoomId, user.id)
      );

      await Promise.all(invitePromises);

      setAlertModal({
        visible: true,
        title: '성공',
        message: `${users.length}명의 사용자를 채팅방에 초대했습니다.`,
        buttons: [{ text: '확인', onPress: () => { setAlertModal(null); navigation.goBack(); } }]
      });
    } catch (error: any) {
      console.error('사용자 초대 실패:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '사용자 초대에 실패했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setIsLoading(false);
    }
  };


  // 사용자 아이템 렌더링
  const renderUserItem = ({ item }: { item: FollowUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
      activeOpacity={0.7}
    >
      {/* 프로필 이미지 */}
      <View style={styles.profileContainer}>
        <UserAvatar
          profileImg={item.profile_img}
          nickname={item.nickname}
          size={40}
        />
      </View>

      {/* 사용자 정보 */}
      <View style={styles.userInfo}>
        <Text style={styles.nickname} numberOfLines={1}>
          {item.nickname}
        </Text>
        <Text style={styles.followerCount}>
          팔로우 중 · {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* 선택 표시 (다중 선택) */}
      {selectedUserIds.has(item.id) && (
        <View style={styles.selectedIndicator}>
          <View style={styles.selectedDot} />
        </View>
      )}
    </TouchableOpacity>
  );

  // 빈 상태 렌더링
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <UserIcon size={64} color={colors.GRAY_400} />
      <Text style={styles.emptyTitle}>
        {searchQuery ? '검색 결과가 없습니다' : '팔로우 목록이 없습니다'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchQuery
          ? '다른 검색어를 시도해보세요'
          : '다른 사용자를 팔로우하고 채팅을 시작해보세요'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title={mode === 'invite' ? '멤버 초대' : '채팅 상대 선택'}
        onBackPress={handleBack}
        showBackButton={true}
        rightComponent={
          selectedUserList.length > 0 ? (
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateChatWithSelected}
              activeOpacity={0.7}
            >
              <PlusCircleIcon size={18} color={colors.PRIMARY} />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={20} color={colors.GRAY_500} />
          <TextInput
            style={styles.searchInput}
            placeholder="팔로우 목록에서 검색"
            placeholderTextColor={colors.GRAY_400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <ClearSearchIcon size={20} color={colors.GRAY_500} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 팔로우 목록 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>팔로우 목록을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.userList}
          contentContainerStyle={styles.userListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* 그룹 채팅 이름 입력 모달 */}
      <GroupChatNameInputModal
        visible={showGroupChatModal}
        onClose={handleGroupChatModalClose}
        onSubmit={handleGroupChatModalSubmit}
        selectedUsersCount={selectedUserList.length}
        firstUserName={selectedUserList.length > 0 ? selectedUserList[0].nickname : ''}
      />

      {/* Custom Alert Modal */}
      {alertModal && (
        <CustomAlertModal
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          buttons={alertModal.buttons}
          onClose={() => setAlertModal(null)}
        />
      )}
    </View>
  );
}

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },

  // 검색바
  searchContainer: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    marginLeft: SPACING.SM,
    paddingVertical: 0,
  },
  clearButton: {
    padding: SPACING.XS,
  },

  // 사용자 목록
  userList: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  userListContent: {
    padding: SPACING.MD,
  },
  separator: {
    height: 1,
    backgroundColor: colors.GRAY_200,
    marginLeft: 72, // 프로필 이미지 + 여백
  },

  // 사용자 아이템
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.SM,
  },
  profileContainer: {
    marginRight: SPACING.MD,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.XS,
  },
  followerCount: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
  },

  // 선택 표시
  selectedIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.PRIMARY,
  },

  // 빈 상태
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptyDescription: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
    textAlign: 'center',
    lineHeight: 20,
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
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  // 채팅 생성 버튼 (헤더에 사용)
  createButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: colors.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
});
