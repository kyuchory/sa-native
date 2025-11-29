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
import CustomInput from '../components/CustomInput';
import CustomAlertModal from '../components/CustomAlertModal';

type BioEditScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'BioEdit'>;

export default function BioEditScreen() {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const navigation = useNavigation<BioEditScreenNavigationProp>();
  const { user, setUser } = useAuthStore();
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    const userBio = user?.bio || '';
    setBio(userBio);
    setOriginalBio(userBio);
  }, [user?.bio]);

  const handleSave = async () => {
    if (bio.length > 150) {
      setError('소개는 150자 이하여야 합니다.');
      return;
    }

    if (bio === originalBio) {
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      setError(''); // 이전 에러 초기화
      await ProfileService.updateProfile({ bio });
      if (user) {
        setUser({ ...user, bio });
      }
      setShowSuccessModal(true); // 성공 모달 표시
    } catch (error : any) {
      console.error('소개 업데이트 실패:', error);
      setError(error.message);
    }  finally {
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
      {loading ? (
        <ActivityIndicator size="small" color={colors.WHITE} />
      ) : (
        <Text style={[
          styles.saveButtonText,
          (bio.length > 150 || bio === originalBio) && styles.disabledButtonText
        ]}>
          완료
        </Text>
      )}
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
            onChangeText={(text) => {
              setBio(text);
              if (error) setError(''); // 입력할 때 에러 메시지 숨김
            }}
            placeholder="자기소개를 입력하세요"
            multiline={true}
            numberOfLines={4}
            maxLength={150}
            autoFocus
            style={styles.bioInput}
            error={error}
          />
          <Text style={styles.hint}>
            {bio.length}/150자
          </Text>
        </View>
      </View>

      {/* 성공 모달 */}
      <CustomAlertModal
        visible={showSuccessModal}
        title="소개 변경 성공"
        message="소개가 성공적으로 변경되었습니다."
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
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
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
