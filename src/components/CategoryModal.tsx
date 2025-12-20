import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { Category } from '../types/post';

// 체크 아이콘 컴포넌트
const CheckIcon = ({ size = 20, color = '#666' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.8, height: size * 0.8, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.6,
          height: size * 0.4,
          borderBottomWidth: 2,
          borderLeftWidth: 2,
          borderColor: color,
          transform: [{ rotate: '-45deg' }],
          marginTop: -size * 0.1,
        }}
      />
    </View>
  </View>
);

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId: number;
  selectedSubcategoryId: number;
  onCategorySelect: (categoryId: number, subcategoryId?: number) => void;
}

export default function CategoryModal({
  visible,
  onClose,
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategorySelect,
}: CategoryModalProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);

  const handleCategoryPress = (category: Category) => {
    // 대분류 선택 시 소분류 초기화
    onCategorySelect(category.id, 0);
    onClose();
  };

  const handleSubcategoryPress = (category: Category, subcategoryId: number) => {
    // 소분류 선택
    onCategorySelect(category.id, subcategoryId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
      style={{ zIndex: 99999 }}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>카테고리 선택</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 카테고리 목록 */}
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* 전체 카테고리 */}
            <TouchableOpacity
              style={[
                styles.categoryItem,
                selectedCategoryId === 0 && styles.categoryItemSelected
              ]}
              onPress={() => {
                onCategorySelect(0, 0);
                onClose();
              }}
            >
              <Text style={[
                styles.categoryName,
                selectedCategoryId === 0 && styles.categoryNameSelected
              ]}>
                전체
              </Text>
              {selectedCategoryId === 0 && (
                <CheckIcon size={20} color={colors.PRIMARY} />
              )}
            </TouchableOpacity>

            {/* 개별 카테고리들 */}
            {categories.map((category) => (
              <View key={category.id}>
                {/* 대분류 */}
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategoryId === category.id && selectedSubcategoryId === 0 && styles.categoryItemSelected
                  ]}
                  onPress={() => handleCategoryPress(category)}
                >
                  <Text style={[
                    styles.categoryName,
                    selectedCategoryId === category.id && selectedSubcategoryId === 0 && styles.categoryNameSelected
                  ]}>
                    {category.name}
                  </Text>
                  {selectedCategoryId === category.id && selectedSubcategoryId === 0 && (
                    <CheckIcon size={20} color={colors.PRIMARY} />
                  )}
                </TouchableOpacity>

                {/* 소분류들 */}
                {category.subCategories.map((subcategory) => (
                  <TouchableOpacity
                    key={subcategory.id}
                    style={[
                      styles.subcategoryItem,
                      selectedCategoryId === category.id && selectedSubcategoryId === subcategory.id && styles.subcategoryItemSelected
                    ]}
                    onPress={() => handleSubcategoryPress(category, subcategory.id)}
                  >
                    <Text style={[
                      styles.subcategoryName,
                      selectedCategoryId === category.id && selectedSubcategoryId === subcategory.id && styles.subcategoryNameSelected
                    ]}>
                      {subcategory.name}
                    </Text>
                    {selectedCategoryId === category.id && selectedSubcategoryId === subcategory.id && (
                      <CheckIcon size={16} color={colors.PRIMARY} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    width: '85%',
    maxWidth: 360,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE.LG,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
    color: colors.GRAY_900,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.GRAY_100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    color: colors.GRAY_700,
  },
  scrollContainer: {
    padding: SPACING.LG,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.XS,
  },
  categoryItemSelected: {
    backgroundColor: colors.GRAY_50,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700,
  },
  categoryNameSelected: {
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingLeft: SPACING.XL, // 대분류보다 더 들여쓰기
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.XS,
  },
  subcategoryItemSelected: {
    backgroundColor: colors.GRAY_50,
  },
  subcategoryName: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.REGULAR,
    color: colors.GRAY_600,
  },
  subcategoryNameSelected: {
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
