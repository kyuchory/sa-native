import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { BG_COLORS, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

// Services
import { ProfileService } from '../services/profileService';
import { useAuthStore } from '../stores/authStore';

// Components
import CommonHeader from '../components/CommonHeader';
import CustomInput from '../components/CustomInput';
import { ProfileEditIcon } from '../components/ProfileIcons';

type ProfileEditScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ProfileEdit'>;

export default function ProfileEditScreen() {
  const navigation = useNavigation<ProfileEditScreenNavigationProp>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // 프로필 데이터 상태
  const [profileData, setProfileData] = useState({
    profileImage: null as string | null,
    nickname: '',
    bio: '',
  });

  // 프로필 데이터 조회
  const fetchProfile = async () => {
    if (user?.id) {
      try {
        setLoading(true);
        const response = await ProfileService.getProfile(user.id);
        setProfileData({
          profileImage: response.data.profile_img,
          nickname: response.data.nickname,
          bio: response.data.bio || '',
        });
      } catch (error) {
        console.error('프로필 조회 실패:', error);
        // 에러 발생 시 기본값 사용
        setProfileData({
          profileImage: user?.profile_img || null,
          nickname: user?.nickname || '사용자',
          bio: user?.bio || '',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  // user 가 변경될 때 profileData 업데이트
  useEffect(() => {
    setProfileData({
      profileImage: user?.profile_img || null,
      nickname: user?.nickname || '사용자',
      bio: user?.bio || '',
    });
  }, [user?.nickname, user?.profile_img, user?.bio]);



  const handleImagePress = () => {
    // TODO: 이미지 선택/촬영 로직 구현
    console.log('프로필 이미지 변경');
  };

  // 로딩 중이거나 프로필 데이터가 없으면 로딩 표시
  if (loading || !profileData.nickname) {
    return (
      <View style={styles.container}>
        <CommonHeader title="프로필 편집" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>프로필 정보를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

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
              <ProfileEditIcon size={16} color={COLORS.WHITE} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 닉네임 입력 */}
        <TouchableOpacity
          style={styles.inputSection}
          onPress={() => navigation.navigate('NicknameEdit')}
          activeOpacity={0.7}
        >
          <CustomInput
            label="닉네임"
            value={profileData.nickname}
            onChangeText={() => {}} // 터치시 화면 이동이므로 입력 차단
            placeholder="닉네임을 입력하세요"
            maxLength={20}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* 소개(Bio) 입력 */}
        <TouchableOpacity
          style={styles.inputSection}
          onPress={() => navigation.navigate('BioEdit')}
          activeOpacity={0.7}
        >
          <CustomInput
            label="소개"
            value={profileData.bio}
            onChangeText={() => {}} // 터치시 화면 이동이므로 입력 차단
            placeholder="자기소개를 입력하세요"
            multiline={true}
            numberOfLines={4}
            maxLength={150}
            style={styles.bioInput}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
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

  // 로딩 섹션
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    color: COLORS.GRAY_500,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
