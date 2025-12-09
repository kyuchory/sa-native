import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useThemeStore } from '../stores/themeStore';
import { useCutStore } from '../stores/cutStore';
import { ShortCategory } from '../types/cut';
import CommonHeader from '../components/CommonHeader';
import CustomAlertModal from '../components/CustomAlertModal';
import { SPACING, TYPOGRAPHY, COLORS, BORDER_RADIUS } from '../constants/theme';

type AuthStackParamList = {
  CutUploadFinalize: {
    videoUri: string;
    trimStart: number;
    trimEnd: number;
    cropArea: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    thumbnailUri?: string;
  };
};

type CutUploadFinalizeRouteProp = RouteProp<AuthStackParamList, 'CutUploadFinalize'>;
type CutUploadFinalizeNavigationProp = StackNavigationProp<AuthStackParamList, 'CutUploadFinalize'>;

export default function CutUploadFinalizeScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation<CutUploadFinalizeNavigationProp>();
  const route = useRoute<CutUploadFinalizeRouteProp>();

  const { categories, isLoadingCategories, error, fetchCategories } = useCutStore();

  const { videoUri, trimStart, trimEnd, cropArea, thumbnailUri } = route.params;

  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ShortCategory[]>([]);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  const styles = createStyles(colors);

  // 카테고리 로드
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategorySelect = useCallback((category: ShortCategory) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(cat => cat.id === category.id);
      if (isSelected) {
        return prev.filter(cat => cat.id !== category.id);
      } else {
        if (prev.length >= 3) return prev; // 최대 3개 제한
        return [...prev, category];
      }
    });
  }, []);

  const handlePreviewPress = useCallback(() => {
    if (selectedCategories.length === 0) {
      setAlertModal({
        visible: true,
        title: '카테고리 선택',
        message: '최소 한 개 이상의 카테고리를 선택해주세요.',
        buttons: [{
          text: '확인',
          style: 'default',
          onPress: () => setAlertModal(null)
        }]
      });
      return;
    }

    (navigation as any).replace('CutPreview', {
      videoUri,
      trimStart,
      trimEnd,
      cropArea,
      thumbnailUri,
      description,
      selectedCategories,
    });
  }, [selectedCategories, navigation, videoUri, trimStart, trimEnd, cropArea, thumbnailUri, description]);

  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CommonHeader
          title="컷츠 게시"
          onBackPress={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity
              onPress={handlePreviewPress}
              style={styles.uploadButton}
            >
              <Text style={styles.uploadButtonText}>미리보기</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >


          {/* 카테고리 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              카테고리 (최소 1개, 최대 3개)
            </Text>
            {isLoadingCategories ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.PRIMARY} />
                <Text style={styles.loadingText}>카테고리를 불러오는 중...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchCategories} style={styles.retryButton}>
                  <Text style={styles.retryText}>다시 시도</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.categoryContainer}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategories.some(cat => cat.id === category.id) && styles.categoryChipSelected
                    ]}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategories.some(cat => cat.id === category.id) && styles.categoryTextSelected
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 설명 입력 */}
          <View style={styles.section}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="컷츠에 대한 설명을 추가하세요... (필요한 경우)"
              placeholderTextColor={colors.GRAY_400}
              multiline
              maxLength={300}
              onChangeText={setDescription}
              value={description}
              textAlignVertical="top"
            />
            {description.length > 0 && (
              <Text style={styles.characterCount}>
                {description.length}/300
              </Text>
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
    </>
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
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.XL,
  },
  uploadButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS.XL,
    minWidth: 80,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
  },
  uploadButtonText: {
    color: colors.WHITE,
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },

  // 입력 섹션
  section: {
    marginBottom: SPACING.XL,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_900,
    marginBottom: SPACING.SM,
  },

  // 설명 입력
  descriptionInput: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    color: colors.GRAY_900,
    minHeight: 100,
    lineHeight: 24,
    textAlign: 'left',
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: colors.GRAY_300,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: TYPOGRAPHY.SIZE.XS,
    color: colors.GRAY_600,
    textAlign: 'right',
    marginTop: SPACING.XS,
  },

  // 카테고리
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  categoryChip: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.ROUND,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  categoryChipSelected: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  categoryTextSelected: {
    color: colors.WHITE,
  },

  // 로딩 및 에러 상태
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.LG,
    gap: SPACING.SM,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    gap: SPACING.SM,
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.ERROR || colors.GRAY_700,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    backgroundColor: colors.PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
  },
  retryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
