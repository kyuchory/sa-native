import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { BG_COLORS, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

// Services
import { ProfileService } from '../services/profileService';
import { useAuthStore } from '../stores/authStore';

// Components
import CommonHeader from '../components/CommonHeader';
import CustomInput from '../components/CustomInput';

type NicknameEditScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'NicknameEdit'>;

export default function NicknameEditScreen() {
  const navigation = useNavigation<NicknameEditScreenNavigationProp>();
  const { user, setUser } = useAuthStore();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
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
      Alert.alert('오류', '닉네임을 입력해주세요.');
      return;
    }

    if (nickname.length > 50) {
      Alert.alert('오류', '닉네임은 50자 이하여야 합니다.');
      return;
    }

    if (nickname === originalNickname) {
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      await ProfileService.updateProfile({ nickname });
      if (user) {
        setUser({ ...user, nickname });
      }
      navigation.goBack();
    } catch (error) {
      console.error('닉네임 업데이트 실패:', error);
      Alert.alert('오류', '닉네임 업데이트에 실패했습니다.');
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
            onChangeText={setNickname}
            placeholder="닉네임을 입력하세요"
            maxLength={50}
            autoFocus
          />
          <Text style={styles.hint}>
            {nickname.length}/50자
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLORS.SECONDARY,
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  inputContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    ...SHADOWS.SMALL,
  },
  hint: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: COLORS.GRAY_500,
    textAlign: 'right',
    marginTop: SPACING.XS,
  },
  saveButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.PRIMARY,
    minWidth: 60,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.GRAY_300,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: COLORS.WHITE,
  },
  disabledButtonText: {
    color: COLORS.GRAY_500,
  },
});
