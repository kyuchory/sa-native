import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

// Services
import { ProfileService } from '../services/profileService';
import { useAuthStore } from '../stores/authStore';

// Components
import CommonHeader from '../components/CommonHeader';
import CommonHeaderButton from '../components/CommonHeaderButton';
import CustomInput from '../components/CustomInput';
import CustomAlertModal from '../components/CustomAlertModal';

type NicknameEditScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'NicknameEdit'>;

export default function NicknameEditScreen() {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const navigation = useNavigation<NicknameEditScreenNavigationProp>();
  const { user, setUser } = useAuthStore();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [originalNickname, setOriginalNickname] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    if (user?.nickname) {
      setNickname(user.nickname);
      setOriginalNickname(user.nickname);
    }
  }, [user?.nickname]);

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.length > 10) {
      setError('닉네임은 10자 이하여야 합니다.');
      return;
    }

    if (nickname === originalNickname) {
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      setError(''); // 이전 에러 초기화
      await ProfileService.updateProfile({ nickname });
      if (user) {
        setUser({ ...user, nickname });
      }
      setShowSuccessModal(true); // 성공 모달 표시
    } catch (error : any) {
      console.error('닉네임 업데이트 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CommonHeader
        title="닉네임 수정"
        rightComponent={
          <CommonHeaderButton
            title="완료"
            onPress={handleSave}
            disabled={!nickname.trim() || nickname === originalNickname}
            loading={loading}
          />
        }
      />
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <CustomInput
            label="닉네임"
            value={nickname}
            onChangeText={(text) => {
              setNickname(text);
              if (error) setError(''); // 입력할 때 에러 메시지 숨김
            }}
            placeholder="닉네임을 입력하세요"
            maxLength={10}
            autoFocus
            error={error}
          />
          <Text style={styles.hint}>
            {nickname.length}/10자
          </Text>
        </View>
      </View>

      {/* 성공 모달 */}
      <CustomAlertModal
        visible={showSuccessModal}
        title="닉네임 변경 성공"
        message="닉네임이 성공적으로 변경되었습니다."
        buttons={[
          {
            text: '확인',
            onPress: () => {
              setShowSuccessModal(false);
              navigation.goBack();
            },
          },
        ]}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_100, // BG_COLORS.SECONDARY
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  inputContainer: {
    backgroundColor: colors.WHITE, // COLORS.WHITE
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  hint: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_500, // COLORS.GRAY_500
    textAlign: 'right' as const,
    marginTop: SPACING.XS,
  },
  saveButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.PRIMARY, // COLORS.PRIMARY
    minWidth: 60,
    alignItems: 'center' as const,
  },
  disabledButton: {
    backgroundColor: colors.GRAY_300, // COLORS.GRAY_300
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE, // COLORS.WHITE
  },
  disabledButtonText: {
    color: colors.GRAY_500, // COLORS.GRAY_500
  },
});
