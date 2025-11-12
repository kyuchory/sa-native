import * as ImagePicker from 'expo-image-picker';
import { ChatService } from '../services/chatService';

/**
 * 카메라 권한을 요청하고 결과를 반환
 * @returns 권한 승인 여부
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  return permissionResult.granted;
};

/**
 * 갤러리 권한을 요청하고 결과를 반환
 * @returns 권한 승인 여부
 */
export const requestGalleryPermission = async (): Promise<boolean> => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return permissionResult.granted;
};

/**
 * 카메라로 사진 촬영
 * @returns 촬영된 이미지 asset 또는 null
 */
export const takePhotoFromCamera = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  try {
    const permissionGranted = await requestCameraPermission();
    if (!permissionGranted) {
      throw new Error('카메라 권한이 필요합니다.');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // 채팅에서는 편집 없이 바로 전송
      quality: 0.8, // 적절한 품질로 압축
      exif: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.error('카메라 촬영 실패:', error);
    throw error;
  }
};

/**
 * 갤러리에서 사진 선택
 * @returns 선택된 이미지 asset 또는 null
 */
export const selectPhotoFromGallery = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  try {
    const permissionGranted = await requestGalleryPermission();
    if (!permissionGranted) {
      throw new Error('갤러리 접근 권한이 필요합니다.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // 채팅에서는 편집 없이 바로 선택
      quality: 0.8, // 적절한 품질로 압축
      exif: false,
      allowsMultipleSelection: false, // 한 장씩만 선택
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.error('갤러리 선택 실패:', error);
    throw error;
  }
};

/**
 * 갤러리에서 비디오 선택
 * @returns 선택된 비디오 asset 또는 null
 */
export const selectVideoFromGallery = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  try {
    const permissionGranted = await requestGalleryPermission();
    if (!permissionGranted) {
      throw new Error('갤러리 접근 권한이 필요합니다.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false, // 채팅에서는 편집 없이 바로 선택
      quality: 0.8, // 적절한 품질로 압축
      exif: false,
      allowsMultipleSelection: false, // 한 개씩만 선택
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.error('갤러리 비디오 선택 실패:', error);
    throw error;
  }
};

/**
 * 채팅 이미지 업로드
 * @param imageUri - 업로드할 이미지 URI
 * @returns 업로드된 이미지 정보
 */
export const uploadChatImage = async (imageUri: string) => {
  try {
    console.log('📤 이미지 업로드 시작...');
    const uploadResponse = await ChatService.uploadChatImage(imageUri);
    console.log('✅ 이미지 업로드 완료:', uploadResponse);
    return uploadResponse;
  } catch (error) {
    console.error('📷 이미지 업로드 실패:', error);
    throw error;
  }
};

/**
 * 채팅 비디오 업로드
 * @param videoUri - 업로드할 비디오 URI
 * @param options - 편집 옵션 (선택)
 * @returns 업로드된 비디오 정보
 */
export const uploadChatVideo = async (videoUri: string, options?: {
  trimStart?: number;
  trimEnd?: number;
  cropArea?: { x: number; y: number; width: number; height: number };
}) => {
  try {
    console.log('📤 비디오 업로드 시작...');
    const uploadResponse = await ChatService.uploadChatVideo(videoUri, options);
    console.log('✅ 비디오 업로드 완료:', uploadResponse);
    return uploadResponse;
  } catch (error) {
    console.error('🎥 비디오 업로드 실패:', error);
    throw error;
  }
};
