import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
} from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import useProfileStore from '../stores/profileStore';
import { AuthStackParamList } from '../types/navigation';
import { ShortItem, RecordShortViewRequest } from '../types/cut';
import { CutService } from '../services/cutService';
import CutCommentActionSheet from '../components/CutCommentActionSheet';
import { ShortItemComponent } from '../components/ShortItemComponent';
import MenuActionSheet from '../components/MenuActionSheet';

// Components
import {
  BackIcon,
  MoreVerticalIcon,
} from '../components/CutIcons';
import LoadingOverlay from '../components/LoadingOverlay';
import { DeleteIcon, ReportIcon } from '../components/CommonIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CutDetailRouteProp = RouteProp<AuthStackParamList, 'CutDetail'>;
type CutDetailNavigationProp = StackNavigationProp<AuthStackParamList, 'CutDetail'>;

export default function CutDetailScreen() {
  const navigation = useNavigation<CutDetailNavigationProp>();
  const route = useRoute<CutDetailRouteProp>();
  const isFocused = useIsFocused();

  const { shortId } = route.params;

  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const ITEM_HEIGHT = containerHeight ?? SCREEN_HEIGHT;

  // Zustand에서 colors만 선택적으로 가져옴 (최적화)
  const { colors } = useThemeStore();

  const [short, setShort] = useState<ShortItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentSheetVisible, setCommentSheetVisible] = useState(false);
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);

  // 쇼츠 상세 정보 조회
  const fetchShortDetail = async () => {
    if (!shortId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await CutService.getShortDetail(shortId);
      setShort(response.data);
    } catch (e) {
      console.error('컷츠 상세 조회 실패:', e);
      setError('컷츠를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShortDetail();
  }, [shortId]);

  // 댓글 보기
  const handleComment = useCallback(() => {
    console.log('댓글 보기:', shortId);
    if (short) {
      setCommentSheetVisible(true);
    }
  }, [short, shortId]);

  // 공유하기
  const handleShare = useCallback(() => {
    console.log('공유하기:', shortId);
    Alert.alert('공유하기', '어디로 공유하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '카카오톡', onPress: () => console.log('카카오톡 공유:', shortId) },
      { text: '인스타그램', onPress: () => console.log('인스타그램 공유:', shortId) },
      { text: '링크 복사', onPress: () => console.log('링크 복사:', shortId, short?.content_url) },
    ]);
  }, [short, shortId]);

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 메뉴 버튼 핸들러
  const handleMorePress = useCallback(() => {
    setMenuActionSheetVisible(true);
  }, []);

  // 컷 삭제 핸들러
  const handleDeleteCut = useCallback(async () => {
    if (!short) return;

    Alert.alert(
      '컷 삭제',
      '정말 이 컷츠를 삭제하시겠습니까? 삭제된 컷츠는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setMenuActionSheetVisible(false);
              await CutService.deleteShort(short.id);

              // 프로필 쇼츠 목록 갱신을 위한 플래그 설정
              useProfileStore.getState().setShouldRefreshProfileShorts(true);

              Alert.alert('성공', '컷츠가 삭제되었습니다.', [
                {
                  text: '확인',
                  onPress: () => navigation.goBack()
                }
              ]);
            } catch (error) {
              console.error('컷 삭제 실패:', error);
              const errorMessage = error instanceof Error ? error.message : '삭제에 실패했습니다.';
              Alert.alert('오류', errorMessage);
            }
          }
        }
      ]
    );
  }, [short, navigation]);

  // 컷 신고 핸들러
  const handleReportCut = useCallback(() => {
    if (short) {
      console.log('컷 신고 터치:', short.id);
      setMenuActionSheetVisible(false);
    }
  }, [short]);

  // 메뉴 액션 배열 (동적 생성)
  const menuActions = useCallback(() => {
    if (!short) return [];

    const actions = [
      {
        id: 'report',
        title: '컷 신고',
        icon: <ReportIcon size={20} color={colors.ERROR} />,
        color: colors.ERROR,
        onPress: handleReportCut,
      },
    ];

    // 내가 소유자인 경우에만 삭제 메뉴 추가
    if (short.is_owner) {
      actions.unshift({
        id: 'delete',
        title: '컷 삭제',
        icon: <DeleteIcon size={20} color={colors.ERROR} />,
        color: colors.ERROR,
        onPress: handleDeleteCut,
      });
    }

    return actions;
  }, [short, colors, handleDeleteCut, handleReportCut]);

  // 시청 기록 저장 핸들러 (로깅 추가)
  const handleViewComplete = useCallback(async (
    shortId: number,
    viewData: RecordShortViewRequest
  ) => {
    console.log(`📊 시청 기록 전송 시작 - 쇼츠 ID: ${shortId}`);
    console.log('📊 전송 데이터:', viewData);

    // 3초 이상 시청한 경우에만 기록
    if (viewData.watched_seconds < 3) {
      console.log(`⏭️ 시청 시간이 3초 미만으로 기록 건너뜀 - 쇼츠 ID: ${shortId} (${viewData.watched_seconds}초)`);
      return;
    }

    try {
      await CutService.recordShortView(shortId, viewData);
      console.log(`✅ 시청 기록 저장 성공 - 쇼츠 ID: ${shortId}`);
    } catch (error) {
      console.error(`❌ 시청 기록 저장 실패 - 쇼츠 ID: ${shortId}:`, error);
    }
  }, []);

  // 로딩 중
  if (isLoading) {
    return (
      <LoadingOverlay
        visible={true}
        message="컷츠 불러오는 중..."
      />
    );
  }

  // 에러 상태
  if (error) {
    return (
      <View
        style={styles.container}
        onLayout={e => {
          const { height } = e.nativeEvent.layout;
          setContainerHeight(height);
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>🎬</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchShortDetail}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 빈 상태
  if (!short) {
    return (
      <View style={styles.container} onLayout={e => {
        const { height } = e.nativeEvent.layout;
        setContainerHeight(height);
      }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.8}>
            <BackIcon size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>컷츠 상세</Text>
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.8}>
            <MoreVerticalIcon size={32} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>컷츠를 찾을 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const { height } = e.nativeEvent.layout;
        setContainerHeight(height);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.8}>
          <BackIcon size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>컷츠 상세</Text>
        <TouchableOpacity style={styles.moreButton} onPress={handleMorePress} activeOpacity={0.8}>
          <MoreVerticalIcon size={32} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <View style={{ height: ITEM_HEIGHT }}>
        <ShortItemComponent
          item={short}
          isActive={isFocused}
          onComment={handleComment}
          onShare={handleShare}
          onUpload={() => {}}
          onViewComplete={handleViewComplete}
        />
      </View>

      {short && (
        <CutCommentActionSheet
          visible={commentSheetVisible}
          onClose={() => {
            setCommentSheetVisible(false);
          }}
          short={short}
        />
      )}

      {/* 메뉴 액션 시트 */}
      <MenuActionSheet
        visible={menuActionSheetVisible}
        onClose={() => setMenuActionSheetVisible(false)}
        title={'컷츠'}
        actions={menuActions()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: (StatusBar.currentHeight || 44) + SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.GRAY_800,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.MD,
  },
  errorText: {
    fontSize: 48,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.PRIMARY,
  },
  retryText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: COLORS.WHITE,
    textAlign: 'center',
  },
});
