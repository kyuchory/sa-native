import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import type { Category, SubCategory } from '../types/post';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId?: number;
  selectedSubcategoryId?: number;
  onCategorySelect: (categoryId: number) => void;
  onSubcategorySelect: (subcategoryId: number) => void;
  showAllOption?: boolean;
}

export default function CategoryPicker({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategorySelect,
  onSubcategorySelect,
  showAllOption = true,
}: CategoryPickerProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  return (
    <View style={styles.container}>
      {/* 대분류 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={styles.categoryContent}
      >
        {showAllOption && (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              !selectedCategoryId && styles.categoryItemActive
            ]}
            onPress={() => onCategorySelect(0)}
          >
            <Text style={[
              styles.categoryText,
              !selectedCategoryId && styles.categoryTextActive
            ]}>
              전체
            </Text>
          </TouchableOpacity>
        )}

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategoryId === category.id && styles.categoryItemActive
            ]}
            onPress={() => onCategorySelect(category.id)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategoryId === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 소분류 */}
      {selectedCategory && selectedCategory.subCategories.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.subcategoryRow}
          contentContainerStyle={styles.subcategoryContent}
        >
          {showAllOption && (
            <TouchableOpacity
              style={[
                styles.subcategoryItem,
                !selectedSubcategoryId && styles.subcategoryItemActive
              ]}
              onPress={() => onSubcategorySelect(0)}
            >
              <Text style={[
                styles.subcategoryText,
                !selectedSubcategoryId && styles.subcategoryTextActive
              ]}>
                전체
              </Text>
            </TouchableOpacity>
          )}

          {selectedCategory.subCategories.map((subcategory) => (
            <TouchableOpacity
              key={subcategory.id}
              style={[
                styles.subcategoryItem,
                selectedSubcategoryId === subcategory.id && styles.subcategoryItemActive
              ]}
              onPress={() => onSubcategorySelect(subcategory.id)}
            >
              <Text style={[
                styles.subcategoryText,
                selectedSubcategoryId === subcategory.id && styles.subcategoryTextActive
              ]}>
                {subcategory.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    borderRadius: BORDER_RADIUS.MD,
  },

  // 대분류 스타일
  categoryRow: {
    paddingVertical: SPACING.SM,
  },
  categoryContent: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.SM,
  },
  categoryItem: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.ROUND,
    backgroundColor: colors.GRAY_100,
    minWidth: 60,
    alignItems: 'center' as const,
  },
  categoryItemActive: {
    backgroundColor: colors.PRIMARY,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
  },
  categoryTextActive: {
    color: colors.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
  },

  // 소분류 스타일
  subcategoryRow: {
    paddingBottom: SPACING.SM,
  },
  subcategoryContent: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.XS,
  },
  subcategoryItem: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: colors.GRAY_300,
    backgroundColor: colors.WHITE,
  },
  subcategoryItemActive: {
    borderColor: colors.PRIMARY,
    backgroundColor: colors.PRIMARY + '10', // 10% 투명도
  },
  subcategoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.REGULAR,
    color: colors.GRAY_700, // TEXT_COLORS.SECONDARY
  },
  subcategoryTextActive: {
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
