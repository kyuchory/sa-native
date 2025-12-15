import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { openSettings } from 'react-native-permissions';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import useSupportStore from '../stores/supportStore';
import CommonHeader from '../components/CommonHeader';
import { SupportService } from '../services/supportService';
import { CreateInquiryRequest } from '../types/support';
import { AddImageIcon, DeleteIcon } from '../components/CommonIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { handleApiError } from '../services/apiClient';
import { AuthStackParamList } from '../types/navigation';
import CustomAlertModal from '../components/CustomAlertModal';

type SupportCreateNavigationProp = StackNavigationProp<AuthStackParamList, 'SupportCreate'>;

const CATEGORIES = [
  { value: 'bug', label: '버그 신고' },
  { value: 'feature', label: '기능 제안' },
  { value: 'account', label: '계정 관련' },
  { value: 'payment', label: '결제 관련' },
  { value: 'etc', label: '기타' },
];

const PRIORITIES = [
  { value: 'low', label: '낮음' },
  { value: 'normal', label: '보통' },
  { value: 'high', label: '높음' },
  { value: 'urgent', label: '긴급' },
];

export default function SupportCreateScreen() {
  const navigation = useNavigation<SupportCreateNavigationProp>();
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  // Zustand 스토어
  const { setShouldRefreshInquiries } = useSupportStore();

  // 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('normal');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // 이미지 선택
  const pickImages = async () => {
    try {
      // 권한 요청
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setAlertModal({
            visible: true,
            title: '권한 필요',
            message: '갤러리 접근 권한이 필요합니다 . 설정에서 허용해주세요.',
            buttons: [{ text: '설정', onPress: () => openSettings() }, { text: '확인', onPress: () => setAlertModal(null) }]
          });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - images.length, // 남은 슬롯만큼 선택 가능
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets;
        if (images.length + newImages.length > 5) {
          setAlertModal({
            visible: true,
            title: '알림',
            message: '이미지는 최대 5장까지 첨부할 수 있습니다.',
            buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
          });
          return;
        }
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: '이미지를 선택하는 중 오류가 발생했습니다.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    }
  };

  // 이미지 삭제
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 카테고리 선택
  const selectCategory = (selectedCategory: string) => {
    setCategory(selectedCategory === category ? '' : selectedCategory);
  };

  // 우선순위 선택
  const selectPriority = (selectedPriority: string) => {
    setPriority(selectedPriority);
  };

  // 폼 검증
  const validateForm = () => {
    if (!title.trim()) {
      setAlertModal({
        visible: true,
        title: '알림',
        message: '제목을 입력해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return false;
    }
    if (!content.trim()) {
      setAlertModal({
        visible: true,
        title: '알림',
        message: '내용을 입력해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return false;
    }
    if (!category) {
      setAlertModal({
        visible: true,
        title: '알림',
        message: '카테고리를 선택해주세요.',
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
      return false;
    }
    return true;
  };

  // 문의 작성
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const inquiryData: CreateInquiryRequest = {
        title: title.trim(),
        content: content.trim(),
        category: category,
        priority: priority as any,
      };

      // 이미지 파일들을 File 객체로 변환
      let imageFiles: File[] = [];
      if (images.length > 0) {
        if (Platform.OS === 'web') {
          // 웹에서는 uri가 blob URL이므로 fetch로 File 객체 생성
          imageFiles = await Promise.all(
            images.map(async (image, index) => {
              const response = await fetch(image.uri);
              const blob = await response.blob();
              return new File([blob], `image_${index + 1}.jpg`, { type: 'image/jpeg' });
            })
          );
        } else {
          // React Native에서는 uri를 File로 변환
          imageFiles = images.map((image, index) => {
            return {
              uri: image.uri,
              name: `image_${index + 1}.jpg`,
              type: 'image/jpeg',
            } as any;
          });
        }
      }

      const result = await SupportService.createInquiry(inquiryData, imageFiles);

      // 목록 새로고침 플래그 설정
      setShouldRefreshInquiries(true);

      // 성공 메시지 표시 후 상세 페이지로 이동
      setAlertModal({
        visible: true,
        title: '문의 작성 완료',
        message: '문의가 성공적으로 작성되었습니다.\n상세 내용을 확인해보세요.',
        buttons: [{
          text: '확인',
          onPress: () => {
            setAlertModal(null);
            navigation.replace('SupportDetail', { inquiryId: result.inquiry_id });
          }
        }]
      });
    } catch (error: any) {
      console.error('문의 작성 실패:', error);
      const errorMessage = handleApiError(error);
      setAlertModal({
        visible: true,
        title: '오류',
        message: errorMessage,
        buttons: [{ text: '확인', onPress: () => setAlertModal(null) }]
      });
    } finally {
      setLoading(false);
    }
  };

  const getSaveButton = () => (
    <TouchableOpacity
      style={[
        styles.saveButton,
        (!title.trim() || !content.trim() || !category || loading) && styles.disabledButton
      ]}
      onPress={handleSubmit}
      disabled={loading || !title.trim() || !content.trim() || !category}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.WHITE} />
      ) : (
        <Text style={[
          styles.saveButtonText,
          (!title.trim() || !content.trim() || !category) && styles.disabledButtonText
        ]}>
          저장
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CommonHeader
        title="문의 작성"
        rightComponent={getSaveButton()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 제목 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제목</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="문의 제목을 입력해주세요"
            placeholderTextColor={colors.GRAY_400}
            maxLength={200}
            returnKeyType="next"
          />
        </View>

        {/* 카테고리 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.categoryButton,
                  category === item.value && styles.categoryButtonActive
                ]}
                onPress={() => selectCategory(item.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    category === item.value && styles.categoryButtonTextActive
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 우선순위 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>우선순위</Text>
          <View style={styles.priorityContainer}>
            {PRIORITIES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.priorityButton,
                  priority === item.value && styles.priorityButtonActive
                ]}
                onPress={() => selectPriority(item.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    priority === item.value && styles.priorityButtonTextActive
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 내용 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내용</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="문의 내용을 자세히 입력해주세요"
            placeholderTextColor={colors.GRAY_400}
            multiline
            textAlignVertical="top"
            numberOfLines={8}
          />
        </View>

        {/* 이미지 첨부 */}
        <View style={styles.section}>
          <View style={styles.imageSectionHeader}>
            <Text style={styles.sectionTitle}>이미지 첨부</Text>
            <Text style={styles.imageCount}>{images.length}/5</Text>
          </View>

          {/* 선택된 이미지들 */}
          {images.length > 0 && (
            <View style={styles.imageGrid}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.image} contentFit="cover" cachePolicy="memory-disk" transition={200}/>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                    activeOpacity={0.7}
                  >
                    <DeleteIcon size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* 이미지 추가 버튼 */}
          {images.length < 5 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImages}
              activeOpacity={0.7}
            >
              <AddImageIcon size={24} color={colors.GRAY_600} />
              <Text style={styles.addImageText}>이미지 선택</Text>
            </TouchableOpacity>
          )}
        </View>


      </ScrollView>

      {/* Custom Alert Modal */}
      {alertModal && (
        <CustomAlertModal
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          buttons={alertModal.buttons}
          onClose={() => setAlertModal(null)}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.GRAY_50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
    marginBottom: SPACING.SM,
  },
  titleInput: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    minHeight: 48,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  categoryButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: colors.GRAY_100,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  categoryButtonActive: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  },
  categoryButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  categoryButtonTextActive: {
    color: colors.WHITE,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  priorityButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: colors.GRAY_100,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  priorityButtonActive: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  },
  priorityButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_700,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  priorityButtonTextActive: {
    color: colors.WHITE,
  },
  contentInput: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  imageCount: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_500,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.SM,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_600,
    marginLeft: SPACING.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },

  saveButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.PRIMARY,
    minWidth: 60,
    alignItems: 'center' as const,
  },
  disabledButton: {
    backgroundColor: colors.GRAY_300,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.WHITE,
  },
  disabledButtonText: {
    color: colors.GRAY_500,
  },
});
