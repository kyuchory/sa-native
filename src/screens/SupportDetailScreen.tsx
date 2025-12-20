import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import CommonHeader from '../components/CommonHeader';
import { SupportService } from '../services/supportService';
import { GetInquiryDetailResponse } from '../types/support';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MenuIcon, EditIcon, DeleteIcon } from '../components/CommonIcons';
import MenuActionSheet from '../components/MenuActionSheet';

// 유틸리티 함수들 (원래 supportMockData.ts에 있던 함수들)
const getCategoryText = (category?: string) => {
  switch (category) {
    case 'bug':
      return '버그 신고';
    case 'feature':
      return '기능 제안';
    case 'account':
      return '계정 관련';
    case 'payment':
      return '결제 관련';
    case 'etc':
      return '기타';
    default:
      return '미분류';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '대기중';
    case 'in_progress':
      return '처리중';
    case 'resolved':
      return '해결됨';
    case 'closed':
      return '종료됨';
    default:
      return '알 수 없음';
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return '긴급';
    case 'high':
      return '높음';
    case 'normal':
      return '보통';
    case 'low':
      return '낮음';
    default:
      return '알 수 없음';
  }
};

const getStatusColor = (status: string, colors: Record<string, string>) => {
  switch (status) {
    case 'pending':
      return colors.WARNING || '#f59e0b';
    case 'in_progress':
      return colors.INFO || '#3b82f6';
    case 'resolved':
      return colors.SUCCESS || '#10b981';
    case 'closed':
      return colors.GRAY_500 || '#6b7280';
    default:
      return colors.GRAY_500 || '#6b7280';
  }
};

const getPriorityColor = (priority: string, colors: Record<string, string>) => {
  switch (priority) {
    case 'urgent':
      return colors.ERROR || '#ef4444';
    case 'high':
      return colors.WARNING || '#f59e0b';
    case 'normal':
      return colors.PRIMARY || '#3b82f6';
    case 'low':
      return colors.GRAY_500 || '#6b7280';
    default:
      return colors.GRAY_500 || '#6b7280';
  }
};

import { handleApiError } from '../services/apiClient';
import { AuthStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import useSupportStore from '../stores/supportStore';
import CustomAlertModal from '../components/CustomAlertModal';
import { ImageViewerModal } from '../components/ImageViewerModal';

type SupportDetailRouteProp = RouteProp<AuthStackParamList, 'SupportDetail'>;

export default function SupportDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<SupportDetailRouteProp>();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const styles = createStyles(colors);

  // Zustand 스토어
  const { setShouldRefreshInquiries } = useSupportStore();

  const { inquiryId } = route.params;

  // 상태 관리
  const [inquiry, setInquiry] = useState<GetInquiryDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuActionSheetVisible, setMenuActionSheetVisible] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // 문의 상세 정보 로드
  useEffect(() => {
    loadInquiryDetail();
  }, [inquiryId]);

  // 문의 수정 (구현 준비중)
  const handleEditInquiry = () => {
    setMenuActionSheetVisible(false);
    setAlertModal({
      visible: true,
      title: '알림',
      message: '문의 수정 기능이 구현 준비중입니다.',
      buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
    });
  };

  // 문의 삭제
  const handleDeleteInquiry = async () => {
    setAlertModal({
      visible: true,
      title: '문의 삭제',
      message: '문의를 삭제하시겠습니까? 삭제된 문의는 복구할 수 없습니다.',
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
              setAlertModal(null);
              await SupportService.deleteInquiry(inquiryId);

              // 목록 새로고침 플래그 설정
              setShouldRefreshInquiries(true);

              setAlertModal({
                visible: true,
                title: '삭제 완료',
                message: '문의가 삭제되었습니다.',
                buttons: [{
                  text: '확인',
                  onPress: () => {
                    setAlertModal(null);
                    navigation.goBack();
                  }
                }]
              });
            } catch (error) {
              console.error('문의 삭제 실패:', error);
              const errorMessage = handleApiError(error);
              setAlertModal({
                visible: true,
                title: '오류',
                message: errorMessage,
                buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
              });
            }
          },
        },
      ]
    });
    setMenuActionSheetVisible(false);
  };


  const loadInquiryDetail = async () => {
    try {
      setLoading(true);
      const response = await SupportService.getInquiryDetail(inquiryId);
      setInquiry(response);
    } catch (error) {
      console.error('문의 상세 조회 실패:', error);
      const errorMessage = handleApiError(error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: errorMessage,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setLoading(false);
    }
  };

  // 로딩 화면
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CommonHeader title="문의 상세" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={styles.loadingText}>문의 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 문의가 없는 경우
  if (!inquiry) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CommonHeader title="문의 상세" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>문의를 찾을 수 없습니다</Text>
          <Text style={styles.errorSubtitle}>
            문의가 삭제되었거나 접근 권한이 없습니다.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CommonHeader
        title="문의 상세"
        rightComponent={
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuActionSheetVisible(true)}
            activeOpacity={0.7}
          >
            <MenuIcon size={20} color={colors.GRAY_700} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 문의 헤더 정보 */}
        <View style={styles.headerCard}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{inquiry.title}</Text>
            <View style={styles.metaInfo}>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(inquiry.status, colors) }
                  ]}
                />
                <Text style={styles.statusText}>
                  {getStatusText(inquiry.status)}
                </Text>
              </View>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.priorityText}>
                {getPriorityText(inquiry.priority)}
              </Text>
            </View>
          </View>

          {inquiry.category && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>
                {getCategoryText(inquiry.category)}
              </Text>
            </View>
          )}
        </View>

        {/* 문의 내용 */}
        <View style={styles.contentCard}>
          <Text style={styles.contentLabel}>문의 내용</Text>
          <Text style={styles.content}>{inquiry.content}</Text>
        </View>

        {/* 첨부 이미지 */}
        {inquiry.attachments && inquiry.attachments.length > 0 && (
          <View style={styles.attachmentsCard}>
            <Text style={styles.attachmentsLabel}>
              첨부 이미지 ({inquiry.attachments.length}장)
            </Text>
            <View style={styles.imageGrid}>
              {inquiry.attachments.map((attachment, index) => (
                <TouchableOpacity
                  key={attachment.id}
                  style={styles.imageContainer}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setImageViewerVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: attachment.file_url }}
                    style={styles.image}
                    cachePolicy="memory-disk"
                    transition={200}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 문의 정보 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>문의 정보</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>문의 번호</Text>
            <Text style={styles.infoValue}>#{inquiry.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>작성일</Text>
            <Text style={styles.infoValue}>
              {new Date(inquiry.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          {inquiry.updated_at !== inquiry.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>수정일</Text>
              <Text style={styles.infoValue}>
                {new Date(inquiry.updated_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 메뉴 액션 시트 */}
      <MenuActionSheet
        visible={menuActionSheetVisible}
        onClose={() => setMenuActionSheetVisible(false)}
        title="문의"
        actions={[
          // 작성자의 문의인 경우 수정/삭제 메뉴 추가
          ...(inquiry?.user.id === user?.id ? [
            {
              id: 'edit',
              title: '문의 수정',
              icon: <EditIcon size={20} color={colors.GRAY_700} />,
              color: colors.GRAY_700,
              onPress: handleEditInquiry,
            },
            {
              id: 'delete',
              title: '문의 삭제',
              icon: <DeleteIcon size={20} color={colors.ERROR} />,
              color: colors.ERROR,
              onPress: handleDeleteInquiry,
            },
          ] : []),
        ]}
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

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={imageViewerVisible}
        mediaItems={inquiry.attachments?.map(attachment => ({
          type: 'image' as const,
          url: attachment.file_url,
        })) || []}
        initialIndex={selectedImageIndex}
        title="문의 첨부 이미지"
        onClose={() => setImageViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
    marginTop: SPACING.MD,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
    paddingHorizontal: SPACING.LG,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_700,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  errorSubtitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_500,
    textAlign: 'center',
    lineHeight: 24,
  },
  headerCard: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    shadowColor: colors.GRAY_900,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  titleSection: {
    marginBottom: SPACING.MD,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    lineHeight: 28,
    marginBottom: SPACING.SM,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.XS,
  },
  statusText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
  },
  separator: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_400,
    marginHorizontal: SPACING.SM,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_600,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.SM,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
  },
  contentCard: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    shadowColor: colors.GRAY_900,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contentLabel: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.MD,
  },
  content: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_800,
    lineHeight: 24,
  },
  attachmentsCard: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    shadowColor: colors.GRAY_900,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  attachmentsLabel: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.MD,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.SM,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.LG,
    shadowColor: colors.GRAY_900,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.MD,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  infoKey: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_800,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.MD,
  },
  // 메뉴 버튼
  menuButton: {
    padding: SPACING.SM,
  },
});
