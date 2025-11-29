import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { FollowService } from '../services/followService';
import { FollowRequest } from '../types/follow';
import CommonHeader from '../components/CommonHeader';
import UserAvatar from '../components/UserAvatar';
import { handleApiError } from '../services/apiClient';
import CustomAlertModal from '../components/CustomAlertModal';

export default function FollowRequestsScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  // 상태 관리
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom Alert Modal 상태
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // 팔로우 요청 목록 가져오기
  const fetchFollowRequests = async () => {
    if (!hasMore && cursor !== null) return;

    try {
      const isLoadingMore = cursor !== null;
      if (isLoadingMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await FollowService.getFollowRequests({ cursor: cursor || undefined });

      if (isLoadingMore) {
        setRequests(prev => [...prev, ...response.requests]);
      } else {
        setRequests(response.requests);
      }

      setCursor(response.next_cursor);
      setHasMore(response.has_more);
      setError(null);
    } catch (err) {
      console.error('팔로우 요청 목록 조회 실패:', err);
      setError('팔로우 요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchFollowRequests();
  }, []);

  // 더 많은 데이터 로드
  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      fetchFollowRequests();
    }
  };

  // 요청 수락 핸들러
  const handleAccept = async (request: FollowRequest) => {
    try {
      await FollowService.acceptFollowRequest(request.id);

      // 목록에서 제거
      setRequests(prev => prev.filter(r => r.id !== request.id));

      setAlertModal({
        visible: true,
        title: '수락 완료',
        message: `${request.requester.nickname}님의 팔로우 요청을 수락했습니다.`,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } catch (error) {
      console.error('팔로우 요청 수락 실패:', error);
      const errorMessage = handleApiError(error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: errorMessage,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
  };

  // 요청 거절 핸들러
  const handleReject = async (request: FollowRequest) => {
    try {
      await FollowService.rejectFollowRequest(request.id);

      // 목록에서 제거
      setRequests(prev => prev.filter(r => r.id !== request.id));

      setAlertModal({
        visible: true,
        title: '거절 완료',
        message: `${request.requester.nickname}님의 팔로우 요청을 거절했습니다.`,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } catch (error) {
      console.error('팔로우 요청 거절 실패:', error);
      const errorMessage = handleApiError(error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: errorMessage,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
  };

  // 사용자 아이템 렌더링
  const renderRequestItem = ({ item }: { item: FollowRequest }) => (
    <View style={[styles.requestItem, { backgroundColor: colors.WHITE }]}>
      <UserAvatar
        profileImg={item.requester.profile_img}
        nickname={item.requester.nickname}
        size={50}
      />
      <View style={styles.userDetails}>
        <Text style={[styles.nickname, { color: colors.GRAY_900 }]}>
          {item.requester.nickname}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: colors.PRIMARY }]}
          onPress={() => handleAccept(item)}
        >
          <Text style={[styles.buttonText, { color: colors.WHITE }]}>
            수락
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectButton, { borderColor: colors.GRAY_300 }]}
          onPress={() => handleReject(item)}
        >
          <Text style={[styles.buttonText, { color: colors.GRAY_700 }]}>
            거절
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 빈 상태 렌더링
  const renderEmpty = () => {
    if (loading && requests.length === 0) {
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
              setCursor(null);
              setRequests([]);
              setError(null);
              fetchFollowRequests();
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
          팔로우 요청이 없습니다.
        </Text>
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <CommonHeader title="팔로우 요청 목록" />
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
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
        contentContainerStyle={requests.length === 0 ? styles.flatListEmpty : undefined}
        showsVerticalScrollIndicator={false}
        style={{ marginBottom: insets.bottom }}
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

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    marginHorizontal: SPACING.SM,
    marginVertical: SPACING.XS,
    borderRadius: SPACING.SM,
  },
  userDetails: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  nickname: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  acceptButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: SPACING.SM,
  },
  rejectButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: SPACING.SM,
    borderWidth: 1,
  },
  buttonText: {
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
