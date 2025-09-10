import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
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
import CustomInput from '../components/CustomInput';

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

    if (nickname.length > 50) {
      setError('닉네임은 50자 이하여야 합니다.');
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
      navigation.goBack();
    } catch (error : any) {
      console.error('닉네임 업데이트 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSaveButton = () => (
    <TouchableOpacity
      style={[
        styles.saveButton,
        (!nickname.trim() || nickname === originalNickname) && styles.disabledButton
      ]}
      onPress={handleSave}
      disabled={loading || !nickname.trim() || nickname === originalNickname}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.saveButtonText,
        (!nickname.trim() || nickname === originalNickname) && styles.disabledButtonText
      ]}>
        {loading ? '저장 중' : '완료'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CommonHeader
        title="닉네임 수정"
        rightComponent={getSaveButton()}
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
            maxLength={50}
            autoFocus
            error={error}
          />
          <Text style={styles.hint}>
            {nickname.length}/50자
          </Text>
        </View>
      </View>
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
