import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

// 카테고리 타입 정의 - types/post.ts와 통일
import { Category, SubCategory } from '../types/post';
import { useThemeStore } from '../stores/themeStore';

// 햄버거 메뉴 아이콘 컴포넌트
const HamburgerIcon = ({ size = 20, color = '#666' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.9, height: 2, backgroundColor: color, marginVertical: 2 }} />
    <View style={{ width: size * 0.9, height: 2, backgroundColor: color, marginVertical: 2 }} />
    <View style={{ width: size * 0.9, height: 2, backgroundColor: color, marginVertical: 2 }} />
  </View>
);

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId?: number;
  selectedSubcategoryId?: number;
  onCategorySelect: (categoryId: number) => void;
  onSubcategorySelect: (subcategoryId: number) => void;
  onMenuPress?: () => void;
}

export default function CategorySelector({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategorySelect,
  onSubcategorySelect,
  onMenuPress,
}: CategorySelectorProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  return (
    <View style={styles.container}>
      {/* 대분류 */}
      <View style={styles.categoryRow}>
        {/* 햄버거 메뉴 아이콘 */}
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={onMenuPress}
        >
          <HamburgerIcon size={20} color={colors.GRAY_600} />
        </TouchableOpacity>

        {/* 카테고리 스크롤 영역 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
          style={styles.categoryScroll}
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
      </View>

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

// 스타일 생성 함수
const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },

  // 대분류 스타일
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  hamburgerButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  categoryScroll: {
    flex: 1,
  },
  categoryContent: {
    paddingLeft: 0,
    paddingRight: SPACING.MD,
    gap: SPACING.SM,
  },
  categoryItem: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.ROUND,
    backgroundColor: colors.GRAY_100,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryItemActive: {
    backgroundColor: colors.PRIMARY,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE.MD,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_600,
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
    backgroundColor: colors.GRAY_50, // 투명도 대신 연한 회색 배경으로 변경
  },
  subcategoryText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.REGULAR,
    color: colors.GRAY_600,
  },
  subcategoryTextActive: {
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
  },
});
