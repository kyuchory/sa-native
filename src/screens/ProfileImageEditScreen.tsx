import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { AuthStackParamList } from '../types/navigation';
import { BG_COLORS, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

// Services
import { useAuthStore } from '../stores/authStore';

// Components
import CommonHeader from '../components/CommonHeader';
import CustomButton from '../components/CustomButton';
import { ProfileEditIcon } from '../components/ProfileIcons';

type ProfileImageEditScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ProfileImageEdit'>;

export default function ProfileImageEditScreen() {
  const navigation = useNavigation<ProfileImageEditScreenNavigationProp>();
  const { user } = useAuthStore();

  // 이미지 상태
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(user?.profile_img || null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  // 미디어 라이브러리 권한 요청
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리에 대한 접근 권한이 필요합니다.');
      return false;
    }
    return true;
  };

  // 카메라 권한 요청
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라에 대한 접근 권한이 필요합니다.');
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
      setSelectedImageUri(result.assets[0].uri);
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
      setSelectedImageUri(result.assets[0].uri);
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

  // 저장 버튼 처리 (퍼블리싱용 - 실제 저장은 하지 않음)
  const handleSave = () => {
    if (selectedImageUri) {
      // 실제 DB 저장 없이 로컬에서만 업데이트
      Alert.alert('성공', '프로필 이미지가 선택되었습니다.');
      navigation.goBack();
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
            {displayImageUri ? (
              <Image source={{ uri: displayImageUri }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.imagePlaceholder]}>
                <Text style={styles.placeholderText}>
                  {user?.nickname?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.editIconContainer}>
              <ProfileEditIcon size={16} color={COLORS.WHITE} />
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
            variant="secondary"
            style={styles.cancelButton}
          />
          <CustomButton
            title="저장"
            onPress={handleSave}
            variant="primary"
            style={styles.saveButton}
            disabled={!selectedImageUri}
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

  // 이미지 섹션
  imageSection: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: SPACING.SM,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
  helperText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: COLORS.GRAY_500,
    textAlign: 'center',
  },

  // 액션 섹션
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.SM,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
