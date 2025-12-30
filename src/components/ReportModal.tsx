import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import {
  ReportCategory,
  ReportTargetType,
  REPORT_CATEGORY_LABELS,
  ReportFormData,
  ReportModalProps,
} from '../types/report';
import { ReportService } from '../services/reportService';
import CustomAlertModal from './CustomAlertModal';

// 체크 아이콘 컴포넌트
const CheckIcon = ({ size = 20, color = '#666' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.8, height: size * 0.8, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.6,
          height: size * 0.4,
          borderBottomWidth: 2,
          borderLeftWidth: 2,
          borderColor: color,
          transform: [{ rotate: '-45deg' }],
          marginTop: -size * 0.1,
        }}
      />
    </View>
  </View>
);

export default function ReportModal({
  visible,
  targetType,
  targetId,
  onSubmit,
  onClose,
}: ReportModalProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const [step, setStep] = useState<1 | 2>(1); // 1: 카테고리 선택, 2: 사유 입력
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title?: string, message: string, buttons: any[]} | null>(null);

  // 모달이 열릴 때 초기화
  React.useEffect(() => {
    if (visible) {
      setStep(1);
      setSelectedCategory(null);
      setReason('');
      setIsSubmitting(false);
      setAlertModal(null);
    }
  }, [visible]);

  const handleCategorySelect = (category: ReportCategory) => {
    setSelectedCategory(category);
  };

  const handleNextStep = () => {
    if (!selectedCategory) {
      setAlertModal({
        visible: true,
        title: '카테고리 선택',
        message: '신고 카테고리를 선택해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      setAlertModal({
        visible: true,
        title: '카테고리 선택',
        message: '신고 카테고리를 선택해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    if (reason.trim().length < 10) {
      setAlertModal({
        visible: true,
        title: '신고 사유',
        message: '신고 사유를 10자 이상 입력해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData: ReportFormData = {
        targetType,
        targetId,
        category: selectedCategory,
        reason: reason.trim(),
      };

      await onSubmit(reportData);
      onClose();
    } catch (error: any) {
      console.error('신고 제출 실패:', error);

      // API 에러 응답 처리
      let errorTitle = '신고 실패';
      let errorMessage = '신고 접수에 실패했습니다. 다시 시도해주세요.';

      // 1. axios response.data에서 메시지 추출 (API 스펙 형식)
      if (error.response?.data) {
        const responseData = error.response.data;

        // API 응답의 message 필드 사용
        if (responseData.message) {
          errorMessage = responseData.message;
        }

        // 상태 코드별 적절한 타이틀 설정
        if (error.response.status === 400) {
          errorTitle = '입력 오류';
          if (!responseData.message) {
            errorMessage = '필수 항목이 누락되었거나 올바르지 않은 값입니다.';
          }
        } else if (error.response.status === 404) {
          errorTitle = '대상 없음';
          if (!responseData.message) {
            errorMessage = '신고하려는 대상을 찾을 수 없습니다.';
          }
        } else if (error.response.status === 409) {
          errorTitle = '중복 신고';
          if (!responseData.message) {
            errorMessage = '이미 신고한 콘텐츠입니다.';
          }
        }
      }
      // 2. error.message에서 메시지 추출 (ApiError 형식)
      else if (error.message && error.message !== 'Network Error') {
        // "ApiError: 이미 신고한 대상입니다." 형식에서 메시지 추출
        const messageMatch = error.message.match(/ApiError:\s*(.+)$/);
        if (messageMatch) {
          errorMessage = messageMatch[1];
        } else {
          errorMessage = error.message;
        }

        // 메시지 내용에 따라 타이틀 설정
        if (errorMessage.includes('이미 신고') || errorMessage.includes('중복')) {
          errorTitle = '중복 신고';
        } else if (errorMessage.includes('찾을 수 없') || errorMessage.includes('존재하지')) {
          errorTitle = '대상 없음';
        } else if (errorMessage.includes('필수') || errorMessage.includes('유효하지')) {
          errorTitle = '입력 오류';
        }
      }

      setAlertModal({
        visible: true,
        title: errorTitle,
        message: errorMessage,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetTypeLabel = (type: ReportTargetType): string => {
    const labels: Record<ReportTargetType, string> = {
      [ReportTargetType.POST]: '게시글',
      [ReportTargetType.FEED_POST]: '피드 게시물',
      [ReportTargetType.COMMENT]: '댓글',
      [ReportTargetType.FEED_COMMENT]: '피드 댓글',
      [ReportTargetType.SHORT]: '숏츠',
      [ReportTargetType.SHORT_COMMENT]: '숏츠 댓글',
      [ReportTargetType.USER]: '사용자',
      [ReportTargetType.CHAT_ROOM]: '채팅방',
      [ReportTargetType.MESSAGE]: '채팅 메시지',
      [ReportTargetType.STORY]: '스토리',
    };
    return labels[type] || '콘텐츠';
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
      style={{ zIndex: 99999 }}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.container} pointerEvents="box-none">
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {getTargetTypeLabel(targetType)} 신고
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {step === 1 ? (
              /* 1단계: 신고 카테고리 선택 */
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>신고 카테고리</Text>
                <Text style={styles.sectionDescription}>
                  신고하시는 콘텐츠의 부적절한 유형을 선택해주세요.
                </Text>

                {Object.values(ReportCategory).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryItem,
                      selectedCategory === category && styles.categoryItemSelected
                    ]}
                    onPress={() => handleCategorySelect(category)}
                    disabled={isSubmitting}
                  >
                    <Text style={[
                      styles.categoryName,
                      selectedCategory === category && styles.categoryNameSelected
                    ]}>
                      {REPORT_CATEGORY_LABELS[category]}
                    </Text>
                    {selectedCategory === category && (
                      <CheckIcon size={20} color={colors.PRIMARY} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              /* 2단계: 신고 사유 입력 */
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>신고 사유</Text>
                <Text style={styles.sectionDescription}>
                  신고 사유를 자세히 설명해주세요. (최소 10자)
                </Text>

                <TextInput
                  style={styles.reasonInput}
                  placeholder="신고 사유를 입력해주세요..."
                  placeholderTextColor={colors.GRAY_400}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  editable={!isSubmitting}
                  autoFocus={true}
                />

                <Text style={styles.charCount}>
                  {reason.length}/500
                </Text>
              </View>
            )}
          </ScrollView>

          {/* 버튼들 */}
          <View style={styles.buttonContainer}>
            {step === 1 ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.nextButton,
                    !selectedCategory && styles.nextButtonDisabled
                  ]}
                  onPress={handleNextStep}
                  disabled={isSubmitting || !selectedCategory}
                >
                  <Text style={[
                    styles.nextButtonText,
                    !selectedCategory && styles.nextButtonTextDisabled
                  ]}>
                    다음
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.prevButton]}
                  onPress={handlePrevStep}
                  disabled={isSubmitting}
                >
                  <Text style={styles.prevButtonText}>이전</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    reason.trim().length < 10 && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting || reason.trim().length < 10}
                >
                  <Text style={[
                    styles.submitButtonText,
                    reason.trim().length < 10 && styles.submitButtonTextDisabled
                  ]}>
                    {isSubmitting ? '제출 중...' : '신고하기'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

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
    </Modal>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.GRAY_100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_700,
  },
  scrollContainer: {
    padding: SPACING.LG,
  },
  section: {
    // marginBottom: SPACING.SM,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.XS,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    marginBottom: SPACING.MD,
    lineHeight: 18,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.XS,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  categoryItemSelected: {
    backgroundColor: colors.GRAY_50,
    borderColor: colors.PRIMARY,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
  },
  categoryNameSelected: {
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.GRAY_300,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500,
    textAlign: 'right',
    marginTop: SPACING.XS,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.LG,
    // paddingTop: SPACING.SM,
    paddingBottom: SPACING.LG,
    gap: SPACING.MD,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.GRAY_100,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
  },
  nextButton: {
    backgroundColor: colors.PRIMARY,
  },
  nextButtonDisabled: {
    backgroundColor: colors.GRAY_300,
  },
  nextButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
  nextButtonTextDisabled: {
    color: colors.GRAY_500,
  },
  prevButton: {
    backgroundColor: colors.GRAY_100,
  },
  prevButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
  },
  submitButton: {
    backgroundColor: colors.ERROR,
  },
  submitButtonDisabled: {
    backgroundColor: colors.GRAY_300,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
  submitButtonTextDisabled: {
    color: colors.GRAY_500,
  },
});
