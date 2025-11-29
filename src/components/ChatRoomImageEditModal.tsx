import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { ChatService } from '../services/chatService';
import CustomAlertModal from './CustomAlertModal';

interface ChatRoomImageEditModalProps {
  visible: boolean;
  onClose: () => void;
  onImageUpdate: (newImageUrl: string) => void;
  chatRoomId: number;
  currentImageUrl?: string;
}

export default function ChatRoomImageEditModal({
  visible,
  onClose,
  onImageUpdate,
  chatRoomId,
  currentImageUrl,
}: ChatRoomImageEditModalProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string} | null>(null);

  // 이미지 선택 및 1:1 crop
  const handleSelectImage = async () => {
    try {
      // 권한 요청
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        setAlertModal({ visible: true, title: '권한 필요', message: '갤러리 접근 권한이 필요합니다.' });
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // 1:1 비율로 crop
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      setAlertModal({ visible: true, title: '오류', message: '이미지를 선택할 수 없습니다.' });
    }
  };

  // 이미지 변경 적용
  const handleApplyImage = async () => {
    if (!selectedImage) return;

    try {
      setIsLoading(true);

      // 이미지 업로드
      const uploadResponse = await ChatService.uploadChatImage(selectedImage);

      // 채팅방 이미지 업데이트
      await ChatService.updateChatRoom(chatRoomId, {
        avatar_url: uploadResponse.image_path
      });

      // 부모 컴포넌트에 알림
      onImageUpdate(uploadResponse.url);

      // 모달 닫기
      handleClose();
    } catch (error: any) {
      console.error('채팅방 이미지 변경 오류:', error);
      setAlertModal({ visible: true, title: '오류', message: error.response?.data?.message || '채팅방 이미지를 변경할 수 없습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setSelectedImage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent={true}
      style={{ zIndex: 99999 }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>채팅방 이미지 변경</Text>

          {/* 현재 이미지 또는 선택된 이미지 미리보기 */}
          <View style={styles.imagePreviewContainer}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                contentFit="cover"
                cachePolicy={'memory-disk'}
                transition={200}
              />
            ) : currentImageUrl ? (
              <Image
                source={{ uri: currentImageUrl }}
                style={styles.imagePreview}
                contentFit="cover"
                cachePolicy={'memory-disk'}
                transition={200}
              />
            ) : (
              <View style={styles.imagePreviewPlaceholder}>
                <Text style={styles.placeholderText}>이미지 없음</Text>
              </View>
            )}
          </View>

          {/* 안내 텍스트 */}
          <Text style={styles.description}>
            {selectedImage
              ? '이 이미지를 채팅방 이미지로 설정하시겠습니까?'
              : '새로운 채팅방 이미지를 선택하세요.'
            }
          </Text>

          {/* 버튼들 */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>

            {!selectedImage ? (
              <TouchableOpacity
                style={[styles.button, styles.selectButton]}
                onPress={handleSelectImage}
                activeOpacity={0.7}
              >
                <Text style={styles.selectButtonText}>이미지 선택</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.applyButton]}
                onPress={handleApplyImage}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.WHITE} />
                ) : (
                  <Text style={styles.applyButtonText}>변경</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Custom Alert Modal */}
        <CustomAlertModal
          visible={alertModal?.visible || false}
          title={alertModal?.title || ''}
          message={alertModal?.message || ''}
          buttons={[{ text: '확인', onPress: () => setAlertModal(null) }]}
          onClose={() => setAlertModal(null)}
        />
      </View>
    </Modal>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 99999,
    elevation: 99999,
  },
  container: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.MD,
  },
  imagePreviewContainer: {
    marginBottom: SPACING.MD,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.GRAY_100,
  },
  imagePreviewPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.GRAY_100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
  },
  description: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.SM,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.GRAY_100,
    borderWidth: 1,
    borderColor: colors.GRAY_300,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
  },
  selectButton: {
    backgroundColor: colors.PRIMARY,
  },
  selectButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
  applyButton: {
    backgroundColor: colors.PRIMARY,
  },
  applyButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
});
