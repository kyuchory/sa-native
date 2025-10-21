import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { BlockService } from '../services/blockService';
import { BlockedUser } from '../types/block';
import { formatMessageDate } from '../utils/timeUtils';
import CommonHeader from '../components/CommonHeader';
import UserAvatar from '../components/UserAvatar';

export default function BlockedUsersScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();

  // 상태 관리
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // 차단된 사용자 목록 가져오기
  const fetchBlockedUsers = async () => {
    if (!hasMore) return;

    try {
      const isLoadingMore = page > 1;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await BlockService.getBlockedUsers(page, 20);

      if (isLoadingMore) {
        setUsers(prev => [...prev, ...response.blocked_users]);
      } else {
        setUsers(response.blocked_users);
      }

      setHasMore(response.has_more);
      setError(null);
    } catch (err) {
      console.error('차단 사용자 목록 조회 실패:', err);
      setError('차단 사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchBlockedUsers();
  }, [page]);

  // 더 많은 데이터 로드
  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      setPage(prev => prev + 1);
    }
  };

  // 차단 해제 핸들러
  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      '차단 해제',
      `${user.nickname}님의 차단을 해제하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '해제',
          style: 'destructive',
          onPress: async () => {
            try {
              // 차단 해제 API 호출
              await BlockService.unblockUser(user.id);
              
              // 목록에서 해당 사용자 제거
              setUsers(prev => prev.filter(u => u.id !== user.id));
              
              // 성공 메시지 표시
              Alert.alert('차단 해제 완료', `${user.nickname}님이 차단 해제 되었습니다.`);
            } catch (error) {
              console.error('차단 해제 실패:', error);
              const errorMessage = error instanceof Error ? error.message : '차단 해제에 실패했습니다.';
              Alert.alert('오류', errorMessage);
            }
          },
        },
      ],
    );
  };

  // 사용자 아이템 렌더링
  const renderUserItem = ({ item }: { item: BlockedUser }) => (
    <View style={[styles.userItem, { backgroundColor: colors.WHITE }]}>
      <View style={styles.userInfo}>
        <UserAvatar
          profileImg={item.profile_img}
          nickname={item.nickname}
          size={40}
        />
        <View style={styles.userDetails}>
          <Text style={[styles.nickname, { color: colors.GRAY_900 }]}>
            {item.nickname}
          </Text>
          <Text style={[styles.blockedAt, { color: colors.GRAY_500 }]}>
            {formatMessageDate(item.blocked_at)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.unblockButton, { borderColor: colors.GRAY_300 }]}
        onPress={() => handleUnblock(item)}
      >
        <Text style={[styles.unblockText, { color: colors.GRAY_700 }]}>
          해제
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 빈 상태 렌더링
  const renderEmpty = () => {
    if (loading && users.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.GRAY_500} />
          <Text style={[styles.loadingText, { color: colors.GRAY_500 }]}>
            불러오는 중...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.GRAY_500 }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.GRAY_200 }]}
            onPress={() => {
              setPage(1);
              setUsers([]);
              setError(null);
              fetchBlockedUsers();
            }}
          >
            <Text style={[styles.retryText, { color: colors.GRAY_700 }]}>
              다시 시도
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyText, { color: colors.GRAY_500 }]}>
          차단한 사용자가 없습니다.
        </Text>
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <CommonHeader title="차단 목록" />
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.GRAY_500} />
              <Text style={[styles.footerText, { color: colors.GRAY_500 }]}>
                더 불러오는 중...
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={users.length === 0 ? styles.flatListEmpty : undefined}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.XS,
    borderRadius: SPACING.SM,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginBottom: 2,
  },
  blockedAt: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
  },
  unblockButton: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderWidth: 1,
    borderRadius: SPACING.XS,
    backgroundColor: colors.WHITE,
  },
  unblockText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  loadingText: {
    marginTop: SPACING.SM,
    fontSize: TYPOGRAPHY.SIZE.MD,
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    marginBottom: SPACING.MD,
  },
  retryButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: SPACING.SM,
  },
  retryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
  },
  flatListEmpty: {
    flex: 1,
  },
  footerLoader: {
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  footerText: {
    marginTop: SPACING.XS,
    fontSize: TYPOGRAPHY.SIZE.SM,
  },
});
