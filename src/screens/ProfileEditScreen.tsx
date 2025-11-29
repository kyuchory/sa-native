import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/navigation';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';

// Components
import CommonHeader from '../components/CommonHeader';
import CustomInput from '../components/CustomInput';
import { ProfileEditIcon } from '../components/ProfileIcons';
import UserAvatar from '../components/UserAvatar';

type ProfileEditScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ProfileEdit'>;

export default function ProfileEditScreen() {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const navigation = useNavigation<ProfileEditScreenNavigationProp>();
  const { user } = useAuthStore();

  // 프로필 데이터 - user 스토어 기반으로 계산
  const profileData = useMemo(() => {
    if (!user) return null;
    return {
      profileImage: user.profile_img || null,
      nickname: user.nickname || '',
      bio: user.bio || '',
    };
  }, [user]);



  const handleImagePress = () => {
    if (!profileData) return;
    navigation.navigate('ProfileImageEdit', {
      currentImageUrl: profileData.profileImage,
      nickname: profileData.nickname
    });
  };

  // 프로필 데이터가 로드되지 않았으면 로딩 표시
  if (!profileData) {
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
            <UserAvatar
              profileImg={profileData.profileImage}
              nickname={profileData.nickname}
              size={100}
            />
            <View style={styles.editIconContainer}>
              <ProfileEditIcon size={16} color={colors.WHITE} />
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

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_100, // BG_COLORS.SECONDARY
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
  },

  // 프로필 이미지 섹션
  imageSection: {
    alignItems: 'center' as const,
    marginBottom: SPACING.XL,
  },
  imageContainer: {
    position: 'relative',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.PRIMARY, // COLORS.PRIMARY
    borderRadius: BORDER_RADIUS.ROUND,
    width: 32,
    height: 32,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 3,
    borderColor: colors.WHITE, // COLORS.WHITE
  },

// 입력 섹션
  inputSection: {
    marginBottom: SPACING.SM,
  },

  // 로딩 섹션
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    color: colors.GRAY_500, // COLORS.GRAY_500
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
});
