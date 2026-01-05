import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import CommonHeaderButton from '../components/CommonHeaderButton';
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
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [alertModal, setAlertModal] = useState<{visible: boolean, title: string, message: string, buttons: any[]} | null>(null);

  // 각 분류별 선택 상태 추적
  const selectedCategoriesByType = useMemo(() => {
    const byType: Record<string, ShortCategory[]> = {};
    selectedCategories.forEach(category => {
      if (!byType[category.category_type]) {
        byType[category.category_type] = [];
      }
      byType[category.category_type].push(category);
    });
    return byType;
  }, [selectedCategories]);

  const styles = createStyles(colors);

  // 카테고리 로드
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 카테고리를 category_type별로 그룹화
  const groupedCategories = useMemo(() => {
    const groups: Record<string, ShortCategory[]> = {};
    categories.forEach(category => {
      if (!groups[category.category_type]) {
        groups[category.category_type] = [];
      }
      groups[category.category_type].push(category);
    });
    return groups;
  }, [categories]);

  // category_type 표시 이름
  const getCategoryTypeDisplayName = (categoryType: string) => {
    const typeNames: Record<string, string> = {
      'animal': '동물',
      'topic': '주제',
      'format': '형식'
    };
    return typeNames[categoryType] || categoryType;
  };

  const handleCategorySelect = useCallback((category: ShortCategory) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(cat => cat.id === category.id);

      if (isSelected) {
        // 선택 해제
        setSelectedCategoryIds(prevIds => prevIds.filter(id => id !== category.id));
        return prev.filter(cat => cat.id !== category.id);
      } else {
        // 토픽 분류의 경우 최대 3개까지 선택 가능
        if (category.category_type === 'topic') {
          const topicSelected = prev.filter(cat => cat.category_type === 'topic');
          if (topicSelected.length >= 3) return prev; // 토픽은 최대 3개 제한

          // 새로운 카테고리 추가
          setSelectedCategoryIds(prevIds => [...prevIds, category.id]);
          return [...prev, category];
        } else {
          // 다른 분류들은 하나씩만 선택 가능 (교체 방식)
          const sameTypeSelected = prev.find(cat => cat.category_type === category.category_type);
          let newSelected = prev;
          let newIds = selectedCategoryIds;

          if (sameTypeSelected) {
            // 같은 분류의 기존 선택 해제
            newSelected = prev.filter(cat => cat.id !== sameTypeSelected.id);
            newIds = selectedCategoryIds.filter(id => id !== sameTypeSelected.id);
          }

          // 새로운 카테고리 선택
          setSelectedCategoryIds([...newIds, category.id]);
          return [...newSelected, category];
        }
      }
    });
  }, [selectedCategoryIds]);

  // 모든 분류에서 하나씩 선택되었는지 확인
  const isAllCategoriesSelected = useMemo(() => {
    const totalTypes = Object.keys(groupedCategories).length;
    const selectedTypes = Object.keys(selectedCategoriesByType).length;
    return selectedTypes === totalTypes;
  }, [groupedCategories, selectedCategoriesByType]);

  const handlePreviewPress = useCallback(() => {
    if (!isAllCategoriesSelected) {
      setAlertModal({
        visible: true,
        title: '카테고리 선택',
        message: '각 분류별로 카테고리를 하나씩 선택해주세요.',
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
      selectedCategoryIds,
    });
  }, [selectedCategories, navigation, videoUri, trimStart, trimEnd, cropArea, thumbnailUri, description]);

  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <CommonHeader
          title="컷츠 게시"
          onBackPress={() => navigation.goBack()}
          rightComponent={
            <CommonHeaderButton
              title="미리보기"
              onPress={handlePreviewPress}
              disabled={!isAllCategoriesSelected}
            />
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 컷츠 설명 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              컷츠 설명
            </Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="컷츠에 대한 설명을 추가해주세요."
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
              <View style={styles.categoryGroupsContainer}>
                {Object.entries(groupedCategories).map(([categoryType, categoryList]) => (
                  <View key={categoryType} style={styles.categoryGroup}>
                    <View style={styles.categoryGroupHeader}>
                      <Text style={styles.categoryGroupTitle}>
                        {getCategoryTypeDisplayName(categoryType)} 분류
                      </Text>
                      {(!selectedCategoriesByType[categoryType] || selectedCategoriesByType[categoryType].length === 0) && (
                        <Text style={styles.hintText}>
                          {categoryType === 'topic' ? '•영상 주제를 1~3개 선택하세요' : '• 하나의 카테고리를 선택해주세요'}
                        </Text>
                      )}
                      {categoryType === 'topic' && selectedCategoriesByType[categoryType] && selectedCategoriesByType[categoryType].length > 0 && (
                        <Text style={styles.selectionCount}>
                          {selectedCategoriesByType[categoryType].length}/3 선택됨
                        </Text>
                      )}
                    </View>
                    <View style={styles.categoryContainer}>
                      {categoryList.map(category => (
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
                  </View>
                ))}
              </View>
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

  // 카테고리 그룹
  categoryGroupsContainer: {
    gap: SPACING.SM,
  },
  categoryGroup: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: colors.GRAY_200,
    padding: SPACING.MD,
  },
  categoryGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
    paddingBottom: SPACING.XS,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_100,
  },
  categoryGroupTitle: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
  },
  hintText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
  selectionCount: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    color: colors.GRAY_600,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
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
