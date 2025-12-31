import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
} from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import useProfileStore from '../stores/profileStore';
import { AuthStackParamList } from '../types/navigation';
import { ShortItem, RecordShortViewRequest } from '../types/cut';
import { ReportTargetType } from '../types/report';
import { CutService } from '../services/cutService';
import { ReportService } from '../services/reportService';
import CutCommentActionSheet from '../components/CutCommentActionSheet';
import { ShortItemComponent } from '../components/ShortItemComponent';
import MenuActionSheet from '../components/MenuActionSheet';
import ReportModal from '../components/ReportModal';

// Components
import {
  BackIcon,
  MoreVerticalIcon,
} from '../components/CutIcons';
import LoadingOverlay from '../components/LoadingOverlay';
import { DeleteIcon, ReportIcon } from '../components/CommonIcons';
import CustomAlertModal from '../components/CustomAlertModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CutDetailRouteProp = RouteProp<AuthStackParamList, 'CutDetail'>;
type CutDetailNavigationProp = StackNavigationProp<AuthStackParamList, 'CutDetail'>;

export default function CutDetailScreen() {
  const navigation = useNavigation<CutDetailNavigationProp>();
  const route = useRoute<CutDetailRouteProp>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

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
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

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
    if (short) {
      setCommentSheetVisible(true);
    }
  }, [short, shortId]);

  // 공유하기
  const handleShare = useCallback(() => {
    setAlertModal({
      visible: true,
      title: '공유하기',
      message: '기능이 준비중입니다.',
      buttons: [{
        text: '취소',
        style: 'cancel',
        onPress: () => setAlertModal(null)
      }]
    });
  }, [short, shortId, colors]);

  // 뒤로가기
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 업로드 화면으로 이동
  const handleUpload = useCallback(() => {
    navigation.navigate('CutUploadSelect');
  }, [navigation]);

  // 메뉴 버튼 핸들러
  const handleMorePress = useCallback(() => {
    setMenuActionSheetVisible(true);
  }, []);

  // 신고 제출 핸들러
  const handleReportSubmit = async (reportData: any) => {
    try {
      await ReportService.createReport({
        target_type: reportData.targetType,
        target_id: reportData.targetId,
        category: reportData.category,
        reason: reportData.reason,
      });

      // 성공 메시지 표시
      setAlertModal({
        visible: true,
        title: '신고 완료',
        message: '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } catch (error) {
      // 에러는 ReportModal 내부에서 처리됨
      throw error;
    }
  };

  // 컷 삭제 핸들러
  const handleDeleteCut = useCallback(async () => {
    if (!short) return;

    setAlertModal({
      visible: true,
      title: '컷츠 삭제',
      message: '정말 이 컷츠를 삭제하시겠습니까? 삭제된 컷츠는 복구할 수 없습니다.',
      buttons: [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => setAlertModal(null)
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setMenuActionSheetVisible(false);
              setAlertModal(null);
              await CutService.deleteShort(short.id);

              // 프로필 쇼츠 목록 갱신을 위한 플래그 설정
              useProfileStore.getState().setShouldRefreshProfileShorts(true);

              setAlertModal({
                visible: true,
                title: '성공',
                message: '컷츠가 삭제되었습니다.',
                buttons: [{
                  text: '확인',
                  onPress: () => {
                    setAlertModal(null);
                    navigation.goBack();
                  }
                }]
              });
            } catch (error) {
              console.error('컷 삭제 실패:', error);
              const errorMessage = error instanceof Error ? error.message : '삭제에 실패했습니다.';
              setAlertModal({
                visible: true,
                title: '오류',
                message: errorMessage,
                buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
              });
            }
          }
        }
      ]
    });
  }, [short, navigation, colors]);

  // 컷 신고 핸들러
  const handleReportCut = useCallback(() => {
    setMenuActionSheetVisible(false);
    setReportModalVisible(true);
  }, []);

  // 메뉴 액션 배열 (동적 생성)
  const menuActions = useCallback(() => {
    if (!short) return [];

    const actions = [
      {
        id: 'report',
        title: '컷츠 신고',
        icon: <ReportIcon size={20} color={colors.ERROR} />,
        color: colors.ERROR,
        onPress: handleReportCut,
      },
    ];

    // 내가 소유자인 경우에만 삭제 메뉴 추가
    if (short.is_owner) {
      actions.unshift({
        id: 'delete',
        title: '컷츠 삭제',
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
    // 3초 이상 시청한 경우에만 기록
    if (viewData.watched_seconds < 3) {
      return;
    }

    try {
      await CutService.recordShortView(shortId, viewData);
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
          onUpload={handleUpload}
          onViewComplete={handleViewComplete}
          onProfilePress={(userId: string) => navigation.navigate('UserProfile', { userId })}
          extraBottomMargin={insets.bottom}
        />
      </View>

      {short && (
        <CutCommentActionSheet
          visible={commentSheetVisible}
          onClose={() => {
            setCommentSheetVisible(false);
          }}
          short={short}
          onAuthorPress={() => navigation.navigate('UserProfile', { userId: String(short.user_id) })}
        />
      )}

      {/* 메뉴 액션 시트 */}
      <MenuActionSheet
        visible={menuActionSheetVisible}
        onClose={() => setMenuActionSheetVisible(false)}
        title={'컷츠'}
        actions={menuActions()}
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

      {/* 신고 모달 */}
      <ReportModal
        visible={reportModalVisible}
        targetType={ReportTargetType.SHORT}
        targetId={shortId}
        onSubmit={handleReportSubmit}
        onClose={() => setReportModalVisible(false)}
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
