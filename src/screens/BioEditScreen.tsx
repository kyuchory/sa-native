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

type BioEditScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'BioEdit'>;

export default function BioEditScreen() {
  const navigation = useNavigation<BioEditScreenNavigationProp>();
  const { user, setUser } = useAuthStore();
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [originalBio, setOriginalBio] = useState('');

  // 초기 데이터 로드
  useEffect(() => {
    const userBio = user?.bio || '';
    setBio(userBio);
    setOriginalBio(userBio);
  }, [user?.bio]);

  const handleSave = async () => {
    if (bio.length > 150) {
      Alert.alert('오류', '소개는 150자 이하여야 합니다.');
      return;
    }

    if (bio === originalBio) {
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      await ProfileService.updateProfile({ bio });
      if (user) {
        setUser({ ...user, bio });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Bio 업데이트 실패:', error);
      Alert.alert('오류', '소개 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getSaveButton = () => (
    <TouchableOpacity
      style={[
        styles.saveButton,
        (bio.length > 150 || bio === originalBio) && styles.disabledButton
      ]}
      onPress={handleSave}
      disabled={loading || bio.length > 150 || bio === originalBio}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.saveButtonText,
        (bio.length > 150 || bio === originalBio) && styles.disabledButtonText
      ]}>
        {loading ? '저장 중...' : '완료'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CommonHeader
        title="소개 수정"
        rightComponent={getSaveButton()}
      />
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <CustomInput
            label="소개"
            value={bio}
            onChangeText={setBio}
            placeholder="자기소개를 입력하세요"
            multiline={true}
            numberOfLines={4}
            maxLength={150}
            autoFocus
            style={styles.bioInput}
          />
          <Text style={styles.hint}>
            {bio.length}/150자
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
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
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
