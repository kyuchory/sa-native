import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';

// Services
import { AuthService } from '../services/authService';

// Components
import CommonHeader from '../components/CommonHeader';
import CustomAlertModal from '../components/CustomAlertModal';

type AccountDeleteScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'AccountDelete'>;

export default function AccountDeleteScreen() {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const navigation = useNavigation<AccountDeleteScreenNavigationProp>();
  const { logout } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  const handleDeleteAccount = () => {
    setConfirmModal({
      visible: true,
      title: '계정 삭제 확인',
      message: '정말 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      buttons: [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => setConfirmModal(null),
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setConfirmModal(null);
            confirmDeleteAccount();
          },
        },
      ]
    });
  };

  const confirmDeleteAccount = async () => {
    try {
      setLoading(true);

      // 계정 삭제 API 호출
      await AuthService.deleteAccount();

      // 토큰 정리
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');

      // 성공 모달 표시
      setAlertModal({
        visible: true,
        title: '계정 삭제 완료',
        message: '계정이 성공적으로 삭제되었습니다.\n이용해 주셔서 감사합니다.',
        buttons: [
          {
            text: '확인',
            onPress: async () => {
              // 로그아웃 처리
              await logout();
              // 로그인 화면으로 이동은 logout에서 처리됨
            }
          }
        ]
      });

    } catch (error: any) {
      console.error('계정 삭제 실패:', error);
      setAlertModal({
        visible: true,
        title: '계정 삭제 실패',
        message: error.message || '계정 삭제 중 오류가 발생했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CommonHeader title="계정 삭제" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 경고 섹션 */}
          <View style={styles.warningSection}>
            <Text style={styles.warningTitle}>⚠️ 계정 삭제 시 주의사항</Text>
            <Text style={styles.warningText}>
              계정을 삭제하면 아래의 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.
            </Text>
          </View>

          {/* 삭제 대상 목록 */}
          <View style={styles.deleteItemsSection}>
            <Text style={styles.sectionTitle}>삭제되는 항목</Text>

            <View style={styles.itemList}>
              <View style={styles.item}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.itemText}>작성한 모든 게시물 및 콘텐츠</Text>
              </View>

              <View style={styles.item}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.itemText}>작성한 모든 피드 및 콘텐츠</Text>
              </View>

              <View style={styles.item}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.itemText}>업로드한 모든 숏츠 및 미디어 파일</Text>
              </View>

              <View style={styles.item}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.itemText}>소셜 계정 연동 정보</Text>
              </View>

              <View style={styles.item}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.itemText}>프로필 이미지 및 개인정보</Text>
              </View>

              <View style={styles.item}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.itemText}>채팅 기록 및 대화 내용</Text>
              </View>

              <View style={styles.item}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.itemText}>북마크 및 저장된 항목</Text>
              </View>
            </View>
          </View>

          {/* 추가 안내 */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>💡 추가 안내</Text>
            <Text style={styles.infoText}>
              • 삭제된 계정은 다시 복구할 수 없습니다.{'\n'}
              • 동일한 이메일로 재가입이 가능하지만, 이전 데이터는 복원되지 않습니다.{'\n'}
              • 계정 삭제 후 즉시 로그아웃됩니다.
            </Text>
          </View>

          {/* 최종 확인 */}
          <View style={styles.confirmSection}>
            <Text style={styles.confirmText}>
              정말로 계정을 삭제하시겠습니까?
            </Text>
          </View>
        </View>

        {/* 삭제 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.deleteButton, loading && styles.disabledButton]}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>
              {loading ? '삭제 중...' : '계정 삭제'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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

      {/* Confirm Modal */}
      {confirmModal && (
        <CustomAlertModal
          visible={confirmModal.visible}
          title={confirmModal.title}
          message={confirmModal.message}
          buttons={confirmModal.buttons}
          onClose={() => setConfirmModal(null)}
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

  scrollView: {
    flex: 1,
  },

  content: {
    padding: SPACING.MD,
  },

  warningSection: {
    backgroundColor: colors.WARNING_LIGHT || '#FFF3CD',
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: colors.WARNING || '#FFC107',
  },

  warningTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WARNING_DARK || '#856404',
    marginBottom: SPACING.SM,
  },

  warningText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.WARNING_DARK || '#856404',
    lineHeight: 20,
  },

  deleteItemsSection: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    shadowColor: colors.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.BLACK,
    marginBottom: SPACING.MD,
  },

  itemList: {
    gap: SPACING.SM,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  bulletPoint: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.ERROR || '#DC3545',
    marginRight: SPACING.SM,
    marginTop: -2,
  },

  itemText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    flex: 1,
    lineHeight: 20,
  },

  infoSection: {
    backgroundColor: colors.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },

  infoTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.PRIMARY,
    marginBottom: SPACING.SM,
  },

  infoText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    lineHeight: 20,
  },

  confirmSection: {
    alignItems: 'center',
    paddingVertical: SPACING.MD,
  },

  confirmText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_800,
    textAlign: 'center',
  },

  buttonContainer: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL,
  },

  deleteButton: {
    backgroundColor: colors.ERROR || '#DC3545',
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    shadowColor: colors.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  disabledButton: {
    backgroundColor: colors.GRAY_400,
    shadowOpacity: 0,
    elevation: 0,
  },

  deleteButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.WHITE,
  },
});
