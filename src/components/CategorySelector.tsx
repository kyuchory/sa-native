import React, { useState, useRef, useEffect } from 'react';
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

// 필터 삼각형 아이콘 컴포넌트 (SVG 스타일)
const FilterChevronIcon = ({ size = 12, color = '#666', isOpen = false }: { size?: number; color?: string; isOpen?: boolean }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: size / 2,
        borderRightWidth: size / 2,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        ...(isOpen
          ? {
              borderBottomWidth: size * 0.8,
              borderBottomColor: color,
            }
          : {
              borderTopWidth: size * 0.8,
              borderTopColor: color,
            }
        ),
      }}
    />
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
  onFilterPress?: () => void;
  selectedAnimalTypeFilter?: string | null;
  isFilterOpen?: boolean;
  animalTypes?: Array<{ value: string; label: string }>;
}

export default function CategorySelector({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategorySelect,
  onSubcategorySelect,
  onMenuPress,
  onFilterPress,
  selectedAnimalTypeFilter,
  isFilterOpen,
  animalTypes = [],
}: CategorySelectorProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const selectedSubcategory = selectedCategory?.subCategories.find(sub => sub.id === selectedSubcategoryId);

  // 필터 버튼 텍스트 계산
  const getFilterButtonText = () => {
    if (!selectedAnimalTypeFilter) return '전체';

    const selectedType = animalTypes.find(type => type.value === selectedAnimalTypeFilter);
    return selectedType ? selectedType.label : '전체';
  };

  // ScrollView ref 추가
  const categoryScrollRef = useRef<ScrollView>(null);
  const subcategoryScrollRef = useRef<ScrollView>(null);

  // 각 카테고리 아이템의 레이아웃 정보를 저장
  const categoryLayoutsRef = useRef<Map<number, { x: number; width: number }>>(new Map());
  const subcategoryLayoutsRef = useRef<Map<number, { x: number; width: number }>>(new Map());

  // 선택된 카테고리로 자동 스크롤
  useEffect(() => {
    if (selectedCategoryId !== undefined && categoryLayoutsRef.current.has(selectedCategoryId)) {
      const layout = categoryLayoutsRef.current.get(selectedCategoryId);
      if (layout && categoryScrollRef.current) {
        // 화면 중앙에 위치하도록 스크롤
        categoryScrollRef.current.scrollTo({
          x: Math.max(0, layout.x - 50), // 약간의 여백을 두고 스크롤
          animated: true,
        });
      }
    }
  }, [selectedCategoryId]);

  // 선택된 소분류로 자동 스크롤 (0이 아닌 실제 소분류만)
  useEffect(() => {
    if (selectedSubcategoryId && selectedSubcategoryId !== 0 && subcategoryLayoutsRef.current.has(selectedSubcategoryId)) {
      const layout = subcategoryLayoutsRef.current.get(selectedSubcategoryId);
      if (layout && subcategoryScrollRef.current) {
        subcategoryScrollRef.current.scrollTo({
          x: Math.max(0, layout.x - 20),
          animated: true,
        });
      }
    } else if (selectedSubcategoryId === 0 && subcategoryScrollRef.current) {
      // "전체" 선택 시 맨 앞으로 스크롤 (선택적)
      subcategoryScrollRef.current.scrollTo({
        x: 0,
        animated: true,
      });
    }
  }, [selectedSubcategoryId]);

  // 레이아웃 측정 핸들러
  const handleCategoryLayout = (categoryId: number, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    categoryLayoutsRef.current.set(categoryId, { x, width });
  };

  const handleSubcategoryLayout = (subcategoryId: number, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    subcategoryLayoutsRef.current.set(subcategoryId, { x, width });
  };

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
          ref={categoryScrollRef}
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
            onLayout={(event) => handleCategoryLayout(0, event)}
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
              onLayout={(event) => handleCategoryLayout(category.id, event)}
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

        {/* 필터 버튼 */}
        {onFilterPress && (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedAnimalTypeFilter && styles.filterButtonActive
            ]}
            onPress={onFilterPress}
          >
            <Text style={[
              styles.filterText,
              selectedAnimalTypeFilter && styles.filterTextActive
            ]}>
              {getFilterButtonText()}
            </Text>
            <FilterChevronIcon
              size={8}
              color={selectedAnimalTypeFilter ? colors.PRIMARY : colors.GRAY_600}
              isOpen={isFilterOpen}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 소분류 */}
      {selectedCategory && selectedCategory.subCategories.length > 0 && (
        <ScrollView
          ref={subcategoryScrollRef}
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
            onLayout={(event) => handleSubcategoryLayout(0, event)}
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
              onLayout={(event) => handleSubcategoryLayout(subcategory.id, event)}
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: colors.GRAY_300,
    backgroundColor: colors.WHITE,
    marginRight: SPACING.SM,
    gap: SPACING.XS,
    minWidth: 50,
  },
  filterButtonActive: {
    borderColor: colors.PRIMARY,
    backgroundColor: colors.GRAY_50,
  },
  filterText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_600,
  },
  filterTextActive: {
    color: colors.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT.SEMIBOLD,
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
    backgroundColor: colors.GRAY_50,
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
