import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS, TEXT_COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import type { Category, SubCategory } from '../types/post';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId?: number;
  selectedSubcategoryId?: number;
  onCategorySelect: (categoryId: number) => void;
  onSubcategorySelect: (subcategoryId: number) => void;
}

export default function CategoryPicker({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategorySelect,
  onSubcategorySelect,
}: CategoryPickerProps) {
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
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
    backgroundColor: COLORS.GRAY_100,
    minWidth: 60,
    alignItems: 'center',
  },
  categoryItemActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: TEXT_COLORS.SECONDARY,
  },
  categoryTextActive: {
    color: COLORS.WHITE,
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
    borderColor: COLORS.GRAY_300,
    backgroundColor: COLORS.WHITE,
  },
  subcategoryItemActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10', // 10% 투명도
  },
  subcategoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.REGULAR,
    color: TEXT_COLORS.SECONDARY,
  },
  subcategoryTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
