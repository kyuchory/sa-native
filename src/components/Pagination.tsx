import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import type { Pagination as PaginationType } from '../types/post';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

export default function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { colors } = useThemeStore();
  const styles = createStyles(colors);
  const { page, total_pages, has_next, has_prev } = pagination;

  // 페이지 번호 배열 생성 (현재 페이지 주변 2개씩)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(total_pages, page + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (total_pages <= 1) return null;

  return (
    <View style={styles.container}>
      {/* 이전 페이지 버튼 */}
      <TouchableOpacity
        style={[styles.pageButton, !has_prev && styles.disabledButton]}
        onPress={() => has_prev && onPageChange(page - 1)}
        disabled={!has_prev}
        activeOpacity={0.7}
      >
        <Text style={[styles.pageButtonText, !has_prev && styles.disabledText]}>
          이전
        </Text>
      </TouchableOpacity>

      {/* 페이지 번호들 */}
      <View style={styles.pageNumbers}>
        {getPageNumbers().map((pageNum) => (
          <TouchableOpacity
            key={pageNum}
            style={[
              styles.pageButton,
              pageNum === page && styles.activePageButton
            ]}
            onPress={() => onPageChange(pageNum)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pageButtonText,
                pageNum === page && styles.activePageButtonText
              ]}
            >
              {pageNum}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 다음 페이지 버튼 */}
      <TouchableOpacity
        style={[styles.pageButton, !has_next && styles.disabledButton]}
        onPress={() => has_next && onPageChange(page + 1)}
        disabled={!has_next}
        activeOpacity={0.7}
      >
        <Text style={[styles.pageButtonText, !has_next && styles.disabledText]}>
          다음
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: Record<string, string>) => StyleSheet.create({
  container: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
    // backgroundColor: colors.WHITE, // 배경색 제거
    // borderTopWidth: 1,        // 구분선 제거
    // borderTopColor: colors.GRAY_200,  // 구분선 색상 제거
  },
  pageNumbers: {
    flexDirection: 'row' as const,
    marginHorizontal: SPACING.SM,
  },
  pageButton: {
    minWidth: 40,
    height: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginHorizontal: SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: colors.GRAY_100, // GRAY_50에서 GRAY_100으로 변경하여 더 부드럽게
    borderWidth: 1,
    borderColor: colors.GRAY_200,
  },
  activePageButton: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  },
  disabledButton: {
    backgroundColor: colors.GRAY_100,
    borderColor: colors.GRAY_100,
  },
  pageButtonText: {
    fontSize: TYPOGRAPHY.SIZE.SM,
    fontWeight: TYPOGRAPHY.WEIGHT.MEDIUM,
    color: colors.GRAY_900, // TEXT_COLORS.PRIMARY
  },
  activePageButtonText: {
    color: colors.WHITE,
  },
  disabledText: {
    color: colors.GRAY_500, // TEXT_COLORS.DISABLED
  },
});
