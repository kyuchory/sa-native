import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { AuthStackParamList } from '../types/navigation';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

// Services
import { useAuthStore } from '../stores/authStore';
import { ProfileService } from '../services/profileService';

// Components
import CommonHeader from '../components/CommonHeader';
import CustomButton from '../components/CustomButton';
import { ProfileEditIcon } from '../components/ProfileIcons';
import UserAvatar from '../components/UserAvatar';

type ProfileImageEditScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ProfileImageEdit'>;
type ProfileImageEditScreenRouteProp = RouteProp<AuthStackParamList, 'ProfileImageEdit'>;

export default function ProfileImageEditScreen() {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const navigation = useNavigation<ProfileImageEditScreenNavigationProp>();
  const route = useRoute<ProfileImageEditScreenRouteProp>();
  const { user } = useAuthStore();

  // props에서 현재 이미지 URL과 닉네임 가져오기
  const { currentImageUrl, nickname } = route.params || { currentImageUrl: null, nickname: '' };

  // 이미지 상태 - props로 받은 currentImageUrl 사용
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(currentImageUrl);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(null); // 서버 저장용
  const [isUploading, setIsUploading] = useState(false);

  // 미디어 라이브러리 권한 요청
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리에 대한 접근 권한이 필요합니다. 설정에서 허용해주세요.');
      return false;
    }
    return true;
  };

  // 카메라 권한 요청
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라에 대한 접근 권한이 필요합니다. 설정에서 허용해주세요.');
      return false;
    }
    return true;
  };

  // 갤러리에서 이미지 선택
  const pickImageFromLibrary = async () => {
    const permissionGranted = await requestMediaLibraryPermission();
    if (!permissionGranted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // 정사각형으로 편집
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      await uploadProfileImage(selectedImage.uri);
    }
  };

  // 카메라로 사진 촬영
  const takePhoto = async () => {
    const permissionGranted = await requestCameraPermission();
    if (!permissionGranted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1], // 정사각형으로 편집
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      await uploadProfileImage(selectedImage.uri);
    }
  };

  // 프로필 이미지 업로드
  const uploadProfileImage = async (imageUri: string) => {
    try {
      setIsUploading(true);
      
      // 프로필 이미지 업로드
      const uploadedImage = await ProfileService.uploadProfileImage(imageUri);
      // 업로드된 이미지 - 화면 표시용은 URL, 저장용은 path를 따로 저장
      setSelectedImageUri(uploadedImage.url); // 표시용: 완전한 URL
      setUploadedImagePath(uploadedImage.path); // 저장용: 경로만
      
      Alert.alert('성공', '프로필 이미지가 업로드되었습니다.');
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error);
      Alert.alert('오류', '이미지 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  // 이미지 선택 옵션 표시
  const handleImageSelect = () => {
    Alert.alert(
      '프로필 이미지 선택',
      '어디에서 이미지를 가져오시겠습니까?',
      [
        { text: '갤러리에서 선택', onPress: pickImageFromLibrary },
        { text: '사진 촬영', onPress: takePhoto },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  // 저장 버튼 처리
  const handleSave = async () => {
    if (selectedImageUri) {
      try {
        setIsUploading(true);
        
        // 저장용 경로 사용 (서버에 보낼 때는 path만)
        const imagePath = uploadedImagePath || '';

        // 프로필 이미지 업데이트
        await ProfileService.updateProfile({
          profile_img: imagePath
        });
        
        Alert.alert('성공', '프로필 이미지가 저장되었습니다.');
        navigation.goBack();
      } catch (error) {
        console.error('프로필 업데이트 실패:', error);
        Alert.alert('오류', '프로필 저장에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  // 취소 버튼 처리
  const handleCancel = () => {
    setSelectedImageUri(null);
    navigation.goBack();
  };

  // 사용 중인 이미지 결정 (선택된 이미지가 있으면 우선)
  const displayImageUri = selectedImageUri || currentImageUri;

  return (
    <View style={styles.container}>
      <CommonHeader title="프로필 이미지 편집" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 현재 이미지 표시 */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imageContainer} onPress={handleImageSelect} activeOpacity={0.7}>
            <UserAvatar
              profileImg={displayImageUri}
              nickname={nickname || 'U'}
              size={120}
            />
            <View style={styles.editIconContainer}>
              <ProfileEditIcon size={16} color={colors.WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            선택된 이미지
          </Text>
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionSection}>
          <CustomButton
            title="취소"
            onPress={handleCancel}
            variant="tertiary"
            style={styles.cancelButton}
          />
          <CustomButton
            title={isUploading ? "저장 중..." : "저장"}
            onPress={handleSave}
            variant="primary"
            style={styles.saveButton}
            disabled={!selectedImageUri || isUploading}
          />
        </View>
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

  // 이미지 섹션
  imageSection: {
    alignItems: 'center' as const,
    marginBottom: SPACING.XL,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: SPACING.SM,
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
  helperText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500, // COLORS.GRAY_500
    textAlign: 'center' as const,
  },

  // 액션 섹션
  actionSection: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: SPACING.SM,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
