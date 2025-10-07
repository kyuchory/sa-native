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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Components
import CommonHeader from '../components/CommonHeader';
import { SearchIcon, ClearSearchIcon, UserIcon } from '../components/SearchIcons';
import UserAvatar from '../components/UserAvatar';

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
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // 상태 관리
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<FollowUser | null>(null);

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
      Alert.alert('오류', '팔로우 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 필터링 (실시간)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return followingList;
    }

    const query = searchQuery.toLowerCase();
    return followingList.filter(user =>
      user.nickname.toLowerCase().includes(query)
    );
  }, [followingList, searchQuery]);

  // 검색어 지우기
  const clearSearch = () => {
    setSearchQuery('');
  };

  // 사용자 선택 핸들러
  const handleUserSelect = (user: FollowUser) => {
    setSelectedUser(user);
    Alert.alert(
      '채팅방 생성',
      `${user.nickname}님과 1:1 채팅방을 생성하시겠습니까?`,
      [
        { text: '취소', style: 'cancel', onPress: () => setSelectedUser(null) },
        { 
          text: '생성', 
          onPress: () => handleCreateChat(user),
          style: 'default'
        }
      ]
    );
  };

  // 채팅방 생성 핸들러
  const handleCreateChat = async (user: FollowUser) => {
    try {
      setIsLoading(true);
      const response = await ChatService.createPrivateChat(user.id);

      console.log('채팅방 생성 API:', response);

      const { chatRoomId, isNewlyCreated } = response;

      // 기존 채팅방이면 알림 표시, 새 채팅방이면 조용히 이동
      if (!isNewlyCreated) {
        console.log('기존 채팅방으로 이동:', chatRoomId);
      } else {
        console.log('새 채팅방 생성됨:', chatRoomId);
      }

      // 채팅방으로 이동 (네비게이션 스택에서 현재 화면 교체)
      navigation.replace('ChatDetail', {
        chatRoomId: chatRoomId,
        chatRoomName: user.nickname,
        chatPartnerId: user.id,
      });
    } catch (error: any) {
      console.error('채팅방 생성 실패:', error);
      Alert.alert('오류', '채팅방 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
      setSelectedUser(null);
    }
  };

  // 뒤로 가기 핸들러
  const handleBack = () => {
    navigation.goBack();
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

      {/* 선택 표시 */}
      {selectedUser?.id === item.id && (
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
        title="채팅 상대 선택"
        onBackPress={handleBack}
        showBackButton={true}
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
});
