import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { BG_COLORS, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

// Components
import CommonHeader from '../components/CommonHeader';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

type ProfileEditScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ProfileEdit'>;

export default function ProfileEditScreen() {
  const navigation = useNavigation<ProfileEditScreenNavigationProp>();

  // 프로필 데이터 상태 (임시 데이터 - 실제로는 props나 API에서 받을 것)
  const [profileData, setProfileData] = useState({
    profileImage: null as string | null,
    nickname: '김사용자',
    bio: '안녕하세요! 반갑습니다 😀',
  });

  const handleSave = () => {
    // TODO: 저장 로직 구현
    console.log('저장하기:', profileData);
    navigation.goBack();
  };

  const handleCancel = () => {
    // TODO: 변경사항 확인 로직 (변경사항이 있으면 팝업 표시)
    navigation.goBack();
  };

  const handleImagePress = () => {
    // TODO: 이미지 선택/촬영 로직 구현
    console.log('프로필 이미지 변경');
  };

  return (
    <View style={styles.container}>
      <CommonHeader title="프로필 편집" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 이미지 섹션 */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imageContainer} onPress={handleImagePress} activeOpacity={0.7}>
            {profileData.profileImage ? (
              <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.imagePlaceholder]}>
                <Text style={styles.placeholderText}>
                  {profileData.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 닉네임 입력 */}
        <View style={styles.inputSection}>
          <CustomInput
            label="닉네임"
            value={profileData.nickname}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, nickname: text }))}
            placeholder="닉네임을 입력하세요"
            maxLength={20}
          />
        </View>

        {/* 소개(Bio) 입력 */}
        <View style={styles.inputSection}>
          <CustomInput
            label="소개"
            value={profileData.bio}
            onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
            placeholder="자기소개를 입력하세요"
            multiline={true}
            numberOfLines={4}
            maxLength={150}
            style={styles.bioInput}
          />
        </View>

        {/* 버튼 섹션 */}
        <View style={styles.buttonSection}>
          <CustomButton
            title="저장하기"
            onPress={handleSave}
            variant="primary"
            size="large"
            style={styles.saveButton}
          />
          <CustomButton
            title="취소"
            onPress={handleCancel}
            variant="outline"
            size="large"
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
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
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
  },

  // 프로필 이미지 섹션
  imageSection: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.GRAY_300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.SIZE.XXXL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.ROUND,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  editIcon: {
    fontSize: 16,
  },

  // 입력 섹션
  inputSection: {
    marginBottom: SPACING.SM,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // 버튼 섹션
  buttonSection: {
    gap: SPACING.SM,
    marginBottom: SPACING.XL,
  },
  saveButton: {
    // 추가 스타일
  },
  cancelButton: {
    // 추가 스타일
  },
});
